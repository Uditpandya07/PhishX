# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.session import Base  # noqa
from app.db.models import User, Scan, Payment, ApiKey, AuditLog, SubscriptionPlan  # noqa
