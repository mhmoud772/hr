import asyncio
import websockets
import json
import sys

async def test_ws(token):
    uri = f"ws://localhost/ws/updates/?token={token}"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # 1. Wait for 'connected' message
            response = await websocket.recv()
            data = json.loads(response)
            print(f"Received initial: {data}")
            if data.get('type') != 'connected':
                print(f"FAILED: Expected 'connected' message, got {data}")
                sys.exit(1)
            
            # 2. Send ping
            print("Sending ping...")
            await websocket.send(json.dumps({"type": "ping"}))
            
            # 3. Wait for pong
            response = await websocket.recv()
            data = json.loads(response)
            print(f"Received response: {data}")
            if data.get('type') != 'pong':
                print(f"FAILED: Expected 'pong', got {data}")
                sys.exit(1)
            
            print("WebSocket Smoke Test PASSED 🚀")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_websocket.py <token>")
        sys.exit(1)
    asyncio.run(test_ws(sys.argv[1]))
