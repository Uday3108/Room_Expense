import { useState } from 'react'

/**
 * Reusable modal form.
 *
 * Props:
 *   title    - modal title string
 *   fields   - array of field descriptors (see below)
 *   initial  - existing record for edit mode (or null for create)
 *   onSubmit - async function(data) called with form values
 *   onClose  - called when modal is dismissed
 *
 * Field descriptor shape:
 *   { name, label, type ('text'|'number'|'date'|'select'|'textarea'),
 *     required?, options? [{value, label}], min?, step?, placeholder? }
 */
export default function ExpenseForm({ title, fields, initial, onSubmit, onClose }) {
  const [values, setValues] = useState(() => {
    const init = {}
    fields.forEach((f) => {
      init[f.name] = initial ? (initial[f.name] ?? '') : ''
    })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const data = { ...values }
    // Coerce number fields
    fields.forEach((f) => {
      if (f.type === 'number' && data[f.name] !== '') {
        data[f.name] = parseFloat(data[f.name])
      }
      // Remove empty optional strings so backend ignores them
      if (!f.required && data[f.name] === '') {
        data[f.name] = null
      }
    })
    try {
      await onSubmit(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            {fields.map((f) => (
              <div className="form-group" key={f.name}>
                <label>{f.label}{f.required && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
                {f.type === 'select' ? (
                  <select
                    value={values[f.name]}
                    required={f.required}
                    onChange={(e) => set(f.name, e.target.value)}
                  >
                    <option value="">— select —</option>
                    {(f.options || []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={values[f.name]}
                    placeholder={f.placeholder || ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={values[f.name]}
                    required={f.required}
                    min={f.min}
                    step={f.step}
                    placeholder={f.placeholder || ''}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
