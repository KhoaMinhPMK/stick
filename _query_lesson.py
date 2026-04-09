import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import sftp_write, run_cmd

sql = """SELECT id, title, category, level, LEFT(content, 300) as content_preview FROM Lesson WHERE published=1 ORDER BY orderIndex LIMIT 20;"""
sftp_write('C:/stick_query.sql', sql)
result = run_cmd(r'mysql -u stick_user -pStickApp2026! stick_db < C:\stick_query.sql', timeout=30)
print(result)
