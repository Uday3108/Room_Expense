from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, inspect, text
from typing import Optional
from datetime import date, datetime
import calendar

from database import engine, get_db, Base
from models import Member, Room, DailyExpense, FixedExpense, ShoppingExpense
import schemas
from settlement import calculate_settlement
from export import generate_excel

# ── App setup ────────────────────────────────────────────────────────────────

Base.metadata.create_all(bind=engine)

def _ensure_room_columns():
    inspector = inspect(engine)
    for table_name in ("daily_expenses", "fixed_expenses", "shopping_expenses"):
        if table_name not in inspector.get_table_names():
            continue
        existing_columns = [col["name"] for col in inspector.get_columns(table_name)]
        if "room" not in existing_columns:
            with engine.connect() as conn:
                conn.execute(text(
                    f'ALTER TABLE {table_name} ADD COLUMN room TEXT NOT NULL DEFAULT "Room 1"'
                ))
                conn.commit()

_ensure_room_columns()
app = FastAPI(title="Room Expense Calculator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_MEMBERS = ["Uday", "Naveen", "Praveen", "Sandeep", "Srihari", "Arun"]
DEFAULT_ROOMS = ["Room 1", "Room 2", "Room 3", "Room 4"]


@app.on_event("startup")
def seed_data():
    db = next(get_db())
    try:
        if db.query(Member).count() == 0:
            for name in DEFAULT_MEMBERS:
                db.add(Member(name=name))
        if db.query(Room).count() == 0:
            for room in DEFAULT_ROOMS:
                db.add(Room(name=room))
        db.commit()
    finally:
        db.close()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_month(month: Optional[str]):
    """Return (year, month) ints or (None, None)."""
    if not month:
        return None, None
    try:
        dt = datetime.strptime(month, "%Y-%m")
        return dt.year, dt.month
    except ValueError:
        raise HTTPException(status_code=400, detail="month must be YYYY-MM")


def _filter_by_month(query, model, year, month):
    if year and month:
        query = query.filter(
            extract("year", model.date) == year,
            extract("month", model.date) == month,
        )
    return query


def _filter_by_room(query, model, room):
    if room:
        query = query.filter(model.room == room)
    return query


# ── Rooms ────────────────────────────────────────────────────────────────────

@app.get("/api/rooms", response_model=list[schemas.RoomOut])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(Room).order_by(Room.name).all()


@app.post("/api/rooms", response_model=schemas.RoomOut, status_code=201)
def create_room(payload: schemas.RoomCreate, db: Session = Depends(get_db)):
    existing = db.query(Room).filter(Room.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Room already exists")
    room = Room(name=payload.name)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.put("/api/rooms/{room_id}", response_model=schemas.RoomOut)
def update_room(room_id: int, payload: schemas.RoomUpdate, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    repeat = db.query(Room).filter(Room.name == payload.name, Room.id != room_id).first()
    if repeat:
        raise HTTPException(status_code=409, detail="Room name already exists")
    room.name = payload.name
    db.commit()
    db.refresh(room)
    return room


@app.delete("/api/rooms/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    exp_exists = any(
        db.query(model).filter(model.room == room.name).first()
        for model in (DailyExpense, FixedExpense, ShoppingExpense)
    )
    if exp_exists:
        raise HTTPException(status_code=409, detail="Room has expenses and cannot be deleted")
    room.is_active = False
    db.commit()


# ── Members ──────────────────────────────────────────────────────────────────

def _member_has_expenses(db: Session, member_name: str) -> bool:
    return any(
        db.query(model).filter(model.paid_by == member_name).first()
        for model in (DailyExpense, FixedExpense, ShoppingExpense)
    )


@app.get("/api/members", response_model=list[schemas.MemberOut])
def list_members(db: Session = Depends(get_db)):
    members = db.query(Member).all()
    result = []
    for member in members:
        result.append({
            'id': member.id,
            'name': member.name,
            'is_active': member.is_active,
            'can_delete': not _member_has_expenses(db, member.name),
        })
    return result


@app.post("/api/members", response_model=schemas.MemberOut, status_code=201)
def create_member(payload: schemas.MemberCreate, db: Session = Depends(get_db)):
    existing = db.query(Member).filter(Member.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Member already exists")
    member = Member(name=payload.name)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@app.delete("/api/members/{member_id}", status_code=204)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if _member_has_expenses(db, member.name):
        raise HTTPException(status_code=409, detail="Member has expenses and cannot be deleted")
    member.is_active = False
    db.commit()


# ── Daily Expenses ────────────────────────────────────────────────────────────

@app.get("/api/daily", response_model=list[schemas.DailyExpenseOut])
def list_daily(
    month: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    year, mon = _parse_month(month)
    q = db.query(DailyExpense)
    q = _filter_by_month(q, DailyExpense, year, mon)
    q = _filter_by_room(q, DailyExpense, room)
    if category:
        q = q.filter(DailyExpense.category == category)
    return q.order_by(DailyExpense.date.desc()).all()


@app.post("/api/daily", response_model=schemas.DailyExpenseOut, status_code=201)
def create_daily(payload: schemas.DailyExpenseCreate, db: Session = Depends(get_db)):
    exp = DailyExpense(**payload.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@app.put("/api/daily/{expense_id}", response_model=schemas.DailyExpenseOut)
def update_daily(
    expense_id: int,
    payload: schemas.DailyExpenseUpdate,
    db: Session = Depends(get_db),
):
    exp = db.query(DailyExpense).filter(DailyExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return exp


@app.delete("/api/daily/{expense_id}", status_code=204)
def delete_daily(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(DailyExpense).filter(DailyExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()


# ── Fixed Expenses ────────────────────────────────────────────────────────────

@app.get("/api/fixed", response_model=list[schemas.FixedExpenseOut])
def list_fixed(
    month: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    expense_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    year, mon = _parse_month(month)
    q = db.query(FixedExpense)
    q = _filter_by_month(q, FixedExpense, year, mon)
    q = _filter_by_room(q, FixedExpense, room)
    if expense_type:
        q = q.filter(FixedExpense.expense_type == expense_type)
    return q.order_by(FixedExpense.date.desc()).all()


@app.post("/api/fixed", response_model=schemas.FixedExpenseOut, status_code=201)
def create_fixed(payload: schemas.FixedExpenseCreate, db: Session = Depends(get_db)):
    exp = FixedExpense(**payload.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@app.put("/api/fixed/{expense_id}", response_model=schemas.FixedExpenseOut)
def update_fixed(
    expense_id: int,
    payload: schemas.FixedExpenseUpdate,
    db: Session = Depends(get_db),
):
    exp = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return exp


@app.delete("/api/fixed/{expense_id}", status_code=204)
def delete_fixed(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()


# ── Shopping Expenses ─────────────────────────────────────────────────────────

@app.get("/api/shopping", response_model=list[schemas.ShoppingExpenseOut])
def list_shopping(
    month: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    year, mon = _parse_month(month)
    q = db.query(ShoppingExpense)
    q = _filter_by_month(q, ShoppingExpense, year, mon)
    q = _filter_by_room(q, ShoppingExpense, room)
    return q.order_by(ShoppingExpense.date.desc()).all()


@app.post("/api/shopping", response_model=schemas.ShoppingExpenseOut, status_code=201)
def create_shopping(payload: schemas.ShoppingExpenseCreate, db: Session = Depends(get_db)):
    exp = ShoppingExpense(**payload.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@app.put("/api/shopping/{expense_id}", response_model=schemas.ShoppingExpenseOut)
def update_shopping(
    expense_id: int,
    payload: schemas.ShoppingExpenseUpdate,
    db: Session = Depends(get_db),
):
    exp = db.query(ShoppingExpense).filter(ShoppingExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return exp


@app.delete("/api/shopping/{expense_id}", status_code=204)
def delete_shopping(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(ShoppingExpense).filter(ShoppingExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard", response_model=schemas.DashboardOut)
def get_dashboard(
    month: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    year, mon = _parse_month(month)

    def total(model):
        q = db.query(func.coalesce(func.sum(model.amount), 0.0))
        if year and mon:
            q = q.filter(
                extract("year", model.date) == year,
                extract("month", model.date) == mon,
            )
        q = _filter_by_room(q, model, room)
        return float(q.scalar())

    def paid_by(model):
        q = (
            db.query(model.paid_by, func.sum(model.amount))
            .group_by(model.paid_by)
        )
        if year and mon:
            q = q.filter(
                extract("year", model.date) == year,
                extract("month", model.date) == mon,
            )
        q = _filter_by_room(q, model, room)
        return {row[0]: float(row[1]) for row in q.all()}

    total_daily = total(DailyExpense)
    total_fixed = total(FixedExpense)
    total_shopping = total(ShoppingExpense)
    grand_total = total_daily + total_fixed + total_shopping

    active_members = db.query(Member).filter(Member.is_active == True).all()
    num_members = len(active_members)
    per_person_share = grand_total / num_members if num_members else 0.0
    daily_share = total_daily / num_members if num_members else 0.0
    fixed_share = total_fixed / num_members if num_members else 0.0

    paid_totals: dict = {member.name: 0.0 for member in active_members}
    daily_totals: dict = {member.name: 0.0 for member in active_members}
    fixed_totals: dict = {member.name: 0.0 for member in active_members}
    shopping_totals: dict = {member.name: 0.0 for member in active_members}

    def add_payment(exp, totals):
        if exp.paid_by != 'All' and exp.paid_by in paid_totals:
            paid_totals[exp.paid_by] += exp.amount
            totals[exp.paid_by] += exp.amount

    for model, totals in ((DailyExpense, daily_totals), (FixedExpense, fixed_totals), (ShoppingExpense, shopping_totals)):
        q = db.query(model)
        if year and mon:
            q = q.filter(
                extract('year', model.date) == year,
                extract('month', model.date) == mon,
            )
        q = _filter_by_room(q, model, room)
        for exp in q.all():
            add_payment(exp, totals)

    balances = {name: paid - per_person_share for name, paid in paid_totals.items()}
    settlement_raw = calculate_settlement(balances)

    member_balances = [
        schemas.MemberBalance(
            name=name,
            paid=round(paid_totals[name], 2),
            share=round(per_person_share, 2),
            balance=round(balances[name], 2),
            status=(
                f"Receives ₹{abs(balances[name]):.2f}" if balances[name] > 0
                else f"Owes ₹{abs(balances[name]):.2f}"
                if balances[name] < 0
                else "Settled"
            ),
            daily_paid=round(daily_totals[name], 2),
            fixed_paid=round(fixed_totals[name], 2),
            shopping_paid=round(shopping_totals[name], 2),
        )
        for name in [m.name for m in active_members]
    ]

    settlement = [
        schemas.SettlementItem(
            from_member=t["from_member"],
            to_member=t["to_member"],
            amount=t["amount"],
        )
        for t in settlement_raw
    ]

    return schemas.DashboardOut(
        total_daily=round(total_daily, 2),
        total_fixed=round(total_fixed, 2),
        total_shopping=round(total_shopping, 2),
        grand_total=round(grand_total, 2),
        per_person_share=round(per_person_share, 2),
        daily_share=round(daily_share, 2),
        fixed_share=round(fixed_share, 2),
        member_balances=member_balances,
        settlement=settlement,
    )


# ── Monthly Report ────────────────────────────────────────────────────────────

@app.get("/api/report/monthly", response_model=list[schemas.MonthlyReportItem])
def monthly_report(
    room: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    def monthly_totals(model):
        q = db.query(
            extract("year", model.date).label("year"),
            extract("month", model.date).label("month"),
            func.sum(model.amount).label("total"),
        )
        if room:
            q = q.filter(model.room == room)
        rows = q.group_by("year", "month").all()
        return {(int(r.year), int(r.month)): float(r.total) for r in rows}

    daily_map = monthly_totals(DailyExpense)
    fixed_map = monthly_totals(FixedExpense)
    shopping_map = monthly_totals(ShoppingExpense)

    all_keys = set(daily_map) | set(fixed_map) | set(shopping_map)
    report = []
    for year, mon in sorted(all_keys):
        d = daily_map.get((year, mon), 0.0)
        f = fixed_map.get((year, mon), 0.0)
        s = shopping_map.get((year, mon), 0.0)
        report.append(
            schemas.MonthlyReportItem(
                month=f"{year}-{mon:02d}",
                daily=round(d, 2),
                fixed=round(f, 2),
                shopping=round(s, 2),
                total=round(d + f + s, 2),
            )
        )
    return report

# ── Expense Clearing ────────────────────────────────────────────────────────
@app.delete("/api/expenses", status_code=204)
def clear_expenses(
    month: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not month:
        raise HTTPException(status_code=400, detail="month query parameter is required")
    year, mon = _parse_month(month)

    for model in (DailyExpense, FixedExpense, ShoppingExpense):
        q = db.query(model)
        q = _filter_by_month(q, model, year, mon)
        q = _filter_by_room(q, model, room)
        q.delete(synchronize_session=False)
    db.commit()

# ── Excel Export ──────────────────────────────────────────────────────────────

@app.get("/api/export/excel")
def export_excel(
    month: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    year, mon = _parse_month(month)

    def fetch(model):
        q = db.query(model)
        if year and mon:
            q = q.filter(
                extract("year", model.date) == year,
                extract("month", model.date) == mon,
            )
        q = _filter_by_room(q, model, room)
        return q.order_by(model.date).all()

    daily = fetch(DailyExpense)
    fixed = fetch(FixedExpense)
    shopping = fetch(ShoppingExpense)

    # Build a minimal dashboard dict for the Summary sheet
    active_members = db.query(Member).filter(Member.is_active == True).all()
    num_members = len(active_members)
    total_daily = sum(e.amount for e in daily)
    total_fixed = sum(e.amount for e in fixed)
    total_shopping = sum(e.amount for e in shopping)
    grand_total = total_daily + total_fixed + total_shopping
    per_person_share = grand_total / num_members if num_members else 0.0

    paid_totals = {m.name: 0.0 for m in active_members}
    for exp in [*daily, *fixed, *shopping]:
        if exp.paid_by != 'All' and exp.paid_by in paid_totals:
            paid_totals[exp.paid_by] += exp.amount

    balances = {name: paid - per_person_share for name, paid in paid_totals.items()}
    settlement_raw = calculate_settlement(balances)

    dashboard = {
        "total_daily": round(total_daily, 2),
        "total_fixed": round(total_fixed, 2),
        "total_shopping": round(total_shopping, 2),
        "grand_total": round(grand_total, 2),
        "per_person_share": round(per_person_share, 2),
        "member_balances": [
            {
                "name": name,
                "paid": round(paid_totals[name], 2),
                "share": round(per_person_share, 2),
                "balance": round(balances[name], 2),
            }
            for name in paid_totals
        ],
        "settlement": settlement_raw,
    }

    filename = f"expenses_{month or 'all'}.xlsx"
    xlsx_bytes = generate_excel(daily, fixed, shopping, dashboard)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
