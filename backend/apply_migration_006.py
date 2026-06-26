import asyncio
import asyncpg
import os
import sys
from urllib.parse import urlparse

async def main():
    from dotenv import load_dotenv
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        sys.exit(1)
        
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print(f"Connecting to {db_url.split('@')[1]}...")
    
    try:
        conn = await asyncpg.connect(db_url)
        print("Successfully connected to database.")
    except Exception as e:
        print(f"Failed to connect: {e}")
        print("Trying direct connection on port 5432...")
        try:
            db_url_5432 = db_url.replace(":6543/", ":5432/")
            parsed = urlparse(db_url_5432)
            username = parsed.username
            if "." in username:
                username = username.split(".")[0]
            db_url_5432 = f"postgresql://{username}:{parsed.password}@{parsed.hostname}:5432/{parsed.path.lstrip('/')}"
            
            conn = await asyncpg.connect(db_url_5432)
            print("Successfully connected to database on port 5432.")
        except Exception as e2:
            print(f"Failed direct connection: {e2}")
            sys.exit(1)

    print("Reading 006_pos_and_customers.sql...")
    schema_path = os.path.join(os.path.dirname(__dirname__), 'database', '006_pos_and_customers.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    print("Executing migration (this may take a minute)...")
    try:
        await conn.execute(schema_sql)
        print("✅ Migration applied successfully!")
    except Exception as e:
        print(f"❌ Failed to apply migration: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
