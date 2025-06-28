async function detectIncognitoMode() {
  const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
  if (!fs) return false;
  return new Promise(resolve => {
    fs(window.TEMPORARY, 100, () => resolve(false), () => resolve(true));
  });
}

function getFingerprint() {
  const data = [
    navigator.platform,
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');
  return btoa(data).slice(0, 12);
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";

  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome") && !ua.includes("Chromium")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  document.getElementById("browser").innerText = browser;
}

function getDeviceInfo() {
  document.getElementById("device").innerText = navigator.platform || "Unknown";
}

async function getBatteryInfo() {
  try {
    const battery = await navigator.getBattery();
    const level = Math.round(battery.level * 100);
    document.getElementById("battery").innerText = `${level}%`;
  } catch {
    document.getElementById("battery").innerText = "Unavailable";
  }
}

async function getIpInfo() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    document.getElementById("ip").innerText = data.ip;
  } catch {
    document.getElementById("ip").innerText = "Unavailable";
  }
}

function getResolution() {
  document.getElementById("resolution").innerText = `${screen.width}x${screen.height}`;
}

function getLanguage() {
  document.getElementById("language").innerText = navigator.language || "Unknown";
}

function getTimezone() {
  document.getElementById("timezone").innerText = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getPermissionStatus(name, elementId) {
  navigator.permissions
    .query({ name })
    .then(result => {
      document.getElementById(elementId).innerText = result.state;
    })
    .catch(() => {
      document.getElementById(elementId).innerText = "Unavailable";
    });
}

async function getGeolocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const locationStr = `${data.city}, ${data.region}, ${data.country_name}`;
    document.getElementById("locationText").innerText = locationStr;
  } catch {
    document.getElementById("locationText").innerText = "Unavailable";
  }
}

function calculatePrivacyGrade() {
  const exposureIds = ["camera", "microphone", "location"];
  let risky = 0;
  exposureIds.forEach(id => {
    const val = document.getElementById(id).innerText;
    if (val === "granted") risky++;
  });

  const emoji = ["🛡️ Safe", "⚠️ Minor Risk", "🔥 High Risk", "☠️ Total Exposure"];
  document.getElementById("exposure").innerText = emoji[risky];

  let grade = "A+";
  if (risky === 1) grade = "B";
  else if (risky === 2) grade = "C";
  else if (risky === 3) grade = "D";

  const gradeEl = document.getElementById("privacyGrade");
  gradeEl.innerText = grade;
  gradeEl.className =
    "font-bold " +
    (grade === "A+" ? "text-green-400"
     : grade === "B" ? "text-yellow-300"
     : grade === "C" ? "text-orange-400"
     : "text-red-500");

  // Update ring
  const percentage = risky * 33;
  const circle = document.querySelector("#privacyCircleFill");
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${circumference - (percentage / 100) * circumference}`;
  document.getElementById("privacyPercent").innerText = `${percentage}%`;
}

async function runScanSequence() {
  document.getElementById("scanNow").classList.add("hidden");
  document.getElementById("reportBlock").classList.add("hidden");
  document.getElementById("rescanBlock").classList.add("hidden");
  document.getElementById("scanIcon").classList.remove("hidden");

  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    const incog = await detectIncognitoMode();
    document.getElementById("incognito").innerText = incog ? "🕵️ Yes" : "❌ No";
    document.getElementById("fingerprint").innerText = getFingerprint();
    getBrowserInfo();
    getDeviceInfo();
    await getBatteryInfo();
    await getIpInfo();
    getResolution();
    getLanguage();
    getTimezone();
    getPermissionStatus("camera", "camera");
    getPermissionStatus("microphone", "microphone");
    getPermissionStatus("geolocation", "location");
    await getGeolocation();

    calculatePrivacyGrade();
  } catch (err) {
    console.error("Scan failed", err);
  }

  document.getElementById("scanIcon").classList.add("hidden");
  document.getElementById("reportBlock").classList.remove("hidden");
  document.getElementById("rescanBlock").classList.remove("hidden");
}

function saveReportAsPDF() {
  const element = document.querySelector(".max-w-2xl");
  if (!element) return;

  const opt = {
    margin: 0.5,
    filename: 'privacy-report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("scanNow").addEventListener("click", runScanSequence);
  document.getElementById("rescan").addEventListener("click", runScanSequence);
  document.getElementById("downloadBtn")?.addEventListener("click", saveReportAsPDF);

  document.getElementById("reportBlock").classList.add("hidden");
  document.getElementById("rescanBlock").classList.add("hidden");
  document.getElementById("scanIcon").classList.add("hidden");
});
