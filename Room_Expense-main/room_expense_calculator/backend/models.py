from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from database import Base


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)


class DailyExpense(Base):
    __tablename__ = "daily_expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(String, nullable=False)
    room = Column(String, nullable=False, default="Room 1", server_default="Room 1")
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)


class FixedExpense(Base):
    __tablename__ = "fixed_expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(String, nullable=False)
    room = Column(String, nullable=False, default="Room 1", server_default="Room 1")
    expense_type = Column(String, nullable=False)


class ShoppingExpense(Base):
    __tablename__ = "shopping_expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(String, nullable=False)
    room = Column(String, nullable=False, default="Room 1", server_default="Room 1")
    store_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
