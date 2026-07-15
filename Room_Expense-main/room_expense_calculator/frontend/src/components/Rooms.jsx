import { useEffect, useState } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api.js'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadRooms = () => {
    setLoading(true)
    setError(null)
    getRooms()
      .then(setRooms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRooms() }, [])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      if (editing) {
        await updateRoom(editing.id, { name: name.trim() })
      } else {
        await createRoom({ name: name.trim() })
      }
      setName('')
      setEditing(null)
      loadRooms()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleEdit = (room) => {
    setEditing(room)
    setName(room.name)
  }

  const handleDelete = async (room) => {
    if (!confirm(`Remove room ${room.name}? This cannot be undone.`)) return
    setLoading(true)
    try {
      await deleteRoom(room.id)
      loadRooms()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <span className="section-title">Room Management</span>
          <p className="card-sub">Create, rename, and remove room groups for tracking expenses separately.</p>
        </div>
      </div>

      <div className="form-row">
        <input
          type="text"
          placeholder="Enter room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={loading}>
          {editing ? 'Update Room' : 'Add Room'}
        </button>
        {editing && (
          <button className="btn btn-ghost" type="button" onClick={() => { setEditing(null); setName('') }}>
            Cancel
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading rooms…</div>
      ) : rooms.length === 0 ? (
        <div className="empty-state"><p>No rooms configured yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>{room.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" title="Rename room" onClick={() => handleEdit(room)}>✏️</button>
                      <button className="btn-icon" title="Delete room" onClick={() => handleDelete(room)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
