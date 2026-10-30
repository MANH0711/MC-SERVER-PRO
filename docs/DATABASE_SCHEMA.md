# MC SERVER ENTERPRISE - DATABASE SCHEMA SPECIFICATION

Hệ thống lưu trữ phân định rõ ràng giữa Cấu hình thiết bị (chuẩn 18 cột ITM Industrial MES), Nhóm thiết bị, Lịch sử kết nối, Giao dịch thông điệp và Cảnh báo sự cố để tối ưu hóa hiệu năng đọc/ghi.

---

## 1. Bảng `devices` (Thiết Bị Sản Xuất - Chuẩn Master Table 18 Cột)

Dữ liệu thiết bị được lưu trữ và đồng bộ tương thích 100% với định dạng bảng dữ liệu nhà máy công nghiệp (ITM / MES Standard Schema):

| STT | Tên Cột (Master Field) | Kiểu Dữ Liệu | Khóa / Chỉ Mục | Giá Trị Mẫu | Mô Tả Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `PLANT` | `string` | Indexed | `ITMVPSG` | Mã định danh nhà máy / phân xưởng |
| 2 | `HOST_ADDRESS` | `string` | Indexed | `127.0.0.1` | Địa chỉ IPv4 tĩnh của máy trạm |
| 3 | `HOST_PORT` | `number` | Indexed | `5010` | Cổng TCP socket kết nối hai chiều |
| 4 | `DEVICE_ID` | `string / number` | -- | `0` | Mã trạm con / slot thiết bị |
| 5 | `SERVER_NO` | `string / number` | -- | `15` | Số máy chủ MC Server phụ trách |
| 6 | `EQUIPMENT_ID` | `string` | **PK (Chính)** | `BAKE01`, `BENDINGJ1` | Mã thiết bị duy nhất trên toàn hệ thống |
| 7 | `GROUP_NAME` | `string` | Indexed | `NET` | Nhóm công đoạn sản xuất (FK liên kết `device_groups`) |
| 8 | `EQUIPMENT_ORDER` | `number` | -- | `20110` | Thứ tự quy trình công đoạn máy trong dây chuyền |
| 9 | `EQUIPMENT_MAIN` | `string` | -- | `MAIN_UNIT_01` | Mã cụm máy chính điều phối |
| 10 | `DESCRIPTION` | `string` | -- | `Bake Oven Furnace 01` | Mô tả chi tiết chức năng / Tên trạm hiển thị |
| 11 | `ENABLE` | `enum ('YES','NO')`| Indexed | `YES` | Trạng thái kích hoạt vận hành máy |
| 12 | `FIELD_01` | `string` | -- | `--` | Trường tùy biến mở rộng 01 |
| 13 | `FIELD_02` | `string` | -- | `--` | Trường tùy biến mở rộng 02 |
| 14 | `FIELD_03` | `string` | -- | `ITMVIET` | Trường tùy biến mở rộng 03 (mặc định ITMVIET) |
| 15 | `INTERLOCK_RECIPE` | `enum ('YES','NO')`| -- | `YES` | Khóa công thức sản xuất (Recipe Safety Interlock) |
| 16 | `EQUIPMENT_MODEL` | `string` | -- | `IBS_BAKE`, `IBS_BENDINGJS` | Mã Model thiết bị của nhà chế tạo |
| 17 | `INTERLOCK_PARAM` | `string` | -- | `CHK_PARAM_ON` | Khóa tham số thông số máy sản xuất |
| 18 | `INTERLOCK_TRACE` | `string` | -- | `LOT_TRACE_EN` | Khóa kiểm tra truy vết lịch sử Lot/Carrier |

### Thuộc tính giao thức & trạng thái mở rộng (`DeviceModel`):
- `frameBoundary` (enum): `20013_STANDARD` (ETX `0x03`), `20014_EXTENDED` (+LF `0x0A`), `VARIABLE_LENGTH`
- `checksumAlgorithm` (enum): `LRC_MOD256`, `XOR_HEX`, `CRC16_CCITT`
- `role` (enum): `SERVER` hoặc `CLIENT`
- `status` (enum): `Disconnected`, `Connecting`, `Connected`, `Ready`, `Busy`, `Warning`, `Error`, `Reconnecting`
- `lastConnectedAt` (timestamp): Thời điểm kết nối gần nhất
- `lastDataReceivedAt` (timestamp): Thời điểm nhận frame gần nhất
- `totalRequests` (number): Tổng số request đã nhận
- `totalResponses` (number): Tổng số response đã gửi
- `errorCount` (number): Số lần lỗi
- `reconnectCount` (number): Số lần tự động tái kết nối
- `avgResponseTimeMs` (number): Thời gian phản hồi trung bình (ms)
- `uptimeSeconds` (number): Thời gian hoạt động liên tục (giây)

---

