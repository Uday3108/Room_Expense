import { useEffect, useMemo, useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import DailyExpenses from './components/DailyExpenses.jsx'
import FixedExpenses from './components/FixedExpenses.jsx'
import ShoppingExpenses from './components/ShoppingExpenses.jsx'
import MonthlyReport from './components/MonthlyReport.jsx'
import RoomTrends from './components/RoomTrends.jsx'
import { getRooms } from './api.js'

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'daily',      label: 'Daily',      icon: '🛒' },
  { id: 'fixed',      label: 'Fixed',      icon: '🏠' },
  { id: 'shopping',   label: 'Shopping',   icon: '🛍️' },
  { id: 'report',     label: 'Report',     icon: '📅' },
  { id: 'room-trends',label: 'Room Trends', icon: '📈' },
]

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function buildMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 24; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return options
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [month, setMonth] = useState(currentMonth())
  const [theme, setTheme] = useState('light')
  const [room, setRoom] = useState('Room 1')
  const [rooms, setRooms] = useState([{ name: 'Room 1', is_active: true }])
  const monthOptions = useMemo(() => buildMonthOptions(), [])

  useEffect(() => {
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(theme)
  }, [theme])

  useEffect(() => {
    getRooms().then((data) => {
      if (data && data.length) {
        setRooms(data)
        const names = data.map((item) => item.name)
        if (!names.includes(room)) {
          setRoom(names[0])
        }
      }
    }).catch(() => {
      setRooms([{ name: 'Room 1', is_active: true }])
    })
  }, [])

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
          <select
            className="month-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            title="Filter by month"
          >
            {monthOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
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
        {tab === 'dashboard' && <Dashboard month={month} room={room} rooms={rooms} />}
        {tab === 'daily'     && <DailyExpenses month={month} room={room} rooms={rooms} />}
        {tab === 'fixed'     && <FixedExpenses month={month} room={room} rooms={rooms} />}
        {tab === 'shopping'  && <ShoppingExpenses month={month} room={room} rooms={rooms} />}
        {tab === 'report'    && <MonthlyReport month={month} room={room} />}
        {tab === 'room-trends' && <RoomTrends month={month} room={room} />}
      </main>
    </div>
  )
}
