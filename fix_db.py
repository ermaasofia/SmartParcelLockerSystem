import sqlite3
conn = sqlite3.connect('pickngo_v2.db')
cursor = conn.cursor()
cursor.execute("UPDATE requests SET actionDate = substr(actionDate, 1, 10) WHERE actionDate LIKE '% %'")
conn.commit()
conn.close()
print('Fixed actionDate.')
