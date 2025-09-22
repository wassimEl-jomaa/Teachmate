from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_SALT = "wassim"
def get_password_hash(password: str) -> str:
    """Hash a plain text password."""
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

if __name__ == "__main__":


    password = input("Enter password: ")

    hashed_password = get_password_hash(password)
    print(f"Hashed password: {hashed_password}")