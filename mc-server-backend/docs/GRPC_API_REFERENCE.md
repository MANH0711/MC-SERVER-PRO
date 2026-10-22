# ⚡ Tài Liệu API gRPC (gRPC API Reference)

MC Server Pro Backend cung cấp giao tiếp qua chuẩn nhị phân hiệu năng cao **gRPC** (HTTP/2 Multiplexing, Protocol Buffers v3) tại cổng mặc định `0.0.0.0:50051`.

---

## 1. Danh Sách Services gRPC

| Service | Proto File | Mục Đích | Streaming |
|:--------|:-----------|:---------|:---------:|
| `DeviceService` | `device.service.proto` | Quản lý thông tin thiết bị (18 cột), trạng thái kết nối | Có (Server Streaming) |
| `CommunicationService`| `communication.service.proto`| Giám sát bản tin truyền nhận (TX/RX), Raw Hex, Logs | Có (Server Streaming) |
| `AlarmService` | `alarm.service.proto` | Giám sát và ghi nhận cảnh báo sự cố từ máy | Có (Server Streaming) |
| `MesService` | `mes.service.proto` | Tương tác trực tiếp và gián tiếp với hệ thống MES | Không |
| `SystemService` | `system.service.proto` | Kiểm tra sức khỏe hệ thống, kích hoạt giả lập máy | Không |

---

## 2. Chi Tiết Phương Thức `DeviceService`

### `GetAllDevices(EmptyRequest) returns (DeviceListResponse)`
- **Mô tả**: Lấy danh sách toàn bộ thiết bị đang quản lý từ bộ nhớ cache hoặc cơ sở dữ liệu Oracle.
- **Dữ liệu trả về**: Mảng các đối tượng thiết bị tuân theo cấu trúc 18 cột (`PLANT`, `HOST_ADDRESS`, `HOST_PORT`, `EQUIPMENT_ID`, `EQUIPMENT_MODEL`,...).

### `GetDeviceById(DeviceIdRequest) returns (DeviceInfo)`
- **Mô tả**: Lấy chi tiết thông tin 1 thiết bị bằng `equipment_id` (ví dụ `BAKE01`, `BENDINGJ1`).

### `UpsertDevice(DeviceInfo) returns (DeviceInfo)`
- **Mô tả**: Thêm mới hoặc cập nhật thông tin thiết bị (khớp với modal FE). Tự động đồng bộ vào Oracle DB.

### `DeleteDevice(DeviceIdRequest) returns (BaseResponse)`
- **Mô tả**: Xóa hoặc chuyển trạng thái `ENABLE = 'NO'`.

### `StreamDeviceStatus(EmptyRequest) returns (stream DeviceStatusUpdate)`
- **Mô tả**: Kênh Server-Streaming gửi liên tục trạng thái Online/Offline, Last Active, CPU/Memory về cho FE Dashboard theo thời gian thực (Real-time).

---

## 3. Chi Tiết Phương Thức `CommunicationService`

### `GetRecentTransactions(TransactionFilterRequest) returns (TransactionListResponse)`
- **Mô tả**: Lấy lịch sử giao dịch truyền nhận gói tin gần nhất của một hoặc tất cả thiết bị.
- **Tham số lọc**: `equipment_id`, `command_code`, `page`, `page_size`.

### `StreamCommunication(StreamFilterRequest) returns (stream TransactionRecord)`
- **Mô tả**: Kênh Server-Streaming cho màn hình `CommunicationMonitorView.tsx`. Mỗi khi có bản tin TX (gửi đi) hoặc RX (nhận về), record sẽ lập tức được đẩy xuống trình duyệt.

### `SendManualCommand(ManualCommandRequest) returns (ManualCommandResponse)`
- **Mô tả**: Gửi một lệnh thủ công trực tiếp từ giao diện FE xuống máy (ví dụ `M001` Heartbeat, `M002` Status Inquiry, hoặc các lệnh riêng như `B101`, `J201`).

---

## 4. Chi Tiết Phương Thức `AlarmService`

### `GetActiveAlarms(EmptyRequest) returns (AlarmListResponse)`
- **Mô tả**: Lấy danh sách sự cố cảnh báo đang chưa được xác nhận (Active).

### `AcknowledgeAlarm(AcknowledgeAlarmRequest) returns (BaseResponse)`
- **Mô tả**: Người vận hành xác nhận đã tiếp nhận cảnh báo (Acknowledge) từ giao diện.

### `StreamAlarms(EmptyRequest) returns (stream AlarmRecord)`
- **Mô tả**: Bắn tín hiệu âm thanh và popup cảnh báo tức thời khi có máy phát tín hiệu báo động `M005`.

---

## 5. Hướng Dẫn Kết Nối gRPC Client từ Node.js / React

Sử dụng thư viện `@grpc/grpc-js` và `@grpc/proto-loader` hoặc công cụ sinh code `ts-proto`:

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('protos/device.service.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const client = new protoDescriptor.mcserver.DeviceService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

client.GetAllDevices({}, (err: any, response: any) => {
  if (err) console.error(err);
  else console.log('Thiết bị:', response.devices);
});
```
