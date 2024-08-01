import asyncio
import websockets
import json 
import base64

async def handler(websocket, path):
    while True:
        message = await websocket.recv()
        data = json.loads(message)
        print(f"Received: {data}")
        
        if data['type'] == 'audio':
            byte_array_data = base64.b64decode(data['data'])
            # from byte array to int array
            int_array_data = [int(byte) for byte in byte_array_data]
            print("Received byte array:", byte_array_data)
            print("Received int array:", int_array_data)
            # Send back the received byte array for verification
            # await websocket.send(json.dumps({"status": "received", "data": data['data']}))
        response = f"Echo: {json.dumps(data)}"
        await websocket.send(response)

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())