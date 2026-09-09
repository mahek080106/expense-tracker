const CATEGORIES = {
  income: ["Salary", "Freelance", "Gift", "Other Income"],
  expense: ["Food", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Other"]
};

const CATEGORY_ICONS = {
  Salary: "💼", Freelance: "🧑‍💻", Gift: "🎁", "Other Income": "➕",
  Food: "🍔", Travel: "✈️", Shopping: "🛍️", Bills: "🧾",
  Entertainment: "🎬", Health: "💊", Other: "📦"
};

const STORAGE_KEY = "spendwise_transactions";
const THEME_KEY = "spendwise_theme";

let transactions = [];          
let pendingDeleteId = null;    

const filters = {
  search: "",
  type: "all",
  category: "all",
  sort: "date-desc"
};


const balanceValue = document.getElementById("balanceValue");
const incomeValue = document.getElementById("incomeValue");
const expenseValue = document.getElementById("expenseValue");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

const transactionList = document.getElementById("transactionList");
const categoryBreakdown = document.getElementById("categoryBreakdown");

const overlay = document.getElementById("overlay");
const drawer = document.getElementById("drawer");
const drawerTitle = document.getElementById("drawerTitle");
const openAddBtn = document.getElementById("openAddBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

const transactionForm = document.getElementById("transactionForm");
const transactionIdField = document.getElementById("transactionId");
const titleField = document.getElementById("title");
const amountField = document.getElementById("amount");
const categoryField = document.getElementById("category");
const dateField = document.getElementById("date");
const submitBtn = document.getElementById("submitBtn");
const typeRadios = document.querySelectorAll('input[name="type"]');

const confirmModal = document.getElementById("confirmModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const toast = document.getElementById("toast");
const themeToggle = document.getElementById("themeToggle");

function loadTransactions() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    return JSON.parse(saved);
  }

 
  return [
    { id: "seed-1", title: "Monthly Allowance", type: "income", amount: 8000, category: "Other Income", date: isoDaysAgo(6) },
    { id: "seed-2", title: "Part-time Tutoring", type: "income", amount: 2500, category: "Freelance", date: isoDaysAgo(4) },
    { id: "seed-3", title: "Canteen Lunch", type: "expense", amount: 120, category: "Food", date: isoDaysAgo(3) },
    { id: "seed-4", title: "Metro Card Recharge", type: "expense", amount: 300, category: "Travel", date: isoDaysAgo(2) },
    { id: "seed-5", title: "Movie Night", type: "expense", amount: 450, category: "Entertainment", date: isoDaysAgo(1) }
  ];
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}


function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderSummary() {
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  balanceValue.textContent = formatCurrency(balance);
  incomeValue.textContent = formatCurrency(income);
  expenseValue.textContent = formatCurrency(expense);
}

function populateCategoryFilterOptions() {
  const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
  allCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

function getFilteredSortedTransactions() {
  let list = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.type === "all" || t.type === filters.type;
    const matchesCategory = filters.category === "all" || t.category === filters.category;
    return matchesSearch && matchesType && matchesCategory;
  });

  list.sort((a, b) => {
    switch (filters.sort) {
      case "date-asc": return a.date.localeCompare(b.date);
      case "amount-desc": return b.amount - a.amount;
      case "amount-asc": return a.amount - b.amount;
      case "date-desc":
      default: return b.date.localeCompare(a.date);
    }
  });

  return list;
}

const EMPTY_JAR_SVG = `
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path class="illus-primary-fill illus-line" stroke-width="2.5" stroke-linejoin="round"
      d="M32 38 L30 84 C30 89 38 92 50 92 C62 92 70 89 70 84 L68 38 Z"/>
    <path class="illus-line" stroke-width="2.5" stroke-linecap="round"
      d="M28 38 H72"/>
    <path class="illus-line" stroke-width="2.5" stroke-linecap="round"
      d="M40 38 V28 C40 24 44 22 50 22 C56 22 60 24 60 28 V38"/>
    <path class="illus-primary" stroke-width="2.5" stroke-linecap="round"
      d="M50 58 V78 M50 58 C44 58 40 54 40 50 M50 66 C56 66 60 63 60 59"/>
    <circle class="illus-pink" stroke-width="2.5" cx="50" cy="14" r="7"/>
    <path class="illus-pink" stroke-width="2" d="M47 14 H53 M50 11 V17"/>
  </svg>`;

