#!/usr/bin/env python3
"""Clear all saved receipt templates from receipt_templates table."""
import sys

def main():
    try:
        from database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM receipt_templates")
        count = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Cleared {count} receipt template(s).")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
