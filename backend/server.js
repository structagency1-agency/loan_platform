require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// ========================================
// ROUTE IMPORTS
// ========================================

const authRoutes = require("./routes/auth");

const loanProductRoutes = require("./routes/loan-products");
const loanApplicationRoutes = require("./routes/loan-applications");

const adminLoanApplicationRoutes = require("./routes/admin-loan-applications");
const adminLoanReviewRoutes = require("./routes/admin-loan-review");
const adminLoanCreationRoutes = require("./routes/admin-loan-creation");

const customerLoanRoutes = require("./routes/customer-loans");

const paymentRoutes = require("./routes/payments");

const adminAgentRoutes = require("./routes/admin-agents");
const adminAreaRoutes = require("./routes/admin-areas");
const adminAgentAreaRoutes = require("./routes/admin-agent-areas");
const adminLoanAgentRoutes = require("./routes/admin-loan-agents");
const adminCashCollectionRoutes = require("./routes/admin-cash-collections");
const adminCashSettlementRoutes = require("./routes/admin-cash-settlements");
const adminFinancialReportRoutes = require("./routes/admin-financial-reports");

// NEW: Agent Dashboard
const agentDashboardRoutes = require("./routes/agent-dashboard");
const agentCashCollectionRoutes = require("./routes/agent-cash-collections");

// ========================================
// MIDDLEWARE IMPORTS
// ========================================

const { authenticateToken } = require("./middleware/auth");
const { authorizeRoles } = require("./middleware/roles");

// ========================================
// EXPRESS APPLICATION
// ========================================

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// ========================================
// AUTHENTICATION
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// LOAN PRODUCTS
// ========================================

app.use("/api/loan-products", loanProductRoutes);

// ========================================
// CUSTOMER LOAN APPLICATIONS
// ========================================

app.use("/api/loan-applications", loanApplicationRoutes);

// ========================================
// CUSTOMER LOANS
// ========================================

app.use("/api/customer/loans", customerLoanRoutes);

// ========================================
// ADMIN LOAN APPLICATION MANAGEMENT
// ========================================

app.use(
  "/api/admin/loan-applications",
  adminLoanApplicationRoutes
);

app.use(
  "/api/admin/loan-applications",
  adminLoanReviewRoutes
);

app.use(
  "/api/admin/loan-applications",
  adminLoanCreationRoutes
);

app.use(
  "/api/admin/loans",
  adminLoanCreationRoutes
);

// ========================================
// PAYMENT MANAGEMENT
// ========================================

app.use("/api/payments", paymentRoutes);

// ========================================
// ADMIN AGENT MANAGEMENT
// ========================================

app.use("/api/admin/agents", adminAgentRoutes);

// ========================================
// ADMIN AREA MANAGEMENT
// ========================================

app.use("/api/admin/areas", adminAreaRoutes);

// ========================================
// ADMIN AGENT-AREA ASSIGNMENTS
// ========================================

app.use(
  "/api/admin/agent-areas",
  adminAgentAreaRoutes
);

// ========================================
// ADMIN LOAN-AGENT ASSIGNMENTS
// ========================================

app.use(
  "/api/admin/loan-agents",
  adminLoanAgentRoutes
);

// ========================================
// ADMIN CASH COLLECTIONS OVERSIGHT
// ========================================

app.use(
  "/api/admin/cash-collections",
  adminCashCollectionRoutes
);

// ========================================
// ADMIN CASH SETTLEMENTS & RECONCILIATION
// ========================================

app.use(
  "/api/admin/cash-settlements",
  adminCashSettlementRoutes
);

// ========================================
// ADMIN FINANCIAL REPORTS & ACCOUNTING LEDGER
// ========================================

app.use(
  "/api/admin/financial-reports",
  adminFinancialReportRoutes
);

// ========================================
// AGENT DASHBOARD & CASH COLLECTIONS
// ========================================

app.use("/api/agent/cash-collections", agentCashCollectionRoutes);
app.use("/api/agent", agentDashboardRoutes);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Loan Platform API is running",
  });
});

// ========================================
// ADMIN AUTHORIZATION TEST
// ========================================

app.get(
  "/api/admin/test",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin authorization successful",
      userId: req.user.userId,
      role: req.user.role,
    });
  }
);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Loan Platform API running on port ${PORT}`);
  });
}

module.exports = app;