# MC SERVER INDUSTRIAL PROTOCOL SPECIFICATION

## 1. Frame Structure (Cấu trúc Khung truyền)

Truyền thông giữa Thiết bị (Equipment) và MC Server sử dụng socket TCP theo cơ chế đóng gói (Framing) nhị phân kết hợp ASCII với delimiter chuẩn công nghiệp:

```
[STX] [LENGTH] [EQUIP_ID] [MSG_CODE] [TX_ID] [PAYLOAD] [CHECKSUM] [ETX]
```

### Chi tiết các trường (Field Specifications)

| Trường | Kích thước | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| **STX** | 1 byte | Hex: `0x02` | Ký tự Start of Text đánh dấu mở đầu frame. |
| **LENGTH** | 4 bytes | ASCII Decimal | Chiều dài của phần nội dung tính từ EQUIP_ID tới hết PAYLOAD. Zero-padded (vd: `0128`). |
| **EQUIP_ID** | 10 bytes | ASCII String | Mã định danh thiết bị duy nhất (Right-padded với khoảng trắng, vd: `EQP_SMT_01`). |
| **MSG_CODE** | 4 bytes | ASCII String | Mã thông điệp (vd: `M001`, `M002`, `S000`, `S005`, `S030`). |
| **TX_ID** | 8 bytes | ASCII String | Transaction ID / Mã giao dịch đơn nhất để liên kết request & response. |
| **PAYLOAD** | Biến đổi | UTF-8 JSON / Key-Value | Nội dung nghiệp vụ sản xuất (Recipe, PCB barcode, Sensor values, Alarms). |
| **CHECKSUM**| 2 bytes | ASCII Hex | Mã kiểm tra tính toàn vẹn (LRC Modulo 256 hoặc XOR). |
| **ETX** | 1 byte | Hex: `0x03` | Ký tự End of Text đánh dấu kết thúc frame (Tùy chọn kèm CRLF ở biến thể 20.014). |

---

## 2. Vấn đề Frame 20.013 bytes vs 20.014 bytes

Trong các dây chuyền lắp ráp bán dẫn/SMT thực tế, một số máy thế hệ cũ và máy thế hệ mới có sự chênh lệch 1 byte do quy tắc kết thúc frame:
1. **Chuẩn 20.013 bytes (Standard ETX)**:
   - STX (1) + Header (26) + Payload (19.983) + Checksum (2) + ETX (1) = 20.013 bytes.
2. **Chuẩn 20.014 bytes (ETX + LF / Null-pad)**:
   - Thêm 1 byte đệm `0x0A` (Line Feed) hoặc `0x00` (Null padding) sau `0x03` ETX.

**Cơ chế xử lý trong MC Server Enterprise**:
Bộ tách khung `IndustrialFrameParser` hỗ trợ chế độ **Auto-Detect Boundary**:
- Kiểm tra byte kế tiếp sau `ETX`. Nếu là `0x0A` hoặc `0x00`, parser sẽ tự động tiêu thụ 1 byte đệm mà không báo lỗi `Frame Corrupted`.
- Tránh việc buffer tích lũy 1 byte trôi dạt (buffer drift) dẫn đến hỏng toàn bộ các frame tiếp theo trên cùng session.

---

## 3. Thuật toán Checksum

### A. LRC (Longitudinal Redundancy Check - Modulo 256)
- Tính tổng tất cả các byte từ sau `STX` đến trước `CHECKSUM`.
- `LRC = (Sum of Bytes) & 0xFF`
- Chuyển đổi thành chuỗi 2 ký tự Hex viết hoa (vd: `4A`).

### B. XOR Checksum
- `XOR = Byte[1] ^ Byte[2] ^ ... ^ Byte[N]`
- Chuyển đổi thành chuỗi 2 ký tự Hex (vd: `7F`).

---

## 4. Bảng Tra cứu Mã Thông điệp (Message Codes)

| Request Code | Ý nghĩa | Response Code | Ý nghĩa phản hồi | Mô tả nghiệp vụ |
| :---: | :--- | :---: | :--- | :--- |
| **M001** | Device Heartbeat & State | **M002** | Heartbeat Ack | Kiểm tra trạng thái sống (Keepalive, Watchdog 5000ms). |
| **S000** | Ready Handshake / Carrier Inquiry | **S001** | Carrier Dispatch Grant | Thiết bị báo sẵn sàng tiếp nhận Lot/Carrier mới. |
| **S002** | Recipe & Param Validation | **S003** | Recipe Validation Result | Gửi Recipe ID và các thông số cài đặt lên MES để thẩm định trước khi chạy. |
| **S005** | Station Move-In Handshake | **S006** | Move-In Permission (PASS/FAIL) | Quét mã PCB/Lot, kiểm tra quy trình công đoạn trước đó có PASS hay không. |
| **S030** | Station Move-Out & Inspection | **S031** | Move-Out Acknowledged | Báo cáo hoàn tất công đoạn, gửi kết quả kiểm tra (AOI/SPI/ICT) và dữ liệu đo. |
| **S040** | Equipment Alarm / Machine Error | **S041** | Alarm Recorded Ack | Thiết bị báo lỗi dừng máy (Interlock, Jam, Temperature out-of-bounds). |
| **S050** | Die Attach Work-In Interlock Request | **S051** | Work-In Interlock Response (OK/NG) | Chuẩn lệnh kiểm tra Work-In Interlock bán dẫn. Đối với Model thiết bị là DIEATTACH: Bắt buộc gửi mã lệnh S050, nhóm công đoạn (`EIF_OPER_GROUP`) và nhóm thiết bị (`EIF_EQP_GROUP`) đều phải là 'D/A'. |
| **M010** | Safety & Interlock Check | **M010** (Resp) | Interlock Result (PASS/NG) | Kiểm tra Interlock công đoạn bán dẫn (Die Attach/Wire Bond), đối chiếu nhóm `EIF_OPER_GROUP` = `EIF_EQP_GROUP` và tự động cập nhật lịch sử quét `AFA_SEMI_WB_SCAN_HIS`. |


---

## 5. Ví dụ Frame đã được Xác minh (Verified Hex & ASCII Frames)

### Frame M001 (Ready Handshake)
```
ASCII: [STX]0034EQP_SMT_01M001TX100001{"status":"IDLE","temp":24.5}8F[ETX]
HEX:   02 30 30 33 34 45 51 50 5F 53 4D 54 5F 30 31 4D 30 30 31 54 58 31 30 30 30 30 31 7B 22 73 74 61 74 75 73 22 3A 22 49 44 4C 45 22 2C 22 74 65 6D 70 22 3A 32 34 2E 35 7D 38 46 03
```

### Frame M002 (Server Response)
```
ASCII: [STX]0031EQP_SMT_01M002TX100001{"ack":"PASS","code":0}4C[ETX]
HEX:   02 30 30 33 31 45 51 50 5F 53 4D 54 5F 30 31 4D 30 30 32 54 58 31 30 30 30 30 31 7B 22 61 63 6B 22 3A 22 50 41 53 53 22 2C 22 63 6F 64 65 22 3A 30 7D 34 43 03
```
