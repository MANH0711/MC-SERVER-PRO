# MC SERVER ENTERPRISE - SECURITY & RBAC CONSTITUTION

## 1. Nguyên tắc Phân quyền (Least Privilege RBAC)
1. **OPERATOR (Vận hành viên)**:
   - Quyền: Xem Dashboard, Giám sát thiết bị, Xem trạng thái giao tiếp.
   - Hạn chế: Không được đổi cấu hình IP/Port, không được can thiệp xóa log, không được bypass interlock.
2. **SUPERVISOR (Trưởng ca / Giám sát)**:
   - Quyền: Toàn bộ quyền Operator + Xác nhận và xử lý cảnh báo (Acknowledge Alarms) + Xuất báo cáo giao dịch (Export CSV).
3. **ENGINEER (Kỹ sư Bảo trì / Thiết bị)**:
   - Quyền: Thêm/Sửa/Xóa cấu hình thiết bị, kiểm tra công cụ Protocol Workbench, Reset kết nối socket, Reset Circuit Breaker.
4. **ADMIN (Quản trị viên Hệ thống)**:
   - Quyền tối cao: Cấu hình cổng mạng, quản lý tài khoản người dùng, chính sách bảo mật, chỉnh sửa chính sách lưu trữ log.

## 2. Bảo vệ Thông tin Bí mật
- Không lưu token, mật khẩu plain-text trong config hay source code.
- Toàn bộ thao tác thay đổi cấu hình được ghi vào nhật ký Audit Log kèm Timestamp và Tên tài khoản.
- Payload nhạy cảm trong Communication Monitor tự động che trường mật khẩu hoặc token (Masking).
