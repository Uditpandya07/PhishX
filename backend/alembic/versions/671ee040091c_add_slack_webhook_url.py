"""add_slack_webhook_url

Revision ID: 671ee040091c
Revises: 404a8f4c7fdc
Create Date: 2026-07-23 22:49:04.883168

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '671ee040091c'
down_revision = '404a8f4c7fdc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('slack_webhook_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'slack_webhook_url')
