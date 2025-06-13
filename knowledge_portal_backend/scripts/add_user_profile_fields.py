import asyncio
import asyncpg

async def add_user_profile_fields():
    # Connect to the database
    conn = await asyncpg.connect(
        user='postgres',
        password='postgres',
        database='knowledge_portal',
        host='localhost',
        port='5432'
    )

    try:
        # Add skill_level column if it doesn't exist
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'skill_level'
                ) THEN
                    ALTER TABLE users ADD COLUMN skill_level VARCHAR;
                END IF;
            END $$;
        """)
        
        # Add interests column if it doesn't exist
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'interests'
                ) THEN
                    ALTER TABLE users ADD COLUMN interests JSONB;
                END IF;
            END $$;
        """)
        
        print("Successfully added user profile fields!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(add_user_profile_fields()) 