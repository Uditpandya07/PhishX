import logging
import sys
import os

# Ensure the app module can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))

from app.db.session import SessionLocal
from app.db.models import SubscriptionPlan, User
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_db():
    db = SessionLocal()
    try:
        # 1. Seed Subscription Plans
        plans = [
            {"name": "Free", "price": 0.0, "scan_limit": 100, "features_json": {"api_access": False}},
            {"name": "Pro", "price": 9.99, "scan_limit": 1000, "features_json": {"api_access": True}},
            {"name": "Enterprise", "price": 49.99, "scan_limit": -1, "features_json": {"api_access": True, "priority_support": True}}
        ]
        
        for plan_data in plans:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == plan_data["name"]).first()
            if not plan:
                new_plan = SubscriptionPlan(**plan_data)
                db.add(new_plan)
                logger.info(f"Created plan: {plan_data['name']}")
            else:
                logger.info(f"Plan already exists: {plan_data['name']}")
                
        # 2. Seed an Admin User
        admin_email = "admin@phishx.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            hashed_password = get_password_hash("admin123")
            new_admin = User(
                name="Admin",
                email=admin_email,
                password_hash=hashed_password,
                is_verified=True,
                is_superuser=True,
                subscription_tier="Enterprise"
            )
            db.add(new_admin)
            logger.info("Created admin user: admin@phishx.com (password: admin123)")
        else:
            logger.info("Admin user already exists")

        db.commit()
        logger.info("Database seeded successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting database seeding...")
    seed_db()
