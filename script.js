// FitCircle Dashboard v2 前端腳本
// 優先用「正式登入」POST /api/login，必要時退回 /api/login-debug
// 登入成功後呼叫 /api/admin/overview 顯示統計

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

  if (!email || !password) {
    errorEl.textContent = "請輸入 Email 與密碼。";
    errorEl.style.display = "block";
    return;
  }

  errorEl.style.display = "none";
  errorEl.textContent = "";
  if (debugEl) debugEl.textContent = "";

  btn.disabled = true;
  statusSpan.textContent = "登入中…";

  const debugPayload = {};

  try {
    // 1) 優先嘗試正式登入：POST /api/login
    let loginSuccess = false;
    let loginData = null;

    try {
      const loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      loginData = await loginRes.json().catch(() => ({}));

      debugPayload.loginStatus = loginRes.status;
      debugPayload.loginData = loginData;

      if (loginRes.ok && loginData && loginData.success) {
        loginSuccess = true;
      }
    } catch (err) {
      debugPayload.loginError = String(err);
      console.error("呼叫 /api/login 失敗：", err);
    }

    // 2) 如果正式登入沒過，退回 login-debug（舊 demo 模式）
    if (!loginSuccess) {
      try {
        const debugUrl =
          `${API_BASE}/login-debug?email=` +
          encodeURIComponent(email) +
          `&password=` +
          encodeURIComponent(password);

        const debugRes = await fetch(debugUrl);
        const debugData = await debugRes.json().catch(() => ({}));

        debugPayload.loginDebugStatus = debugRes.status;
        debugPayload.loginDebugData = debugData;

        if (debugRes.ok && debugData.matchDemo) {
          loginSuccess = true;
          // 模擬 admin 資料
          loginData = {
            success: true,
            admin: {
              email,
              name: "Demo Owner",
              role: "super_admin",
            },
          };
        }
      } catch (err2) {
        debugPayload.loginDebugError = String(err2);
        console.error("呼叫 /api/login-debug 失敗：", err2);
      }
    }

    if (!loginSuccess) {
      if (debugEl) {
        debugEl.textContent = JSON.stringify(debugPayload, null, 2);
      }
      errorEl.textContent = "登入失敗，請確認帳號密碼（或稍後再試）。";
      errorEl.style.display = "block";
      statusSpan.textContent = "";
      return;
    }

    // 3) 登入成功，顯示 Dashboard，使用 admin 資料
    const admin = loginData.admin || {};
    if (userEmailSpan) {
      userEmailSpan.textContent = admin.email || email;
    }
    if (appRoot) appRoot.style.display = "block";

    statusSpan.textContent = "登入成功，載入總覽中…";

    // 4) 呼叫 /api/admin/overview
    try {
      const overviewRes = await fetch(`${API_BASE}/admin/overview`);
      const overviewData = await overviewRes.json().catch(() => ({}));

      debugPayload.overviewStatus = overviewRes.status;
      debugPayload.overviewData = overviewData;

      if (overviewRes.ok && overviewData) {
        fillOverviewStats(overviewData);
        statusSpan.textContent = "總覽載入完成。";
      } else {
        statusSpan.textContent = "登入成功，但載入總覽時發生問題。";
      }
    } catch (err3) {
      debugPayload.overviewError = String(err3);
      console.error("呼叫 /api/admin/overview 失敗：", err3);
      statusSpan.textContent = "登入成功，但載入總覽時發生例外。";
    }

    if (debugEl) {
      debugEl.textContent = JSON.stringify(debugPayload, null, 2);
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
