import { useEffect, useState } from 'react'
import { getMonthlyReport, getDashboard, downloadExcel, clearExpensesByMonth } from '../api.js'

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function MonthlyReport({ month, room }) {
  const [report, setReport] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { setSelectedMonth(month) }, [month])

  const loadReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rep, dash] = await Promise.all([
        getMonthlyReport(room),
        getDashboard(selectedMonth, room),
      ])
      setReport(rep)
      setDashboard(dash)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [selectedMonth, room])

  const handleClearMonth = async () => {
    if (!selectedMonth) return
    if (!confirm(`Erase all expenses for ${selectedMonth} ${room}? This cannot be undone.`)) return
    try {
      setLoading(true)
      await clearExpensesByMonth(selectedMonth, room)
      await loadReport()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading report…</div>
  if (error)   return <div className="error-msg">{error}</div>

  const last12 = report.slice(-12)

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
          <button className="btn btn-danger" onClick={handleClearMonth}>
            🧹 Clear Month
          </button>
          <button className="btn btn-success" onClick={() => downloadExcel(selectedMonth, room)}>
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

      {last12.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Last 12 Months History</div>
          <div className="summary-grid">
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">12-Month Total</div>
              <div className="card-value" style={{ fontSize: 20 }}>{fmt(last12.reduce((sum, row) => sum + row.total, 0))}</div>
              <div className="card-sub">Based on the last year of reported expenses.</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Average per Month</div>
              <div className="card-value" style={{ fontSize: 20 }}>{fmt(last12.reduce((sum, row) => sum + row.total, 0) / last12.length)}</div>
              <div className="card-sub">Average of the last {last12.length} months.</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Best Month</div>
              <div className="card-value" style={{ fontSize: 20 }}>{last12.reduce((best, row) => row.total > best.total ? row : best, last12[0]).month}</div>
              <div className="card-sub">Highest spending month in the last year.</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div className="card-title">Trend</div>
              <div className="card-value" style={{ fontSize: 20, color: last12.length > 1 && last12[last12.length - 1].total >= last12[last12.length - 2].total ? '#16a34a' : '#dc2626' }}>
                {last12.length > 1 ? `${last12[last12.length - 1].total >= last12[last12.length - 2].total ? '▲' : '▼'} ${fmt(Math.abs(last12[last12.length - 1].total - last12[last12.length - 2].total))}` : '—'}
              </div>
              <div className="card-sub">Compared to the previous month.</div>
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
