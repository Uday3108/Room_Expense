export default function Settlement({ settlement }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="section-title" style={{ marginBottom: 14 }}>Settlement Summary</div>
      {!settlement || settlement.length === 0 ? (
        <div className="settlement-empty">✅ All settled! No transactions needed.</div>
      ) : (
        <div className="settlement-list">
          {settlement.map((txn, i) => (
            <div className="settlement-item" key={i}>
              <span className="from">{txn.from_member}</span>
              <span className="arrow">→ pays →</span>
              <span className="to">{txn.to_member}</span>
              <span className="amt">₹{Number(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
