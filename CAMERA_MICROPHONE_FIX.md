# 🎥 Hướng dẫn khắc phục lỗi Camera/Microphone

## ❌ Lỗi thường gặp
```
Không thể truy cập camera/microphone. Lỗi: Cannot read properties of undefined (reading 'getUserMedia')
```

## 🔍 Nguyên nhân
- Trình duyệt chặn truy cập camera/microphone qua HTTP từ các thiết bị khác (không phải localhost)
- Cần HTTPS để truy cập camera/microphone từ mạng LAN

## ✅ Giải pháp

### Bước 1: Tạo SSL Certificate
```bash
# Chạy script tạo certificate
.\generate-ssl-cert.bat
```

### Bước 2: Khởi động server với HTTPS
```bash
# Khởi động với HTTPS
.\start-network-https.bat

# Hoặc restart nếu server đang chạy
.\restart-https.bat
```

### Bước 3: Truy cập qua HTTPS URLs

#### 🏠 Truy cập local:
- Frontend: https://localhost:5173
- Backend: https://localhost:5000

#### 🌐 Truy cập từ thiết bị khác:
- Frontend: https://192.168.1.140:5173 (Ethernet)
- Frontend: https://192.168.2.6:5173 (Wi-Fi)
- Backend: https://192.168.1.140:5000 (Ethernet)
- Backend: https://192.168.2.6:5000 (Wi-Fi)

### Bước 4: Chấp nhận Certificate
1. Lần đầu truy cập, trình duyệt sẽ hiển thị cảnh báo "Not Secure"
2. Click "Advanced" → "Proceed to localhost (unsafe)"
3. Cho phép truy cập camera/microphone khi được hỏi

## 🔧 Troubleshooting

### Lỗi: Certificate không hợp lệ
```bash
# Tạo lại certificate
del ssl\*.pem
.\generate-ssl-cert.bat
```

### Lỗi: Server không khởi động được
```bash
# Kiểm tra port có bị chiếm không
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Kill process nếu cần
taskkill /f /pid [PID_NUMBER]
```

### Lỗi: Không kết nối được từ thiết bị khác
1. Kiểm tra firewall Windows
2. Đảm bảo tất cả thiết bị cùng mạng
3. Sử dụng IP address thay vì hostname

## 📱 Kiểm tra kết nối

### Từ máy local:
- https://localhost:5173 ✅
- https://127.0.0.1:5173 ✅

### Từ thiết bị khác:
- https://[YOUR_IP]:5173 ✅
- Thay [YOUR_IP] bằng IP thực tế (192.168.1.140 hoặc 192.168.2.6)

## 🎯 Kết quả mong đợi
- ✅ Camera/microphone hoạt động trên tất cả thiết bị
- ✅ Kết nối HTTPS an toàn
- ✅ Socket.io kết nối qua WSS (WebSocket Secure)
- ✅ Không còn lỗi getUserMedia

## 📞 Hỗ trợ
Nếu vẫn gặp vấn đề, kiểm tra:
1. Console log trong Developer Tools (F12)
2. Network tab để xem request có thành công không
3. Đảm bảo certificate được tạo đúng trong thư mục `ssl/`