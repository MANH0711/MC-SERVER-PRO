# MC SERVER ENTERPRISE - DEPLOYMENT & OPERATION GUIDE

## 1. Yêu cầu Hệ thống (System Requirements)
- **Hệ điều hành**: Windows 10/11 Enterprise LTSC hoặc Windows Server 2019/2022 (x64).
- **Phần cứng**: Intel Core i5/i7 8th Gen trở lên, tối thiểu 8GB RAM (khuyến nghị 16GB), SSD NVMe cho lưu trữ log tốc độ cao.
- **Node.js**: v18.x - v22.x LTS (Khuyến nghị Node.js v20+).
- **Oracle Client**: Oracle Instant Client 12.2.0 (hoặc 11g/19c) 64-bit cài đặt tại đường dẫn:
  `C:\app\client\IT2-LAP-007\product\12.2.0\client_2\bin` (hoặc cấu hình qua biến môi trường `ORACLE_CLIENT_PATH`).
- **Mạng**: 2 cổng mạng Ethernet chuyên dụng (Dual NIC):
  - NIC 1 (OT Network): Kết nối mạng nội bộ phân xưởng máy sản xuất (VLAN Thiết bị, IP tĩnh không ra Internet).
  - NIC 2 (IT/MES Network): Kết nối hạ tầng mạng nhà máy lên Oracle MES/ERP.

---

## 2. Kiến Trúc Hai Tầng (Dual-Tier Services)
Hệ thống gồm 2 dịch vụ độc lập:
1. **Backend Service (`mc-server-backend`)**:
   - HTTP REST API & SSE Server: Port `3005`
   - TCP Socket Server (Equipment connections): Port `5000`
   - gRPC Server: Port `50051`
2. **Frontend Service (`mc-server-frontend`)**:
   - Web GUI Dashboard: Port `3000` (hoặc `3002` nếu 3000 bị chiếm dụng)

---

## 3. Các Bước Triển Khai Chi Tiết

### Bước 1: Cấu hình Môi trường Backend (`mc-server-backend/.env`)
```bash
PORT=3005
TCP_SERVER_PORT=5000
GRPC_PORT=50051
ORACLE_DEFAULT_TNS=ITMVMES
ORACLE_CLIENT_PATH=C:\app\client\IT2-LAP-007\product\12.2.0\client_2\bin
ORACLE_ITMVMES_HOST=192.168.35.202
ORACLE_ITMVMES_PORT=1521
ORACLE_ITMVMES_SERVICE=ITMVMES
ORACLE_ITMVMES_USER=mighty
ORACLE_ITMVMES_PASSWORD=mighty
```

### Bước 2: Cài Đặt Phụ Thuộc & Biên Dịch Backend
```bash
cd mc-server-backend
npm install
npm run build
```

### Bước 3: Cài Đặt & Biên Dịch Frontend với Code-Splitting
```bash
cd .. # Thư mục gốc MC-SERVER-PRO-main
npm install
npm run build
```
*Lệnh build tự động phân tách các gói chunk nhỏ cho từng phân hệ nghiệp vụ dưới thư mục `dist/assets/`, giảm kích thước file nạp đầu tiên xuống dưới 400 kB.*

### Bước 4: Khởi Chạy Dịch Vụ
- **Khởi chạy Backend (Production Daemon)**:
  ```bash
  cd mc-server-backend
  node dist/main.js
  ```
- **Khởi chạy Frontend Dev Server hoặc Web Server**:
  ```bash
  npm run dev # Hoặc serve bản build production bằng nginx/pm2
  ```

---

## 4. Thiết Lập Quy Tắc Windows Firewall
- **TCP Inbound Port `5000`**: Cho phép tất cả các máy trạm sản xuất (Wire Bond, Die Attach, Reflow, SMT) kết nối gửi bản tin.
- **TCP Inbound Port `3005`, `3000`, `3002`**: Cho phép máy tính kỹ sư và màn hình giám sát truy cập giao diện điều hành.
- **TCP Outbound Port `1521`**: Cho phép backend kết nối đến cơ sở dữ liệu Oracle MES (`192.168.35.202`, `192.168.80.20`, `112.160.65.212`).
