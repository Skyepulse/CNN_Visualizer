import asyncpg
import asyncio
from typing import Optional

class DatabaseEndpoint:
    def __init__(self, host: str, port: int, user: str, password: str, dbname: str, max_images: int = 2000):
        self.dsn = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
        self.max_images = max_images
        self.pool: Optional[asyncpg.Pool] = None

        # Cleanup scheduling
        self._cleanup_task: Optional[asyncio.Task] = None
        self._cleanup_lock = asyncio.Lock()
        self._cleanup_interval = 1.5 # seconds

    async def init_db(self):
        if self.pool is None:
            self.pool = await asyncpg.create_pool(dsn=self.dsn)

    async def insert_and_cleanup_image(
        self,
        image_data: bytes,
        prediction: int,
        real: int,
        client_port: int,
        client_name: str,
    ):
        if self.pool is None:
            raise RuntimeError("Database not initialized. Call `init_db()` first.")

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # Insert the new image
                await conn.execute("""
                    INSERT INTO mnist_images (image_data, prediction, real, client_port, client_name)
                    VALUES ($1, $2, $3, $4, $5)
                """, image_data, prediction, real, client_port, client_name)
        
        await self.debounce_cleanup(delay=self._cleanup_interval)
    
    async def get_images(self, limit: int = 10):
        if self.pool is None:
            raise RuntimeError("Database not initialized. Call init_db() first.")

        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT image_data, prediction, real, client_name
                FROM mnist_images
                ORDER BY created_at DESC
                LIMIT $1    
            """, limit)

        return rows
    
    async def debounce_cleanup(self, delay: float = 1.5):
        async with self._cleanup_lock:

            if self._cleanup_task is not None and not self._cleanup_task.done():
                self._cleanup_task.cancel()

            self._cleanup_task = asyncio.create_task(self._delayed_cleanup(delay))

    async def _delayed_cleanup(self, delay: float):
        try:
            await asyncio.sleep(delay)
            await self.cleanup_images()
        except asyncio.CancelledError:
            pass  # Expected if debounce reschedules the cleanup

    async def cleanup_images(self):
        if self.pool is None:
            raise RuntimeError("Database not initialized.")

        async with self.pool.acquire() as conn:
            await conn.execute("""
                WITH ranked AS (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) AS rnk
                    FROM mnist_images
                )
                DELETE FROM mnist_images
                WHERE id IN (
                    SELECT id FROM ranked WHERE rnk > $1
                )
            """, self.max_images)