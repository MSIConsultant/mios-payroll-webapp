"""init

Revision ID: 001_init
Revises: 
Create Date: 2026-02-20 00:00:00.000000

"""
from typing import Any

# Provide `op` fallback for static analysis when Alembic isn't installed
try:
    from alembic import op  # type: ignore
except Exception:
    op: Any = None

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('companies',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('npwp', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('tax_configs',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('version_name', sa.String(), nullable=False),
    sa.Column('effective_from', sa.Date(), nullable=False),
    sa.Column('ptkp_k0', sa.Integer(), nullable=False),
    sa.Column('ptkp_k1', sa.Integer(), nullable=False),
    sa.Column('ptkp_k2', sa.Integer(), nullable=False),
    sa.Column('ptkp_k3', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('employees',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('nama', sa.String(), nullable=False),
    sa.Column('nik', sa.String(), nullable=False),
    sa.Column('npwp', sa.String(), nullable=True),
    sa.Column('status_ptkp', sa.String(), nullable=False),
    sa.Column('jabatan', sa.String(), nullable=True),
    sa.Column('tanggal_masuk', sa.Date(), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('payroll_items',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('year', sa.Integer(), nullable=False),
    sa.Column('month', sa.Integer(), nullable=False),
    sa.Column('gross_income', sa.Numeric(precision=18, scale=2), nullable=False),
    sa.Column('pph21', sa.Numeric(precision=18, scale=2), nullable=False),
    sa.Column('bpjs', sa.Numeric(precision=18, scale=2), nullable=False),
    sa.Column('net_income', sa.Numeric(precision=18, scale=2), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('payroll_items')
    op.drop_table('employees')
    op.drop_table('tax_configs')
    op.drop_table('companies')
