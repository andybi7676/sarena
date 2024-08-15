import json
import asyncio
import numpy as np
from logging import getLogger
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack
from aiortc.contrib.media import MediaBlackhole, MediaRecorder

logger = getLogger("pc")

pcs = set()

class EchoTrack(MediaStreamTrack):
    kind = "audio"

    def __init__(self, track, delay=1.0):
        super().__init__()  # initialize base class
        self.track = track
        self.delay = delay
        self.buffer = []

    async def recv(self):
        frame = await self.track.recv()
        self.buffer.append(frame)

        # Apply delay
        if len(self.buffer) > int(self.delay * 100):  # assuming 100 frames per second
            frame = self.buffer.pop(0)
            print(f"Echoing frame, frame={frame}, type={type(frame)}")
            return frame
        else:
            # Return silent frame if buffer is not full enough to apply delay
            return frame  # or use MediaBlackhole or a silent frame instead

async def index(request):
    content = open('index.html', 'r').read()
    return web.Response(content_type='text/html', text=content)

async def offer(request):
    print("Offer request recieved. Creating peer connection...")
    params = await request.json()
    offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])
    
    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on('iceconnectionstatechange')
    async def on_iceconnectionstatechange():
        if pc.iceConnectionState == 'failed':
            await pc.close()
            pcs.discard(pc)

    @pc.on('track')
    def on_track(track):
        if track.kind == 'audio':
            local_track = EchoTrack(track)
            pc.addTrack(local_track)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    print("Sending answer...")

    return web.json_response({
        'sdp': pc.localDescription.sdp,
        'type': pc.localDescription.type
    })

async def websocket_handler(request):
    print("Websocket connection established.")
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            data = json.loads(msg.data)
            if data['type'] == 'offer':
                params = data['params']
                offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])
                
                pc = RTCPeerConnection()
                pcs.add(pc)

                @pc.on('iceconnectionstatechange')
                async def on_iceconnectionstatechange():
                    if pc.iceConnectionState == 'failed':
                        await pc.close()
                        pcs.discard(pc)

                @pc.on('track')
                def on_track(track):
                    if track.kind == 'audio':
                        local_track = EchoTrack(track)
                        pc.addTrack(local_track)

                await pc.setRemoteDescription(offer)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                await ws.send_json({
                    'sdp': pc.localDescription.sdp,
                    'type': pc.localDescription.type
                })
                
    return ws

app = web.Application()
app.add_routes([
    web.get('/', index),
    web.post('/offer', offer),
    web.get('/ws', websocket_handler)
])

web.run_app(app, port=8080)
