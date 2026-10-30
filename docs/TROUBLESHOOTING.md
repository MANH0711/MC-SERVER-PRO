# MC SERVER ENTERPRISE - TROUBLESHOOTING & OPERATIONS GUIDE

## 1. Sự cố Thường gặp & Hướng dẫn Khắc phục

### Sự cố 1: Checksum Mismatch (Mã lỗi `ERR_FRAME_CHECKSUM_INVALID`)
- **Triệu chứng**: MC Server từ chối xử lý frame, ghi nhận cảnh báo WARNING trên Alarm Center.
- **Nguyên nhân**: Thiết bị sử dụng thuật toán XOR thay vì LRC Modulo 256, hoặc tính cả byte STX vào checksum.
- **Khắc phục**: 
  1. Mở màn hình **Protocol Explorer & Debug Workbench**.
  2. Chọn tab Checksum Inspector, dán chuỗi Hex thô vào.
  3. Kiểm tra xem Checksum thiết bị gửi khớp với LRC hay XOR.
  4. Vào **Device Management** -> Chỉnh sửa thiết bị -> Đổi Checksum Algorithm tương ứng (`LRC` hoặc `XOR`).

---

### Sự cố 2: Frame Bị Cắt Lưng (TCP Fragmentation)
- **Triệu chứng**: Log ghi nhận `INCOMPLETE_FRAME_WAITING_CHUNKS`.
- **Nguyên nhân**: MTU mạng phân xưởng nhỏ hơn payload (đặc biệt khi gửi mảng dữ liệu đo S030 lớn).
- **Khắc phục**: MC Server tự động giữ lại buffer trong 3000ms chờ phần còn lại. Đảm bảo Switch công nghiệp không bị drop packet.

---

### Sự cố 3: MES Endpoint Timeout / Circuit Breaker OPEN
- **Triệu chứng**: Giao diện hiển thị badge MES cảnh báo màu đỏ/cam, trạng thái `CIRCUIT_BREAKER_OPEN`.
- **Nguyên nhân**: Server MES nhà máy phản hồi > 3000ms quá 3 lần liên tiếp.
- **Khắc phục**:
  1. Kiểm tra kết nối mạng VLAN MES tại trạm **MES Monitor**.
  2. Bấm nút **Ping MES Health** để kiểm tra độ trễ.
  3. Khi MES phục hồi, bấm **Reset Circuit Breaker** để chuyển về `CLOSED`.

---

### Sự cố 4: Mã Công Đoạn và Thiết Bị Không Khớp Nhóm Nghiệp Vụ
- **Triệu chứng**: Phản hồi Interlock trả về `FAIL` kèm thông báo chi tiết:
  `"Mã công đoạn [420] (Nhóm: WB_LINE_A) và thiết bị [WB116VN] (Nhóm: WB_LINE_B) không cùng nhóm phân loại nghiệp vụ"`.
- **Nguyên nhân**: Trong cơ sở dữ liệu Oracle bảng `ADM_GROUP_CATEGORY_DATA`, giá trị `GROUP_VALUE` của công đoạn (CATEGORY=`'EIF_OPER_GROUP'`) không trùng với giá trị `GROUP_VALUE` của thiết bị (CATEGORY=`'EIF_EQP_GROUP'`).
- **Khắc phục**:
  1. Mở Oracle SQL Developer kết nối TNS `ITMVMES`.
  2. Tra cứu nhóm của công đoạn:
     ```sql
     SELECT GROUP_VALUE FROM ADM_GROUP_CATEGORY_DATA
     WHERE PLANT = 'ITMVIET' AND GROUP_TARGET = 'OPERATION' AND GROUP_OBJECT = '420'
       AND GROUP_INDEX = '22' AND GROUP_CATEGORY = 'EIF_OPER_GROUP';
     ```
  3. Tra cứu nhóm của thiết bị:
     ```sql
     SELECT GROUP_VALUE FROM ADM_GROUP_CATEGORY_DATA
     WHERE PLANT = 'ITMVIET' AND GROUP_TARGET = 'EQUIPMENT' AND GROUP_OBJECT = 'WB116VN'
       AND GROUP_INDEX = '13' AND GROUP_CATEGORY = 'EIF_EQP_GROUP';
     ```
  4. Cập nhật cho 2 giá trị `GROUP_VALUE` đồng nhất hoặc chọn đúng mã máy thuộc chuyền sản xuất tương ứng.

---

### Sự cố 5: Lỗi Kết Nối Oracle Thin Mode (NJS-116 / ORA-28040: No matching authentication protocol)
- **Triệu chứng**: Backend báo lỗi `ORA-28040: No matching authentication protocol` hoặc `NJS-116: password verifier type 0x939 is not supported by node-oracledb Thin mode`.
- **Nguyên nhân**: Cơ sở dữ liệu Oracle Database là phiên bản 11g/12c sử dụng cơ chế hash mật khẩu cũ, driver `oracledb` mặc định ở chế độ Thin không hỗ trợ.
- **Khắc phục**:
  1. Cài đặt Oracle Instant Client 12.2.0 (hoặc 19c) 64-bit trên máy chủ.
  2. Kiểm tra đường dẫn thư viện trong file `mc-server-backend/.env`:
     `ORACLE_CLIENT_PATH=C:\app\client\IT2-LAP-007\product\12.2.0\client_2\bin`
  3. Khởi động lại backend để nạp Thick mode.

---

### Sự cố 6: Lỗi Rớt Mạng Oracle (ORA-03113: end-of-file on communication channel)
- **Triệu chứng**: Log xuất hiện `ORA-03113` hoặc `ORA-03114: not connected to ORACLE`.
- **Cơ chế xử lý tự động**: `OracleService` được trang bị sẵn cơ chế Auto-Reconnect:
  1. Đóng và hủy ngay Connection Pool đang bị đứt.
  2. Tạo mới lại Connection Pool tương ứng.
  3. Tự động thực thi lại transaction một lần duy nhất mà không làm dừng tiến trình xử lý socket của máy sản xuất.
  4. Luồng Heartbeat Keep-Alive định kỳ 45s sẽ phát hiện và sửa chữa kết nối ngầm trước khi có request từ máy.

---

### Sự cố 7: Màn Hình Giao Diện Báo Lỗi Khối Chức Năng
- **Triệu chứng**: Một tab màn hình xuất hiện khung cảnh báo đỏ *"Không thể tải phân hệ chức năng"* kèm nút *"Thử Lại Giao Diện"*.
- **Nguyên nhân**: Lỗi dữ liệu bất thường hoặc sự cố mạng khi tải gói chunk động.
- **Khắc phục**:
  - Nhấp vào nút **Thử Lại Giao Diện**: Hệ thống tự động re-mount component mà không cần tải lại toàn bộ trang web.
  - Nhấp vào nút **Tải Lại Trang**: Làm mới cache trình duyệt.

---

### Sự cố 8: Port 3000 Bị Chiếm Dụng Bởi Ứng Dụng Khác
- **Triệu chứng**: Gặp lỗi `Port 3000 is in use, trying another one...` lúc chạy lệnh `npm run dev`.
- **Khắc phục**: Hệ thống Vite dev server đã được cấu hình tự động nhảy sang cổng khả dụng kế tiếp (ví dụ: `http://localhost:3002`). Bạn chỉ cần truy cập vào đường dẫn mới hiển thị trong Terminal.
