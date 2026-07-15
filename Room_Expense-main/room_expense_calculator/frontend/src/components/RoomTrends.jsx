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

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMonthlyReport(room)
      .then((data) => setReport(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [room])

  if (loading) return <div className="loading">Loading room trends…</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!report.length) return <div className="empty-state"><p>No room data available yet.</p></div>

  const labels = report.map((row) => row.month)
  const dailyData = report.map((row) => row.daily)
  const fixedData = report.map((row) => row.fixed)
  const shoppingData = report.map((row) => row.shopping)
  const totalData = report.map((row) => row.total)

  const barData = {
    labels,
    datasets: [
      { label: 'Daily', data: dailyData, backgroundColor: '#3b82f6' },
      { label: 'Fixed', data: fixedData, backgroundColor: '#10b981' },
      { label: 'Shopping', data: shoppingData, backgroundColor: '#f97316' },
    ],
  }

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Total Expenses',
        data: totalData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'var(--text)' },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: 'var(--text)' }, grid: { display: false } },
      y: {
        ticks: {
          callback: (value) => `₹${value}`,
          color: 'var(--text)',
        },
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
      },
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
          <h3 className="chart-card-title">Monthly Category Stack</h3>
          <div style={{ height: 340 }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="card chart-card">
          <h3 className="chart-card-title">Total Expense Trend</h3>
          <div style={{ height: 340 }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
