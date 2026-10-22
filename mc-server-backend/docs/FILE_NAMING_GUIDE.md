# 📂 FILE NAMING GUIDE - Hướng Dẫn Quy Tắc Đặt Tên File

## Mục Đích
Giúp lập trình viên **tìm kiếm nhanh** bất kỳ handler/service nào chỉ bằng cách nhìn tên file,
không cần mở file hay đọc code bên trong.

---

## 1. Quy Tắc Chung

### Công thức đặt tên:
```
[MÃ_LỆNH].[TÊN_MÔ_TẢ_CHỨC_NĂNG].[LOẠI_FILE].ts
```

### Bảng giải thích thành phần:

| Thành phần | Quy tắc | Ví dụ |
|-----------|---------|-------|
| **Mã lệnh** | Prefix viết HOA, lấy từ message code protocol | `M001`, `S005`, `B001`, `SMT003` |
| **Tên mô tả** | Viết kebab-case (chữ-thường-nối-gạch), mô tả ngắn gọn chức năng | `heartbeat`, `move-in`, `feeder-status` |
| **Loại file** | Hậu tố NestJS chuẩn | `.handler`, `.service`, `.module`, `.controller`, `.dto` |

---

## 2. Tiền Tố Mã Lệnh Theo Nhóm

| Tiền tố | Thiết bị | Ý nghĩa |
|---------|---------|---------|
| `M___` | **Tất cả** | Lệnh hệ thống chung (Machine-level) |
| `S___` | **Tất cả** | Lệnh sản xuất chung (Station-level) |
| `B___` | **Bake Oven** | Lệnh riêng máy nung/sấy |
| `BD___` | **Bending** | Lệnh riêng máy uốn |
| `SMT___` | **SMT Mounter** | Lệnh riêng máy gắn chip |
| `RF___` | **Reflow Oven** | Lệnh riêng lò hàn reflow |
| `INS___` | **SPI/AOI** | Lệnh riêng máy kiểm tra quang học |
| `ICT___` | **ICT Tester** | Lệnh riêng máy test điện |
| `LSR___` | **Laser Marker** | Lệnh riêng máy khắc laser |

---

## 3. Loại File (Suffixes)

| Hậu tố | Vai trò | Khi nào dùng |
|--------|---------|-------------|
| `.handler.ts` | Xử lý 1 message code cụ thể | Mỗi lệnh M001, S005, B001... |
| `.service.ts` | Logic nghiệp vụ chung | Service tổng hợp cho 1 nhóm |
| `.module.ts` | Module NestJS | Đăng ký providers & exports |
| `.controller.ts` | gRPC Controller | Expose API qua gRPC |
| `.dto.ts` | Data Transfer Object | Chuẩn hóa dữ liệu vào/ra |
| `.constants.ts` | Hằng số | Định nghĩa threshold, code, enum |
| `.interface.ts` | TypeScript Interface | Contract / base type |
| `.interceptor.ts` | NestJS Interceptor | Middleware (logging, auth...) |
| `.proto` | Protocol Buffer | gRPC service definition |
| `.config.ts` | Cấu hình | Env, connection, options |

---

## 4. Ví Dụ Cụ Thể

### Lệnh CHUNG (folder `common/handlers/`):
```
M001.heartbeat.handler.ts               → Mã M001: Xử lý heartbeat từ thiết bị
M002.heartbeat-ack.handler.ts           → Mã M002: Server phản hồi heartbeat
S005.move-in.handler.ts                 → Mã S005: PCB vào trạm xin phép xử lý
S030.move-out-inspection.handler.ts     → Mã S030: PCB rời trạm + kết quả kiểm tra
S040.alarm-event.handler.ts             → Mã S040: Thiết bị phát cảnh báo
```

### Lệnh RIÊNG (folder `devices/<tên-máy>/handlers/`):
```
# Máy Bake:
B001.temp-profile-report.handler.ts     → Mã B001: Báo cáo profile nhiệt độ lò
B003.cure-complete.handler.ts           → Mã B003: Hoàn tất chu trình nung

# Máy SMT Mounter:
SMT001.feeder-status.handler.ts         → Mã SMT001: Trạng thái feeder linh kiện
SMT005.nozzle-change.handler.ts         → Mã SMT005: Thay đầu hút nozzle

# Máy SPI/AOI:
INS001.inspection-result.handler.ts     → Mã INS001: Kết quả kiểm tra quang học
INS003.defect-map-upload.handler.ts     → Mã INS003: Upload bản đồ lỗi
```

---

## 5. Cách Tìm Kiếm Nhanh

```bash
# Tìm handler theo mã lệnh cụ thể:
find . -name "S005*"
# → src/common/handlers/S005.move-in.handler.ts

# Tìm tất cả lệnh của máy Bake:
find . -path "*/bake/handlers/*"
# → src/devices/bake/handlers/B001.temp-profile-report.handler.ts
# → src/devices/bake/handlers/B002.temp-profile-ack.handler.ts
# → ...

# Tìm tất cả handler lệnh chung:
find . -path "*/common/handlers/*"

# Tìm tất cả file service:
find . -name "*.service.ts"

# Tìm tất cả proto definitions:
find . -name "*.proto"

# Tìm theo keyword trong tên:
find . -name "*alarm*"
find . -name "*recipe*"
find . -name "*feeder*"
```

---

## 6. Tổng Kết File Count

| Nhóm | Số file handler | Thiết bị |
|------|----------------|---------|
| Common (chung) | 12 | Tất cả |
| Bake Oven | 4 | BAKE01, BAKE02... |
| Bending | 4 | BENDINGJ1, J2... |
| SMT Mounter | 6 | EQP_SMT_01, 02... |
| Reflow Oven | 4 | EQP_RFL_01... |
| SPI/AOI | 4 | EQP_SPI_01, EQP_AOI_01... |
| ICT Tester | 4 | EQP_ICT_01... |
| Laser Marker | 4 | EQP_LSR_01... |
| **Tổng** | **42 handlers** | |
