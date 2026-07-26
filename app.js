const plants = [
  "Işıkkent","Torbalı","Gaziemir","Özbek","Çeşme","Çiğli","Koyundere",
  "Aliağa","Zeytindağ","Akhisar","Aydın","Tekirdağ","Kıraç","Çorlu"
];

const defaultShipments = [
  {
    id: 1, date: new Date().toISOString().slice(0,10), time: "08:30",
    plant: "Işıkkent", company: "Önerge Yapı", site: "Bornova Konutları",
    concreteClass: "C30/37", amount: 48, pumpStatus: "Pompalı", pumpType: "47'lik",
    slump: "S4", gross: "Hayır", additive: "Standart",
    contact: "Mehmet Usta - 0532 000 00 01"
  },
  {
    id: 2, date: new Date().toISOString().slice(0,10), time: "11:00",
    plant: "Gaziemir", company: "Ege İnşaat", site: "Menderes Fabrika",
    concreteClass: "C35/45", amount: 72, pumpStatus: "Pompasız", pumpType: "-",
    slump: "S3", gross: "Evet", additive: "Katkısız",
    contact: "Hasan Bey - 0533 000 00 02"
  },
  {
    id: 3, date: new Date(Date.now()+86400000).toISOString().slice(0,10), time: "09:15",
    plant: "Torbalı", company: "Güven Beton", site: "Ayrancılar Villa Projesi",
    concreteClass: "C25/30", amount: 36, pumpStatus: "Pompalı", pumpType: "42'lik",
    slump: "S3", gross: "Hayır", additive: "Standart",
    contact: "Ali Usta - 0534 000 00 03"
  }
];

let shipments = JSON.parse(localStorage.getItem("betonexaShipments")) || defaultShipments;
let activeFilter = "all";
let currentUser = localStorage.getItem("betonexaUser") || "";

const $ = (id) => document.getElementById(id);
const loginView = $("loginView");
const dashboardView = $("dashboardView");
const modal = $("modal");
const shipmentList = $("shipmentList");
const template = $("shipmentCardTemplate");

function save() {
  localStorage.setItem("betonexaShipments", JSON.stringify(shipments));
}

function showDashboard(user) {
  currentUser = user;
  localStorage.setItem("betonexaUser", user);
  $("welcomeName").textContent = user;
  loginView.classList.remove("active");
  dashboardView.classList.add("active");
  render();
}

function showLogin() {
  localStorage.removeItem("betonexaUser");
  dashboardView.classList.remove("active");
  loginView.classList.add("active");
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat("tr-TR", {
    day:"2-digit", month:"long", year:"numeric", weekday:"long"
  }).format(new Date(dateStr + "T12:00:00"));
}

