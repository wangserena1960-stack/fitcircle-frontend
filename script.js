// FitCircle Dashboard v1 前端腳本
// 仍使用 /login-debug 做登入驗證，登入後呼叫 /admin/overview 顯示真實統計

const API_BASE = "https://fitcircle-api.wangserena1960.workers.dev/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (form) {
    form.addEventListener("submit", handleLogin);
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const btn = document.getElementById("login-button");
  const statusSpan = document.getElementById("login-status");
  const errorEl = document.getElementById("login-error");
  const debugEl = document.getElementById("debug");
  const appRoot = document.getElementById("app-root");
  const userEmailSpan = document.getElementById("current-user-email");

  const email = (emailInput.value || "").trim();
  const password = (passwordInput.value || "").trim();

  errorEl.style.display = "none";
  errorEl.textContent = "";
  if (debugEl) debugEl.textContent = "";

  btn.disabled = true;
  statusSpan.textContent = "登入中…";

  try {
    // 1) 先呼叫 login-debug（仍是硬寫死 demo 帳號）
    const loginUrl =
      `${API_BASE}/login-debug?email=` +
      encodeURIComponent(email) +
      `&password=` +
      encodeURIComponent(password);

    const loginRes = await fetch(loginUrl);
    const loginData = await loginRes.json().catch(() => ({}));

    const debugPayload = { loginStatus: loginRes.status, loginData };

    if (!loginRes.ok || !loginData.matchDemo) {
      if (debugEl) {
        debugPayload.error = "login failed";
        debugEl.textContent = JSON.stringify(debugPayload, null, 2);
      }
      errorEl.textContent = "登入失敗，請確認帳號密碼（或稍後再試）";
      errorEl.style.display = "block";
      return;
    }

    // 2) 登入成功，顯示 Dashboard，並呼叫 /admin/overview
    if (userEmailSpan) userEmailSpan.textContent = email;
    if (appRoot) appRoot.style.display = "block";
    statusSpan.textContent = "登入成功，載入總覽中…";

    const overviewUrl = `${API_BASE}/admin/overview`;
    const overviewRes = await fetch(overviewUrl);
    const overviewData = await overviewRes.json().catch(() => ({}));

    debugPayload.overviewStatus = overviewRes.status;
    debugPayload.overviewData = overviewData;
    if (debugEl) {
      debugEl.textContent = JSON.stringify(debugPayload, null, 2);
    }

    if (overviewRes.ok && overviewData) {
      fillOverviewStats(overviewData);
      statusSpan.textContent = "總覽載入完成。";
    } else {
      statusSpan.textContent = "登入成功，但載入總覽時發生問題。";
    }
  } catch (err) {
    console.error("登入流程例外：", err);
    errorEl.textContent = "登入或載入總覽時發生例外，請稍後再試。";
    errorEl.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

function fillOverviewStats(data) {
  const coaches = document.getElementById("stat-coaches");
  const students = document.getElementById("stat-students");
  const classes = document.getElementById("stat-classes");
  const pendingLeaves = document.getElementById("stat-pending-leaves");
  const totalPayments = document.getElementById("stat-total-payments");

  if (coaches) coaches.textContent = safeNumber(data.coaches);
  if (students) students.textContent = safeNumber(data.students);
  if (classes) classes.textContent = safeNumber(data.classes);
  if (pendingLeaves) pendingLeaves.textContent = safeNumber(data.pendingLeaves);

  if (totalPayments) {
    const amount = Number(data.totalPayments || 0);
    if (Number.isNaN(amount)) {
      totalPayments.textContent = "-";
    } else {
      // 顯示成「NT$ 12,345」
      totalPayments.textContent =
        "NT$ " + amount.toLocaleString("zh-Hant-TW");
    }
  }
}

function safeNumber(v) {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return 0;
  return n;
}
