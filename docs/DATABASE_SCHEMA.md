# MC SERVER ENTERPRISE - DATABASE SCHEMA SPECIFICATION

Hệ thống lưu trữ phân định rõ ràng giữa Cấu hình thiết bị, Lịch sử kết nối, Giao dịch thông điệp và Cảnh báo sự cố để tối ưu hóa hiệu năng đọc/ghi.

## 1. Bảng `devices` (Thiết bị sản xuất)
- `id` (PK, string, vd: `EQP_SMT_01`): Mã thiết bị
- `name` (string): Tên trạm / máy
- `factory` (string): Phân xưởng (Factory 1, Factory 2)
- `line` (string): Tên dây chuyền (Line SMT-A, Line Final-01)
- `station` (string): Tên trạm công đoạn (Stencil Printer, Mounter, Reflow Oven, AOI 3D)
- `model` (string): Model máy của nhà sản xuất (Panasonic NPM-D3, Koh Young 3D)
- `ipAddress` (string): Địa chỉ IPv4 tĩnh
- `port` (number): Cổng kết nối TCP
- `role` (enum): `SERVER` hoặc `CLIENT`
- `protocolVersion` (string): `v1.2-Standard` hoặc `v2.0-Extended20014`
- `status` (enum): `Disconnected`, `Connecting`, `Connected`, `Ready`, `Busy`, `Warning`, `Error`, `Reconnecting`
- `lastConnectedAt` (timestamp): Thời điểm kết nối gần nhất
- `lastDataReceivedAt` (timestamp): Thời điểm nhận frame gần nhất
- `totalRequests` (number): Tổng số request đã nhận
- `totalResponses` (number): Tổng số response đã gửi
- `errorCount` (number): Số lần lỗi
- `reconnectCount` (number): Số lần tự động tái kết nối
- `avgResponseTimeMs` (number): Thời gian phản hồi trung bình (ms)
- `uptimeSeconds` (number): Thời gian hoạt động liên tục (giây)

## 2. Bảng `communication_transactions` (Lịch sử Giao dịch)
- `id` (PK, string / UUID)
- `correlationId` (string, indexed): Mã theo dõi xuyên suốt
- `equipmentId` (string, indexed): Mã thiết bị
- `messageCode` (string): M001, S000, S002, S005, S030, S040...
- `direction` (enum): `INBOUND` (Thiết bị gửi lên) hoặc `OUTBOUND` (Server trả lời)
- `rawHex` (string): Chuỗi Hex thô của frame
- `rawAscii` (string): Chuỗi ASCII hiển thị
- `payloadJson` (object): Nội dung payload đã giải mã
- `checksumStatus` (enum): `VALID`, `INVALID`, `SKIPPED`
- `responseTimeMs` (number): Thời gian xử lý
- `status` (enum): `SUCCESS`, `ERROR`, `TIMEOUT`, `INTERLOCK_DENIED`
- `timestamp` (timestamp, indexed): Thời điểm xảy ra giao dịch

## 3. Bảng `alarms` (Cảnh báo & Sự cố)
- `id` (PK, string)
- `equipmentId` (string): Mã thiết bị gặp lỗi
- `alarmCode` (string): Mã lỗi (vd: `ALM_E034_FEEDER_JAM`)
- `severity` (enum): `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- `description` (string): Mô tả chi tiết sự cố
- `acknowledged` (boolean): Trạng thái xác nhận của kỹ sư
- `acknowledgedBy` (string): Tài khoản nhân viên xử lý
- `acknowledgedAt` (timestamp): Thời điểm xác nhận
- `createdAt` (timestamp): Thời điểm phát sinh
