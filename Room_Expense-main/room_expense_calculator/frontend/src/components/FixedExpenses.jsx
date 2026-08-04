import { useEffect, useState } from 'react'
import {
  getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense,
  getMembers,
} from '../api.js'
import ExpenseForm from './ExpenseForm.jsx'

const EXPENSE_TYPES = ['Rent', 'Worker Salary', 'Electricity', 'Rice Bag', 'Internet', 'Water Bill', 'Other']

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function FixedExpenses({ month, room, rooms }) {
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterMonth, setFilterMonth] = useState(month)
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      getFixedExpenses({ month: filterMonth, room, expense_type: filterType }),
      getMembers(),
    ])
      .then(([exp, mem]) => { setExpenses(exp); setMembers(mem) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setFilterMonth(month) }, [month])
  useEffect(() => { load() }, [filterMonth, filterType, room])

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    await deleteFixedExpense(id)
    load()
  }

  const handleSubmit = async (data) => {
    if (editItem) {
      await updateFixedExpense(editItem.id, data)
    } else {
      await createFixedExpense(data)
    }
    setShowForm(false)
    setEditItem(null)
    load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const activeMembers = members.filter((m) => m.is_active)
  const memberShare = activeMembers.length ? total / activeMembers.length : 0

  const paidByOptions = [
    { value: 'All', label: 'Paid by all (to owner)' },
    ...members.filter(m => m.is_active).map(m => ({ value: m.name, label: m.name })),
  ]

  const fields = [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'amount', label: 'Amount (₹)', type: 'number', required: true, min: 0.01, step: 0.01 },
    { name: 'paid_by', label: 'Paid By', type: 'select', required: true,
      options: paidByOptions },
    { name: 'room', label: 'Room', type: 'select', required: true,
      options: rooms.filter((r) => r.is_active !== false).map((r) => ({ value: r.name, label: r.name })) },
    { name: 'expense_type', label: 'Expense Type', type: 'select', required: true,
      options: EXPENSE_TYPES.map(t => ({ value: t, label: t })) },
  ]

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Monthly / Fixed Expenses</span>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true) }}>
          + Add Expense
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
          Total: {fmt(total)}
        </span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--accent)' }}>
          Per person share: {fmt(memberShare)}
        </span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state"><p>No fixed expenses found. Add one!</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Paid By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td><span className="badge badge-neutral">{e.expense_type}</span></td>
                  <td className="amount-cell">{fmt(e.amount)}</td>
                  <td>{e.paid_by}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" title="Edit" onClick={() => { setEditItem(e); setShowForm(true) }}>✏️</button>
                      <button className="btn-icon" title="Delete" onClick={() => handleDelete(e.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          title={editItem ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
          fields={fields}
          initial={editItem ?? { room }}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
