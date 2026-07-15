import { useEffect, useState } from 'react'
import { getDashboard, getMembers, createMember, deleteMember } from '../api.js'
import Settlement from './Settlement.jsx'
import Charts from './Charts.jsx'

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard({ month, room }) {
  const [data, setData] = useState(null)
  const [members, setMembers] = useState([])
  const [memberName, setMemberName] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberError, setMemberError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [memberLoading, setMemberLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadDashboard = () => {
    setLoading(true)
    setError(null)
    getDashboard(month, room)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const loadMembers = () => {
    setMemberLoading(true)
    setMemberError(null)
    getMembers()
      .then(setMembers)
      .catch((e) => setMemberError(e.message))
      .finally(() => setMemberLoading(false))
  }

  useEffect(() => {
    loadDashboard()
    loadMembers()
  }, [month, room])

  if (loading) return <div className="loading">Loading dashboard…</div>
  if (error)   return <div className="error-msg">{error}</div>
  if (!data)   return null

  const activeMembers = members.filter((m) => m.is_active)
  const filteredMembers = activeMembers.filter((m) => m.name.toLowerCase().includes(memberSearch.trim().toLowerCase()))

  const handleAddMember = async () => {
    if (!memberName.trim()) return
    setMemberError(null)
    try {
      await createMember(memberName.trim())
      setMemberName('')
      loadMembers()
      loadDashboard()
    } catch (e) {
      setMemberError(e.message)
    }
  }

  const handleDeleteMember = async (member) => {
    if (!confirm(`Delete member ${member.name}?`)) return
    setMemberError(null)
    try {
      await deleteMember(member.id)
      loadMembers()
      loadDashboard()
    } catch (e) {
      setMemberError(e.message)
    }
  }

  const unsettledTotal = data.member_balances.reduce((sum, mb) => sum + Math.max(-mb.balance, 0), 0)

  return (
    <div className="dashboard-shell">
      <section className="card overview-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Dashboard overview</p>
            <h2>Expense performance at a glance</h2>
            <p className="card-sub">Settlement applies to {month || 'the selected period'}.</p>
          </div>
        </div>

        <div className="summary-grid">
          <div className="stat-card stat-primary">
            <div className="stat-card-icon">📅</div>
            <div>
              <div className="stat-card-title">Selected Month</div>
              <div className="stat-card-value">{month || 'All'}</div>
            </div>
          </div>

          <div className="stat-card stat-secondary">
            <div className="stat-card-icon">👥</div>
            <div>
              <div className="stat-card-title">Active Members</div>
              <div className="stat-card-value">{activeMembers.length}</div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-card-icon">�</div>
            <div>
              <div className="stat-card-title">Selected Room</div>
              <div className="stat-card-value">{room}</div>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-card-icon">📊</div>
            <div>
              <div className="stat-card-title">Per Person Share</div>
              <div className="stat-card-value">{fmt(data.per_person_share)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Members</p>
            <h3>Room members</h3>
          </div>
          <div className="section-actions">
            <div className="filter-bar member-search-bar">
              <input
                type="text"
                placeholder="Search members"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="member-add-row">
              <input
                type="text"
                placeholder="New member name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
              <button className="btn btn-primary" type="button" onClick={handleAddMember} disabled={!memberName.trim() || memberLoading}>
                + Add member
              </button>
            </div>
          </div>
        </div>

        {memberError && <div className="error-msg">{memberError}</div>}

        <div className="members-grid">
          {filteredMembers.length > 0 ? filteredMembers.map((m) => (
            <article className="member-card" key={m.id}>
              <div className="member-avatar">{m.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div className="member-details">
                <strong>{m.name}</strong>
                <span className={`badge ${m.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {m.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="member-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  title={m.can_delete ? 'Delete member' : 'Cannot delete member with existing expenses'}
                  onClick={() => handleDeleteMember(m)}
                  disabled={!m.can_delete}
                >
                  🗑️
                </button>
                {!m.can_delete && <span className="badge badge-neutral">Has expenses</span>}
              </div>
            </article>
          )) : (
            <div className="empty-state"><p>No active room members found.</p></div>
          )}
        </div>
      </section>

      <section className="card section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Balances</p>
            <h3>Member balances</h3>
          </div>
          <span className="card-sub">Shows whether each member receives or owes.</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Paid</th>
                <th>Share</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.member_balances.map((mb) => (
                <tr key={mb.name}>
                  <td><strong>{mb.name}</strong></td>
                  <td>{fmt(mb.paid)}</td>
                  <td>{fmt(mb.share)}</td>
                  <td>{fmt(mb.balance)}</td>
                  <td>
                    <span className={`status-label ${mb.balance >= 0 ? 'status-positive' : 'status-negative'}`}>
                      {mb.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Settlement settlement={data.settlement} />

      <section className="card result-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Settlement summary</p>
            <h3>Final result</h3>
          </div>
          <span className="card-sub">Summary of settled amounts before charts.</span>
        </div>

        <div className="summary-grid">
          <div className="stat-card stat-secondary">
            <div className="stat-card-icon">⬆️</div>
            <div>
              <div className="stat-card-title">Total Receive</div>
              <div className="stat-card-value">{fmt(data.member_balances.reduce((sum, mb) => sum + Math.max(mb.balance, 0), 0))}</div>
            </div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-card-icon">⬇️</div>
            <div>
              <div className="stat-card-title">Total Owe</div>
              <div className="stat-card-value">{fmt(data.member_balances.reduce((sum, mb) => sum + Math.max(-mb.balance, 0), 0))}</div>
            </div>
          </div>
          <div className="stat-card stat-primary">
            <div className="stat-card-icon">🏆</div>
            <div>
              <div className="stat-card-title">Primary Receiver</div>
              <div className="stat-card-value">{data.member_balances.filter((mb) => mb.balance > 0).sort((a, b) => b.balance - a.balance)[0]?.name || 'None'}</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-card-icon">🔁</div>
            <div>
              <div className="stat-card-title">Settlement Count</div>
              <div className="stat-card-value">{data.settlement.length}</div>
            </div>
          </div>
        </div>
      </section>

      <Charts month={month} room={room} />
    </div>
  )
}
