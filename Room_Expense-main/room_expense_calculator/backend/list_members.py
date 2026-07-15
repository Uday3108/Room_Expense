import sqlite3
import os

ROOT = os.path.dirname(__file__)
DB_PATH = os.path.join(ROOT, 'room_expenses.db')
OUT = os.path.join(ROOT, 'members_list.txt')

conn = sqlite3.connect(DB_PATH)
rows = list(conn.execute('SELECT id, name, is_active FROM members ORDER BY id'))
conn.close()

with open(OUT, 'w', encoding='utf-8') as f:
    for r in rows:
        f.write(f"{r}\n")

print('WROTE', len(rows), 'members to', OUT)
