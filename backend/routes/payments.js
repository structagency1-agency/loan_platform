const crypto = require("crypto");
const express = require("express");
const { Prisma } = require("@prisma/client");

const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roles");
const {
    applyPaymentToEmi,
    parseAndValidateMoney,
    toDecimal,
} = require("../services/payment-engine");

const Decimal = Prisma.Decimal;

const router = express.Router();

/*
 * =========================================================================
 * RAZORPAY PAYMENT GATEWAY (TEST MODE)
 * =========================================================================
 */

/**
 * GET /api/payments/razorpay/config
 * Public/authenticated endpoint returning Razorpay client configuration.
 * (Never exposes secret key!)
 */
router.get("/razorpay/config", (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
    const isConfigured = Boolean(keyId && !keyId.includes("placeholder"));

    return res.json({
        success: true,
        keyId,
        currency: "INR",
        isConfigured,
        testMode: true,
    });
});

/**
 * POST /api/payments/razorpay/create-order
 * Customer creates an order using server-calculated eligible EMI balances.
 */
router.post(
    "/razorpay/create-order",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    async (req, res) => {
        try {
            const { loanId, emiId, amount } = req.body;

            if (!loanId || !emiId) {
                return res.status(400).json({
                    success: false,
                    message: "loanId and emiId are required",
                });
            }

            const customer = await prisma.customerProfile.findUnique({
                where: { userId: req.user.userId },
                include: { user: { select: { name: true, email: true, phone: true } } },
            });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found",
                });
            }

            const loan = await prisma.loan.findFirst({
                where: {
                    id: String(loanId).trim(),
                    customerId: customer.id,
                },
            });

            if (!loan) {
                return res.status(404).json({
                    success: false,
                    message: "Loan not found for this customer",
                });
            }

            // Pending disbursement guard: cannot pay for loan pending disbursement
            if (loan.status === "PENDING_DISBURSEMENT") {
                return res.status(400).json({
                    success: false,
                    message: "Loan is pending disbursement and not eligible for payment",
                });
            }

            if (!["ACTIVE", "OVERDUE"].includes(loan.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Loan is not eligible for payment (status: ${loan.status})`,
                });
            }

            const emi = await prisma.emiSchedule.findFirst({
                where: {
                    id: String(emiId).trim(),
                    loanId: loan.id,
                },
            });

            if (!emi) {
                return res.status(404).json({
                    success: false,
                    message: "EMI not found for this loan",
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
                    message: "This EMI has been waived and cannot be paid",
                });
            }

            const emiOutstanding = new Decimal(emi.outstandingAmount);
            if (emiOutstanding.lte(0)) {
                return res.status(400).json({
                    success: false,
                    message: "This EMI is already fully paid",
                });
            }

            // Determine repayment amount: either customer-requested or full EMI outstanding
            let targetAmount;
            if (amount !== undefined && amount !== null && String(amount).trim() !== "") {
                targetAmount = parseAndValidateMoney(amount);
            } else {
                targetAmount = emiOutstanding;
            }

            if (targetAmount.gt(emiOutstanding)) {
                return res.status(400).json({
                    success: false,
                    message: `Payment amount cannot exceed outstanding amount of ₹${emiOutstanding.toFixed(2)}`,
                });
            }

            const loanOutstanding = new Decimal(loan.outstandingAmount);
            if (targetAmount.gt(loanOutstanding)) {
                return res.status(400).json({
                    success: false,
                    message: `Payment amount cannot exceed loan outstanding amount of ₹${loanOutstanding.toFixed(2)}`,
                });
            }

            // Convert amount to integer paise
            const amountInPaise = Math.round(Number(targetAmount.toString()) * 100);
            if (amountInPaise <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Calculated payment amount in paise must be greater than zero",
                });
            }

            const receipt = `RZP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
            const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
            const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder";

            let orderId;
            const isLiveGateway = keyId && keySecret && !keyId.includes("placeholder");

            if (isLiveGateway) {
                const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
                const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
                    method: "POST",
                    headers: {
                        Authorization: authHeader,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: amountInPaise,
                        currency: "INR",
                        receipt,
                        notes: {
                            loanId: loan.id,
                            emiId: emi.id,
                            installmentNo: String(emi.installmentNo),
                            customerId: customer.id,
                            userId: req.user.userId,
                        },
                    }),
                });

                const rzpData = await rzpRes.json();
                if (!rzpRes.ok) {
                    console.error("Razorpay order creation error:", rzpData);
                    return res.status(rzpRes.status).json({
                        success: false,
                        message: rzpData.error?.description || "Failed to create Razorpay order",
                        code: rzpData.error?.code || "RAZORPAY_ORDER_FAILED",
                    });
                }
                orderId = rzpData.id;
            } else {
                // Deterministic Test Mode Order identifier
                orderId = `order_test_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
            }

            return res.status(201).json({
                success: true,
                orderId,
                amount: amountInPaise,
                amountInRupees: targetAmount.toString(),
                currency: "INR",
                keyId,
                receipt,
                loanId: loan.id,
                loanNumber: loan.loanNumber,
                emiId: emi.id,
                installmentNo: emi.installmentNo,
                outstandingAmount: emi.outstandingAmount.toString(),
                customer: {
                    name: customer.user?.name || "Customer",
                    email: customer.user?.email || "",
                    phone: customer.user?.phone || "",
                },
            });
        } catch (error) {
            console.error("Razorpay create-order error:", error);
            return res.status(error.message && error.message.includes("Amount") ? 400 : 500).json({
                success: false,
                message: error.message || "Failed to create Razorpay order",
            });
        }
    }
);

/**
 * POST /api/payments/razorpay/verify
 * Verifies Razorpay payment signatures on the backend and updates unified payment engine.
 */
router.post(
    "/razorpay/verify",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    async (req, res) => {
        try {
            const {
                loanId,
                emiId,
                amount,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
            } = req.body;

            if (
                !loanId ||
                !emiId ||
                amount === undefined ||
                !razorpayOrderId ||
                !razorpayPaymentId ||
                !razorpaySignature
            ) {
                return res.status(400).json({
                    success: false,
                    message: "loanId, emiId, amount, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required",
                });
            }

            const cleanOrderId = String(razorpayOrderId).trim();
            const cleanPaymentId = String(razorpayPaymentId).trim();
            const cleanSignature = String(razorpaySignature).trim();

            if (!cleanOrderId || !cleanPaymentId || !cleanSignature) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or empty Razorpay payment identifiers",
                });
            }

            const customer = await prisma.customerProfile.findUnique({
                where: { userId: req.user.userId },
            });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found",
                });
            }

            const loan = await prisma.loan.findFirst({
                where: {
                    id: String(loanId).trim(),
                    customerId: customer.id,
                },
            });

            if (!loan) {
                return res.status(404).json({
                    success: false,
                    message: "Loan not found for this customer",
                });
            }

            const emi = await prisma.emiSchedule.findFirst({
                where: {
                    id: String(emiId).trim(),
                    loanId: loan.id,
                },
            });

            if (!emi) {
                return res.status(404).json({
                    success: false,
                    message: "EMI not found for this loan",
                });
            }

            // 1. Signature Verification with Server Secret
            const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder";
            const payload = `${cleanOrderId}|${cleanPaymentId}`;
            const expectedSignature = crypto
                .createHmac("sha256", keySecret)
                .update(payload)
                .digest("hex");

            const expectedBuf = Buffer.from(expectedSignature, "utf8");
            const actualBuf = Buffer.from(cleanSignature, "utf8");

            const isSignatureValid =
                expectedBuf.length === actualBuf.length &&
                crypto.timingSafeEqual(expectedBuf, actualBuf);

            if (!isSignatureValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment signature: verification failed",
                    code: "INVALID_SIGNATURE",
                });
            }

            // 2. Server-side payment verification
            const keyId = process.env.RAZORPAY_KEY_ID;
            const isLiveGateway = keyId && keySecret && !keyId.includes("placeholder");

            let gatewayResponseData = {
                gateway: "RAZORPAY",
                orderId: cleanOrderId,
                paymentId: cleanPaymentId,
                signature: cleanSignature,
                verifiedAt: new Date().toISOString(),
                mode: isLiveGateway ? "LIVE_GATEWAY" : "TEST_MODE",
            };

            if (isLiveGateway) {
                const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
                const payRes = await fetch(`https://api.razorpay.com/v1/payments/${cleanPaymentId}`, {
                    headers: { Authorization: authHeader },
                });
                const payData = await payRes.json();

                if (!payRes.ok) {
                    return res.status(400).json({
                        success: false,
                        message: payData.error?.description || "Failed to confirm payment details with Razorpay",
                        code: payData.error?.code || "GATEWAY_VERIFICATION_FAILED",
                    });
                }

                if (payData.order_id !== cleanOrderId) {
                    return res.status(400).json({
                        success: false,
                        message: "Payment order mismatch: payment does not match the server order",
                        code: "ORDER_MISMATCH",
                    });
                }

                if (!["captured", "authorized"].includes(payData.status)) {
                    return res.status(400).json({
                        success: false,
                        message: `Payment is not in a successful captured state (current status: ${payData.status})`,
                        code: "PAYMENT_NOT_CAPTURED",
                    });
                }

                gatewayResponseData = {
                    ...gatewayResponseData,
                    status: payData.status,
                    method: payData.method,
                    email: payData.email,
                    contact: payData.contact,
                    amount: payData.amount,
                    currency: payData.currency,
                };
            }

            // 3. Atomically apply payment to unified payment engine
            const result = await applyPaymentToEmi({
                emiId: emi.id,
                loanId: loan.id,
                amount,
                mode: "ONLINE",
                transactionId: cleanPaymentId,
                onlinePaymentData: {
                    cashfreeOrderId: cleanOrderId,
                    cashfreePaymentId: cleanPaymentId,
                    paymentSessionId: cleanSignature,
                    gatewayResponse: gatewayResponseData,
                },
                userId: req.user.userId,
                ipAddress: req.ip || null,
            });

            return res.status(result.duplicate ? 200 : 201).json({
                success: true,
                message: result.duplicate
                    ? "Payment already processed"
                    : "Payment recorded successfully",
                duplicate: Boolean(result.duplicate),
                receiptNumber: result.payment.receiptNumber,
                transactionId: result.payment.transactionId,
                amount: result.payment.amount.toString(),
                paidAt: result.payment.paidAt,
                payment: result.payment,
                emi: result.emi,
                loan: result.loan,
            });
        } catch (error) {
            console.error("Razorpay verification error:", error);

            if (
                error.message &&
                (error.message.includes("already fully paid") ||
                    error.message.includes("cannot exceed") ||
                    error.message.includes("Transaction ID already exists"))
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message || "Failed to verify and record payment",
            });
        }
    }
);

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