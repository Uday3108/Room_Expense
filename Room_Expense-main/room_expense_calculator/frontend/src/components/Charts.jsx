import { useEffect, useState, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import { getMonthlyReport, getDailyExpenses } from '../api.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const COLORS = {
  daily:    '#3b82d4',
  fixed:    '#7c5cd8',
  shopping: '#16a34a',
}

const CAT_COLORS = [
  '#3b82d4', '#7c5cd8', '#16a34a', '#d97706', '#ef4444',
  '#0891b2', '#db2777', '#65a30d', '#9333ea', '#f59e0b',
]

export default function Charts({ month }) {
  const [report, setReport] = useState([])
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMonthlyReport(),
      getDailyExpenses({ month }),
    ])
      .then(([rep, daily]) => { setReport(rep); setDailyExpenses(daily) })
      .finally(() => setLoading(false))
  }, [month])

  if (loading) return <div className="loading">Loading charts…</div>

  // ── Bar chart: last 6 months ──────────────────────────────────────────────
  const last6 = report.slice(-6)
  const barData = {
    labels: last6.map((r) => r.month),
    datasets: [
      {
        label: 'Daily',
        data: last6.map((r) => r.daily),
        backgroundColor: COLORS.daily,
      },
      {
        label: 'Fixed',
        data: last6.map((r) => r.fixed),
        backgroundColor: COLORS.fixed,
      },
      {
        label: 'Shopping',
        data: last6.map((r) => r.shopping),
        backgroundColor: COLORS.shopping,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Expense Breakdown (Last 6 Months)' },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { callback: (v) => '₹' + v.toLocaleString('en-IN') } },
    },
  }

  // ── Pie chart: category breakdown for selected month ──────────────────────
  const catTotals = {}
  dailyExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount
  })
  const catLabels = Object.keys(catTotals)
  const catValues = Object.values(catTotals)

  const pieData = {
    labels: catLabels,
    datasets: [
      {
        data: catValues,
        backgroundColor: CAT_COLORS.slice(0, catLabels.length),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: `Daily Expenses by Category — ${month}` },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString('en-IN')}`,
        },
      },
    },
  }

  return (
    <div className="charts-grid">
      <div className="card chart-card">
        {last6.length > 0 ? (
          <Bar data={barData} options={barOptions} />
        ) : (
          <div className="empty-state"><p>Not enough monthly data for bar chart.</p></div>
        )}
      </div>
      <div className="card chart-card">
        {catLabels.length > 0 ? (
          <Pie data={pieData} options={pieOptions} />
        ) : (
          <div className="empty-state"><p>No daily expenses in {month} for pie chart.</p></div>
        )}
      </div>
    </div>
  )
}
