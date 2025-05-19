import asyncpg
from typing import Optional

class DatabaseEndpoint:
    def __init__(self, host: str, port: int, user: str, password: str, dbname: str, max_images: int = 20):
        self.dsn = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
        self.max_images = max_images
        self.pool: Optional[asyncpg.Pool] = None

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
                await conn.execute("""
                    INSERT INTO mnist_images (image_data, prediction, real, client_port, client_name)
                    VALUES ($1, $2, $3, $4, $5)
                """, image_data, prediction, real, client_port, client_name)

                await conn.execute("""
                    DELETE FROM mnist_images
                    WHERE id NOT IN (
                        SELECT id FROM mnist_images
                        ORDER BY created_at DESC
                        LIMIT $1
                    )
                """, self.max_images)
