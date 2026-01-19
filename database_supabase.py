#!/usr/bin/env python3
"""
Supabase database connection module for multi-tenant POS system
Replaces SQLite connection with PostgreSQL/Supabase connection
"""

import os
from supabase import create_client, Client
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import threading

# Thread-local storage for establishment context
_thread_local = threading.local()

# Supabase configuration (from environment variables)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')  # Use 'anon' key for client, 'service_role' for admin
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')  # Direct PostgreSQL connection string

# Global connections
_supabase_client: Optional[Client] = None
_pg_connection = None
_connection_lock = threading.Lock()

def get_supabase_client() -> Client:
    """Get Supabase client (single instance)"""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client

def get_connection():
    """
    Get PostgreSQL connection with establishment context set
    This replaces the SQLite get_connection() function
    Returns a connection with RealDictCursor support (dict-like rows)
    """
    global _pg_connection
    
    with _connection_lock:
        if _pg_connection is None or _pg_connection.closed:
            if not SUPABASE_DB_URL:
                raise ValueError("SUPABASE_DB_URL must be set in environment")
            _pg_connection = psycopg2.connect(SUPABASE_DB_URL)
            _pg_connection.set_session(autocommit=False)
        
        # Set establishment context for RLS
        establishment_id = get_current_establishment()
        if establishment_id:
            try:
                with _pg_connection.cursor() as cur:
                    cur.execute(f"SET app.establishment_id = {establishment_id}")
                    _pg_connection.commit()
            except Exception as e:
                # If setting fails, try to reconnect
                try:
                    _pg_connection.close()
                except:
                    pass
                _pg_connection = psycopg2.connect(SUPABASE_DB_URL)
                _pg_connection.set_session(autocommit=False)
                if establishment_id:
                    with _pg_connection.cursor() as cur:
                        cur.execute(f"SET app.establishment_id = {establishment_id}")
                        _pg_connection.commit()
        
        return _pg_connection

def get_cursor():
    """Get cursor with dict-like row access (like SQLite Row factory)"""
    conn = get_connection()
    return conn.cursor(cursor_factory=RealDictCursor)

def set_current_establishment(establishment_id: int):
    """Set establishment context for current thread"""
    _thread_local.establishment_id = establishment_id
    
    # Also set in database session for RLS
    global _pg_connection
    if _pg_connection and not _pg_connection.closed:
        try:
            with _pg_connection.cursor() as cur:
                cur.execute(f"SET app.establishment_id = {establishment_id}")
                _pg_connection.commit()
        except Exception as e:
            print(f"Warning: Could not set establishment context: {e}")

def get_current_establishment() -> Optional[int]:
    """Get current establishment ID from thread-local storage"""
    return getattr(_thread_local, 'establishment_id', None)

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
