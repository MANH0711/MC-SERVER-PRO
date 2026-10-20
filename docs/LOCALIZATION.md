# MC SERVER ENTERPRISE - LOCALIZATION SPECIFICATION

## 1. Hỗ trợ 4 Ngôn ngữ Tiêu chuẩn Công nghiệp
1. **Tiếng Việt (`vi-VN`)**: Ngôn ngữ bản địa hóa vận hành tại các nhà máy Việt Nam.
2. **Tiếng Anh (`en-US`)**: Ngôn ngữ chuẩn quốc tế cho chuyên gia và tích hợp kỹ thuật.
3. **Tiếng Hàn (`ko-KR`)**: Chuẩn chuyên dụng cho các tập đoàn điện tử Hàn Quốc (Samsung, LG, Hanwha, Simmtech, Hansol...).
4. **Tiếng Trung giản thể (`zh-CN`)**: Chuẩn chuyên dụng cho các đối tác công nghệ và nhà máy tại Trung Quốc, Đài Loan.

## 2. Quy tắc Bản dịch
- Mã thông điệp (`M001`, `S005`), Equipment ID (`EQP_SMT_01`), Protocol Tokens và Frame Hex KHÔNG BAO GIỜ bị dịch để đảm bảo truy vết kỹ thuật.
- Toàn bộ giao diện người dùng, nhãn cảnh báo, thông báo lỗi, thông điệp hệ thống, modal xác nhận đều được dịch 100%.
- Định dạng ngày tháng, số lượng, thời gian phản hồi tự động thích ứng theo Locale.
