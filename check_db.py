import sqlite3
con = sqlite3.connect('instance/indecap_dev.db')
tablas = [r[0] for r in con.execute("select name from sqlite_master where type='table'")]
print(tablas)
