"""Create User and Company tables - Production Schema

Revision ID: 002_production_setup
Revises: 001_init
Create Date: 2026-02-23 00:00:00.000000

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
revision = '002_production_setup'
down_revision = '001_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create User and Company tables, add company_id to employees
    """
    
    # Create User enum type for PostgreSQL
    sa.Enum('super_admin', 'company_admin', 'accountant', 'hr_staff', 'viewer', name='userrole').create(op.get_bind(), checkfirst=True)
    
    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('nama', sa.String(255), nullable=False),
        sa.Column('npwp', sa.String(16), nullable=False, unique=True),
        sa.Column('alamat', sa.String(500), nullable=False),
        sa.Column('kota', sa.String(100), nullable=False),
        sa.Column('provinsi', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('telepon', sa.String(20), nullable=True),
        sa.Column('pic_nama', sa.String(255), nullable=True),
        sa.Column('pic_telepon', sa.String(20), nullable=True),
        sa.Column('bank_nama', sa.String(100), nullable=True),
        sa.Column('bank_rekening', sa.String(30), nullable=True),
        sa.Column('bank_atas_nama', sa.String(255), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for companies table
    op.create_index('idx_company_npwp', 'companies', ['npwp'], unique=True)
    op.create_index('idx_company_is_active', 'companies', ['is_active'])
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
            sa.Column('role', sa.Enum('super_admin', 'company_admin', 'accountant', 'hr_staff', 'viewer', name='userrole'), nullable=False, server_default=sa.text("'viewer'")),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True),
            sa.Column('force_password_change', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for users table
    op.create_index('idx_user_email', 'users', ['email'], unique=True)
    op.create_index('idx_user_company', 'users', ['company_id'])
    op.create_index('idx_user_is_active', 'users', ['is_active'])
    

def downgrade() -> None:
    """
    Drop User and Company tables
    """
    # Drop indexes
    op.drop_index('idx_user_is_active', table_name='users')
    op.drop_index('idx_user_company', table_name='users')
    op.drop_index('idx_user_email', table_name='users')
    op.drop_index('idx_company_is_active', table_name='companies')
    op.drop_index('idx_company_npwp', table_name='companies')
    
    # Drop tables
    op.drop_table('users')
    op.drop_table('companies')
    
    # Drop enum type
    sa.Enum('super_admin', 'company_admin', 'accountant', 'hr_staff', 'viewer', name='userrole').drop(op.get_bind(), checkfirst=True)
