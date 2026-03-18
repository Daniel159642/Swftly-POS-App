# Employees & Users (RBAC)
The Employee and User management system handles authentication, authorization, and audit logging for all staff interactions with the POS.

## Architecture
The system uses a Role-Based Access Control (RBAC) structure primarily managed by `permission_manager.py`.

## Key Capabilities
- **Role-Based Permissions**: Permissions are grouped into roles (e.g., Cashier, Manager, Admin). Employees are assigned roles, granting them all associated permissions automatically.
- **Employee-Specific Overrides**: Beyond roles, specific permissions can be explicitly granted or revoked at the individual employee level (e.g., granting a Cashier the ability to void a sale without making them a Manager).
- **Secure PIN Access**: Access to POS functions often requires a secure PIN entry (`setup_admin_pin.py`). Critical actions require a manager override PIN.
- **Audit Logging**: A robust history of who did what, and when. Every critical action (sales, refunds, inventory adjustments, permission changes) writes an `audit_log` event linked to the employee.
- **Decorator-Based Enforcement**: In the backend, routes and functions are secured using a `@require_permission('permission_name')` decorator to ensure endpoints cannot be bypassed.
