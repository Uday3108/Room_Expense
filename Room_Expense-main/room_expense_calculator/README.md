# 🏠 Room Expense Calculator

A full-stack web application for tracking and settling shared expenses among 6 roommates.
Split bills fairly, visualise spending, and settle debts with the minimum number of transactions.

---

## Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 18 + Vite (plain CSS)   |
| Backend   | Python FastAPI                 |
| Database  | SQLite via SQLAlchemy          |
| Charts    | Chart.js + react-chartjs-2     |
| Export    | openpyxl (Excel .xlsx)         |

---

## Project Structure

```
room_expense_calculator/
├── backend/
│   ├── main.py           # FastAPI app + all routes
│   ├── models.py         # SQLAlchemy ORM models
│   ├── database.py       # SQLite engine + session
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── settlement.py     # Greedy settlement algorithm
│   ├── export.py         # Excel export with openpyxl
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js    # proxy /api → http://localhost:8000
    └── src/
        ├── main.jsx
        ├── App.jsx       # tabs + global month filter
        ├── api.js        # all fetch helpers
        ├── components/
        │   ├── Dashboard.jsx        # summary cards + balances
        │   ├── DailyExpenses.jsx    # CRUD table
        │   ├── FixedExpenses.jsx    # CRUD table
        │   ├── ShoppingExpenses.jsx # CRUD table
        │   ├── MonthlyReport.jsx    # monthly table + export
        │   ├── Settlement.jsx       # settlement list
        │   ├── ExpenseForm.jsx      # reusable modal form
        │   └── Charts.jsx           # bar + pie charts
        └── styles/
            └── app.css
```

---

## Setup — Backend

### Prerequisites
- Python 3.10+

### Steps

```bash
cd room_expense_calculator/backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**

Interactive API docs available at **http://localhost:8000/docs**

---

## Setup — Frontend

### Prerequisites
- Node.js 18+

### Steps

```bash
cd room_expense_calculator/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at **http://localhost:5173**

> Vite proxies all `/api` requests to `http://localhost:8000`, so no CORS issues.

---

## Default Members

The database is seeded automatically on first startup with 6 members:

| # | Name    |
|---|---------|
| 1 | Uday    |
| 2 | Naveen  |
| 3 | Praveen |
| 4 | Sandeep |
| 5 | Srihari |
| 6 | Arun    |

---

## Features

### 📊 Dashboard
- 4 summary cards: Daily / Fixed / Shopping / Grand Total
- Member balance table: Amount Paid · Fair Share · Balance · Status badge
- Settlement section: minimised list of "X → pays → Y ₹Z"
- Bar chart (last 6 months, stacked) + Pie chart (category breakdown)

### 🛒 Daily Expenses
- Categories: Groceries, Vegetables, Milk, Gas, Snacks, Other
- Full CRUD — Add / Edit (pencil) / Delete (trash) via modal form
- Filter by month and category

### 🏠 Fixed Expenses
- Types: Rent, Worker Salary, Electricity, Rice Bag, Internet, Water Bill, Other
- Full CRUD with month + type filters

### 🛍️ Shopping Expenses
- Stores: DMart, Other
- Full CRUD with month filter

### 📅 Monthly Report
- Month selector
- Summary cards for selected month
- Full all-time monthly breakdown table
- **Export to Excel** button (downloads `.xlsx` with 4 sheets)

---

## Example Calculation

```
Month: July 2025
Daily Expenses:   ₹12,000
Fixed Expenses:   ₹18,000
Shopping:         ₹ 5,000
──────────────────────────
Grand Total:      ₹35,000
Members:          6
Per Person Share: ₹ 7,000
```

If Alice paid ₹15,000 and everyone else paid ₹5,000:

| Member  | Paid     | Share   | Balance   |
|---------|----------|---------|-----------|
| Uday    | ₹15,000  | ₹7,000  | +₹8,000   |
| Naveen  | ₹5,000   | ₹7,000  | −₹2,000   |
| Praveen | ₹5,000   | ₹7,000  | −₹2,000   |
| Sandeep | ₹5,000   | ₹7,000  | −₹2,000   |
| Srihari | ₹5,000   | ₹7,000  | −₹2,000   |
| Arun    | ₹5,000   | ₹7,000  | −₹2,000   |

Settlement (4 transactions):
```
Naveen  → pays → Uday    ₹2,000
Praveen → pays → Uday    ₹2,000
Sandeep → pays → Uday    ₹2,000
Srihari → pays → Uday    ₹2,000
Arun    → pays → Uday    ₹2,000
```

---

## API Reference

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | /api/members              | List all members                     |
| POST   | /api/members              | Add member                           |
| DELETE | /api/members/{id}         | Deactivate member                    |
| GET    | /api/daily                | List daily expenses (filter: month, category) |
| POST   | /api/daily                | Create daily expense                 |
| PUT    | /api/daily/{id}           | Update daily expense                 |
| DELETE | /api/daily/{id}           | Delete daily expense                 |
| GET    | /api/fixed                | List fixed expenses (filter: month, expense_type) |
| POST   | /api/fixed                | Create fixed expense                 |
| PUT    | /api/fixed/{id}           | Update fixed expense                 |
| DELETE | /api/fixed/{id}           | Delete fixed expense                 |
| GET    | /api/shopping             | List shopping expenses (filter: month) |
| POST   | /api/shopping             | Create shopping expense              |
| PUT    | /api/shopping/{id}        | Update shopping expense              |
| DELETE | /api/shopping/{id}        | Delete shopping expense              |
| GET    | /api/dashboard            | Full dashboard data (filter: month)  |
| GET    | /api/report/monthly       | All-time monthly breakdown           |
| GET    | /api/export/excel         | Download Excel file (filter: month)  |

---

## Settlement Algorithm

The greedy algorithm minimises the number of transactions:

1. Calculate each member's net balance = (total paid) − (fair share)
2. Separate into **creditors** (balance > 0) and **debtors** (balance < 0)
3. Sort both lists by absolute value descending
4. Match the largest creditor with the largest debtor
5. Transfer `min(creditor_balance, |debtor_balance|)`
6. Repeat until all balances reach zero

This typically achieves the theoretical minimum of `n − 1` transactions for `n` members.
