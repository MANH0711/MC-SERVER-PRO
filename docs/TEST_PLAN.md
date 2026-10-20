# MC SERVER ENTERPRISE - COMPREHENSIVE TEST PLAN

## 1. Protocol Tests (Kiểm thử Khung truyền)
- [x] **TC-PRT-01**: Khung hợp lệ đúng STX, ETX, Độ dài và LRC Checksum.
- [x] **TC-PRT-02**: Khung 20.013 bytes (Standard ETX) vs 20.014 bytes (ETX + 1 padding byte).
- [x] **TC-PRT-03**: Xử lý Checksum bị sai lệch (Checksum Mismatch) -> Trả mã lỗi E02 và ghi Alarm.
- [x] **TC-PRT-04**: TCP Fragmentation (Khung bị chia làm 2 hoặc 3 phần) -> Ghép nối hoàn chỉnh trước khi parse.
- [x] **TC-PRT-05**: TCP Coalescing (2 khung nằm liền nhau trong 1 packet) -> Tách thành 2 message độc lập.

## 2. Communication & Session Tests
- [x] **TC-COM-01**: Kết nối đồng thời nhiều thiết bị (Multi-client concurrent connections).
- [x] **TC-COM-02**: Thiết bị ngắt kết nối đột ngột -> Server kích hoạt Watchdog và chuyển trạng thái sang Disconnected sau 5s.
- [x] **TC-COM-03**: Tự động kết nối lại (Auto-reconnect with Exponential Backoff + Jitter).

## 3. Business & MES Tests
- [x] **TC-BUS-01**: Handshake M001/M002 giữ kết nối sống (Keepalive).
- [x] **TC-BUS-02**: Move-In S005/S006 thẩm định Recipe và trạng thái Lot từ MES trước khi mở chốt trạm.
- [x] **TC-BUS-03**: MES trễ quá 3000ms -> Kích hoạt Circuit Breaker, đẩy vào hàng đợi retry mà không nghẽn máy trạm.
