# MC SERVER ENTERPRISE - COMPREHENSIVE TEST PLAN

## 1. Protocol Tests (Kiểm thử Khung truyền)
- [x] **TC-PRT-01**: Khung hợp lệ đúng STX, ETX, Độ dài và LRC Checksum.
- [x] **TC-PRT-02**: Khung 20.013 bytes (Standard ETX) vs 20.014 bytes (ETX + 1 padding byte).
- [x] **TC-PRT-03**: Xử lý Checksum bị sai lệch (Checksum Mismatch) -> Trả mã lỗi E02 và ghi Alarm.
- [x] **TC-PRT-04**: TCP Fragmentation (Khung bị chia làm 2 hoặc 3 phần) -> Ghép nối hoàn chỉnh trước khi parse.
- [x] **TC-PRT-05**: TCP Coalescing (2 khung nằm liền nhau trong 1 packet) -> Tách thành 2 message độc lập.

---

## 2. Communication & Session Tests
- [x] **TC-COM-01**: Kết nối đồng thời nhiều thiết bị (Multi-client concurrent connections 1,000+ sockets).
- [x] **TC-COM-02**: Thiết bị ngắt kết nối đột ngột -> Server kích hoạt Watchdog và chuyển trạng thái sang Disconnected sau 5s.
- [x] **TC-COM-03**: Tự động kết nối lại (Auto-reconnect with Exponential Backoff + Jitter).

---

## 3. Business & MES Tests
- [x] **TC-BUS-01**: Handshake M001/M002 giữ kết nối sống (Keepalive).
- [x] **TC-BUS-02**: Move-In S005/S006 thẩm định Recipe và trạng thái Lot từ MES trước khi mở chốt trạm.
- [x] **TC-BUS-03**: MES trễ quá 3000ms -> Kích hoạt Circuit Breaker, đẩy vào hàng đợi retry mà không nghẽn máy trạm.

---

## 4. Oracle Database Resilience & Group Matching Tests
- [x] **TC-ORA-01**: Lazy Pool Initialization - Truy vấn TNS mới (`ITMVMES`, `ITMMES`) tự động tạo pool mà không sập server.
- [x] **TC-ORA-02**: Auto-Reconnect - Giả lập ngắt kết nối mạng Oracle (`ORA-03113`/`ORA-03114`), service tự đóng pool và tạo pool mới thành công.
- [x] **TC-ORA-03**: Heartbeat Ping 45s - Định kỳ gửi `SELECT 1 FROM DUAL`, giữ kết nối sống qua Firewall.
- [x] **TC-ORA-04**: Group Category Matching - Thử nghiệm công đoạn `420` và thiết bị `WB116VN`:
  - Trường hợp trùng nhóm: Phê duyệt PASS.
  - Trường hợp lệch nhóm: Từ chối với cảnh báo chi tiết *"Mã công đoạn và thiết bị không cùng nhóm phân loại nghiệp vụ"*.
- [x] **TC-ORA-05**: Lịch sử Quét MES (`AFA_SEMI_WB_SCAN_HIS`) - Cập nhật đúng bản ghi cũ về `APPLY_FLAG = 'N'` và chèn bản ghi mới với `APPLY_FLAG = 'Y'`.

---

## 5. Frontend Performance & Error Recovery Tests
- [x] **TC-FE-01**: ErrorBoundary Isolation - Khi một component con ném ngoại lệ, Error Boundary bắt thành công, hiển thị nút *"Thử lại giao diện"* mà không làm sập toàn bộ ứng dụng.
- [x] **TC-FE-02**: Code-Splitting Chunks - Kiểm tra 8 phân hệ thứ cấp được tải động theo yêu cầu (Network tab hiển thị tải các file `.js` tương ứng).
- [x] **TC-FE-03**: Memoized Transaction Rows - 500 bản tin SSE truyền liên tục không gây lag giật giao diện (60fps).
- [x] **TC-FE-04**: Phân Trang Chunking - Chuyển đổi giữa 50, 100, 200 và Tất cả dòng mượt mà, số lượng DOM elements duy trì tối ưu.
