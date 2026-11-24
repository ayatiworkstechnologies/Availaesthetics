
from sqlalchemy import text
from app.database import engine


def test_database_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT DATABASE(), VERSION()")
            )

            database_name, version = result.one()

            print("Database connected successfully!")
            print("Database:", database_name)
            print("Version:", version)

    except Exception as error:
        print("Database connection failed!")
        print("Error type:", type(error).__name__)


if __name__ == "__main__":
    test_database_connection()