function render() {
  const query = $("searchInput").value.trim().toLocaleLowerCase("tr-TR");
  const today = new Date().toISOString().slice(0,10);

  const filtered = shipments
    .filter(item => {
      if (activeFilter === "today" && item.date !== today) return false;
      if (activeFilter === "pompalı" && item.pumpStatus !== "Pompalı") return false;
      if (activeFilter === "pompasız" && item.pumpStatus !== "Pompasız") return false;
      const haystack = `${item.site} ${item.company} ${item.plant}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(query);
    })
    .sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  shipmentList.innerHTML = "";

  if (!filtered.length) {
    shipmentList.innerHTML = '<div class="empty-state">Bu filtreye uygun sevkiyat bulunamadı.</div>';
  }

  filtered.forEach(item => {
    const card = template.content.cloneNode(true);
    card.querySelector(".date-line").textContent = `${formatDate(item.date)} • ${item.time}`;
    card.querySelector(".site-line").textContent = item.site;
    card.querySelector(".company-line").textContent = item.company;
    card.querySelector(".status-badge").textContent = item.pumpStatus;
    card.querySelector(".plant-line").textContent = item.plant;
    card.querySelector(".concrete-line").textContent = `${item.concreteClass} / ${item.slump}`;
    card.querySelector(".amount-line").textContent = `${item.amount} m³`;
    card.querySelector(".pump-line").textContent = item.pumpStatus === "Pompalı" ? item.pumpType : "Pompasız";
    card.querySelector(".contact-line").textContent = item.contact || "Sorumlu bilgisi yok";
    card.querySelector(".edit-btn").addEventListener("click", () => openModal(item));
    card.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Bu sevkiyat silinsin mi?")) {
        shipments = shipments.filter(x => x.id !== item.id);
        save();
        render();
      }
    });
    shipmentList.appendChild(card);
  });

  const todays = shipments.filter(x => x.date === today);
  $("todayCount").textContent = todays.length;
  $("totalM3").textContent = todays.reduce((sum,x) => sum + Number(x.amount), 0);
  $("activePlants").textContent = new Set(todays.map(x => x.plant)).size;
}

function openModal(item = null) {
  $("modalTitle").textContent = item ? "Sevkiyatı Düzenle" : "Yeni Sevkiyat";
  $("editId").value = item?.id || "";
  $("date").value = item?.date || new Date().toISOString().slice(0,10);
  $("time").value = item?.time || "08:00";
  $("plant").value = item?.plant || plants[0];
  $("company").value = item?.company || "";
  $("site").value = item?.site || "";
  $("concreteClass").value = item?.concreteClass || "C30/37";
  $("amount").value = item?.amount || 30;
  $("pumpStatus").value = item?.pumpStatus || "Pompalı";
  $("pumpType").value = item?.pumpType || "47'lik";
  $("slump").value = item?.slump || "S3";
  $("gross").value = item?.gross || "Hayır";
  $("additive").value = item?.additive || "Standart";
  $("contact").value = item?.contact || "";
  togglePumpType();
  checkConflict();
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function togglePumpType() {
  const disabled = $("pumpStatus").value === "Pompasız";
  $("pumpType").disabled = disabled;
  if (disabled) $("pumpType").value = "38'lik";
  checkConflict();
}

function checkConflict() {
  const warning = $("conflictWarning");
  const pumpStatus = $("pumpStatus").value;
  const pumpType = $("pumpType").value;
  const watched = ["47'lik","52'lik","56'lık"];
  const id = Number($("editId").value || 0);

  const conflict = pumpStatus === "Pompalı" && watched.includes(pumpType) &&
    shipments.some(x =>
      x.id !== id &&
      x.date === $("date").value &&
      x.time === $("time").value &&
      x.pumpStatus === "Pompalı" &&
      x.pumpType === pumpType
    );

  warning.classList.toggle("hidden", !conflict);
}

$("loginBtn").addEventListener("click", () => {
  if ($("passwordInput").value !== "1234") {
    alert("Şifre hatalı. Demo şifresi 1234.");
    return;
  }
  showDashboard($("userSelect").value);
});

$("logoutBtn").addEventListener("click", showLogin);
$("addShipmentBtn").addEventListener("click", () => openModal());
$("closeModalBtn").addEventListener("click", closeModal);
$("modalBackdrop").addEventListener("click", closeModal);
$("searchInput").addEventListener("input", render);
$("pumpStatus").addEventListener("change", togglePumpType);
["date","time","pumpType"].forEach(id => $(id).addEventListener("change", checkConflict));

document.querySelectorAll(".filter-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    render();
  });
});

$("shipmentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number($("editId").value || Date.now());
  const item = {
    id,
    date: $("date").value,
    time: $("time").value,
    plant: $("plant").value,
    company: $("company").value.trim(),
    site: $("site").value.trim(),
    concreteClass: $("concreteClass").value,
    amount: Number($("amount").value),
    pumpStatus: $("pumpStatus").value,
    pumpType: $("pumpStatus").value === "Pompalı" ? $("pumpType").value : "-",
    slump: $("slump").value,
    gross: $("gross").value,
    additive: $("additive").value,
    contact: $("contact").value.trim()
  };

  const index = shipments.findIndex(x => x.id === id);
  if (index >= 0) shipments[index] = item;
  else shipments.push(item);

  save();
  closeModal();
  render();
});

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("betonexaTheme", document.body.classList.contains("dark") ? "dark" : "light");
});

plants.forEach(plant => {
  const option = document.createElement("option");
  option.textContent = plant;
  option.value = plant;
  $("plant").appendChild(option);
});

if (localStorage.getItem("betonexaTheme") === "dark") document.body.classList.add("dark");
if (currentUser) showDashboard(currentUser);