## 2. Bảng `device_groups` (Nhóm Thiết Bị)

Hỗ trợ phân nhóm máy trực quan theo công đoạn sản xuất để hiển thị trên cây Ma trận thiết bị:
- `id` (PK, string, vd: `GRP_NET`, `NET`): Mã nhóm duy nhất
- `name` (string, vd: `NET`): Tên nhóm hiển thị ngắn gọn
- `color` (string): Màu nhận diện badge (blue, cyan, emerald, amber, purple, rose)
- `description` (string): Mô tả chi tiết nhóm công đoạn
- `createdAt` (timestamp): Thời điểm đăng ký nhóm

---

## 3. Định Dạng Nhập / Xuất Bảng Dữ Liệu (TSV & CSV Format)

Hệ thống hỗ trợ sao chép, dán trực tiếp dữ liệu dạng bảng phân cách bằng Tab (TSV từ Excel) hoặc file CSV gồm đúng 18 cột tiêu chuẩn:
```tsv
PLANT	HOST_ADDRESS	HOST_PORT	DEVICE_ID	SERVER_NO	EQUIPMENT_ID	GROUP_NAME	EQUIPMENT_ORDER	EQUIPMENT_MAIN	DESCRIPTION	ENABLE	FIELD_01	FIELD_02	FIELD_03	INTERLOCK_RECIPE	EQUIPMENT_MODEL	INTERLOCK_PARAM	INTERLOCK_TRACE
ITMVPSG	127.0.0.1	5010	0	15	BAKE01	NET	20110			YES			ITMVIET	YES	IBS_BAKE		
ITMVPSG	127.0.0.1	5010	0	15	BENDINGJ1	NET	20110			YES			ITMVIET	YES	IBS_BENDINGJS		
```

Các hàm xử lý cốt lõi tại `src/utils/deviceFormat.ts`:
- `parseDevicesFromTsvOrCsv(rawText)`: Tự động phát hiện TSV/CSV, chuẩn hóa khoảng trắng và trích xuất danh sách thiết bị hợp lệ.
- `exportDevicesToTsv(devices)`: Xuất định dạng chuỗi TSV 18 cột để dán trực tiếp vào bảng tính Excel.
- `exportDevicesToCsv(devices)`: Xuất file `.csv` chuẩn 18 cột kèm escaping ký tự đặc biệt.
- `deviceToRecord(device)` / `recordToDevice(record)`: Chuyển đổi hai chiều giữa mô hình hoạt động runtime và bản ghi Master Table.

---

## 4. Bảng `communication_transactions` (Lịch Sử Giao Dịch Socket)
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

---