const EMPTY_SEARCH_SVG = `
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect class="illus-primary-fill illus-line" stroke-width="2.5" x="24" y="14" width="40" height="52" rx="4"/>
    <path class="illus-line" stroke-width="2" stroke-linecap="round"
      d="M32 26 H56 M32 34 H56 M32 42 H48"/>
    <path class="illus-line" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" d="M24 58 H64"/>
    <circle class="illus-pink" stroke-width="3" cx="62" cy="62" r="14"/>
    <path class="illus-pink" stroke-width="3" stroke-linecap="round" d="M72 72 L82 82"/>
  </svg>`;

function renderTransactionList() {
  const list = getFilteredSortedTransactions();
  transactionList.innerHTML = "";

  if (list.length === 0) {
    const isEmptyOverall = transactions.length === 0;
    transactionList.innerHTML = `
      <div class="empty-state">
        ${isEmptyOverall ? EMPTY_JAR_SVG : EMPTY_SEARCH_SVG}
        <h3>${isEmptyOverall ? "No transactions yet" : "No matching transactions"}</h3>
        <p>${isEmptyOverall
          ? "Add your first income or expense to see your dashboard come to life."
          : "Try a different search term or clear your filters."}</p>
      </div>`;
    return;
  }

  list.forEach(t => {
    const row = document.createElement("div");
    row.className = `transaction-row ${t.type}`;
    row.innerHTML = `
      <div class="t-icon">${CATEGORY_ICONS[t.category] || "💰"}</div>
      <div class="t-info">
        <div class="t-title">${escapeHtml(t.title)}</div>
        <div class="t-meta">
          <span class="t-category">${escapeHtml(t.category)}</span>
          <span>${formatDate(t.date)}</span>
        </div>
      </div>
      <div class="t-amount">${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}</div>
      <div class="t-actions">
        <button class="edit-btn" title="Edit" data-id="${t.id}">✏️</button>
        <button class="delete-btn" title="Delete" data-id="${t.id}">🗑️</button>
      </div>
    `;
    transactionList.appendChild(row);
  });

  transactionList.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openDrawerForEdit(btn.dataset.id));
  });
  transactionList.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => openConfirmModal(btn.dataset.id));
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderCategoryBreakdown() {
  const expenseTransactions = transactions.filter(t => t.type === "expense");
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpense === 0) {
    categoryBreakdown.innerHTML = `<p class="category-empty">Add an expense to see where your money goes.</p>`;
    return;
  }

  const totalsByCategory = {};
  expenseTransactions.forEach(t => {
    totalsByCategory[t.category] = (totalsByCategory[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1]);

  categoryBreakdown.innerHTML = sortedCategories.map(([category, amount]) => {
    const percent = Math.round((amount / totalExpense) * 100);
    return `
      <div class="category-bar-row">
        <div class="category-bar-label">
          <span>${CATEGORY_ICONS[category] || "📦"} ${escapeHtml(category)}</span>
          <span>${percent}%</span>
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width: ${percent}%"></div>
        </div>
      </div>`;
  }).join("");
}

function renderAll() {
  renderSummary();
  renderTransactionList();
  renderCategoryBreakdown();
}

function fillCategoryOptions(type, selected) {
  categoryField.innerHTML = '<option value="">Select a category</option>';
  CATEGORIES[type].forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selected) option.selected = true;
    categoryField.appendChild(option);
  });
}

function getSelectedType() {
  return document.querySelector('input[name="type"]:checked').value;
}


function updateTypeToggleStyles() {
  document.querySelectorAll(".type-toggle label").forEach(label => {
    const input = label.querySelector("input");
    label.classList.toggle("is-checked", input.checked);
  });
}

function openDrawer() {
  overlay.classList.add("show");
  drawer.classList.add("show");
}

function closeDrawer() {
  overlay.classList.remove("show");
  drawer.classList.remove("show");
  transactionForm.reset();
  clearErrors();
  transactionIdField.value = "";
}

function openDrawerForAdd() {
  drawerTitle.textContent = "Add Transaction";
  submitBtn.textContent = "Add Transaction";
  transactionIdField.value = "";
  transactionForm.reset();
  clearErrors();
  fillCategoryOptions("income", "");
  updateTypeToggleStyles();
  dateField.value = new Date().toISOString().slice(0, 10);
  openDrawer();
}

