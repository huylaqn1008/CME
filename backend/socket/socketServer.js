const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Course = require("../models/CourseModel");

class SocketServer {
  constructor(server, httpsEnabled = false) {
    // Enhanced CORS configuration for HTTPS support
    const corsOrigins = [
      // HTTP origins (fallback)
      "http://localhost:5173",
      "http://127.0.0.1:5173", 
      "http://192.168.1.140:5173",
      "http://192.168.2.6:5173",
      
      // HTTPS origins (preferred for camera/mic)
      "https://localhost:5173",
      "https://127.0.0.1:5173",
      "https://192.168.1.140:5173",
      "https://192.168.2.6:5173",
      
      // Regex patterns for dynamic IPs
      /^https?:\/\/192\.168\.\d+\.\d+:5173$/,
      /^https?:\/\/10\.\d+\.\d+\.\d+:5173$/,
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/
    ];

    this.io = new Server(server, {
      cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.rooms = new Map(); // Store room information
    this.httpsEnabled = httpsEnabled;
    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log(`📡 Socket.io server initialized with ${httpsEnabled ? 'HTTPS' : 'HTTP'} support`);
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).populate('role_id department_id');
        
        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        socket.user = user;
        console.log(`🔐 Socket authenticated: ${user.full_name} (${user.email})`);
        next();
      } catch (err) {
        console.error('Socket authentication error:', err.message);
        next(new Error("Authentication error: Invalid token"));
      }
    });

    // Connection logging
    this.io.engine.on("connection_error", (err) => {
      console.error("Socket.io connection error:", err.req, err.code, err.message, err.context);
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      const protocol = this.httpsEnabled ? 'HTTPS' : 'HTTP';
      console.log(`👤 User connected via ${protocol}: ${socket.user.full_name} (${socket.user.email})`);

      // Join a course room
      socket.on("join-course-room", async (data) => {
        try {
          const { courseId } = data;
          const course = await Course.findById(courseId);
          
          if (!course) {
            socket.emit("error", { message: "Course not found" });
            return;
          }

          // Check if user is registered for the course or is instructor
          const isRegistered = course.registered_users.includes(socket.user._id);
          const isInstructor = course.created_by.toString() === socket.user._id.toString();
          const isSuperAdmin = socket.user.role_id.name.toLowerCase().includes('super admin');

          if (!isRegistered && !isInstructor && !isSuperAdmin) {
            socket.emit("error", { message: "You are not registered for this course" });
            return;
          }

          const roomId = `course-${courseId}`;
          socket.join(roomId);

          // Initialize room if not exists
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
              courseId,
              participants: new Map(),
              instructor: null,
              isLive: false,
              chatMessages: [],
              createdAt: new Date()
            });
          }

          const room = this.rooms.get(roomId);
          
          // Add participant to room
          room.participants.set(socket.id, {
            userId: socket.user._id,
            name: socket.user.full_name,
            email: socket.user.email,
            role: socket.user.role_id.name,
            isInstructor: isInstructor || isSuperAdmin,
            videoEnabled: false,
            audioEnabled: false,
            screenSharing: false,
            joinedAt: new Date()
          });

          // Set instructor if applicable
          if ((isInstructor || isSuperAdmin) && !room.instructor) {
            room.instructor = socket.id;
          }

          socket.emit("joined-room", {
            roomId,
            participants: Array.from(room.participants.values()),
            isLive: room.isLive,
            chatMessages: room.chatMessages,
            httpsEnabled: this.httpsEnabled
          });

          // Notify others about new participant
          socket.to(roomId).emit("participant-joined", {
            participant: room.participants.get(socket.id)
          });

          console.log(`🏠 ${socket.user.full_name} joined course room: ${roomId} (${room.participants.size} participants)`);
        } catch (error) {
          console.error("Error joining course room:", error);
          socket.emit("error", { message: "Failed to join course room" });
        }
      });

      // Start live session (instructor only)
      socket.on("start-live-session", async (data) => {
        try {
          const { courseId } = data;
          const course = await Course.findById(courseId);
          
          if (!course) {
            socket.emit("error", { message: "Course not found" });
            return;
          }

          const isInstructor = course.created_by.toString() === socket.user._id.toString();
          const isSuperAdmin = socket.user.role_id.name.toLowerCase().includes('super admin');

          if (!isInstructor && !isSuperAdmin) {
            socket.emit("error", { message: "Only instructors can start live sessions" });
            return;
          }

          const roomId = `course-${courseId}`;
          const room = this.rooms.get(roomId);

          if (room) {
            room.isLive = true;
            room.liveStartedAt = new Date();
            
            // Update course in database
            await Course.findByIdAndUpdate(courseId, {
              is_live: true,
              live_started_at: new Date(),
              status: 'live'
            });

            // Notify all participants
            this.io.to(roomId).emit("live-session-started", {
              instructor: room.participants.get(socket.id),
              startedAt: room.liveStartedAt
            });

            console.log(`🔴 Live session started for course: ${courseId} by ${socket.user.full_name}`);
          }
        } catch (error) {
          console.error("Error starting live session:", error);
          socket.emit("error", { message: "Failed to start live session" });
        }
      });

      // End live session (instructor only)
      socket.on("end-live-session", async (data) => {
        try {
          const { courseId } = data;
          const course = await Course.findById(courseId);
          
          if (!course) {
            socket.emit("error", { message: "Course not found" });
            return;
          }

          const isInstructor = course.created_by.toString() === socket.user._id.toString();
          const isSuperAdmin = socket.user.role_id.name.toLowerCase().includes('super admin');

          if (!isInstructor && !isSuperAdmin) {
            socket.emit("error", { message: "Only instructors can end live sessions" });
            return;
          }

          const roomId = `course-${courseId}`;
          const room = this.rooms.get(roomId);

          if (room) {
            room.isLive = false;
            room.liveEndedAt = new Date();
            
            // Update course in database
            await Course.findByIdAndUpdate(courseId, {
              is_live: false,
              live_ended_at: new Date(),
              status: 'completed'
            });

            // Notify all participants
            this.io.to(roomId).emit("live-session-ended", {
              endedAt: room.liveEndedAt
            });

            console.log(`⏹️ Live session ended for course: ${courseId} by ${socket.user.full_name}`);
          }
        } catch (error) {
          console.error("Error ending live session:", error);
          socket.emit("error", { message: "Failed to end live session" });
        }
      });

      // Enhanced WebRTC signaling with error handling
      socket.on("webrtc-offer", (data) => {
        try {
          socket.to(data.target).emit("webrtc-offer", {
            offer: data.offer,
            sender: socket.id,
            senderName: socket.user.full_name
          });
          console.log(`📞 WebRTC offer sent from ${socket.user.full_name} to ${data.target}`);
        } catch (error) {
          console.error("Error handling WebRTC offer:", error);
          socket.emit("error", { message: "Failed to send WebRTC offer" });
        }
      });

      socket.on("webrtc-answer", (data) => {
        try {
          socket.to(data.target).emit("webrtc-answer", {
            answer: data.answer,
            sender: socket.id,
            senderName: socket.user.full_name
          });
          console.log(`📞 WebRTC answer sent from ${socket.user.full_name} to ${data.target}`);
        } catch (error) {
          console.error("Error handling WebRTC answer:", error);
          socket.emit("error", { message: "Failed to send WebRTC answer" });
        }
      });

      socket.on("webrtc-ice-candidate", (data) => {
        try {
          socket.to(data.target).emit("webrtc-ice-candidate", {
            candidate: data.candidate,
            sender: socket.id,
            senderName: socket.user.full_name
          });
        } catch (error) {
          console.error("Error handling ICE candidate:", error);
        }
      });

      // Enhanced chat messages with validation
      socket.on("send-chat-message", (data) => {
        try {
          const { roomId, message } = data;
          
          if (!message || message.trim().length === 0) {
            socket.emit("error", { message: "Message cannot be empty" });
            return;
          }

          if (message.length > 1000) {
            socket.emit("error", { message: "Message too long (max 1000 characters)" });
            return;
          }

          const room = this.rooms.get(roomId);
          
          if (room && room.participants.has(socket.id)) {
            const chatMessage = {
              id: Date.now() + Math.random(),
              userId: socket.user._id,
              name: socket.user.full_name,
              message: message.trim(),
              timestamp: new Date(),
              role: socket.user.role_id.name
            };
            
            room.chatMessages.push(chatMessage);
            
            // Keep only last 100 messages to prevent memory issues
            if (room.chatMessages.length > 100) {
              room.chatMessages = room.chatMessages.slice(-100);
            }
            
            // Broadcast to all participants in the room
            this.io.to(roomId).emit("new-chat-message", chatMessage);
            
            console.log(`💬 Chat message from ${socket.user.full_name} in ${roomId}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
          } else {
            socket.emit("error", { message: "You are not in this room" });
          }
        } catch (error) {
          console.error("Error handling chat message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Enhanced media controls with room validation
      socket.on("toggle-video", (data) => {
        try {
          const { roomId, enabled } = data;
          const room = this.rooms.get(roomId);
          
          if (room && room.participants.has(socket.id)) {
            room.participants.get(socket.id).videoEnabled = enabled;
            socket.to(roomId).emit("participant-video-toggled", {
              participantId: socket.id,
              participantName: socket.user.full_name,
              enabled
            });
            console.log(`📹 ${socket.user.full_name} ${enabled ? 'enabled' : 'disabled'} video in ${roomId}`);
          }
        } catch (error) {
          console.error("Error toggling video:", error);
        }
      });

      socket.on("toggle-audio", (data) => {
        try {
          const { roomId, enabled } = data;
          const room = this.rooms.get(roomId);
          
          if (room && room.participants.has(socket.id)) {
            room.participants.get(socket.id).audioEnabled = enabled;
            socket.to(roomId).emit("participant-audio-toggled", {
              participantId: socket.id,
              participantName: socket.user.full_name,
              enabled
            });
            console.log(`🎤 ${socket.user.full_name} ${enabled ? 'enabled' : 'disabled'} audio in ${roomId}`);
          }
        } catch (error) {
          console.error("Error toggling audio:", error);
        }
      });

      // Handle disconnection with enhanced cleanup
      socket.on("disconnect", (reason) => {
        console.log(`👋 User disconnected: ${socket.user.full_name} (Reason: ${reason})`);
        
        // Remove from all rooms
        for (const [roomId, room] of this.rooms.entries()) {
          if (room.participants.has(socket.id)) {
            const participant = room.participants.get(socket.id);
            room.participants.delete(socket.id);
            
            // If instructor disconnected, end live session
            if (room.instructor === socket.id && room.isLive) {
              room.isLive = false;
              room.liveEndedAt = new Date();
              this.io.to(roomId).emit("live-session-ended", {
                reason: "Instructor disconnected",
                endedAt: room.liveEndedAt
              });
              console.log(`⏹️ Live session auto-ended due to instructor disconnect: ${roomId}`);
            }
            
            // Notify others about participant leaving
            socket.to(roomId).emit("participant-left", {
              participantId: socket.id,
              participant,
              reason: reason
            });
            
            console.log(`🏠 ${socket.user.full_name} left room: ${roomId} (${room.participants.size} participants remaining)`);
            
            // Clean up empty rooms
            if (room.participants.size === 0) {
              this.rooms.delete(roomId);
              console.log(`🗑️ Empty room cleaned up: ${roomId}`);
            }
          }
        }
      });

      // Handle connection errors
      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.user.full_name}:`, error);
      });
    });
  }

  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    return {
      ...room,
      participants: Array.from(room.participants.values()),
      participantCount: room.participants.size
    };
  }

  getAllRooms() {
    return Array.from(this.rooms.entries()).map(([roomId, room]) => ({
      roomId,
      courseId: room.courseId,
      participantCount: room.participants.size,
      isLive: room.isLive,
      createdAt: room.createdAt,
      liveStartedAt: room.liveStartedAt,
      instructor: room.instructor ? room.participants.get(room.instructor)?.name : null,
      httpsEnabled: this.httpsEnabled
    }));
  }

  // Get server statistics
  getServerStats() {
    const totalRooms = this.rooms.size;
    const totalParticipants = Array.from(this.rooms.values())
      .reduce((sum, room) => sum + room.participants.size, 0);
    const liveRooms = Array.from(this.rooms.values())
      .filter(room => room.isLive).length;

    return {
      totalRooms,
      totalParticipants,
      liveRooms,
      httpsEnabled: this.httpsEnabled,
      connectedSockets: this.io.engine.clientsCount
    };
  }
}

module.exports = SocketServer;