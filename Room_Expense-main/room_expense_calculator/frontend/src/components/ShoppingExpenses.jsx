import { useEffect, useState } from 'react'
import {
  getShoppingExpenses, createShoppingExpense, updateShoppingExpense, deleteShoppingExpense,
  getMembers,
} from '../api.js'
import ExpenseForm from './ExpenseForm.jsx'

const STORES = ['DMart', 'Other']

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ShoppingExpenses({ month, room, rooms }) {
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterMonth, setFilterMonth] = useState(month)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      getShoppingExpenses({ month: filterMonth, room }),
      getMembers(),
    ])
      .then(([exp, mem]) => { setExpenses(exp); setMembers(mem) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setFilterMonth(month) }, [month])
  useEffect(() => { load() }, [filterMonth, room])

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    await deleteShoppingExpense(id)
    load()
  }

  const handleSubmit = async (data) => {
    if (editItem) {
      await updateShoppingExpense(editItem.id, data)
    } else {
      await createShoppingExpense(data)
    }
    setShowForm(false)
    setEditItem(null)
    load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const fields = [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'amount', label: 'Amount (₹)', type: 'number', required: true, min: 0.01, step: 0.01 },
    { name: 'paid_by', label: 'Paid By', type: 'select', required: true,
      options: members.filter(m => m.is_active).map(m => ({ value: m.name, label: m.name })) },
    { name: 'room', label: 'Room', type: 'select', required: true,
      options: rooms.filter((r) => r.is_active !== false).map((r) => ({ value: r.name, label: r.name })) },
    { name: 'store_name', label: 'Store', type: 'select', required: true,
      options: STORES.map(s => ({ value: s, label: s })) },
    { name: 'description', label: 'Description (optional)', type: 'text' },
  ]

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Shopping Expenses</span>
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
        <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--primary)' }}>
          Total: {fmt(total)}
        </span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state"><p>No shopping expenses found. Add one!</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Store</th>
                <th>Amount</th>
                <th>Paid By</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td><span className="badge badge-neutral">{e.store_name}</span></td>
                  <td className="amount-cell">{fmt(e.amount)}</td>
                  <td>{e.paid_by}</td>
                  <td style={{ color: 'var(--muted)' }}>{e.description || '—'}</td>
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
          title={editItem ? 'Edit Shopping Expense' : 'Add Shopping Expense'}
          fields={fields}
          initial={editItem ?? { room }}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
