# Admin Account Created Successfully! ✅

## Login Credentials

**Employee Code:** `ADMIN001`  
**Password:** `123456`

## How to Log In

1. **Start the backend server:**
   ```bash
   cd /Users/danielbudnyatsky/pos
   python3 web_viewer.py
   ```

2. **Start the frontend server:**
   ```bash
   cd /Users/danielbudnyatsky/pos/frontend
   npm run dev
   ```

3. **Open your browser:**
   Go to: **http://localhost:3000**

4. **Log in:**
   - Select employee: **ADMIN001** (or type it)
   - Enter password: **123456**
   - Click Login

## Account Details

- **Employee ID:** 1
- **Employee Code:** ADMIN001
- **Name:** Admin User
- **Position:** admin
- **Status:** Active

## Security Note

⚠️ **Change the default password after first login!**

The default password `123456` is not secure. You should:
1. Log in with the default credentials
2. Go to Settings or Profile
3. Change your password to something more secure

## Creating Additional Admin Accounts

If you need to create more admin accounts, run:

```bash
python3 create_admin_account.py
```

This script will:
- Create a default establishment if needed
- Prompt you for admin details
- Create the admin account in the database

## Troubleshooting

### Can't see ADMIN001 in the dropdown
- Make sure the backend server is running
- Check that the database connection is working: `python3 check_postgres_connection.py`
- Verify the employee exists: Check the database directly

### Login fails
- Verify the password is correct (123456)
- Check that the employee is active: `active = 1`
- Check backend logs for error messages

### Need to reset password
You can update the password directly in the database or use the `update_employee` function in Python.
