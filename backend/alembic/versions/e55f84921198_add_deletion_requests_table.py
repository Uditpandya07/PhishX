"""add_deletion_requests_table

Revision ID: e55f84921198
Revises: da4f32472287
Create Date: 2026-05-19 00:45:12.104832

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e55f84921198'
down_revision = 'da4f32472287'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create deletion_requests table
    op.create_table('deletion_requests',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_deletion_requests_id'), 'deletion_requests', ['id'], unique=False)

    # Add ai_training_enabled column to users if not exists
    try:
        op.add_column('users', sa.Column('ai_training_enabled', sa.Boolean(), server_default='true', nullable=True))
    except Exception as e:
        print(f"Column ai_training_enabled might already exist: {e}")


def downgrade() -> None:
    try:
        op.drop_column('users', 'ai_training_enabled')
    except Exception as e:
        print(f"Error dropping ai_training_enabled: {e}")
    op.drop_index(op.f('ix_deletion_requests_id'), table_name='deletion_requests')
    op.drop_table('deletion_requests')
