import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import DailyExpenses from './components/DailyExpenses.jsx'
import FixedExpenses from './components/FixedExpenses.jsx'
import ShoppingExpenses from './components/ShoppingExpenses.jsx'
import MonthlyReport from './components/MonthlyReport.jsx'

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'daily',      label: 'Daily',      icon: '🛒' },
  { id: 'fixed',      label: 'Fixed',      icon: '🏠' },
  { id: 'shopping',   label: 'Shopping',   icon: '🛍️' },
  { id: 'report',     label: 'Report',     icon: '📅' },
]

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [month, setMonth] = useState(currentMonth())
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(theme)
  }, [theme])

  return (
    <div className={`app-wrapper ${theme}`}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Room Expense</p>
          <h1>Expense Dashboard</h1>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="btn btn-ghost theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
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
            type="button"
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
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
