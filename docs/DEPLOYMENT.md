# MC SERVER ENTERPRISE - DEPLOYMENT & OPERATION GUIDE

## 1. Yêu cầu Hệ thống (System Requirements)
- **Hệ điều hành**: Windows 10/11 Enterprise LTSC hoặc Windows Server 2019/2022.
- **Phần cứng**: Intel Core i5/i7 8th Gen trở lên, tối thiểu 8GB RAM (khuyến nghị 16GB), SSD NVMe cho lưu trữ log tốc độ cao.
- **Mạng**: 2 cổng mạng Ethernet chuyên dụng (Dual NIC):
  - NIC 1 (OT Network): Kết nối mạng nội bộ phân xưởng máy sản xuất (VLAN Thiết bị, IP tĩnh không ra Internet).
  - NIC 2 (IT/MES Network): Kết nối hạ tầng mạng nhà máy lên MES/ERP.

## 2. Các bước Triển khai
1. Clone hoặc tải gói phân phối `MCServer-Enterprise-v2.4.zip`.
2. Mở file cấu hình `config/server-config.json` để kiểm tra IP, Port, MES Endpoints.
3. Chạy lệnh cài đặt hoặc service wrapper:
   ```bash
   npm run build
   npm run preview
   ```
4. Thiết lập quy tắc Windows Firewall:
   - Cho phép TCP Inbound Port `5000-5050` cho các thiết bị sản xuất.
   - Cho phép TCP Outbound Port `8080/443` lên MES.
