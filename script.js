const API_BASE = "https://fitcircle-api.wangserena1960.workers.dev/api";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
});

async function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const debug = document.getElementById("debug");

  const url = `${API_BASE}/login-debug?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const res = await fetch(url);
  const data = await res.json().catch(()=>({}));

  debug.textContent = JSON.stringify({status:res.status, data}, null, 2);
}
