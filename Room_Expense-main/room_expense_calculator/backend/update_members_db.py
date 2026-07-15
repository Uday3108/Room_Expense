#!/usr/bin/env python3
import sqlite3
import os
from shutil import copy2


ROOT = os.path.dirname(__file__)
DB_PATH = os.path.join(ROOT, 'room_expenses.db')
BACKUP_PATH = os.path.join(ROOT, f'room_expenses.db.bak')


def backup_db():
    if os.path.exists(DB_PATH):
        copy2(DB_PATH, BACKUP_PATH)
        print('Backup created at', BACKUP_PATH)
    else:
        print('DB file not found at', DB_PATH)


def migrate():
    mapping = {
        'Alice': 'Uday',
        'Bob': 'Naveen',
        'Charlie': 'Praveen',
        'David': 'Sandeep',
        'Eva': 'Srihari',
    }

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Update members and expenses
    for old, new in mapping.items():
        # If target name already exists, skip renaming to avoid UNIQUE constraint errors
        cur.execute('SELECT id FROM members WHERE name=?', (new,))
        if cur.fetchone():
            print(f"Target name '{new}' already exists — skipping rename for '{old}'")
            continue

        cur.execute('UPDATE members SET name=? WHERE name=?', (new, old))
        cur.execute('UPDATE daily_expenses SET paid_by=? WHERE paid_by=?', (new, old))
        cur.execute('UPDATE fixed_expenses SET paid_by=? WHERE paid_by=?', (new, old))
        cur.execute('UPDATE shopping_expenses SET paid_by=? WHERE paid_by=?', (new, old))
        print(f"Renamed '{old}' → '{new}'")

    # Ensure Arun exists
    cur.execute('SELECT id FROM members WHERE name=?', ('Arun',))
    if not cur.fetchone():
        cur.execute('INSERT INTO members (name, is_active) VALUES (?, 1)', ('Arun',))
        print("Inserted member 'Arun'")
    else:
        print("Member 'Arun' already exists")

    conn.commit()

    # Print current members
    print('\nCurrent members:')
    for row in cur.execute('SELECT id, name, is_active FROM members ORDER BY id'):
        print(row)

    conn.close()


if __name__ == '__main__':
    backup_db()
    migrate()
