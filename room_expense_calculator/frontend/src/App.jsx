import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import DailyExpenses from './components/DailyExpenses.jsx'
import FixedExpenses from './components/FixedExpenses.jsx'
import ShoppingExpenses from './components/ShoppingExpenses.jsx'
import MonthlyReport from './components/MonthlyReport.jsx'

const TABS = [
  { id: 'dashboard',  label: '📊 Dashboard' },
  { id: 'daily',      label: '🛒 Daily' },
  { id: 'fixed',      label: '🏠 Fixed' },
  { id: 'shopping',   label: '🛍️ Shopping' },
  { id: 'report',     label: '📅 Monthly Report' },
]

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [month, setMonth] = useState(currentMonth())

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>🏠 Room Expense Calculator</h1>
        <div className="header-right">
          <input
            type="month"
            className="month-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            title="Filter by month"
          />
        </div>
      </header>

      <nav className="app-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'dashboard' && <Dashboard month={month} />}
        {tab === 'daily'     && <DailyExpenses month={month} />}
        {tab === 'fixed'     && <FixedExpenses month={month} />}
        {tab === 'shopping'  && <ShoppingExpenses month={month} />}
        {tab === 'report'    && <MonthlyReport month={month} />}
      </main>
    </div>
  )
}
