import asyncio
import asyncpg

async def verify_columns():
    conn = await asyncpg.connect(
        user='postgres',
        password='postgres',
        database='knowledge_portal',
        host='localhost',
        port='5432'
    )

    try:
        result = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('skill_level', 'interests')
        """)
        print('Found columns:', [r['column_name'] for r in result])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(verify_columns()) 