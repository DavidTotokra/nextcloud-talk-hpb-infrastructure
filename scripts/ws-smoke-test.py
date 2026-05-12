import asyncio
import os
import websockets

URL = os.environ.get("WS_URL", "wss://hpb.example.com/spreed")
CLIENTS = int(os.environ.get("CLIENTS", "20"))


async def connect_one(i: int):
    name = f"ws-{i:02d}"
    try:
        async with websockets.connect(URL) as ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            print(f"[{name}] connected, first message: {msg[:120]!r}")
            await asyncio.sleep(10)
    except Exception as e:
        print(f"[{name}] failed: {e}")


async def main():
    tasks = [connect_one(i) for i in range(1, CLIENTS + 1)]
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
