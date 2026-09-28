"""add patient gender and package

Revision ID: 9d4c9f9ce5b4
Revises: a4e49a70538e
Create Date: 2026-09-28 12:25:52.126792
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '9d4c9f9ce5b4'
down_revision: str | None = 'a4e49a70538e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # add_column does not auto-create the enum type (unlike create_table), so make it
    # explicitly first; create_type=False stops the column add from creating it again.
    patient_gender = postgresql.ENUM(
        'male', 'female', 'other', name='patient_gender', create_type=False
    )
    patient_gender.create(op.get_bind(), checkfirst=True)
    op.add_column('patients', sa.Column('gender', patient_gender, nullable=True))
    op.add_column('patients', sa.Column('package', sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column('patients', 'package')
    op.drop_column('patients', 'gender')
    postgresql.ENUM(name='patient_gender').drop(op.get_bind(), checkfirst=True)
