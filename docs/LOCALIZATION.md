# MC SERVER ENTERPRISE - LOCALIZATION SPECIFICATION

## 1. Hỗ trợ 4 Ngôn ngữ Tiêu chuẩn Công nghiệp
1. **Tiếng Việt (`vi-VN`)**: Ngôn ngữ bản địa hóa vận hành tại các nhà máy Việt Nam.
2. **Tiếng Anh (`en-US`)**: Ngôn ngữ chuẩn quốc tế cho chuyên gia và tích hợp kỹ thuật.
3. **Tiếng Hàn (`ko-KR`)**: Chuẩn chuyên dụng cho các tập đoàn điện tử Hàn Quốc (Samsung, LG, Hanwha, Simmtech, Hansol...).
4. **Tiếng Trung giản thể (`zh-CN`)**: Chuẩn chuyên dụng cho các đối tác công nghệ và nhà máy tại Trung Quốc, Đài Loan.

---

## 2. Thống Kê & Độ Phủ Bản Dịch (100% Key Parity)
- Số lượng khóa bản dịch: **642 keys** trên từng ngôn ngữ (`vi.ts`, `en.ts`, `ko.ts`, `zh.ts`).
- Tỷ lệ thiếu khóa (Missing Keys): **0%** (Được kiểm tra tự động qua test script).
- Các module được bản địa hóa:
  - `sidebar`: Điều hướng phân hệ.
  - `topbar`: Trạng thái hệ thống, đồng hồ ca kíp, chọn ngôn ngữ toàn cục.
  - `dashboard`: Chỉ số KPI tổng quan, biểu đồ thời gian thực.
  - `devices`: Quản lý 18 cột Master Table, bộ lọc, thao tác nhập/xuất TSV/CSV, modal nhóm thiết bị.
  - `communication`: Bắt gói tin, Hex dump, phân tích ASCII, bộ lọc giao thức, phân trang bảng.
  - `workbench`: Bàn thử nghiệm tạo frame, kiểm tra checksum LRC/CRC16.
  - `alarms`: Trung tâm cảnh báo, quy trình xác nhận sự cố (Acknowledge).
  - `config`: Trung tâm cấu hình tham số mạng và phân quyền RBAC.
  - `common`: Nút thao tác chung, thông báo Toast, hộp thoại xác nhận.

---

## 3. Quy Tắc Tiêu Đề Ngắn Gọn & Chống Lệch Cột (Concise Labeling Standard)
- **Tiêu đề bảng và trường nhập liệu trong modal**: Ưu tiên hiển thị ngắn gọn (`PLANT`, `HOST_ADDR`, `PORT`, `DEV_ID`, `SRV_NO`, `EQUIP_ID`, `GROUP`, `ORDER`, `MAIN`, `F1`, `F2`, `FIELD_03`, `RECIPE`, `MODEL`, `PARAM`, `TRACE`).
- **Chống ngắt dòng làm lệch ô**: Khóa chiều cao nhãn `h-5` kèm `truncate whitespace-nowrap overflow-hidden`.
- **Hỗ trợ giải nghĩa chi tiết**: Mọi nhãn rút gọn đều đính kèm thuộc tính `title="..."` hiển thị tooltip đầy đủ khi rê chuột, đảm bảo vừa giữ thẩm mỹ vừa cung cấp đủ thông tin.

---

## 4. Chuyển Đổi Ngôn Ngữ Tức Thì Ngay Trong Modal (In-Modal Live Switcher)
- Tích hợp cụm nút chọn ngôn ngữ `[🇻🇳 VI] [🇺🇸 EN] [🇰🇷 KO] [🇨🇳 ZH]` trực tiếp trên Header của Modal Thêm/Sửa thiết bị.
- Cho phép kỹ sư chuyển đổi ngôn ngữ hiển thị ngay trong quá trình nhập liệu mà không bị đóng modal hoặc mất dữ liệu form đang điền dở.

---

## 5. Chuẩn Hóa Thuật Ngữ Nghiệp Vụ Mới
| Khái Niệm Mới | Tiếng Việt (`vi-VN`) | Tiếng Anh (`en-US`) | Tiếng Hàn (`ko-KR`) | Tiếng Trung (`zh-CN`) |
| :--- | :--- | :--- | :--- | :--- |
| Tab Lệnh Quét | **Lệnh Quét MES** | **MES Scan Command** | **MES 스캔 명령** | **MES 扫描命令** |
| Phân trang bảng | **Số dòng hiển thị** | **Page Size** | **표시 행 수** | **显示行数** |
| Điều hướng trang | **Trang [X] / [Y]** | **Page [X] / [Y]** | **페이지 [X] / [Y]** | **第 [X] / [Y] 页** |
| Cách ly lỗi UI | **Thử Lại Giao Diện** | **Retry Interface** | **인터페이스 재시도** | **重试界面** |
| Trạng thái Pool | **Sẵn sàng / Kết nối** | **Connected / Standby** | **연결됨 / 대기 중** | **已连接 / 待机** |
