import { useEffect, useState } from 'react'
import { getMonthlyReport, getDashboard, downloadExcel } from '../api.js'

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function MonthlyReport({ month }) {
  const [report, setReport] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { setSelectedMonth(month) }, [month])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getMonthlyReport(),
      getDashboard(selectedMonth),
    ])
      .then(([rep, dash]) => { setReport(rep); setDashboard(dash) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedMonth])

  if (loading) return <div className="loading">Loading report…</div>
  if (error)   return <div className="error-msg">{error}</div>

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Monthly Report</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <button className="btn btn-success" onClick={() => downloadExcel(selectedMonth)}>
            ⬇️ Export Excel
          </button>
        </div>
      </div>

      {/* Selected month summary */}
      {dashboard && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>{selectedMonth} — Summary</div>
          <div className="summary-grid">
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Daily</div>
              <div className="card-value" style={{ fontSize: 20 }}>{fmt(dashboard.total_daily)}</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Fixed</div>
              <div className="card-value" style={{ fontSize: 20 }}>{fmt(dashboard.total_fixed)}</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Shopping</div>
              <div className="card-value" style={{ fontSize: 20 }}>{fmt(dashboard.total_shopping)}</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Grand Total</div>
              <div className="card-value" style={{ fontSize: 20 }}>{fmt(dashboard.grand_total)}</div>
              <div className="card-sub">Per person: {fmt(dashboard.per_person_share)}</div>
            </div>
          </div>
        </div>
      )}

      {/* All-time monthly breakdown table */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 12 }}>All-Time Monthly Breakdown</div>
        {report.length === 0 ? (
          <div className="empty-state"><p>No data yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Daily (₹)</th>
                  <th>Fixed (₹)</th>
                  <th>Shopping (₹)</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.month} style={r.month === selectedMonth ? { background: '#eff6ff' } : {}}>
                    <td style={{ fontWeight: r.month === selectedMonth ? 700 : 400 }}>{r.month}</td>
                    <td>{fmt(r.daily)}</td>
                    <td>{fmt(r.fixed)}</td>
                    <td>{fmt(r.shopping)}</td>
                    <td className="amount-cell">{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
