import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import apiClient from "../../config/api";
import './LiveClassroom.css';

const LiveClassroom = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected, joinCourseRoom, startLiveSession, endLiveSession, sendChatMessage } = useSocket();
  
  // State management
  const [courseInfo, setCourseInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Video/Audio controls
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [httpsEnabled, setHttpsEnabled] = useState(false);
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  
  // Video refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideosRef = useRef({});
  const chatMessagesRef = useRef(null);
  
  // Layout
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'speaker'

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Fetch course info and join room
  useEffect(() => {
    const fetchCourseInfo = async () => {
      try {
        const response = await apiClient.get(`/api/courses/${courseId}/live-info`);
        
        setCourseInfo(response.data);
        setUserRole(response.data.user_role);
        setIsLive(response.data.is_live);
        setLoading(false);
        
        // Join the course room via socket
        if (isConnected) {
          joinCourseRoom(courseId);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải thông tin khóa học');
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseInfo();
    }
  }, [courseId, isConnected, joinCourseRoom]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = (data) => {
      setParticipants(data.participants);
      setIsLive(data.isLive);
      setChatMessages(data.chatMessages || []);
      setHttpsEnabled(data.httpsEnabled || false);
      
      // Show HTTPS status message
      if (data.httpsEnabled) {
        console.log('🔒 HTTPS enabled - Camera/microphone access available');
      } else {
        console.log('⚠️ HTTP mode - Camera/microphone may be blocked on remote devices');
      }
    };

    const handleParticipantJoined = (data) => {
      setParticipants(prev => [...prev, data.participant]);
    };

    const handleParticipantLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.participant.userId));
    };

    const handleLiveSessionStarted = () => {
      setIsLive(true);
    };

    const handleLiveSessionEnded = () => {
      setIsLive(false);
    };

    const handleNewChatMessage = (message) => {
      setChatMessages(prev => [...prev, message]);
    };

    socket.on('joined-room', handleJoinedRoom);
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('live-session-started', handleLiveSessionStarted);
    socket.on('live-session-ended', handleLiveSessionEnded);
    socket.on('new-chat-message', handleNewChatMessage);

    return () => {
      socket.off('joined-room', handleJoinedRoom);
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('live-session-started', handleLiveSessionStarted);
      socket.off('live-session-ended', handleLiveSessionEnded);
      socket.off('new-chat-message', handleNewChatMessage);
    };
  }, [socket]);

  // Initialize local media with HTTPS detection
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log('🎥 Initializing media devices...');
        
        // Check if we're on HTTPS
        const isSecure = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        console.log(`🔒 Connection: ${isSecure ? 'HTTPS (Secure)' : 'HTTP (Insecure)'}`);
        console.log(`🏠 Location: ${isLocalhost ? 'Localhost' : 'Remote Device'}`);
        
        // Show warning for HTTP on remote devices
        if (!isSecure && !isLocalhost) {
          const httpsUrl = `https://${window.location.hostname}:5173${window.location.pathname}`;
          setError(`⚠️ Để sử dụng camera/microphone, vui lòng truy cập qua HTTPS: ${httpsUrl}`);
          console.warn('⚠️ Camera/microphone may be blocked on HTTP from remote devices');
          return;
        }
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia không được hỗ trợ trên trình duyệt này');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        console.log('✅ Media stream obtained:', stream);
        console.log('Video tracks:', stream.getVideoTracks());
        console.log('Audio tracks:', stream.getAudioTracks());
        
        localStreamRef.current = stream;
        
        // Force video to load and play
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          
          localVideoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded');
            localVideoRef.current.play().catch(err => {
              console.error('Error playing video:', err);
            });
          };
        }
        
        // Initially disable tracks but keep them available
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
          console.log('🔇 Audio track disabled initially');
        });
        
        stream.getVideoTracks().forEach(track => {
          track.enabled = false;
          console.log('📷 Video track disabled initially');
        });
        
        setMediaInitialized(true);
        setError(null); // Clear any previous errors
        console.log('✅ Media initialization complete');
        
      } catch (err) {
        console.error('❌ Error accessing media devices:', err);
        
        let errorMessage = 'Không thể truy cập camera/microphone.';
        
        if (err.name === 'NotAllowedError') {
          errorMessage += ' Vui lòng cho phép truy cập thiết bị và refresh trang.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += ' Không tìm thấy camera/microphone.';
        } else if (err.name === 'NotSecureError' || err.message.includes('secure')) {
          const httpsUrl = `https://${window.location.hostname}:5173${window.location.pathname}`;
          errorMessage += ` Cần HTTPS để truy cập từ máy khác. Vui lòng truy cập: ${httpsUrl}`;
        } else if (err.message.includes('getUserMedia')) {
          const isSecure = window.location.protocol === 'https:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (!isSecure && !isLocalhost) {
            const httpsUrl = `https://${window.location.hostname}:5173${window.location.pathname}`;
            errorMessage = `🔒 Cần HTTPS để sử dụng camera/microphone từ thiết bị khác. Vui lòng truy cập: ${httpsUrl}`;
          } else {
            errorMessage += ` Lỗi: ${err.message}`;
          }
        } else {
          errorMessage += ` Lỗi: ${err.message}`;
        }
        
        setError(errorMessage);
      }
    };

    initializeMedia();

    return () => {
      if (localStreamRef.current) {
        console.log('🛑 Cleaning up media stream');
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, []);

  // Control functions
  const toggleVideo = () => {
    if (!localStreamRef.current) {
      console.error('No local stream available');
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !videoTrack.enabled;
      videoTrack.enabled = newState;
      setIsVideoEnabled(newState);
      
      console.log(`📹 Video ${newState ? 'enabled' : 'disabled'}`);
      
      // Force video element to update
      if (localVideoRef.current && newState) {
        localVideoRef.current.play().catch(err => {
          console.error('Error playing video after toggle:', err);
        });
      }
    } else {
      console.error('No video track found');
    }
  };

  const toggleAudio = () => {
    if (!localStreamRef.current) {
      console.error('No local stream available');
      return;
    }

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const newState = !audioTrack.enabled;
      audioTrack.enabled = newState;
      setIsAudioEnabled(newState);
      
      console.log(`🎤 Audio ${newState ? 'enabled' : 'disabled'}`);
    } else {
      console.error('No audio track found');
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        console.log('🖥️ Starting screen share...');
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: true
        });
        
        console.log('✅ Screen share stream obtained');
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(err => {
            console.error('Error playing screen share:', err);
          });
        }
        
        setIsScreenSharing(true);
        setIsVideoEnabled(true);
        
        const videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = async () => {
          console.log('🛑 Screen share ended');
          setIsScreenSharing(false);
          
          try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: false 
            });
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = cameraStream;
            }
            
            if (localStreamRef.current) {
              const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
              if (oldVideoTrack) {
                localStreamRef.current.removeTrack(oldVideoTrack);
              }
              localStreamRef.current.addTrack(cameraStream.getVideoTracks()[0]);
            }
            
            setIsVideoEnabled(false);
          } catch (err) {
            console.error('Error restoring camera:', err);
          }
        };
      } else {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = cameraStream;
          }
          
          setIsScreenSharing(false);
          setIsVideoEnabled(false);
        } catch (err) {
          console.error('Error restoring camera:', err);
        }
      }
    } catch (err) {
      console.error('❌ Error with screen sharing:', err);
      alert('Không thể chia sẻ màn hình. Vui lòng thử lại.');
    }
  };

  const handleStartLive = async () => {
    try {
      await apiClient.post(`/api/courses/${courseId}/start-live`, {});
      startLiveSession(courseId);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể bắt đầu buổi học');
    }
  };

  const handleEndLive = async () => {
    if (window.confirm('Bạn có chắc chắn muốn kết thúc buổi học?')) {
      try {
        await apiClient.post(`/api/courses/${courseId}/end-live`, {});
        endLiveSession(courseId);
      } catch (err) {
        alert(err.response?.data?.message || 'Không thể kết thúc buổi học');
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      sendChatMessage(`course-${courseId}`, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleLeaveMeeting = () => {
    if (window.confirm('Bạn có chắc chắn muốn rời khỏi phòng học?')) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      navigate('/user/courses');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.full_name || user.name || 'User';
      }
      return 'User';
    } catch {
      return 'User';
    }
  };

  if (loading) {
    return (
      <div className="live-classroom-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải phòng học...</p>
      </div>
    );
  }

  if (error) {
    const isSecure = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    return (
      <div className="live-classroom-error">
        <div className="error-content">
          <h2>❌ Lỗi</h2>
          <p>{error}</p>
          
          {/* HTTPS Instructions */}
          {!isSecure && !isLocalhost && (
            <div className="https-instructions">
              <h3>🔒 Để sử dụng camera/microphone:</h3>
              <div className="instruction-steps">
                <p><strong>Bước 1:</strong> Chạy <code>generate-ssl-cert.bat</code> để tạo SSL certificate</p>
                <p><strong>Bước 2:</strong> Sử dụng <code>start-network-https.bat</code> để khởi động HTTPS</p>
                <p><strong>Bước 3:</strong> Truy cập qua HTTPS URL:</p>
                <div className="https-urls">
                  <p>🌐 <strong>HTTPS URL:</strong> <code>https://{window.location.hostname}:5173{window.location.pathname}</code></p>
                </div>
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          <div className="connection-status">
            <p><strong>Trạng thái kết nối:</strong></p>
            <ul>
              <li>Protocol: {isSecure ? '🔒 HTTPS (Secure)' : '⚠️ HTTP (Insecure)'}</li>
              <li>Device: {isLocalhost ? '🏠 Localhost' : '🌐 Remote Device'}</li>
              <li>Socket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</li>
            </ul>
          </div>
          
          <button onClick={() => navigate('/user/courses')} className="back-btn">
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-classroom">
      {/* Header */}
      <div className="classroom-header">
        <div className="course-info">
          <h1>{courseInfo?.title}</h1>
          <div className="status-indicators">
            <span className={`live-status ${isLive ? 'live' : 'waiting'}`}>
              {isLive ? '🔴 ĐANG LIVE' : '⏸️ CHƯA BẮT ĐẦU'}
            </span>
            <span className={`connection-status ${window.location.protocol === 'https:' ? 'secure' : 'insecure'}`}>
              {window.location.protocol === 'https:' ? '🔒 HTTPS' : '⚠️ HTTP'}
            </span>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="participant-count">
            👥 {participants.length + 1} người tham gia
          </div>
          
          {userRole === 'instructor' && (
            <div className="instructor-controls">
              {!isLive ? (
                <button onClick={handleStartLive} className="start-live-btn">
                  🎥 Bắt đầu Live
                </button>
              ) : (
                <button onClick={handleEndLive} className="end-live-btn">
                  ⏹️ Kết thúc Live
                </button>
              )}
            </div>
          )}
          
          <button onClick={handleLeaveMeeting} className="leave-btn">
            🚪 Rời khỏi
          </button>
        </div>
      </div>

      {/* HTTPS Warning Banner */}
      {window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
        <div className="https-warning-banner">
          <span>⚠️ HTTP mode - Camera/microphone có thể bị chặn. </span>
          <span>Sử dụng HTTPS để truy cập đầy đủ tính năng: </span>
          <code>https://{window.location.hostname}:5173{window.location.pathname}</code>
        </div>
      )}

      {/* Main Content */}
      <div className="classroom-content">
        {/* Video Area */}
        <div className={`video-area ${showChat ? 'with-chat' : 'full-width'}`}>
          {/* View Mode Controls */}
          <div className="view-controls">
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
            >
              ⊞ Lưới
            </button>
            <button 
              className={viewMode === 'speaker' ? 'active' : ''} 
              onClick={() => setViewMode('speaker')}
            >
              👤 Diễn giả
            </button>
          </div>

          {/* Video Grid */}
          <div className={`video-grid ${viewMode}`}>
            {/* Local Video */}
            <div className="video-container local">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`video-element ${(!isVideoEnabled && !isScreenSharing) ? 'video-hidden' : ''}`}
              />
              {(!isVideoEnabled && !isScreenSharing) && (
                <div className="video-placeholder">
                  <div className="avatar">
                    {getUserName().charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="video-overlay">
                <span className="participant-name">
                  Bạn {isScreenSharing && '(Đang chia sẻ màn hình)'}
                </span>
                <div className="video-status">
                  {!isVideoEnabled && !isScreenSharing && <span className="video-off-icon">📹</span>}
                  {!isAudioEnabled && <span className="audio-off-icon">🔇</span>}
                  {!mediaInitialized && <span className="loading-icon">⏳</span>}
                  {window.location.protocol === 'https:' && <span className="secure-icon">🔒</span>}
                </div>
              </div>
            </div>

            {/* Remote Videos */}
            {participants.map((participant) => (
              <div key={participant.userId} className="video-container remote">
                <div className="video-placeholder">
                  <div className="avatar">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="video-overlay">
                  <span className="participant-name">
                    {participant.name}
                    {participant.isInstructor && <span className="instructor-badge">👨‍🏫</span>}
                  </span>
                  <div className="video-status">
                    {!participant.videoEnabled && <span className="video-off-icon">📹</span>}
                    {!participant.audioEnabled && <span className="audio-off-icon">🔇</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state when no participants */}
            {participants.length === 0 && (
              <div className="video-container">
                <div className="video-placeholder">
                  <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
                    <p>Chờ người tham gia khác...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="chat-panel">
            <div className="chat-header">
              <h3>💬 Trò chuyện</h3>
              <button onClick={() => setShowChat(false)} className="close-chat">
                ✕
              </button>
            </div>
            
            <div className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9aa0a6', padding: '20px' }}>
                  <p>Chưa có tin nhắn nào</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="chat-message">
                    <div className="message-header">
                      <span className="sender-name">{message.name}</span>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="message-content">{message.message}</div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={!isConnected}
                maxLength={1000}
              />
              <button type="submit" disabled={!newMessage.trim() || !isConnected}>
                📤
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <div className="media-controls">
          <button 
            onClick={toggleAudio} 
            className={`control-btn ${isAudioEnabled ? 'active' : 'muted'}`}
            title={isAudioEnabled ? 'Tắt mic' : 'Bật mic'}
            disabled={!mediaInitialized}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>
          
          <button 
            onClick={toggleVideo} 
            className={`control-btn ${isVideoEnabled ? 'active' : 'disabled'}`}
            title={isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
            disabled={!mediaInitialized}
          >
            {isVideoEnabled ? '📹' : '📷'}
          </button>
          
          {userRole === 'instructor' && (
            <button 
              onClick={toggleScreenShare} 
              className={`control-btn ${isScreenSharing ? 'active' : ''}`}
              title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
              disabled={!mediaInitialized}
            >
              {isScreenSharing ? '🛑' : '🖥️'}
            </button>
          )}
        </div>

        <div className="secondary-controls">
          {!showChat && (
            <button onClick={() => setShowChat(true)} className="control-btn">
              💬 Chat
            </button>
          )}
          
          <button 
            className="control-btn" 
            title={`Kết nối: ${isConnected ? 'Đã kết nối' : 'Mất kết nối'} | Media: ${mediaInitialized ? 'Đã khởi tạo' : 'Đang khởi tạo'} | ${window.location.protocol === 'https:' ? 'HTTPS' : 'HTTP'}`}
            onClick={() => {
              const isSecure = window.location.protocol === 'https:';
              const status = `Trạng thái kết nối: ${isConnected ? 'Đã kết nối' : 'Mất kết nối'}\nMedia: ${mediaInitialized ? 'Đã khởi tạo' : 'Đang khởi tạo'}\nBảo mật: ${isSecure ? 'HTTPS (Secure)' : 'HTTP (Insecure)'}\nThiết bị: ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'Localhost' : 'Remote Device'}`;
              alert(status);
            }}
          >
            {isConnected ? (window.location.protocol === 'https:' ? '🟢🔒' : '🟡⚠️') : '🔴'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveClassroom;