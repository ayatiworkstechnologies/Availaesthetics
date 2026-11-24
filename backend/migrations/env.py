
from logging.config import fileConfig

from alembic import context

from app.database import Base, engine

# Import all SQLAlchemy models to register their metadata
from app import models  # noqa: F401


# Alembic configuration
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# All registered SQLAlchemy tables
target_metadata = Base.metadata


def run_migrations_offline():
    """Generate SQL migrations without a database connection."""

    context.configure(
        url=engine.url.render_as_string(
            hide_password=False
        ),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Apply migrations using the configured database engine."""

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
