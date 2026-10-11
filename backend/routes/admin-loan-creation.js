const express = require("express");
const { Prisma } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roles");

const router = express.Router();

function addMonths(date, months) {
    const result = new Date(date);

    const originalDay = result.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const lastDayOfMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0
    ).getDate();

    result.setDate(
        Math.min(originalDay, lastDayOfMonth)
    );

    return result;
}

// CREATE LOAN FROM APPROVED APPLICATION
router.post(
    "/:id/create-loan",
    authenticateToken,
    authorizeRoles("ADMIN"),
    async (req, res) => {
        try {
            const { id } = req.params;

            const application =
                await prisma.loanApplication.findUnique({
                    where: {
                        id,
                    },
                    include: {
                        product: true,
                        loan: true,
                    },
                });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Loan application not found",
                });
            }

            // Application must be approved first
            if (application.status !== "APPROVED") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Only approved applications can be converted into loans",
                });
            }

            // Prevent duplicate loan creation
            if (application.loan) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A loan has already been created for this application",
                    loan: {
                        id: application.loan.id,
                        loanNumber:
                            application.loan.loanNumber,
                    },
                });
            }

            // Approved application must have interest rate
            if (!application.interestRate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Approved application does not have an interest rate",
                });
            }

            const principal =
                new Prisma.Decimal(
                    application.requestedAmount
                );

            const annualInterestRate =
                new Prisma.Decimal(
                    application.interestRate
                );

            const tenureMonths =
                application.requestedTenure;

            if (principal.lte(0)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Loan principal must be greater than zero",
                });
            }

            if (
                !Number.isInteger(tenureMonths) ||
                tenureMonths <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Loan tenure must be a positive whole number",
                });
            }

            // ==========================================
            // EMI CALCULATION
            // ==========================================

            const monthlyRate =
                annualInterestRate.div(1200);

            const onePlusRate =
                new Prisma.Decimal(1).plus(
                    monthlyRate
                );

            const power =
                onePlusRate.pow(tenureMonths);

            let emiAmount;

            if (monthlyRate.eq(0)) {
                emiAmount =
                    principal.div(tenureMonths);
            } else {
                emiAmount = principal
                    .mul(monthlyRate)
                    .mul(power)
                    .div(
                        power.minus(1)
                    );
            }

            emiAmount =
                emiAmount.toDecimalPlaces(2);

            // ==========================================
            // CREATE LOAN + EMI SCHEDULE
            // ==========================================

            const result =
                await prisma.$transaction(
                    async (tx) => {
                        const startDate = new Date();

                        const endDate =
                            addMonths(
                                startDate,
                                tenureMonths
                            );

                        const loanNumber =
                            `LN-${startDate.getFullYear()}-${randomUUID()
                                .slice(0, 8)
                                .toUpperCase()}`;

                        let outstanding =
                            principal;

                        let totalInterest =
                            new Prisma.Decimal(0);

                        const emiRecords = [];

                        for (
                            let installmentNo = 1;
                            installmentNo <= tenureMonths;
                            installmentNo++
                        ) {
                            const dueDate =
                                addMonths(
                                    startDate,
                                    installmentNo
                                );

                            let interestAmount =
                                outstanding
                                    .mul(monthlyRate)
                                    .toDecimalPlaces(2);

                            let principalAmount;

                            let currentEmi =
                                emiAmount;

                            // Final EMI adjustment
                            if (
                                installmentNo ===
                                tenureMonths
                            ) {
                                principalAmount =
                                    outstanding;

                                currentEmi =
                                    principalAmount
                                        .plus(interestAmount)
                                        .toDecimalPlaces(2);
                            } else {
                                principalAmount =
                                    currentEmi
                                        .minus(
                                            interestAmount
                                        )
                                        .toDecimalPlaces(2);

                                // Safety against rounding
                                if (
                                    principalAmount.gt(
                                        outstanding
                                    )
                                ) {
                                    principalAmount =
                                        outstanding;

                                    currentEmi =
                                        principalAmount
                                            .plus(
                                                interestAmount
                                            )
                                            .toDecimalPlaces(2);
                                }
                            }

                            outstanding =
                                outstanding
                                    .minus(
                                        principalAmount
                                    )
                                    .toDecimalPlaces(2);

                            totalInterest =
                                totalInterest
                                    .plus(
                                        interestAmount
                                    )
                                    .toDecimalPlaces(2);

                            emiRecords.push({
                                installmentNo,
                                dueDate,
                                principalAmount,
                                interestAmount,
                                emiAmount: currentEmi,
                                paidAmount:
                                    new Prisma.Decimal(0),
                                outstandingAmount:
                                    currentEmi,
                                status: "PENDING",
                            });
                        }

                        const totalPayable =
                            principal
                                .plus(totalInterest)
                                .toDecimalPlaces(2);

                        const loan =
                            await tx.loan.create({
                                data: {
                                    customerId:
                                        application.customerId,

                                    applicationId:
                                        application.id,

                                    loanNumber,

                                    principalAmount:
                                        principal,

                                    interestRate:
                                        annualInterestRate,

                                    tenureMonths,

                                    emiAmount,

                                    totalInterest,

                                    totalPayable,

                                    outstandingAmount:
                                        totalPayable,

                                    startDate,

                                    endDate,

                                    status: "ACTIVE",

                                    emis: {
                                        create:
                                            emiRecords,
                                    },
                                },

                                include: {
                                    emis: {
                                        orderBy: {
                                            installmentNo:
                                                "asc",
                                        },
                                    },
                                },
                            });

                        await tx.auditLog.create({
                            data: {
                                userId:
                                    req.user.userId,

                                action: "CREATE",

                                entity: "Loan",

                                entityId: loan.id,

                                description:
                                    "Loan created from approved loan application",

                                metadata: {
                                    applicationId:
                                        application.id,

                                    loanNumber:
                                        loan.loanNumber,

                                    principalAmount:
                                        principal.toString(),

                                    interestRate:
                                        annualInterestRate.toString(),

                                    tenureMonths,

                                    emiAmount:
                                        emiAmount.toString(),
                                },
                            },
                        });

                        return loan;
                    }
                );

            return res.status(201).json({
                success: true,

                message:
                    "Loan created successfully",

                loan: {
                    id: result.id,

                    loanNumber:
                        result.loanNumber,

                    principalAmount:
                        result.principalAmount.toString(),

                    interestRate:
                        result.interestRate.toString(),

                    tenureMonths:
                        result.tenureMonths,

                    emiAmount:
                        result.emiAmount.toString(),

                    totalInterest:
                        result.totalInterest.toString(),

                    totalPayable:
                        result.totalPayable.toString(),

                    outstandingAmount:
                        result.outstandingAmount.toString(),

                    startDate:
                        result.startDate,

                    endDate:
                        result.endDate,

                    status:
                        result.status,

                    emiCount:
                        result.emis.length,
                },

                emiSchedule:
                    result.emis.map((emi) => ({
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
                    })),
            });
        } catch (error) {
            console.error(
                "Create loan error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to create loan",
            });
        }
    }
);

module.exports = router;