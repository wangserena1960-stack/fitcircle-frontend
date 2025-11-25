// 記得這個是你的 Workers API 入口
const API_BASE = "https://falling-bush-0aae.wangserena1960.workers.dev";

let currentUser = null;
let currentRole = "coach";

async function handleLogin() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const errorBox = document.getElementById("login-error");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  errorBox.style.display = "none";

  if (!email || !password) {
    errorBox.textContent = "請輸入 email 與密碼";
    errorBox.style.display = "block";
    return;
  }

  try {
    const res = await fetch(API_BASE + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      errorBox.textContent = "帳號或密碼錯誤，或沒有權限";
      errorBox.style.display = "block";
      return;
    }
    const data = await res.json();
    currentUser = data.user;
    window._fitcircleToken = data.token;

    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      errorBox.textContent = "你不是 Admin，沒有權限進入平台管理介面";
      errorBox.style.display = "block";
      currentUser = null;
      return;
    }

    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-root").style.display = "block";

    switchRole("super_admin");
    await loadAdminOverview();
    await loadAdminCoaches();
    await loadAdminStudents();
  } catch (e) {
    console.error(e);
    errorBox.textContent = "登入時發生錯誤，請稍後再試";
    errorBox.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  const passwordInput = document.getElementById("login-password");
  if (loginButton) {
    loginButton.addEventListener("click", handleLogin);
  }
  if (passwordInput) {
    passwordInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  setupUiInteractions();
});

function setupUiInteractions() {
  const screens = document.querySelectorAll(".screen");
  const sectionTabs = document.querySelectorAll(".section-tab-btn");
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");

  function openScreen(id) {
    screens.forEach((s) => s.classList.toggle("active", s.id === id));
    sectionTabs.forEach((tab) =>
      tab.classList.toggle("active", tab.dataset.screen === id)
    );
    navItems.forEach((nav) =>
      nav.classList.toggle("active", nav.dataset.screen === id)
    );

    if (id === "admin-dashboard") {
      loadAdminOverview();
    } else if (id === "admin-coaches") {
      loadAdminCoaches();
    } else if (id === "admin-students") {
      loadAdminStudents();
    }
  }

  window.openScreen = openScreen;

  sectionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.screen;
      if (target) openScreen(target);
    });
  });

  navItems.forEach((nav) => {
    nav.addEventListener("click", () => {
      const target = nav.dataset.screen;
      if (target) openScreen(target);
    });
  });

  const roleBtns = document.querySelectorAll(".role-btn");
  const topCoach = document.getElementById("top-coach");
  const topStudent = document.getElementById("top-student");
  const topAdmin = document.getElementById("top-admin");
  const tabsCoach = document.getElementById("tabs-coach");
  const tabsStudent = document.getElementById("tabs-student");
  const tabsAdmin = document.getElementById("tabs-admin");
  const navCoach = document.getElementById("nav-coach");
  const navStudent = document.getElementById("nav-student");
  const navAdmin = document.getElementById("nav-admin");

  function switchRole(role) {
    currentRole = role;
    const isCoach = role === "coach";
    const isStudent = role === "student";
    const isAdmin = role === "super_admin";

    roleBtns.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.role === role)
    );

    if (topCoach && topStudent && topAdmin) {
      topCoach.style.display = isCoach ? "flex" : "none";
      topStudent.style.display = isStudent ? "flex" : "none";
      topAdmin.style.display = isAdmin ? "flex" : "none";
    }

    if (tabsCoach && tabsStudent && tabsAdmin) {
      tabsCoach.style.display = isCoach ? "flex" : "none";
      tabsStudent.style.display = isStudent ? "flex" : "none";
      tabsAdmin.style.display = isAdmin ? "flex" : "none";
    }

    if (navCoach && navStudent && navAdmin) {
      navCoach.style.display = isCoach ? "flex" : "none";
      navStudent.style.display = isStudent ? "flex" : "none";
      navAdmin.style.display = isAdmin ? "flex" : "none";
    }

    if (isCoach) openScreen("coach-dashboard");
    else if (isStudent) openScreen("student-home");
    else if (isAdmin) openScreen("admin-dashboard");
  }

  window.switchRole = switchRole;

  const roleBtns = document.querySelectorAll(".role-btn");
  roleBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchRole(btn.dataset.role));
  });
}

