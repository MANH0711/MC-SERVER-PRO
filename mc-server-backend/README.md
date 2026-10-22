# 🏭 MC Server Pro - NestJS gRPC Backend

Hệ thống Backend chuyên dụng cho công nghiệp sản xuất điện tử / cơ khí chính xác, xây dựng trên nền tảng **NestJS (Node.js/TypeScript)**, giao thức truyền tải nhị phân tốc độ cao **gRPC**, quản lý kết nối TCP Socket thiết bị máy và tích hợp hệ thống **Oracle Database** (5 cấu hình TNS).

---

## 🌟 Tính Năng Nổi Bật

1. **Hiệu Năng Cao Với gRPC (HTTP/2 Multiplexing)**:
   - Truyền tải nhị phân Protocol Buffers v3.
   - Hỗ trợ đầy đủ **Server Streaming RPC** cho việc giám sát trạng thái máy (`StreamDeviceStatus`), luồng giao tiếp thời gian thực (`StreamCommunication`), và phát cảnh báo sự cố tức thời (`StreamAlarms`).

2. **Cấu Trúc Thư Mục & Đặt Tên File Trực Quan**:
   - Quy tắc chuẩn: `[MÃ_LỆNH].[TÊN_MÔ_TẢ].[LOẠI_FILE].ts`
   - Phân tách rõ ràng giữa **Lệnh chung (`src/commands/common/Mxxx`)** và **Lệnh riêng theo loại máy**:
     - `src/commands/bake/Bxxx` cho model `IBS_BAKE` (Lò nung sấy buồng nhiệt)
     - `src/commands/bending/Jxxx` cho model `IBS_BENDINGJS` (Máy uốn gấp Jig)
     - SMT Mounter, Laser Marking, AOI Inspector,...

3. **Cơ Sở Dữ Liệu Oracle Đa Môi Trường (5 TNS)**:
   - `ITMDEV`: Máy chủ phát triển dev (`112.160.65.212:1521/MIGHTY`)
   - `ITMMES`: Cơ sở dữ liệu MES chính (`192.168.80.20:1521/ITMMES`)
   - `ITMVMES`: Hệ thống MES High-Availability dự phòng 3 IP (`192.168.35.202-204:1521/ITMVMES`)
   - `ITMSEMIMES`: Phân xưởng bán dẫn (`192.168.35.202:1521/ITMSEMIMES`)
   - `ITMPMES`: Phân xưởng PMES (`192.168.1.18:1521/ITMPMES`)
   - Tự động chuyển đổi sang bộ đệm thông minh In-Memory khi chạy offline tại môi trường local.

4. **Khớp Chuẩn 18 Cột Cấu Hình Thiết Bị**:
   - `PLANT`, `HOST_ADDRESS`, `HOST_PORT`, `DEVICE_ID`, `SERVER_NO`, `EQUIPMENT_ID`, `GROUP_NAME`, `EQUIPMENT_ORDER`, `EQUIPMENT_MAIN`, `DESCRIPTION`, `ENABLE`, `FIELD_01`, `FIELD_02`, `FIELD_03`, `INTERLOCK_RECIPE`, `EQUIPMENT_MODEL`, `INTERLOCK_PARAM`, `INTERLOCK_TRACE`.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài Đặt Thư Viện Phụ Thuộc
```bash
cd mc-server-backend
npm install
```

### 2. Thiết Lập Môi Trường
Sao chép file `.env.example` thành `.env` và cập nhật thông tin tài khoản nếu cần:
```bash
cp .env.example .env
```

### 3. Chạy Server ở Chế Độ Phát Triển (Hot-Reload)
```bash
npm run start:dev
```

### 4. Build Bản Production
```bash
npm run build
npm run start:prod
```

---

## 📁 Tài Liệu Kỹ Thuật Đính Kèm

- [docs/FILE_NAMING_GUIDE.md](docs/FILE_NAMING_GUIDE.md): Hướng dẫn chi tiết quy tắc đặt tên file.
- [docs/MESSAGE_CODE_REFERENCE.md](docs/MESSAGE_CODE_REFERENCE.md): Bảng tra cứu toàn bộ hơn 40 mã lệnh công nghiệp.
- [docs/ORACLE_DATABASE_GUIDE.md](docs/ORACLE_DATABASE_GUIDE.md): Chi tiết cấu hình kết nối Oracle, SQL Schema và Failover.
- [docs/GRPC_API_REFERENCE.md](docs/GRPC_API_REFERENCE.md): Đặc tả API gRPC cho Frontend và các Microservices khác.
