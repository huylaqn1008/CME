// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
 
const connectDB = require("./config/db");
const authRoutes = require("./routes/AuthRoute");
const userRoutes = require("./routes/UserRoute");
const departmentRoutes = require("./routes/DepartmentRoute");
const roleRoutes = require("./routes/RoleRoute");
const courseRoutes = require("./routes/CourseRoute");
const SocketServer = require("./socket/socketServer");

// Load biến môi trường từ .env
dotenv.config();

// Kết nối MongoDB
connectDB();

// Chạy cron để tự động đóng đăng ký
require("./middleware/Scheduler")

const app = express();

// Check for SSL certificates
const sslPath = path.resolve(__dirname, '../ssl');
const certPath = path.join(sslPath, 'cert.pem');
const keyPath = path.join(sslPath, 'key.pem');

let server;
let httpsEnabled = false;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // HTTPS server
  try {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    server = https.createServer(httpsOptions, app);
    httpsEnabled = true;
    console.log('🔒 HTTPS certificates found - enabling HTTPS');
  } catch (error) {
    console.log('⚠️  Error reading SSL certificates, falling back to HTTP:', error.message);
    server = http.createServer(app);
  }
} else {
  // HTTP server
  server = http.createServer(app);
  console.log('⚠️  No HTTPS certificates found - using HTTP');
  console.log('   For camera/mic access from other devices, generate SSL certificates:');
  console.log('   Run: generate-ssl-cert.bat');
}

// Initialize Socket.io server with updated CORS for HTTPS
const socketServer = new SocketServer(server, httpsEnabled);

// Middleware - Cấu hình CORS để cho phép truy cập từ các máy khác với HTTPS
const allowedOrigins = [
  // HTTP origins (fallback)
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.1.140:5173',
  'http://192.168.2.6:5173',
  
  // HTTPS origins (preferred for camera/mic)
  'https://localhost:5173',
  'https://127.0.0.1:5173',
  'https://192.168.1.140:5173',
  'https://192.168.2.6:5173',
  
  // Regex patterns for dynamic IPs
  /^https?:\/\/192\.168\.\d+\.\d+:5173$/,
  /^https?:\/\/10\.\d+\.\d+\.\d+:5173$/,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else {
        return allowed.test(origin);
      }
    })) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.log('🚫 CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Security headers for HTTPS
if (httpsEnabled) {
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// Make socket server available to routes
app.set('socketServer', socketServer);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/courses", courseRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  const protocol = httpsEnabled ? 'HTTPS' : 'HTTP';
  res.json({
    message: `🚀 CME Backend API with Video Call is running on ${protocol}`,
    protocol: protocol.toLowerCase(),
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      roles: '/api/roles',
      courses: '/api/courses',
      liveRooms: '/api/live-rooms'
    }
  });
});

// API endpoint to get live rooms info (for admin)
app.get("/api/live-rooms", (req, res) => {
  const rooms = socketServer.getAllRooms();
  res.json({
    rooms,
    totalRooms: rooms.length,
    totalParticipants: rooms.reduce((sum, room) => sum + room.participantCount, 0)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    availableEndpoints: ['/api/auth', '/api/users', '/api/departments', '/api/roles', '/api/courses']
  });
});

// Khởi động server - Lắng nghe trên tất cả network interfaces
const PORT = process.env.PORT || 5000;
const protocol = httpsEnabled ? 'https' : 'http';

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log(`✅ CME Backend Server Running`);
  console.log('========================================');
  console.log(`Protocol: ${protocol.toUpperCase()}`);
  console.log(`Port: ${PORT}`);
  console.log('\n🌐 Access URLs:');
  console.log(`   Local:    ${protocol}://localhost:${PORT}`);
  console.log(`   Ethernet: ${protocol}://192.168.1.140:${PORT}`);
  console.log(`   Wi-Fi:    ${protocol}://192.168.2.6:${PORT}`);
  
  if (httpsEnabled) {
    console.log('\n🔒 HTTPS Features:');
    console.log('   ✅ Camera/microphone access enabled');
    console.log('   ✅ Secure WebSocket connections');
    console.log('   ✅ SSL/TLS encryption');
  } else {
    console.log('\n⚠️  HTTP Mode:');
    console.log('   ❌ Camera/microphone may be blocked on remote devices');
    console.log('   💡 Run generate-ssl-cert.bat to enable HTTPS');
  }
  
  console.log('\n📡 Socket.io server initialized');
  console.log('🚀 Ready to accept connections');
  console.log('========================================\n');
});