async function loadAdminOverview() {
  if (!currentUser) return;
  try {
    const res = await fetch(API_BASE + "/api/admin/overview");
    if (!res.ok) return;
    const data = await res.json();
    const cCoaches = document.getElementById("admin-count-coaches");
    const cStudents = document.getElementById("admin-count-students");
    const cClasses = document.getElementById("admin-count-classes");
    const cPending = document.getElementById("admin-count-pending");
    const tPayments = document.getElementById("admin-total-payments");
    if (cCoaches) cCoaches.textContent = data.coaches;
    if (cStudents) cStudents.textContent = data.students;
    if (cClasses) cClasses.textContent = data.classes;
    if (cPending) cPending.textContent = data.pendingLeaves;
    if (tPayments)
      tPayments.textContent = Number(data.totalPayments || 0).toLocaleString();
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminCoaches() {
  if (!currentUser) return;
  const tbody = document.getElementById("admin-coach-table-body");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4">載入中...</td></tr>';
  try {
    const res = await fetch(API_BASE + "/api/admin/coaches");
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML = '<tr><td colspan="4">尚未建立教練</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(
        (c) => `
      <tr>
        <td>${c.name}</td>
        <td>${c.email || ""}</td>
        <td>${c.phone || ""}</td>
        <td>${c.active ? "啟用" : "停用"}</td>
      </tr>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="4">載入失敗</td></tr>';
  }
}

async function loadAdminStudents() {
  if (!currentUser) return;
  const tbody = document.getElementById("admin-student-table-body");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3">載入中...</td></tr>';
  try {
    const res = await fetch(API_BASE + "/api/admin/students");
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML = '<tr><td colspan="3">尚未建立學生</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(
        (s) => `
      <tr>
        <td>${s.name}</td>
        <td>${s.phone || ""}</td>
        <td>${s.line_id || ""}</td>
      </tr>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="3">載入失敗</td></tr>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const coachBtn = document.getElementById("admin-create-coach-btn");
  if (coachBtn) {
    coachBtn.addEventListener("click", async () => {
      const name = document.getElementById("admin-new-coach-name").value.trim();
      const email = document
        .getElementById("admin-new-coach-email")
        .value.trim();
      const phone = document
        .getElementById("admin-new-coach-phone")
        .value.trim();
      const line = document.getElementById("admin-new-coach-line").value.trim();
      if (!name) {
        alert("請輸入教練姓名");
        return;
      }
      try {
        const res = await fetch(API_BASE + "/api/admin/coaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email: email || null,
            phone: phone || null,
            line_id: line || null,
            active: true,
          }),
        });
        if (!res.ok) {
          alert("建立失敗");
          return;
        }
        document.getElementById("admin-new-coach-name").value = "";
        document.getElementById("admin-new-coach-email").value = "";
        document.getElementById("admin-new-coach-phone").value = "";
        document.getElementById("admin-new-coach-line").value = "";
        await loadAdminCoaches();
        await loadAdminOverview();
      } catch (e) {
        console.error(e);
        alert("建立失敗");
      }
    });
  }

  const studentBtn = document.getElementById("admin-create-student-btn");
  if (studentBtn) {
    studentBtn.addEventListener("click", async () => {
      const name = document
        .getElementById("admin-new-student-name")
        .value.trim();
      const phone = document
        .getElementById("admin-new-student-phone")
        .value.trim();
      const line = document
        .getElementById("admin-new-student-line")
        .value.trim();
      if (!name) {
        alert("請輸入學生姓名");
        return;
      }
      try {
        const res = await fetch(API_BASE + "/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone: phone || null,
            line_id: line || null,
          }),
        });
        if (!res.ok) {
          alert("建立失敗");
          return;
        }
        document.getElementById("admin-new-student-name").value = "";
        document.getElementById("admin-new-student-phone").value = "";
        document.getElementById("admin-new-student-line").value = "";
        await loadAdminStudents();
        await loadAdminOverview();
      } catch (e) {
        console.error(e);
        alert("建立失敗");
      }
    });
  }
});