function openDrawerForEdit(id) {
  const t = transactions.find(t => t.id === id);
  if (!t) return;

  drawerTitle.textContent = "Edit Transaction";
  submitBtn.textContent = "Save Changes";
  transactionIdField.value = t.id;

  document.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
  fillCategoryOptions(t.type, t.category);
  updateTypeToggleStyles();

  titleField.value = t.title;
  amountField.value = t.amount;
  dateField.value = t.date;
  clearErrors();
  openDrawer();
}

function setFieldError(groupEl, hasError) {
  groupEl.classList.toggle("has-error", hasError);
}

function clearErrors() {
  ["titleGroup", "amountGroup", "categoryGroup", "dateGroup"].forEach(id => {
    document.getElementById(id).classList.remove("has-error");
  });
}

function validateForm() {
  let isValid = true;

  const titleOk = titleField.value.trim().length > 0;
  setFieldError(document.getElementById("titleGroup"), !titleOk);
  if (!titleOk) isValid = false;

  const amountOk = amountField.value !== "" && parseFloat(amountField.value) > 0;
  setFieldError(document.getElementById("amountGroup"), !amountOk);
  if (!amountOk) isValid = false;

  const categoryOk = categoryField.value !== "";
  setFieldError(document.getElementById("categoryGroup"), !categoryOk);
  if (!categoryOk) isValid = false;

  const dateOk = dateField.value !== "";
  setFieldError(document.getElementById("dateGroup"), !dateOk);
  if (!dateOk) isValid = false;

  return isValid;
}

function handleFormSubmit(event) {
  event.preventDefault();

  if (!validateForm()) return;

  const id = transactionIdField.value;
  const data = {
    title: titleField.value.trim(),
    type: getSelectedType(),
    amount: parseFloat(amountField.value),
    category: categoryField.value,
    date: dateField.value
  };

  if (id) {
    const index = transactions.findIndex(t => t.id === id);
    transactions[index] = { ...transactions[index], ...data };
    showToast("Transaction updated");
  } else {
    // Adding a brand new transaction.
    transactions.push({ id: "t-" + Date.now(), ...data });
    showToast("Transaction added");
  }

  saveTransactions();
  renderAll();
  closeDrawer();
}

function openConfirmModal(id) {
  pendingDeleteId = id;
  overlay.classList.add("show");
  confirmModal.classList.add("show");
}

function closeConfirmModal() {
  pendingDeleteId = null;
  overlay.classList.remove("show");
  confirmModal.classList.remove("show");
}

function handleConfirmedDelete() {
  transactions = transactions.filter(t => t.id !== pendingDeleteId);
  saveTransactions();
  renderAll();
  closeConfirmModal();
  showToast("Transaction deleted");
}

function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function attachEventListeners() {
  openAddBtn.addEventListener("click", openDrawerForAdd);
  closeDrawerBtn.addEventListener("click", closeDrawer);

  typeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      fillCategoryOptions(getSelectedType(), "");
      updateTypeToggleStyles();
    });
  });

  transactionForm.addEventListener("submit", handleFormSubmit);

  cancelDeleteBtn.addEventListener("click", closeConfirmModal);
  confirmDeleteBtn.addEventListener("click", handleConfirmedDelete);

  overlay.addEventListener("click", () => {
    closeDrawer();
    closeConfirmModal();
  });

  searchInput.addEventListener("input", () => {
    filters.search = searchInput.value;
    renderTransactionList();
  });
  typeFilter.addEventListener("change", () => {
    filters.type = typeFilter.value;
    renderTransactionList();
  });
  categoryFilter.addEventListener("change", () => {
    filters.category = categoryFilter.value;
    renderTransactionList();
  });
  sortSelect.addEventListener("change", () => {
    filters.sort = sortSelect.value;
    renderTransactionList();
  });

  themeToggle.addEventListener("click", toggleTheme);
}

function initDashboard() {
  transactions = loadTransactions();
  saveTransactions(); 

  document.getElementById("todayDate").textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const savedName = localStorage.getItem("spendwise_username");
  if (savedName) {
    document.getElementById("userName").textContent = savedName;
    document.getElementById("userInitial").textContent = savedName.charAt(0).toUpperCase();
  }

  populateCategoryFilterOptions();
  applySavedTheme();
  attachEventListeners();
  updateTypeToggleStyles();
  renderAll();
}

document.addEventListener("DOMContentLoaded", initDashboard);