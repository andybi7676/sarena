// src/useWebSocket.js
import { useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    console.log("Establishing new connection with server");

    ws.current.onopen = () => {
      console.log('Connected to server');
    };

    ws.current.onclose = () => {
      console.log('Disconnected from server');
    };

    ws.current.onerror = (error) => {
      console.error(`WebSocket error: ${error}`);
    };

    ws.current.onmessage = (event) => {
      console.log('Received message:', event.data);
      // parse message and update context
    };

    return () => {
      ws.current.close();
    };
  }, [url]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  };

  return { ws: ws.current, sendMessage };
};

export default useWebSocket;