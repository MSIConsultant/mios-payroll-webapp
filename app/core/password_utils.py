"""
Password hashing utilities using bcrypt
Indonesian Payroll System - Production Grade
"""

try:
    from passlib.context import CryptContext  # type: ignore
    from passlib.exc import InvalidHashError  # type: ignore

    # Bcrypt context with 12 rounds (secure, fast)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
except Exception:  # pragma: no cover - development fallback when passlib not installed
    InvalidHashError = Exception

    class _PwdStub:
        def hash(self, password: str) -> str:  # type: ignore[override]
            raise RuntimeError("passlib is not installed; install with 'pip install passlib[bcrypt]'")

        def verify(self, plain: str, hashed: str) -> bool:  # type: ignore[override]
            raise RuntimeError("passlib is not installed; install with 'pip install passlib[bcrypt]'")

    pwd_context = _PwdStub()


class PasswordManager:
    """Password hashing and verification manager"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash password using bcrypt
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify plain password against hash
        
        Args:
            plain_password: Plain text password
            hashed_password: Bcrypt hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except InvalidHashError:
            return False
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Validate password strength requirements
        Requirements:
        - Minimum 8 characters
        - At least 1 uppercase letter
        - At least 1 lowercase letter
        - At least 1 digit
        - At least 1 special character (!@#$%^&*)
        
        Args:
            password: Password to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Password harus minimal 8 karakter"
        
        if not any(c.isupper() for c in password):
            return False, "Password harus mengandung minimal 1 huruf besar"
        
        if not any(c.islower() for c in password):
            return False, "Password harus mengandung minimal 1 huruf kecil"
        
        if not any(c.isdigit() for c in password):
            return False, "Password harus mengandung minimal 1 angka"
        
        special_chars = "!@#$%^&*()-_=+[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Password harus mengandung minimal 1 karakter spesial (!@#$%^&*)"
        
        return True, ""


# Global instance
password_manager = PasswordManager()
