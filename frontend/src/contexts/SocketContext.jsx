import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Sử dụng API_BASE_URL thay vì localhost cố định
      const newSocket = io(API_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to server at:', API_BASE_URL);
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
        setError(err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  const joinCourseRoom = (courseId) => {
    if (socket && isConnected) {
      socket.emit('join-course-room', { courseId });
    }
  };

  const startLiveSession = (courseId) => {
    if (socket && isConnected) {
      socket.emit('start-live-session', { courseId });
    }
  };

  const endLiveSession = (courseId) => {
    if (socket && isConnected) {
      socket.emit('end-live-session', { courseId });
    }
  };

  const sendChatMessage = (roomId, message) => {
    if (socket && isConnected) {
      socket.emit('send-chat-message', { roomId, message });
    }
  };

  const toggleVideo = (roomId, enabled) => {
    if (socket && isConnected) {
      socket.emit('toggle-video', { roomId, enabled });
    }
  };

  const toggleAudio = (roomId, enabled) => {
    if (socket && isConnected) {
      socket.emit('toggle-audio', { roomId, enabled });
    }
  };

  const sendWebRTCOffer = (target, offer) => {
    if (socket && isConnected) {
      socket.emit('webrtc-offer', { target, offer });
    }
  };

  const sendWebRTCAnswer = (target, answer) => {
    if (socket && isConnected) {
      socket.emit('webrtc-answer', { target, answer });
    }
  };

  const sendWebRTCIceCandidate = (target, candidate) => {
    if (socket && isConnected) {
      socket.emit('webrtc-ice-candidate', { target, candidate });
    }
  };

  const value = {
    socket,
    isConnected,
    error,
    joinCourseRoom,
    startLiveSession,
    endLiveSession,
    sendChatMessage,
    toggleVideo,
    toggleAudio,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};