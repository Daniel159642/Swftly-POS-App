#!/usr/bin/env python3
"""
Encryption utilities for storing sensitive data like Stripe API keys
Uses Fernet (symmetric encryption) from cryptography library
"""

import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def get_encryption_key():
    """
    Get or generate encryption key from environment variable or file
    In production, set ENCRYPTION_KEY environment variable
    """
    # Try to get from environment first
    key_str = os.getenv('ENCRYPTION_KEY')
    
    if key_str:
        # If it's a base64 string, decode it
        try:
            return base64.urlsafe_b64decode(key_str.encode())
        except:
            # If it's not base64, derive a key from it
            return derive_key_from_password(key_str)
    
    # Try to read from file (for development)
    key_file = os.path.join(os.path.dirname(__file__), '.encryption_key')
    if os.path.exists(key_file):
        with open(key_file, 'rb') as f:
            return f.read()
    
    # Generate a new key (for first-time setup)
    key = Fernet.generate_key()
    
    # Save to file for development
    try:
        with open(key_file, 'wb') as f:
            f.write(key)
        print(f"⚠ Generated new encryption key. Saved to {key_file}")
        print("⚠ For production, set ENCRYPTION_KEY environment variable")
    except:
        pass
    
    return key

def derive_key_from_password(password: str) -> bytes:
    """Derive a Fernet key from a password"""
    password_bytes = password.encode()
    salt = b'pos_system_salt'  # In production, use a unique salt per installation
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
    return key

def get_cipher():
    """Get Fernet cipher instance"""
    key = get_encryption_key()
    return Fernet(key)

def encrypt(plaintext: str) -> str:
    """
    Encrypt a string and return base64-encoded encrypted string
    
    Args:
        plaintext: String to encrypt
        
    Returns:
        Base64-encoded encrypted string
    """
    if not plaintext:
        return ''
    
    try:
        cipher = get_cipher()
        encrypted = cipher.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        raise

def decrypt(encrypted_text: str) -> str:
    """
    Decrypt a base64-encoded encrypted string
    
    Args:
        encrypted_text: Base64-encoded encrypted string
        
    Returns:
        Decrypted plaintext string
    """
    if not encrypted_text:
        return ''
    
    try:
        cipher = get_cipher()
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_text.encode())
        decrypted = cipher.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        raise

# Test encryption/decryption
if __name__ == '__main__':
    test_string = "sk_test_1234567890abcdef"
    print(f"Original: {test_string}")
    
    encrypted = encrypt(test_string)
    print(f"Encrypted: {encrypted}")
    
    decrypted = decrypt(encrypted)
    print(f"Decrypted: {decrypted}")
    
    assert decrypted == test_string, "Encryption/decryption failed!"
    print("✓ Encryption test passed!")
