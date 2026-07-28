"""switch to razorpay

Revision ID: 0a11e8048c26
Revises: 65930f75f82a
Create Date: 2026-07-28 20:17:15.591057

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0a11e8048c26'
down_revision = '65930f75f82a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table changes
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('razorpay_customer_id', sa.String(), nullable=True))
        # Note: In SQLite, dropping a column drops its inline unique constraint automatically if batch mode handles it right
        # but let's be explicit if we can. Since the constraint is unnamed in SQLite, batch mode usually strips it.
        batch_op.drop_column('stripe_customer_id')
        batch_op.create_unique_constraint('uq_users_razorpay_customer_id', ['razorpay_customer_id'])

    # Payments table changes
    with op.batch_alter_table('payments') as batch_op:
        batch_op.add_column(sa.Column('razorpay_payment_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('razorpay_order_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('razorpay_signature', sa.String(), nullable=True))
        batch_op.drop_index('ix_payments_stripe_payment_id')
        batch_op.drop_column('stripe_payment_id')
        batch_op.create_index(op.f('ix_payments_razorpay_payment_id'), ['razorpay_payment_id'], unique=True)
        batch_op.create_index(op.f('ix_payments_razorpay_order_id'), ['razorpay_order_id'], unique=True)


def downgrade() -> None:
    # Users table changes
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('stripe_customer_id', sa.String(), nullable=True))
        batch_op.drop_column('razorpay_customer_id')
        batch_op.create_unique_constraint('uq_users_stripe_customer_id', ['stripe_customer_id'])

    # Payments table changes
    with op.batch_alter_table('payments') as batch_op:
        batch_op.add_column(sa.Column('stripe_payment_id', sa.String(), nullable=True))
        batch_op.drop_index('ix_payments_razorpay_payment_id')
        batch_op.drop_index('ix_payments_razorpay_order_id')
        batch_op.drop_column('razorpay_payment_id')
        batch_op.drop_column('razorpay_order_id')
        batch_op.drop_column('razorpay_signature')
        batch_op.create_index(op.f('ix_payments_stripe_payment_id'), ['stripe_payment_id'], unique=True)
