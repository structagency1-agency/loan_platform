const express = require("express");

const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roles");
const {
    applyPaymentToEmi,
} = require("../services/payment-engine");

const router = express.Router();

/*
 * CUSTOMER
 * Get payment history for the logged-in customer.
 */
router.get(
    "/my",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    async (req, res) => {
        try {
            const customer = await prisma.customerProfile.findUnique({
                where: {
                    userId: req.user.userId,
                },
            });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found",
                });
            }

            const payments = await prisma.payment.findMany({
                where: {
                    loan: {
                        customerId: customer.id,
                    },
                },
                include: {
                    emi: {
                        select: {
                            installmentNo: true,
                            dueDate: true,
                            emiAmount: true,
                            paidAmount: true,
                            outstandingAmount: true,
                            status: true,
                        },
                    },
                    onlinePayment: true,
                    cashCollection: {
                        include: {
                            agent: {
                                include: {
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
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return res.json({
                success: true,
                count: payments.length,
                payments,
            });
        } catch (error) {
            console.error("Payment history error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch payment history",
            });
        }
    }
);

/*
 * CUSTOMER
 * Make a payment against an EMI.
 *
 * This endpoint is currently for backend testing.
 * Cashfree will be connected later.
 */
router.post(
    "/online",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    async (req, res) => {
        try {
            const {
                loanId,
                emiId,
                amount,
                cashfreeOrderId,
                cashfreePaymentId,
                paymentSessionId,
            } = req.body;

            if (!loanId || !emiId || amount === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "loanId, emiId and amount are required",
                });
            }

            const customer = await prisma.customerProfile.findUnique({
                where: {
                    userId: req.user.userId,
                },
            });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found",
                });
            }

            /*
             * Verify that this loan belongs to the logged-in customer.
             */
            const loan = await prisma.loan.findFirst({
                where: {
                    id: loanId,
                    customerId: customer.id,
                },
            });

            if (!loan) {
                return res.status(404).json({
                    success: false,
                    message: "Loan not found",
                });
            }

            const emi = await prisma.emiSchedule.findFirst({
                where: {
                    id: emiId,
                    loanId,
                },
            });

            if (!emi) {
                return res.status(404).json({
                    success: false,
                    message: "EMI not found",
                });
            }

            const result = await applyPaymentToEmi({
                emiId,
                loanId,
                amount,
                mode: "ONLINE",
                transactionId:
                    cashfreePaymentId || null,
                onlinePaymentData: {
                    cashfreeOrderId:
                        cashfreeOrderId ||
                        `TEST-ORDER-${Date.now()}`,
                    cashfreePaymentId:
                        cashfreePaymentId || null,
                    paymentSessionId:
                        paymentSessionId || null,
                    gatewayResponse: {
                        source: "MVP_TEST_PAYMENT",
                    },
                },
                userId: req.user.userId,
                ipAddress: req.ip || null,
            });

            return res.status(201).json({
                success: true,
                message: result.duplicate
                    ? "Payment already processed"
                    : "Payment recorded successfully",
                duplicate: result.duplicate,
                payment: result.payment,
                emi: result.emi,
            });
        } catch (error) {
            console.error("Online payment error:", error);

            return res.status(400).json({
                success: false,
                message: error.message || "Payment failed",
            });
        }
    }
);

/*
 * AGENT
 * Record a cash EMI collection.
 */
router.post(
    "/cash",
    authenticateToken,
    authorizeRoles("AGENT"),
    async (req, res) => {
        try {
            const {
                loanId,
                emiId,
                amount,
                notes,
            } = req.body;

            if (!loanId || !emiId || amount === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "loanId, emiId and amount are required",
                });
            }

            /*
             * Verify that the logged-in user is an active agent.
             */
            const agent = await prisma.agentProfile.findUnique({
                where: {
                    userId: req.user.userId,
                },
            });

            if (!agent) {
                return res.status(404).json({
                    success: false,
                    message: "Agent profile not found",
                });
            }

            /*
             * Verify loan exists.
             */
            const loan = await prisma.loan.findUnique({
                where: {
                    id: loanId,
                },
            });

            if (!loan) {
                return res.status(404).json({
                    success: false,
                    message: "Loan not found",
                });
            }

            /*
             * Verify EMI belongs to loan.
             */
            const emi = await prisma.emiSchedule.findFirst({
                where: {
                    id: emiId,
                    loanId,
                },
            });

            if (!emi) {
                return res.status(404).json({
                    success: false,
                    message: "EMI not found",
                });
            }

            const result = await applyPaymentToEmi({
                emiId,
                loanId,
                amount,
                mode: "CASH",
                agentId: agent.id,
                notes: notes || null,
                userId: req.user.userId,
                ipAddress: req.ip || null,
            });

            return res.status(201).json({
                success: true,
                message: "Cash collection recorded successfully",
                payment: result.payment,
                emi: result.emi,
            });
        } catch (error) {
            console.error("Cash collection error:", error);

            return res.status(400).json({
                success: false,
                message:
                    error.message || "Cash collection failed",
            });
        }
    }
);

module.exports = router;