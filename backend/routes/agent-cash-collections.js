const crypto = require("crypto");
const express = require("express");

const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roles");
const {
    applyPaymentWithRetry,
    parseAndValidateMoney,
} = require("../services/payment-engine");
const { parseDateRange } = require("../lib/date-utils");

const router = express.Router();

// Middleware: all collection endpoints require an authenticated AGENT
router.use(authenticateToken, authorizeRoles("AGENT"));

/**
 * Core handler for recording a cash collection.
 */
async function handleCashCollection(req, res) {
    try {
        const { loanId, emiId, amount, notes } = req.body;

        // 1. Validate mandatory input fields
        if (!loanId || typeof loanId !== "string" || !loanId.trim()) {
            return res.status(400).json({
                success: false,
                message: "loanId is required",
            });
        }

        if (!emiId || typeof emiId !== "string" || !emiId.trim()) {
            return res.status(400).json({
                success: false,
                message: "emiId is required",
            });
        }

        if (amount === undefined || amount === null || amount === "") {
            return res.status(400).json({
                success: false,
                message: "amount is required",
            });
        }

        // 2. Validate amount representation and decimals
        let parsedAmount;
        try {
            parsedAmount = parseAndValidateMoney(amount);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError.message,
            });
        }

        // 3. Confirm authenticated user is an active AGENT and load profile
        const agent = await prisma.agentProfile.findUnique({
            where: {
                userId: req.user.userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        status: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent profile not found",
            });
        }

        if (agent.user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Your agent account is inactive",
            });
        }

        // 4. Verify loan exists and is eligible for collection
        const loan = await prisma.loan.findUnique({
            where: {
                id: loanId.trim(),
            },
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found",
            });
        }

        if (!["ACTIVE", "OVERDUE"].includes(loan.status)) {
            return res.status(400).json({
                success: false,
                message: `Loan is not eligible for collection (current status: ${loan.status})`,
            });
        }

        // 5. Verify agent has an active assignment for this exact loan
        const activeAssignment = await prisma.loanAgentAssignment.findFirst({
            where: {
                loanId: loan.id,
                agentId: agent.id,
                active: true,
            },
        });

        if (!activeAssignment) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have an active assignment to collect for this loan",
            });
        }

        // 6. Verify EMI exists, belongs to this loan, and is unpaid/eligible
        const emi = await prisma.emiSchedule.findUnique({
            where: {
                id: emiId.trim(),
            },
        });

        if (!emi) {
            return res.status(404).json({
                success: false,
                message: "EMI not found",
            });
        }

        if (emi.loanId !== loan.id) {
            return res.status(400).json({
                success: false,
                message: "EMI does not belong to the specified loan",
            });
        }

        if (emi.status === "PAID") {
            return res.status(400).json({
                success: false,
                message: "This EMI is already fully paid",
            });
        }

        if (emi.status === "WAIVED") {
            return res.status(400).json({
                success: false,
                message: "This EMI has been waived and cannot be collected",
            });
        }

        if (!["PENDING", "PARTIAL", "OVERDUE"].includes(emi.status)) {
            return res.status(400).json({
                success: false,
                message: `This EMI is not eligible for collection (status: ${emi.status})`,
            });
        }

        // 7. Balance checks
        const emiOutstanding = Number(emi.outstandingAmount);
        if (emiOutstanding <= 0) {
            return res.status(400).json({
                success: false,
                message: "This EMI has no remaining outstanding balance",
            });
        }

        if (parsedAmount.gt(emi.outstandingAmount)) {
            return res.status(400).json({
                success: false,
                message: `Collection amount cannot exceed EMI outstanding amount of ₹${emi.outstandingAmount.toString()}`,
            });
        }

        if (parsedAmount.gt(loan.outstandingAmount)) {
            return res.status(400).json({
                success: false,
                message: `Collection amount cannot exceed loan outstanding amount of ₹${loan.outstandingAmount.toString()}`,
            });
        }

        // 8. Idempotency & Transaction Identifier
        // Support optional client-provided idempotency key from header or body
        const rawIdempotencyKey =
            req.headers["idempotency-key"] ||
            req.body.idempotencyKey ||
            null;

        let transactionId;
        if (rawIdempotencyKey) {
            const sanitizedKey = String(rawIdempotencyKey)
                .trim()
                .slice(0, 64)
                .replace(/[^a-zA-Z0-9_-]/g, "");

            if (!sanitizedKey) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Idempotency-Key provided",
                });
            }

            // Namespace transactionId to the agent to prevent collisions or spoofing
            transactionId = `CASH-${agent.id}-${sanitizedKey}`;
        } else {
            // Generate unique, non-replayable transaction identifier
            const uniqueNonce = crypto.randomBytes(6).toString("hex");
            transactionId = `CASH-${agent.id}-${Date.now()}-${uniqueNonce}`;
        }

        // 9. Execute atomic payment recording with bounded retry for serialization conflicts
        const ipAddress =
            req.ip ||
            req.headers["x-forwarded-for"] ||
            req.socket?.remoteAddress ||
            null;

        const result = await applyPaymentWithRetry({
            emiId: emi.id,
            loanId: loan.id,
            amount: parsedAmount.toString(),
            mode: "CASH",
            transactionId,
            agentId: agent.id,
            notes: notes && typeof notes === "string" ? notes.trim() : null,
            userId: req.user.userId,
            ipAddress,
        });

        const statusCode = result.duplicate ? 200 : 201;
        const message = result.duplicate
            ? "Collection request already processed"
            : "Cash collection recorded successfully";

        return res.status(statusCode).json({
            success: true,
            message,
            duplicate: result.duplicate,
            paymentId: result.payment.id,
            receiptNumber: result.payment.receiptNumber,
            loanId: loan.id,
            emiId: emi.id,
            installmentNo: result.emi.installmentNo,
            collectedAmount: result.payment.amount.toString(),
            collectedAt: result.cashCollection?.collectedAt || result.payment.paidAt,
            notes: result.cashCollection?.notes || null,
            reconciled: result.cashCollection?.reconciled || false,
            payment: {
                id: result.payment.id,
                receiptNumber: result.payment.receiptNumber,
                amount: result.payment.amount.toString(),
                mode: result.payment.mode,
                status: result.payment.status,
                paidAt: result.payment.paidAt,
                createdAt: result.payment.createdAt,
            },
            emi: {
                id: result.emi.id,
                installmentNo: result.emi.installmentNo,
                status: result.emi.status,
                paidAmount: result.emi.paidAmount.toString(),
                outstandingAmount: result.emi.outstandingAmount.toString(),
                paidAt: result.emi.paidAt,
            },
            loan: {
                id: result.loan.id,
                loanNumber: result.loan.loanNumber,
                outstandingAmount: result.loan.outstandingAmount.toString(),
                status: result.loan.status,
            },
        });
    } catch (error) {
        console.error("Cash collection error:", error);

        if (
            error.message &&
            (error.message.includes("cannot exceed outstanding amount") ||
                error.message.includes("already fully paid") ||
                error.message.includes("not eligible") ||
                error.message.includes("Transaction ID already exists"))
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to record cash collection",
        });
    }
}

