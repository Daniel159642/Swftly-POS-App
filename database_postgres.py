#!/usr/bin/env python3
"""
Local PostgreSQL database connection module for POS system
Replaces Supabase with local PostgreSQL database
"""

import os
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import threading

# Global connection
_pg_connection = None
_connection_lock = threading.Lock()

# Database configuration (from environment variables)
DB_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL') or os.getenv('DB_URL')

# Default local PostgreSQL connection parameters
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'pos_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')

def _build_connection_string():
    """Build PostgreSQL connection string from environment variables"""
    if DB_URL:
        return DB_URL
    
    # Build connection string from individual components
    return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_connection():
    """
    Get PostgreSQL connection
    Returns a connection with RealDictCursor support (dict-like rows)
    """
    global _pg_connection
    
    with _connection_lock:
        if _pg_connection is None or _pg_connection.closed:
            connection_string = _build_connection_string()
            
            if not connection_string:
                raise ValueError(
                    "Database connection not configured. "
                    "Set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD environment variables."
                )
            
            try:
                _pg_connection = psycopg2.connect(connection_string)
                _pg_connection.set_session(autocommit=False)
            except Exception as e:
                # If connection fails, reset and raise
                _pg_connection = None
                raise ConnectionError(
                    f"Failed to connect to PostgreSQL: {str(e)}. "
                    f"Check your database connection settings (DATABASE_URL or DB_* variables)."
                ) from e
        
        return _pg_connection

def get_cursor():
    """Get cursor with dict-like row access (like SQLite Row factory)"""
    conn = get_connection()
    return conn.cursor(cursor_factory=RealDictCursor)

def close_connection():
    """Close database connection"""
    global _pg_connection
    if _pg_connection and not _pg_connection.closed:
        _pg_connection.close()
        _pg_connection = None

def reset_connection():
    """Reset connection (useful for testing or after errors)"""
    global _pg_connection
    if _pg_connection and not _pg_connection.closed:
        _pg_connection.close()
    _pg_connection = None

# Compatibility functions for code that might reference establishment context
# These are no-ops since we're not using multi-tenant establishment isolation
def set_current_establishment(establishment_id: Optional[int]):
    """No-op: establishment context not used in local PostgreSQL"""
    pass

def get_current_establishment() -> Optional[int]:
    """No-op: establishment context not used in local PostgreSQL"""
    return None
