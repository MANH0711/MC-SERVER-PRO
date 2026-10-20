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

### Sự cố 2: Frame Bị Cắt Lưng (TCP Fragmentation)
- **Triệu chứng**: Log ghi nhận `INCOMPLETE_FRAME_WAITING_CHUNKS`.
- **Nguyên nhân**: MTU mạng phân xưởng nhỏ hơn payload (đặc biệt khi gửi mảng dữ liệu đo S030 lớn).
- **Khắc phục**: MC Server tự động giữ lại buffer trong 3000ms chờ phần còn lại. Đảm bảo Switch công nghiệp không bị drop packet.

### Sự cố 3: MES Endpoint Timeout / Circuit Breaker OPEN
- **Triệu chứng**: Giao diện hiển thị badge MES cảnh báo màu đỏ/cam, trạng thái `CIRCUIT_BREAKER_OPEN`.
- **Nguyên nhân**: Server MES nhà máy phản hồi > 3000ms quá 3 lần liên tiếp.
- **Khắc phục**:
  1. Kiểm tra kết nối mạng VLAN MES tại trạm **MES Monitor**.
  2. Bấm nút **Ping MES Health** để kiểm tra độ trễ.
  3. Khi MES phục hồi, bấm **Reset Circuit Breaker** để chuyển về `CLOSED`.
