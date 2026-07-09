import { useEffect, useState } from 'react'
import { getDashboard } from '../api.js'
import Settlement from './Settlement.jsx'
import Charts from './Charts.jsx'

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard({ month }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboard(month)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  if (loading) return <div className="loading">Loading dashboard…</div>
  if (error)   return <div className="error-msg">{error}</div>
  if (!data)   return null

  return (
    <div>
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="card">
          <div className="card-title">Daily Expenses</div>
          <div className="card-value">{fmt(data.total_daily)}</div>
          <div className="card-sub">Groceries, Milk, Gas…</div>
        </div>
        <div className="card">
          <div className="card-title">Fixed Expenses</div>
          <div className="card-value">{fmt(data.total_fixed)}</div>
          <div className="card-sub">Rent, Electricity, Water…</div>
        </div>
        <div className="card">
          <div className="card-title">Shopping Expenses</div>
          <div className="card-value">{fmt(data.total_shopping)}</div>
          <div className="card-sub">DMart, Other stores…</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="card-title">Grand Total</div>
          <div className="card-value">{fmt(data.grand_total)}</div>
          <div className="card-sub">Per person: {fmt(data.per_person_share)}</div>
        </div>
      </div>

      {/* Member Balances */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">Member Balances</span>
          <span className="card-sub">
            {month} · {data.member_balances.length} members · share {fmt(data.per_person_share)} each
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Total Paid</th>
                <th>Fair Share</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.member_balances.map((mb) => (
                <tr key={mb.name}>
                  <td><strong>{mb.name}</strong></td>
                  <td className="amount-cell">{fmt(mb.paid)}</td>
                  <td>{fmt(mb.share)}</td>
                  <td style={{ fontWeight: 600, color: mb.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {mb.balance >= 0 ? '+' : ''}{fmt(mb.balance)}
                  </td>
                  <td>
                    {Math.abs(mb.balance) < 0.01 ? (
                      <span className="badge badge-neutral">Settled</span>
                    ) : mb.balance > 0 ? (
                      <span className="badge badge-success">Receives {fmt(mb.balance)}</span>
                    ) : (
                      <span className="badge badge-danger">Owes {fmt(Math.abs(mb.balance))}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement */}
      <Settlement settlement={data.settlement} />

      {/* Charts */}
      <Charts month={month} />
    </div>
  )
}
