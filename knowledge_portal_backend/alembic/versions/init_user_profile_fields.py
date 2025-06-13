"""init user profile fields

Revision ID: init_user_profile_fields
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'init_user_profile_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create alembic_version table if it doesn't exist
    op.execute('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)')
    
    # Add skill_level column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'skill_level'
            ) THEN
                ALTER TABLE users ADD COLUMN skill_level VARCHAR;
            END IF;
        END $$;
    """)
    
    # Add interests column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'interests'
            ) THEN
                ALTER TABLE users ADD COLUMN interests JSONB;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove the columns in reverse order
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'interests'
            ) THEN
                ALTER TABLE users DROP COLUMN interests;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'skill_level'
            ) THEN
                ALTER TABLE users DROP COLUMN skill_level;
            END IF;
        END $$;
    """) 