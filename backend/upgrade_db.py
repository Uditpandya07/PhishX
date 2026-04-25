import sys
import os

# Add the current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def upgrade():
    try:
        # Use the DATABASE_URL from your .env file automatically
        print(f"Connecting to database...")
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            print("Checking 'users' table structure...")
            
            # Use 'ALTER TABLE ... ADD COLUMN IF NOT EXISTS' for Postgres 9.6+
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN ai_training_enabled BOOLEAN DEFAULT TRUE"))
                conn.commit()
                print("✅ Successfully added 'ai_training_enabled' column.")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("ℹ️ Column 'ai_training_enabled' already exists.")
                else:
                    raise e
                    
        print("🎉 Database upgrade complete.")
    except Exception as e:
        print(f"❌ Error during upgrade: {e}")

if __name__ == "__main__":
    upgrade()
