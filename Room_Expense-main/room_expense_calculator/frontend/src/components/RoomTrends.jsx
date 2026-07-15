import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { getMonthlyReport } from '../api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function RoomTrends({ month, room }) {
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof document === 'undefined') return 'light'
    return document.body.classList.contains('dark') ? 'dark' : 'light'
  })

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMonthlyReport(room)
      .then((data) => setReport(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [room])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const syncTheme = () => {
      setThemeMode(document.body.classList.contains('dark') ? 'dark' : 'light')
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (loading) return <div className="loading">Loading room trends…</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!report.length) return <div className="empty-state"><p>No room data available yet.</p></div>

  const labels = report.map((row) => row.month)
  const dailyData = report.map((row) => row.daily)
  const fixedData = report.map((row) => row.fixed)
  const shoppingData = report.map((row) => row.shopping)
  const totalData = report.map((row) => row.total)
  const isDarkMode = themeMode === 'dark'
  const chartColor = isDarkMode ? '#f8fafc' : '#111827'
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.12)'
  const tooltipBg = isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(248, 250, 252, 0.96)'
  const tooltipText = isDarkMode ? '#f8fafc' : '#111827'
  const tooltipMuted = isDarkMode ? '#cbd5e1' : '#475569'

  const createGradient = (context, colorStops) => {
    const { chart } = context
    const { ctx, chartArea } = chart
    if (!chartArea) return colorStops[0]
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, colorStops[0])
    gradient.addColorStop(1, colorStops[1])
    return gradient
  }

  const barData = {
    labels,
    datasets: [
      { label: 'Daily', data: dailyData, backgroundColor: (ctx) => createGradient(ctx, ['rgba(59, 130, 246, 0.94)', 'rgba(59, 130, 246, 0.28)']), borderColor: 'rgba(59, 130, 246, 0.9)', borderWidth: 1 },
      { label: 'Fixed', data: fixedData, backgroundColor: (ctx) => createGradient(ctx, ['rgba(16, 185, 129, 0.94)', 'rgba(16, 185, 129, 0.28)']), borderColor: 'rgba(16, 185, 129, 0.9)', borderWidth: 1 },
      { label: 'Shopping', data: shoppingData, backgroundColor: (ctx) => createGradient(ctx, ['rgba(249, 115, 22, 0.94)', 'rgba(249, 115, 22, 0.28)']), borderColor: 'rgba(249, 115, 22, 0.9)', borderWidth: 1 },
    ],
  }

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Total Expenses',
        data: totalData,
        borderColor: isDarkMode ? '#93c5fd' : '#2563eb',
        backgroundColor: (ctx) => createGradient(ctx, isDarkMode
          ? ['rgba(147, 197, 253, 0.36)', 'rgba(147, 197, 253, 0)']
          : ['rgba(37, 99, 235, 0.24)', 'rgba(37, 99, 235, 0)']),
        fill: true,
        tension: 0.45,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: isDarkMode ? '#dbeafe' : '#bfdbfe',
        pointBorderColor: isDarkMode ? '#f8fafc' : '#111827',
        pointBorderWidth: 2,
        borderWidth: 3,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: chartColor, font: { size: 13, weight: '700' }, usePointStyle: true, padding: 14 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipMuted,
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15, 23, 42, 0.14)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: chartColor, font: { size: 12, weight: '600' }, maxRotation: 0 },
        grid: { color: gridColor, drawBorder: false },
        border: { color: gridColor },
      },
      y: {
        ticks: {
          callback: (value) => `₹${value}`,
          color: chartColor,
          font: { size: 12, weight: '600' },
        },
        grid: { color: gridColor, drawBorder: false },
        border: { color: gridColor },
      },
    },
    elements: {
      bar: { borderRadius: 14, borderSkipped: false },
      line: { tension: 0.45, borderCapStyle: 'round' },
    },
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="section-title">Room Trends</span>
          <p className="card-sub">Visualize expense performance for {room} over time.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-primary">
          <div className="stat-card-title">Latest Month</div>
          <div className="stat-card-value">{report[report.length - 1].month}</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-card-title">Latest Total</div>
          <div className="stat-card-value">{fmt(report[report.length - 1].total)}</div>
        </div>
        <div className="stat-card stat-secondary">
          <div className="stat-card-title">12-Month Average</div>
          <div className="stat-card-value">{fmt(report.reduce((sum, row) => sum + row.total, 0) / report.length)}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Monthly Category Stack</h3>
              <p className="chart-card-subtitle">Modern rounded bars with subtle depth</p>
            </div>
            <span className="chart-card-badge">Bar</span>
          </div>
          <div className="chart-shell">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="card chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Total Expense Trend</h3>
              <p className="chart-card-subtitle">Smooth line curves and clearer tooltip styling</p>
            </div>
            <span className="chart-card-badge">Line</span>
          </div>
          <div className="chart-shell">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
