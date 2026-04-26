from app.db.session import engine
from app.db.base import Base
import app.db.models as models

def init_db():
    print("🚀 Initializing all PhishX database tables...")
    try:
        # This will create all tables defined in models.py that don't exist yet
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialization successful!")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    init_db()
