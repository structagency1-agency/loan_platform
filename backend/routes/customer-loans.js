const express = require("express");

const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roles");

const router = express.Router();

// ==========================================
// GET ALL CUSTOMER LOANS
// ==========================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    async (req, res) => {
        try {
            const customer =
                await prisma.customerProfile.findUnique({
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

            const loans =
                await prisma.loan.findMany({
                    where: {
                        customerId: customer.id,
                    },
                    include: {
                        application: {
                            include: {
                                product: true,
                            },
                        },
                        emis: {
                            orderBy: {
                                installmentNo: "asc",
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            return res.status(200).json({
                success: true,
                count: loans.length,

                loans: loans.map((loan) => ({
                    id: loan.id,

                    loanNumber:
                        loan.loanNumber,

                    principalAmount:
                        loan.principalAmount.toString(),

                    interestRate:
                        loan.interestRate.toString(),

                    tenureMonths:
                        loan.tenureMonths,

                    emiAmount:
                        loan.emiAmount.toString(),

                    totalInterest:
                        loan.totalInterest.toString(),

                    totalPayable:
                        loan.totalPayable.toString(),

                    outstandingAmount:
                        loan.outstandingAmount.toString(),

                    startDate:
                        loan.startDate,

                    endDate:
                        loan.endDate,

                    status:
                        loan.status,

                    product:
                        loan.application?.product
                            ? {
                                id:
                                    loan.application.product.id,

                                name:
                                    loan.application.product.name,
                            }
                            : null,

                    emiSchedule:
                        loan.emis.map((emi) => ({
                            id:
                                emi.id,

                            installmentNo:
                                emi.installmentNo,

                            dueDate:
                                emi.dueDate,

                            principalAmount:
                                emi.principalAmount.toString(),

                            interestAmount:
                                emi.interestAmount.toString(),

                            emiAmount:
                                emi.emiAmount.toString(),

                            paidAmount:
                                emi.paidAmount.toString(),

                            outstandingAmount:
                                emi.outstandingAmount.toString(),

                            status:
                                emi.status,

                            paidAt:
                                emi.paidAt,
                        })),
                })),
            });
        } catch (error) {
            console.error(
                "Get customer loans error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch customer loans",
            });
        }
    }
);

// ==========================================
// GET SINGLE CUSTOMER LOAN
// ==========================================

router.get(
    "/:loanId",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    async (req, res) => {
        try {
            const customer =
                await prisma.customerProfile.findUnique({
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

            const loan =
                await prisma.loan.findFirst({
                    where: {
                        id: req.params.loanId,
                        customerId: customer.id,
                    },
                    include: {
                        application: {
                            include: {
                                product: true,
                            },
                        },
                        emis: {
                            orderBy: {
                                installmentNo: "asc",
                            },
                        },
                    },
                });

            if (!loan) {
                return res.status(404).json({
                    success: false,
                    message: "Loan not found",
                });
            }

            return res.status(200).json({
                success: true,

                loan: {
                    id:
                        loan.id,

                    loanNumber:
                        loan.loanNumber,

                    principalAmount:
                        loan.principalAmount.toString(),

                    interestRate:
                        loan.interestRate.toString(),

                    tenureMonths:
                        loan.tenureMonths,

                    emiAmount:
                        loan.emiAmount.toString(),

                    totalInterest:
                        loan.totalInterest.toString(),

                    totalPayable:
                        loan.totalPayable.toString(),

                    outstandingAmount:
                        loan.outstandingAmount.toString(),

                    startDate:
                        loan.startDate,

                    endDate:
                        loan.endDate,

                    status:
                        loan.status,

                    product:
                        loan.application?.product
                            ? {
                                id:
                                    loan.application.product.id,

                                name:
                                    loan.application.product.name,
                            }
                            : null,

                    emiSchedule:
                        loan.emis.map((emi) => ({
                            id:
                                emi.id,

                            installmentNo:
                                emi.installmentNo,

                            dueDate:
                                emi.dueDate,

                            principalAmount:
                                emi.principalAmount.toString(),

                            interestAmount:
                                emi.interestAmount.toString(),

                            emiAmount:
                                emi.emiAmount.toString(),

                            paidAmount:
                                emi.paidAmount.toString(),

                            outstandingAmount:
                                emi.outstandingAmount.toString(),

                            status:
                                emi.status,

                            paidAt:
                                emi.paidAt,
                        })),
                },
            });
        } catch (error) {
            console.error(
                "Get customer loan error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch customer loan",
            });
        }
    }
);

module.exports = router;