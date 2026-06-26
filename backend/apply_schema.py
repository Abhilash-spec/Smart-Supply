import asyncio
import asyncpg
import os
import sys
from urllib.parse import urlparse

async def main():
    # Parse the DATABASE_URL
    # From postgresql+asyncpg://... to postgresql://...
    from dotenv import load_dotenv
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        sys.exit(1)
        
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    # Supabase direct connection usually requires setting the password and user
    # Sometimes DDL requires connecting to port 5432 (direct) instead of 6543 (pooler)
    # Let's try 6543 first, if it fails we can try 5432
    
    print(f"Connecting to {db_url.split('@')[1]}...")
    
    try:
        conn = await asyncpg.connect(db_url)
        print("Successfully connected to database.")
    except Exception as e:
        print(f"Failed to connect: {e}")
        # Try replacing port 6543 with 5432
        print("Trying direct connection on port 5432...")
        try:
            db_url_5432 = db_url.replace(":6543/", ":5432/")
            # Also user is usually just 'postgres' for port 5432
            parsed = urlparse(db_url_5432)
            username = parsed.username
            if "." in username:
                username = username.split(".")[0] # just 'postgres'
            db_url_5432 = f"postgresql://{username}:{parsed.password}@{parsed.hostname}:5432/{parsed.path.lstrip('/')}"
            
            conn = await asyncpg.connect(db_url_5432)
            print("Successfully connected to database on port 5432.")
        except Exception as e2:
            print(f"Failed direct connection: {e2}")
            sys.exit(1)

    print("Reading schema.sql...")
    schema_path = os.path.join(os.path.dirname(__dirname__), 'database', 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    print("Executing schema (this may take a minute)...")
    try:
        await conn.execute(schema_sql)
        print("✅ Schema applied successfully!")
    except Exception as e:
        print(f"❌ Failed to apply schema: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
