from pydantic import BaseModel
from datetime import date
from typing import Optional, List


# ── Member ──────────────────────────────────────────────────────────────────

class MemberCreate(BaseModel):
    name: str


class MemberOut(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}


# ── Daily Expense ────────────────────────────────────────────────────────────

class DailyExpenseCreate(BaseModel):
    date: date
    amount: float
    paid_by: str
    category: str
    description: Optional[str] = None


class DailyExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    paid_by: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class DailyExpenseOut(BaseModel):
    id: int
    date: date
    amount: float
    paid_by: str
    category: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Fixed Expense ────────────────────────────────────────────────────────────

class FixedExpenseCreate(BaseModel):
    date: date
    amount: float
    paid_by: str
    expense_type: str


class FixedExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    paid_by: Optional[str] = None
    expense_type: Optional[str] = None


class FixedExpenseOut(BaseModel):
    id: int
    date: date
    amount: float
    paid_by: str
    expense_type: str

    model_config = {"from_attributes": True}


# ── Shopping Expense ─────────────────────────────────────────────────────────

class ShoppingExpenseCreate(BaseModel):
    date: date
    amount: float
    paid_by: str
    store_name: str
    description: Optional[str] = None


class ShoppingExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    paid_by: Optional[str] = None
    store_name: Optional[str] = None
    description: Optional[str] = None


class ShoppingExpenseOut(BaseModel):
    id: int
    date: date
    amount: float
    paid_by: str
    store_name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Settlement ───────────────────────────────────────────────────────────────

class SettlementItem(BaseModel):
    from_member: str
    to_member: str
    amount: float


# ── Dashboard ────────────────────────────────────────────────────────────────

class MemberBalance(BaseModel):
    name: str
    paid: float
    share: float
    balance: float


class DashboardOut(BaseModel):
    total_daily: float
    total_fixed: float
    total_shopping: float
    grand_total: float
    per_person_share: float
    member_balances: List[MemberBalance]
    settlement: List[SettlementItem]


# ── Monthly Report ───────────────────────────────────────────────────────────

class MonthlyReportItem(BaseModel):
    month: str
    daily: float
    fixed: float
    shopping: float
    total: float
