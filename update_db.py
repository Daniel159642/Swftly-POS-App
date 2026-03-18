import sys, os
from dotenv import load_dotenv
load_dotenv()
from database_postgres import get_connection

def run():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE inventory ADD COLUMN qbo_id VARCHAR(255);")
        conn.commit()
        print("Added qbo_id to inventory")
    except Exception as e:
        print(e)
    finally:
        conn.close()

if __name__ == '__main__':
    run()
