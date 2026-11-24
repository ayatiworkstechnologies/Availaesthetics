
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.admin_user import AdminUser


def create_super_admin():
    with SessionLocal() as db:
        existing_admin = db.scalar(
            select(AdminUser.id)
            .where(AdminUser.role == "super_admin")
            .limit(1)
        )

        if existing_admin is not None:
            print("A Super Admin already exists.")
            return

        print("Create initial Super Admin")

        full_name = input("Full name: ").strip()
        email = input("Email: ").strip().lower()

        if not full_name or "@" not in email:
            print("Enter a valid name and email.")
            return

        existing_email = db.scalar(
            select(AdminUser.id)
            .where(AdminUser.email == email)
        )

        if existing_email is not None:
            print("Email already exists.")
            return

        password = getpass("Password: ")
        confirm_password = getpass("Confirm password: ")

        if password != confirm_password:
            print("Passwords do not match.")
            return

        try:
            password_hash = hash_password(password)
        except ValueError as error:
            print(error)
            return

        admin = AdminUser(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            role="super_admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Super Admin created successfully!")


if __name__ == "__main__":
    create_super_admin()