## 5. Bảng `alarms` (Cảnh Báo & Sự Cố)
- `id` (PK, string)
- `equipmentId` (string): Mã thiết bị gặp lỗi
- `alarmCode` (string): Mã lỗi (vd: `ALM_E034_FEEDER_JAM`)
- `severity` (enum): `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- `description` (string): Mô tả chi tiết sự cố
- `acknowledged` (boolean): Trạng thái xác nhận của kỹ sư
- `acknowledgedBy` (string): Tài khoản nhân viên xử lý
- `acknowledgedAt` (timestamp): Thời điểm xác nhận
- `createdAt` (timestamp): Thời điểm phát sinh

---

## 6. Bảng Oracle MES `AFA_SEMI_WB_SCAN_HIS` (Lịch Sử Quét Mã Vạch MES)

Bảng ghi nhận toàn bộ dữ liệu quét barcode PCB / Lot tại các công đoạn bán dẫn (Die Attach / Wire Bond).

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| `PLANT` | `VARCHAR2(20)` | NOT NULL | Mã nhà máy (mặc định `'ITMVIET'`) |
| `EQUIPMENT_ID` | `VARCHAR2(50)` | NOT NULL | Mã thiết bị quét (vd: `'WB161VN'`, `'WB182VN'`) |
| `EQUIPMENT_TYPE`| `VARCHAR2(50)` | NOT NULL | Loại máy (vd: `'W/B'`, `'D/A'`) |
| `EQUIPMENT_GROUP`| `VARCHAR2(50)`| NOT NULL | Nhóm máy phân xưởng (vd: `'W/B'`) |
| `OPERATION` | `VARCHAR2(20)` | NOT NULL | Mã công đoạn sản xuất (vd: `'289'`, `'410'`, `'420'`) |
| `BARCODE_TYPE` | `VARCHAR2(20)` | NOT NULL | Loại mã vạch quét (mặc định `'PCB'`) |
| `BARCODE_ID` | `VARCHAR2(100)`| NOT NULL | Mã vạch vật phẩm quét (PCB ID / Strip ID) |
| `LOT_NUMBER` | `VARCHAR2(50)` | NULL | Số Lot sản xuất MES liên kết |
| `TRANS_TIME` | `VARCHAR2(14)` | NOT NULL | Thời gian quét (Định dạng `YYYYMMDDHH24MISS`) |
| `APPLY_FLAG` | `CHAR(1)` | NOT NULL | Cờ hiệu lực: `'Y'` (Đang áp dụng) hoặc `'N'` (Đã bị ghi đè) |
| `RECIPE` | `VARCHAR2(100)`| NULL | Tên công thức sản xuất đã xác thực |
| `EQP_OPT_05` | `VARCHAR2(50)` | NULL | Tùy chọn mở rộng (User ID / RFID / 'No ID') |

### Quy Tắc Cập Nhật Trạng Thái Tự Động (Auto-Apply Flag Lifecycle):
Khi phát sinh một lượt quét mới:
1. **Bước 1 (Đánh dấu hủy bản ghi cũ):**
   ```sql
   UPDATE AFA_SEMI_WB_SCAN_HIS
   SET APPLY_FLAG = 'N'
   WHERE PLANT = :plant
     AND EQUIPMENT_ID = :equipmentId
     AND EQUIPMENT_TYPE = :equipmentType
     AND EQUIPMENT_GROUP = :equipmentGroup
     AND OPERATION = :operation
     AND BARCODE_TYPE = :barcodeType
     AND BARCODE_ID = :barcodeId
     AND APPLY_FLAG = 'Y';
   ```
2. **Bước 2 (Chèn bản ghi mới nhất có hiệu lực):**
   ```sql
   INSERT INTO AFA_SEMI_WB_SCAN_HIS (
     PLANT, EQUIPMENT_ID, EQUIPMENT_TYPE, EQUIPMENT_GROUP,
     OPERATION, BARCODE_TYPE, BARCODE_ID, LOT_NUMBER,
     TRANS_TIME, APPLY_FLAG, RECIPE, EQP_OPT_05
   ) VALUES (
     :plant, :equipmentId, :equipmentType, :equipmentGroup,
     :operation, :barcodeType, :barcodeId, :lotNumber,
     :transTime, 'Y', :recipe, :eqpOpt05
   );
   ```
*Đảm bảo tính duy nhất: Tại một thời điểm, chỉ có duy nhất 1 bản ghi có `APPLY_FLAG = 'Y'` cho cùng một bộ nhận diện vật phẩm.*

---

## 7. Bảng Oracle Phân Loại Nhóm Nghiệp Vụ `ADM_GROUP_CATEGORY_DATA`

Dùng để xác thực mối tương quan hợp lệ giữa mã công đoạn thao tác và thiết bị thực thi:

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Thường Dùng | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `PLANT` | `VARCHAR2(20)` | PK | `'ITMVIET'` | Nhà máy |
| `GROUP_TARGET` | `VARCHAR2(30)` | PK | `'OPERATION'`, `'EQUIPMENT'` | Đối tượng phân loại |
| `GROUP_OBJECT` | `VARCHAR2(50)` | PK | Mã công đoạn (`'420'`) hoặc Mã máy (`'WB116VN'`) | Giá trị cụ thể cần tra cứu |
| `GROUP_INDEX` | `VARCHAR2(10)` | PK | `'22'` (Công đoạn) hoặc `'13'` (Thiết bị) | Chỉ mục phân loại MES |
| `GROUP_CATEGORY`| `VARCHAR2(50)`| PK | `'EIF_OPER_GROUP'`, `'EIF_EQP_GROUP'` | Tên danh mục quy tắc |
| `GROUP_VALUE` | `VARCHAR2(50)` | NOT NULL | vd: `'WB_GROUP_A'`, `'DA_GROUP_1'` | Nhóm nghiệp vụ thực tế |

### Quy Tắc Xác Thực Đối Chiếu Nhóm (Group Match Rule):
Hệ thống lấy `GROUP_VALUE` của Công đoạn (`EIF_OPER_GROUP`) và Thiết bị (`EIF_EQP_GROUP`).
- Nếu `GROUP_VALUE_OPER === GROUP_VALUE_EQP`: **PASS** (Tiến hành mở chốt Interlock).
- Nếu khác nhau hoặc thiếu cấu hình: **INTERLOCK REJECT** kèm thông báo:
  `"Mã công đoạn [{operation}] (Nhóm: {operGroup}) và thiết bị [{equipmentId}] (Nhóm: {equipGroup}) không cùng nhóm phân loại nghiệp vụ"`.

---

## 8. Bảng Oracle Master `MIGHTY.GATEWAY_DEVICES` (Đồng Bộ Thiết Bị Thật)
Lưu trữ toàn bộ danh sách 18 cột của hơn 1,000 thiết bị trên máy chủ Oracle Database. Backend NestJS (`EquipmentRepository`) nạp danh sách lúc khởi động và định kỳ đồng bộ với Frontend qua API `GET /api/devices` mỗi 30 giây.


