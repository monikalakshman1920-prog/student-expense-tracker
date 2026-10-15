const nameInput = document.querySelector("#expenseName");
const amountInput = document.querySelector("#expenseAmount");
const categoryInput = document.querySelector("#expenseCategory");
const dateInput = document.querySelector("#expenseDate");
const addBtn = document.querySelector("#addBtn");
const expenseList = document.querySelector("#expenseList");
const totalDisplay = document.querySelector("#total");

const budgetInput = document.querySelector("#monthlyBudget");
const saveBudgetBtn = document.querySelector("#saveBudgetBtn");
const budgetRemaining = document.querySelector("#budgetRemaining");
const budgetMessage = document.querySelector("#budgetMessage");
const categorySummary = document.querySelector("#categorySummary");
const spendingChart = document.querySelector("#spendingChart");

// Create the month selector automatically.
const monthLabel = document.createElement("label");
monthLabel.textContent = "Choose Month: ";
monthLabel.style.display = "block";
monthLabel.style.margin = "15px 0 5px";

const monthSelect = document.createElement("select");
monthSelect.id = "monthSelect";
monthSelect.style.padding = "10px";
monthSelect.style.borderRadius = "8px";
monthSelect.style.marginBottom = "10px";

budgetInput.parentNode.insertBefore(monthLabel, budgetInput);
budgetInput.parentNode.insertBefore(monthSelect, budgetInput);

let expenses = [];
let budgets = {};

try {
  expenses = JSON.parse(localStorage.getItem("studentExpenses")) || [];
  if (!Array.isArray(expenses)) expenses = [];
} catch {
  expenses = [];
}

try {
  budgets = JSON.parse(localStorage.getItem("studentBudgets")) || {};
  if (!budgets || typeof budgets !== "object" || Array.isArray(budgets)) {
    budgets = {};
  }
} catch {
  budgets = {};
}

const oldBudget = Number(localStorage.getItem("studentBudget"));
const today = new Date();
const currentMonth =
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

if (!budgets[currentMonth] && oldBudget > 0) {
  budgets[currentMonth] = oldBudget;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveExpenses() {
  localStorage.setItem("studentExpenses", JSON.stringify(expenses));
}

function saveBudgets() {
  localStorage.setItem("studentBudgets", JSON.stringify(budgets));
}

function setupMonths() {
  const months = new Set([currentMonth]);

  expenses.forEach(expense => {
    if (expense.date && /^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
      months.add(expense.date.slice(0, 7));
    }
  });

  const previousSelection = monthSelect.value;
  monthSelect.innerHTML = "";

  [...months].sort().reverse().forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    const [year, number] = month.split("-");
    option.textContent = new Date(
      Number(year), Number(number) - 1, 1
    ).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    monthSelect.appendChild(option);
  });

  monthSelect.value = months.has(previousSelection)
    ? previousSelection
    : currentMonth;
}

function showExpenses() {
  expenseList.innerHTML = "";
  categorySummary.innerHTML = "";
  spendingChart.innerHTML = "";

  const selectedMonth = monthSelect.value;
  const monthlyExpenses = expenses
    .map((expense, index) => ({ ...expense, originalIndex: index }))
    .filter(expense =>
      expense.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(expense.date) &&
      expense.date.startsWith(selectedMonth)
    );

  let total = 0;
  const categories = { Food: 0, Travel: 0, Education: 0, Shopping: 0, Other: 0 };

  monthlyExpenses.forEach(expense => {
    const amount = Number(expense.amount) || 0;
    total += amount;
    categories[expense.category] = (categories[expense.category] || 0) + amount;

    const item = document.createElement("p");
    item.textContent =
      `${expense.name} - ₹${amount.toFixed(2)} | ${expense.category} | ${expense.date} `;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = function () {
      expenses.splice(expense.originalIndex, 1);
      saveExpenses();
      setupMonths();
      showExpenses();
    };

    item.appendChild(delBtn);
    expenseList.appendChild(item);
  });

  totalDisplay.textContent = total.toFixed(2);
  if (monthlyExpenses.length === 0) {
    expenseList.textContent = "No expenses recorded for this month.";
  }

  const budget = Number(budgets[selectedMonth]) || 0;
  budgetInput.value = budget || "";
  const remaining = budget - total;
  budgetRemaining.textContent = remaining.toFixed(2);

  if (budget <= 0) {
    budgetMessage.textContent = "Set a budget for this month!";
  } else if (remaining < 0) {
    budgetMessage.textContent = `Budget exceeded by ₹${Math.abs(remaining).toFixed(2)}!`;
  } else {
    budgetMessage.textContent = `You have ₹${remaining.toFixed(2)} left this month.`;
  }

  Object.entries(categories).forEach(([category, amount]) => {
    const line = document.createElement("p");
    line.textContent = `${category}: ₹${amount.toFixed(2)}`;
    categorySummary.appendChild(line);
  });

  const maxAmount = Math.max(...Object.values(categories), 1);
  Object.entries(categories).forEach(([category, amount]) => {
    const label = document.createElement("p");
    label.textContent = `${category} — ₹${amount.toFixed(2)}`;

    const bar = document.createElement("div");
    bar.style.width = `${(amount / maxAmount) * 100}%`;
    bar.style.height = "18px";
    bar.style.background = "#7655db";
    bar.style.borderRadius = "6px";
    bar.style.marginBottom = "12px";
    bar.style.minWidth = amount > 0 ? "4px" : "0";

    spendingChart.appendChild(label);
    spendingChart.appendChild(bar);
  });
}

addBtn.onclick = function () {
  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);

  if (name === "" || amountInput.value === "" ||
      !Number.isFinite(amount) || amount <= 0) {
    alert("Enter a description and a valid amount!");
    return;
  }

  const expenseDate = dateInput.value || getLocalDateString();
  expenses.push({
    name,
    amount,
    category: categoryInput.value,
    date: expenseDate
  });

  saveExpenses();
  setupMonths();
  monthSelect.value = expenseDate.slice(0, 7);
  showExpenses();

  nameInput.value = "";
  amountInput.value = "";
  dateInput.value = "";
};

saveBudgetBtn.onclick = function () {
  const budget = Number(budgetInput.value);
  if (budgetInput.value.trim() === "" || !Number.isFinite(budget) || budget <= 0) {
    alert("Enter a budget greater than zero!");
    return;
  }

  budgets[monthSelect.value] = budget;
  saveBudgets();
  showExpenses();
};

monthSelect.onchange = showExpenses;

setupMonths();
showExpenses();
