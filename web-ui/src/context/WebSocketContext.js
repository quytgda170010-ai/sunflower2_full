import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useKeycloak } from './KeycloakContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { keycloak } = useKeycloak();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [listeners, setListeners] = useState([]);

  // WebSocket URL - use gateway if available, fallback to ehr-core
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
      return window.REACT_APP_API_URL;
    }
    return process.env.REACT_APP_API_URL || 'https://localhost:8443';
  };
  const API_BASE_URL = getApiBaseUrl();
  // Convert HTTP URL to WebSocket URL (gateway doesn't support WS, so use ehr-core directly for WS)
  const WS_URL = process.env.REACT_APP_WS_URL || API_BASE_URL.replace('http://', 'ws://').replace('8081', '8000') + '/ws';

  const connect = () => {
    if (!keycloak?.authenticated) {
      console.log('Not authenticated, skipping WebSocket connection');
      return;
    }

    // Check if WebSocket is enabled (can be disabled via env var)
    const WS_ENABLED = process.env.REACT_APP_WS_ENABLED !== 'false';
    if (!WS_ENABLED) {
      console.debug('WebSocket is disabled via REACT_APP_WS_ENABLED');
      return;
    }

    try {
      const token = keycloak.token;
      if (!token) {
        console.debug('No token available, skipping WebSocket connection');
        return;
      }

      const wsUrl = `${WS_URL}?token=${token}`;
      
      console.debug('Connecting to WebSocket:', wsUrl.replace(token, 'token=***'));
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.debug('WebSocket message received:', data);
          setLastMessage(data);
          
          // Notify all listeners
          listeners.forEach(listener => {
            if (listener.type === data.type || listener.type === '*') {
              listener.callback(data);
            }
          });
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        // Only log as debug since WebSocket may not be implemented yet
        console.debug('WebSocket connection failed (backend may not support WebSocket):', error);
        // Don't set connected to false here, let onclose handle it
      };

      ws.onclose = (event) => {
        console.debug('WebSocket disconnected', event.code, event.reason);
        setConnected(false);
        
        // Only attempt to reconnect if it was a normal closure or unexpected error
        // Don't reconnect on authentication failures (code 1008) or if backend doesn't support it
        if (event.code !== 1008 && event.code !== 1006) {
          // Attempt to reconnect after 5 seconds (but only once to avoid spam)
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              console.debug('Attempting to reconnect WebSocket...');
              connect();
            }, 5000);
          }
        } else {
          console.debug('WebSocket authentication failed or backend not available, not reconnecting');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.debug('Failed to create WebSocket connection:', err);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  };

  const subscribe = (type, callback) => {
    const listener = { type, callback, id: Math.random().toString(36) };
    setListeners(prev => [...prev, listener]);
    
    // Return unsubscribe function
    return () => {
      setListeners(prev => prev.filter(l => l.id !== listener.id));
    };
  };

  // Connect when authenticated (only if WebSocket is enabled)
  // NOTE: WebSocket is currently disabled as backend doesn't support it yet
  useEffect(() => {
    // Temporarily disable WebSocket until backend implements it
    const WS_ENABLED = false; // process.env.REACT_APP_WS_ENABLED !== 'false';
    
    if (keycloak?.authenticated && WS_ENABLED) {
      // Delay connection slightly to avoid immediate connection attempts
      const timeoutId = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    }
    
    return () => {
      disconnect();
    };
  }, [keycloak?.authenticated]);

  const value = {
    connected,
    lastMessage,
    sendMessage,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;

