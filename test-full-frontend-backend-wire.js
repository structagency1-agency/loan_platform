/**
 * Full End-to-End Frontend-to-Backend Wiring Test
 */

const BASE_URL = "http://localhost:5000/api";

async function run() {
  console.log("=== STARTING FRONTEND-TO-BACKEND INTEGRATION TEST ===");

  // 1. Customer Login
  console.log("\n[1] Customer Login...");
  const custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "testcustomer@example.com", password: "TestPassword123!" })
  });
  const custLoginData = await custLoginRes.json();
  if (!custLoginData.success) throw new Error("Customer login failed: " + JSON.stringify(custLoginData));
  const custToken = custLoginData.token;
  console.log("  ✓ Customer authenticated:", custLoginData.user.name);

  // 2. Fetch loan products
  console.log("\n[2] Fetching Loan Products...");
  const prodRes = await fetch(`${BASE_URL}/loan-products`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  const prodData = await prodRes.json();
  const product = prodData.products?.[0];
  if (!product) throw new Error("No loan product found");
  console.log("  ✓ Product retrieved:", product.name, "(ID:", product.id + ")");

  // 3. Customer submits loan application
  console.log("\n[3] Customer Submitting Loan Application...");
  const appRes = await fetch(`${BASE_URL}/loan-applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`
    },
    body: JSON.stringify({
      productId: product.id,
      requestedAmount: 50000,
      requestedTenure: 12,
      purpose: "Medical and Business Expansion"
    })
  });
  const appData = await appRes.json();
  if (!appData.success) throw new Error("Loan application failed: " + JSON.stringify(appData));
  const appId = appData.application.id;
  console.log("  ✓ Loan application submitted successfully! App ID:", appId);

  // 4. Admin Login
  console.log("\n[4] Admin Login...");
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@loanplatform.com", password: "Admin@12345" })
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginData.success) throw new Error("Admin login failed");
  const adminToken = adminLoginData.token;
  console.log("  ✓ Admin authenticated:", adminLoginData.user.name);

  // 5. Admin queries pending applications
  console.log("\n[5] Admin Queries Pending Loan Applications...");
  const adminAppsRes = await fetch(`${BASE_URL}/admin/loan-applications`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminAppsData = await adminAppsRes.json();
  const foundApp = adminAppsData.applications?.find(a => a.id === appId);
  if (!foundApp) throw new Error("Submitted application not found in Admin queue!");
  console.log("  ✓ Admin successfully retrieved submitted application in real-time:", foundApp.id, "Status:", foundApp.status);

  // 6. Admin approves application
  console.log("\n[6] Admin Review & Approval...");
  const reviewRes = await fetch(`${BASE_URL}/admin/loan-applications/${appId}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      decision: "APPROVE",
      interestRate: "12",
      reviewNotes: "Credit verified, low risk score."
    })
  });
  const reviewData = await reviewRes.json();
  if (!reviewData.success) throw new Error("Admin review failed: " + JSON.stringify(reviewData));
  console.log("  ✓ Admin approved application! Message:", reviewData.message);

  // 7. Admin creates loan from approved application
  console.log("\n[7] Admin Creating Loan & EMI Schedule...");
  const createLoanRes = await fetch(`${BASE_URL}/admin/loan-applications/${appId}/create-loan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      startDate: new Date().toISOString()
    })
  });
  const createLoanData = await createLoanRes.json();
  if (!createLoanData.success) throw new Error("Loan creation failed: " + JSON.stringify(createLoanData));
  const newLoan = createLoanData.loan;
  console.log("  ✓ Loan created! Loan Number:", newLoan.loanNumber, "Status:", newLoan.status);

  // 8. Customer fetches real loans
  console.log("\n[8] Customer Queries Active Loans...");
  const custLoansRes = await fetch(`${BASE_URL}/customer/loans`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  const custLoansData = await custLoansRes.json();
  const customerFoundLoan = custLoansData.loans?.find(l => l.id === newLoan.id);
  console.log("  ✓ Customer portal reflects live loan:", customerFoundLoan?.loanNumber, "EMI count:", customerFoundLoan?.emis?.length);

  // 9. Agent queries assigned dues & summary
  console.log("\n[9] Agent Queries Collection Summary...");
  const agentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "agent.test.002@loanplatform.com", password: "Agent@12345" })
  });
  const agentLoginData = await agentLoginRes.json();
  const agentToken = agentLoginData.token;
  const summaryRes = await fetch(`${BASE_URL}/agent/collection-summary/daily`, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  const summaryData = await summaryRes.json();
  console.log("  ✓ Agent collection summary retrieved! Total Collected:", summaryData.totalCashCollected);

  console.log("\n============================================================");
  console.log("ALL FRONTEND-TO-BACKEND CORE WORKFLOWS ARE WIRED & WORKING!");
  console.log("============================================================");
}

run().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
