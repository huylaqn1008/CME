# 🔒 Hướng dẫn thiết lập HTTPS cho CME System

## 📋 Tổng quan
Hướng dẫn này giúp bạn thiết lập HTTPS để camera/microphone hoạt động trên tất cả các máy trong mạng.

## 🚨 Vấn đề với HTTP
Khi truy cập từ các máy khác qua HTTP, trình duyệt sẽ **block camera/microphone** vì lý do bảo mật. Chỉ có HTTPS mới cho phép truy cập đầy đủ các thiết bị media.

## 🔧 Giải pháp HTTPS

### Bước 1: Tạo SSL Certificate
```bash
# Chạy script tự động tạo certificate
generate-ssl-cert.bat
```

Script này sẽ:
- Tự động cài đặt mkcert (nếu chưa có)
- Tạo certificate cho tất cả IP addresses của bạn
- Cấu hình certificate cho local network

### Bước 2: Khởi động với HTTPS
```bash
# Khởi động hệ thống với HTTPS
start-network-https.bat
```

## 🌐 URL truy cập sau khi setup HTTPS

### 📱 Truy cập Local:
- **Frontend**: `https://localhost:5173`
- **Backend**: `https://localhost:5000`

### 🌐 Truy cập từ máy khác:
#### Mạng Ethernet:
- **Frontend**: `https://192.168.1.140:5173`
- **Backend**: `https://192.168.1.140:5000`

#### Mạng Wi-Fi:
- **Frontend**: `https://192.168.2.6:5173`
- **Backend**: `https://192.168.2.6:5000`

## ✅ Lợi ích của HTTPS

### 🔒 Bảo mật:
- ✅ Camera/microphone hoạt động trên tất cả thiết bị
- ✅ Kết nối được mã hóa SSL/TLS
- ✅ Không bị browser block media devices
- ✅ WebSocket connections an toàn

### 🎥 Tính năng Media:
- ✅ Camera access từ mọi máy trong mạng
- ✅ Microphone access không bị chặn
- ✅ Screen sharing hoạt động mượt mà
- ✅ WebRTC connections ổn định

## 🛠️ Cấu hình đã được cập nhật

### 1. Backend Server (`backend/server.js`)
```javascript
// Tự động phát hiện và sử dụng SSL certificates
const httpsOptions = {
  key: fs.readFileSync('ssl/key.pem'),
  cert: fs.readFileSync('ssl/cert.pem')
};
server = https.createServer(httpsOptions, app);
```

### 2. Frontend Vite (`frontend/vite.config.js`)
```javascript
// Tự động enable HTTPS nếu có certificates
const httpsConfig = fs.existsSync(certPath) && fs.existsSync(keyPath) ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
} : false
```

### 3. Socket.io Configuration
```javascript
// Enhanced CORS cho HTTPS
const corsOrigins = [
  "https://localhost:5173",
  "https://192.168.1.140:5173", 
  "https://192.168.2.6:5173",
  // ... và các IP patterns khác
];
```

## 🔍 Kiểm tra trạng thái HTTPS

### Trong ứng dụng:
- Kiểm tra status indicator: `🔒 HTTPS` (xanh) hoặc `⚠️ HTTP` (vàng)
- Console log sẽ hiển thị: `🔒 HTTPS enabled - Camera/microphone access available`

### Trong browser:
- URL bar hiển thị `https://` với biểu tượng khóa
- Không có cảnh báo "Not Secure"

## 🚨 Troubleshooting

### Vấn đề: Certificate không được tạo
**Giải pháp**:
1. Chạy PowerShell as Administrator
2. Chạy lại `generate-ssl-cert.bat`
3. Kiểm tra folder `ssl/` có files `cert.pem` và `key.pem`

### Vấn đề: Browser hiển thị "Not Secure"
**Giải pháp**:
1. Click "Advanced" → "Proceed to site"
2. Hoặc thêm exception trong browser settings
3. Certificate sẽ được trust sau lần đầu

### Vấn đề: Camera vẫn bị block
**Kiểm tra**:
1. Đảm bảo đang truy cập qua `https://` (không phải `http://`)
2. Kiểm tra browser permissions cho camera/mic
3. Refresh trang và cho phép access khi được hỏi

### Vấn đề: Không kết nối được từ máy khác
**Giải pháp**:
1. Kiểm tra firewall (chạy `setup-firewall.bat`)
2. Đảm bảo tất cả máy cùng mạng
3. Thử ping IP address trước

## 📊 So sánh HTTP vs HTTPS

| Tính năng | HTTP | HTTPS |
|-----------|------|-------|
| Camera access (localhost) | ✅ | ✅ |
| Camera access (remote) | ❌ | ✅ |
| Microphone access (localhost) | ✅ | ✅ |
| Microphone access (remote) | ❌ | ✅ |
| Screen sharing | ⚠️ | ✅ |
| WebRTC connections | ⚠️ | ✅ |
| Browser security warnings | ❌ | ✅ |
| Data encryption | ❌ | ✅ |

## 🔄 Quy trình hoàn chỉnh

### Lần đầu setup:
1. `generate-ssl-cert.bat` (chỉ cần chạy 1 lần)
2. `setup-firewall.bat` (chỉ cần chạy 1 lần)
3. `start-network-https.bat` (mỗi lần khởi động)

### Các lần sau:
1. `start-network-https.bat` (mỗi lần khởi động)

## 📱 Hỗ trợ thiết bị

### ✅ Hoạt động hoàn hảo với HTTPS:
- Windows computers (Chrome, Edge, Firefox)
- Mac computers (Safari, Chrome, Firefox)
- Android devices (Chrome, Samsung Browser)
- iOS devices (Safari, Chrome)
- Linux computers (Chrome, Firefox)

### ⚠️ Lưu ý:
- Certificate chỉ hoạt động trong mạng local
- Để deploy production cần domain name và certificate từ CA

## 🔒 Bảo mật

### Certificate được tạo cho:
- `localhost` và `127.0.0.1`
- IP Ethernet: `192.168.1.140`
- IP Wi-Fi: `192.168.2.6`
- IPv6 localhost: `::1`

### Chỉ tin cậy trong mạng nội bộ:
- Certificate chỉ valid cho các IP được chỉ định
- Không expose ra internet mà không có bảo mật bổ sung
- Sử dụng mkcert để tạo local CA

---

**🎯 Kết quả**: Sau khi setup HTTPS, camera/microphone sẽ hoạt động trên **TẤT CẢ** các máy trong mạng, không còn bị browser block!