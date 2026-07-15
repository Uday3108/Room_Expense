import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { getMonthlyReport, getDailyExpenses } from '../api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
)

const COLORS = {
  daily:    '#3b82f6',
  fixed:    '#10b981',
  shopping: '#f97316',
}

const GRADIENT_COLORS = {
  daily: ['rgba(59, 130, 246, 0.92)', 'rgba(59, 130, 246, 0.32)'],
  fixed: ['rgba(16, 185, 129, 0.92)', 'rgba(16, 185, 129, 0.32)'],
  shopping: ['rgba(249, 115, 22, 0.92)', 'rgba(249, 115, 22, 0.32)'],
}

const CAT_COLORS = [
  '#4f46e5', '#0ea5e9', '#ec4899', '#f97316', '#14b8a6',
  '#f59e0b', '#f43f5e', '#22c55e', '#7c3aed', '#38bdf8',
]

const LINE_COLOR_LIGHT = '#2563eb'
const LINE_COLOR_DARK = '#93c5fd'

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

  const isDarkMode = typeof window !== 'undefined' && document.body.classList.contains('dark')
  const chartColor = isDarkMode ? '#f8fafc' : '#111827'
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(31, 41, 55, 0.12)'
  const tooltipTitleColor = isDarkMode ? '#f8fafc' : '#111827'
  const tooltipBodyColor = isDarkMode ? '#e5e7eb' : '#374151'

  const createGradient = (context, colorStops) => {
    const { chart } = context
    const { ctx, chartArea } = chart
    if (!chartArea) return colorStops[0]
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, colorStops[0])
    gradient.addColorStop(1, colorStops[1])
    return gradient
  }

  const lineTotal = last6.map((r) => r.daily + r.fixed + r.shopping)
  const lineData = {
    labels: last6.map((r) => r.month),
    datasets: [
      {
        label: 'Total Expenses',
        data: lineTotal,
        borderColor: isDarkMode ? LINE_COLOR_DARK : LINE_COLOR_LIGHT,
        backgroundColor: (ctx) => createGradient(ctx, isDarkMode
          ? ['rgba(147, 197, 253, 0.35)', 'rgba(147, 197, 253, 0)']
          : ['rgba(37, 99, 235, 0.24)', 'rgba(37, 99, 235, 0)']),
        tension: 0.45,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: isDarkMode ? '#dbeafe' : '#bfdbfe',
        pointBorderColor: isDarkMode ? '#f8fafc' : '#111827',
        pointBorderWidth: 2,
        borderWidth: 3,
        cubicInterpolationMode: 'monotone',
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: chartColor,
    animation: { duration: 900, easing: 'easeOutQuart' },
    layout: { padding: { top: 12, right: 10, left: 10, bottom: 4 } },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColor,
          font: { size: 13, weight: '700' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(248, 250, 252, 0.96)',
        titleColor: tooltipTitleColor,
        bodyColor: tooltipBodyColor,
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15, 23, 42, 0.14)',
        borderWidth: 1,
        padding: 14,
        callbacks: {
          label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
      title: {
        display: false,
      },
    },
    elements: {
      line: {
        tension: 0.45,
        borderWidth: 3,
        borderCapStyle: 'round',
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        hoverBorderWidth: 2,
      },
    },
    scales: {
      x: {
        ticks: {
          color: chartColor,
          font: { size: 13, weight: '700' },
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        ticks: {
          callback: (v) => '₹' + v.toLocaleString('en-IN'),
          color: chartColor,
          font: { size: 13, weight: '700' },
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
    },
  }

  const barValuePlugin = {
    id: 'barValuePlugin',
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart
      if (!data.datasets.length) return
      const topMeta = chart.getDatasetMeta(data.datasets.length - 1)
      ctx.save()
      ctx.font = '600 12px Inter, sans-serif'
      ctx.fillStyle = chartColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      topMeta.data.forEach((bar, index) => {
        const value = data.datasets.reduce((total, dataset) => total + (dataset.data[index] || 0), 0)
        ctx.fillText(`₹${value.toLocaleString('en-IN')}`, bar.x, bar.y - 12)
      })
      ctx.restore()
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: chartColor,
    animation: { duration: 900, easing: 'easeOutQuart' },
    layout: { padding: { top: 12, right: 10, left: 10, bottom: 4 } },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColor,
          font: { size: 13, weight: '700' },
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 14,
          boxWidth: 18,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(248, 250, 252, 0.96)',
        titleColor: tooltipTitleColor,
        bodyColor: tooltipBodyColor,
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15, 23, 42, 0.14)',
        borderWidth: 1,
        padding: 14,
        callbacks: {
          label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
      title: {
        display: false,
      },
    },
    elements: {
      bar: {
        borderRadius: 14,
        borderSkipped: false,
        hoverBorderWidth: 2,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: chartColor,
          font: { size: 13, weight: '700' },
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        stacked: true,
        ticks: {
          callback: (v) => '₹' + v.toLocaleString('en-IN'),
          color: chartColor,
          font: { size: 13, weight: '700' },
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
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
        borderWidth: 2,
        borderColor: isDarkMode ? '#111827' : '#ffffff',
        hoverOffset: 12,
      },
    ],
  }

  const pieLabelPlugin = {
    id: 'pieLabelPlugin',
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart
      const meta = chart.getDatasetMeta(0)
      const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0)
      ctx.save()
      ctx.font = '600 12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = chartColor
      meta.data.forEach((arc, index) => {
        const value = data.datasets[0].data[index]
        if (!value) return
        const percentage = total ? Math.round((value / total) * 100) : 0
        if (percentage < 5) return
        const { x, y } = arc.getCenterPoint()
        ctx.fillText(`${percentage}%`, x, y)
      })
      ctx.restore()
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: chartColor,
    animation: { duration: 900, easing: 'easeOutQuad' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartColor,
          font: { size: 14, weight: '700' },
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 16,
          boxWidth: 18,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(248, 250, 252, 0.96)',
        titleColor: tooltipTitleColor,
        bodyColor: tooltipBodyColor,
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15, 23, 42, 0.14)',
        borderWidth: 1,
        padding: 14,
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
          <Bar data={barData} options={barOptions} plugins={[barValuePlugin]} />
        ) : (
          <div className="empty-state"><p>Not enough monthly data for bar chart.</p></div>
        )}
      </div>
      <div className="card chart-card">
        {last6.length > 0 ? (
          <Line data={lineData} options={lineOptions} />
        ) : (
          <div className="empty-state"><p>Not enough monthly data for line chart.</p></div>
        )}
      </div>
      <div className="card chart-card">
        {catLabels.length > 0 ? (
          <Pie data={pieData} options={pieOptions} plugins={[pieLabelPlugin]} />
        ) : (
          <div className="empty-state"><p>No daily expenses in {month} for pie chart.</p></div>
        )}
      </div>
    </div>
  )
}