/**
 * Handler for fetching agent's cash collection history.
 */
async function handleGetAgentCashCollections(req, res) {
    try {
        // 1. Confirm authenticated agent profile
        const agent = await prisma.agentProfile.findUnique({
            where: {
                userId: req.user.userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        status: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent profile not found",
            });
        }

        if (agent.user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Your agent account is inactive",
            });
        }

        // 2. Pagination
        let page = parseInt(req.query.page, 10);
        if (isNaN(page) || page < 1) page = 1;

        let limit = parseInt(req.query.limit || req.query.pageSize, 10);
        if (isNaN(limit) || limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;

        // 3. Where clause strictly isolated to this agent
        const where = {
            agentId: agent.id,
        };

        // 4. Date range filter
        const { startDate, endDate } = req.query;
        if (startDate || endDate) {
            try {
                const { start, end } = parseDateRange(startDate, endDate);
                where.collectedAt = {};
                if (start) where.collectedAt.gte = start;
                if (end) where.collectedAt.lt = end;
            } catch (dateErr) {
                return res.status(400).json({
                    success: false,
                    message: dateErr.message,
                });
            }
        }

        // Optional loan filter
        if (req.query.loanId) {
            where.payment = {
                loanId: String(req.query.loanId).trim(),
            };
        }

        // 5. Query count, aggregations, and records
        const [totalRecords, aggResult, collections] = await Promise.all([
            prisma.cashCollection.count({ where }),
            prisma.cashCollection.aggregate({
                where,
                _sum: {
                    collectedAmount: true,
                },
                _count: {
                    _all: true,
                },
            }),
            prisma.cashCollection.findMany({
                where,
                include: {
                    payment: {
                        select: {
                            id: true,
                            amount: true,
                            mode: true,
                            status: true,
                            transactionId: true,
                            receiptNumber: true,
                            paidAt: true,
                            createdAt: true,
                            loan: {
                                select: {
                                    id: true,
                                    loanNumber: true,
                                    status: true,
                                    customer: {
                                        select: {
                                            user: {
                                                select: {
                                                    name: true,
                                                    phone: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            emi: {
                                select: {
                                    id: true,
                                    installmentNo: true,
                                    dueDate: true,
                                    emiAmount: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [
                    { collectedAt: "desc" },
                    { id: "desc" },
                ],
                skip,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(totalRecords / limit) || 1;

        return res.json({
            success: true,
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages,
            },
            summary: {
                totalCollectedAmount: aggResult._sum.collectedAmount
                    ? aggResult._sum.collectedAmount.toString()
                    : "0",
                count: aggResult._count._all || 0,
            },
            collections: collections.map((c) => ({
                id: c.id,
                receiptNumber: c.receiptNumber,
                collectedAmount: c.collectedAmount.toString(),
                collectedAt: c.collectedAt,
                reconciled: c.reconciled,
                reconciledAt: c.reconciledAt,
                notes: c.notes,
                payment: {
                    id: c.payment.id,
                    amount: c.payment.amount.toString(),
                    mode: c.payment.mode,
                    status: c.payment.status,
                    transactionId: c.payment.transactionId,
                    paidAt: c.payment.paidAt,
                },
                loan: {
                    id: c.payment.loan.id,
                    loanNumber: c.payment.loan.loanNumber,
                    status: c.payment.loan.status,
                },
                emi: {
                    id: c.payment.emi.id,
                    installmentNo: c.payment.emi.installmentNo,
                    dueDate: c.payment.emi.dueDate,
                    status: c.payment.emi.status,
                },
                customer: {
                    name: c.payment.loan.customer?.user?.name || "N/A",
                    phone: c.payment.loan.customer?.user?.phone || null,
                },
            })),
        });
    } catch (error) {
        console.error("Agent cash collections history error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cash collections history",
        });
    }
}

// Support both POST / and POST /cash-collections
router.post("/", handleCashCollection);
router.post("/cash-collections", handleCashCollection);

// Support GET / and GET /cash-collections for collection history
router.get("/", handleGetAgentCashCollections);
router.get("/cash-collections", handleGetAgentCashCollections);

module.exports = router;

