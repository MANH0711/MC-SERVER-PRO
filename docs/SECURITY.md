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

---

## 2. Bảo vệ Thông tin Bí mật
- Không lưu token, mật khẩu plain-text trong config hay source code.
- Toàn bộ thao tác thay đổi cấu hình được ghi vào nhật ký Audit Log kèm Timestamp và Tên tài khoản.
- Payload nhạy cảm trong Communication Monitor tự động che trường mật khẩu hoặc token (Masking).

---

## 3. Bảo Mật Kết Nối Cơ Sở Dữ Liệu Oracle (Database Security)
1. **Quản Lý Mật Khẩu Qua Biến Môi Trường (.env)**:
   - Mọi thông số đăng nhập Oracle TNS (`ORACLE_ITMVMES_PASSWORD`, `ORACLE_ITMDEV_PASSWORD`) được nạp qua biến môi trường được mã hóa phân quyền cấp OS, không lộ lọt vào Git repository.
2. **Oracle Client Native Thick Mode Isolation**:
   - Sử dụng thư mục Oracle Client chính thức được cấp quyền Administrator cục bộ, đảm bảo tính xác thực qua giao thức hash bảo mật Oracle (Password Verifier 0x939).
3. **Chống Tiêm Nhiễm SQL (SQL Injection Prevention)**:
   - 100% các câu lệnh SELECT, UPDATE, INSERT thực thi qua `OracleService` (`executeQuery`, `executeDml`, `executeProcedure`) đều sử dụng cơ chế liên kết tham số (Bind Variables `:param`), tuyệt đối không ghép chuỗi SQL thô.
