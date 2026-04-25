from app.db.session import engine
from app.db.base import Base
from app.db.models import DeletionRequest  # Ensure model is imported

def create_missing_tables():
    print("🚀 Initializing DeletionRequest table...")
    try:
        # This will only create tables that don't exist yet
        Base.metadata.create_all(bind=engine)
        print("✅ Success! The 'deletion_requests' table has been created.")
    except Exception as e:
        print(f"❌ Error creating table: {e}")

if __name__ == "__main__":
    create_missing_tables()
