# 📋 Bảng Tra Cứu Toàn Bộ Mã Lệnh (Message Code Reference)

Hệ thống **MC Server Pro Backend** chuẩn hóa mã lệnh theo định dạng:
`[PREFIX][MÃ_3_SỐ]` để đảm bảo tra cứu tức thì, không trùng lặp và phản ánh chính xác nhóm thiết bị.

---

## 1. Nhóm Lệnh Chung Cho Mọi Thiết Bị (Common Commands - Prefix `M`)
Thư mục: `src/commands/common/`

| Mã Lệnh | Tên Lệnh (File Name) | Chiều Truyền | Chức Năng | Ghi Chú |
|:-------:|:---------------------|:------------:|:----------|:--------|
| **M001** | `M001.heartbeat.handler.ts` | ↔ Hai chiều | Nhịp tim kiểm tra kết nối (Keep-Alive / Ping-Pong) | Chu kỳ 5s - 30s |
| **M002** | `M002.status-inquiry.handler.ts` | ↔ Hai chiều | Truy vấn và báo cáo trạng thái máy (Run/Stop/Idle/Alarm) | Kèm mã trạng thái |
| **M003** | `M003.recipe-upload.handler.ts` | Máy → Server | Thiết bị gửi nội dung công thức sản xuất hiện tại | Lưu trữ vào Oracle |
| **M004** | `M004.recipe-download.handler.ts` | Server → Máy | Server nạp công thức sản xuất chuẩn xuống thiết bị | Khóa an toàn Recipe |
| **M005** | `M005.alarm-report.handler.ts` | Máy → Server | Thiết bị báo cáo sự cố phát sinh (Alarm code, Level) | Ghi nhận sự cố ngay |
| **M006** | `M006.alarm-reset.handler.ts` | ↔ Hai chiều | Xóa báo động hoặc gửi tín hiệu Reset lỗi | Xác nhận giải tỏa |
| **M007** | `M007.lot-track-in.handler.ts` | Máy → Server | Bắt đầu xử lý lô hàng (Barcode, Lot ID, Carrier ID) | Check MES validation |
| **M008** | `M008.lot-track-out.handler.ts` | Máy → Server | Hoàn thành lô hàng (Số lượng đạt/lỗi, Yield rate) | Update MES WIP |
| **M009** | `M009.time-sync.handler.ts` | Server → Máy | Đồng bộ thời gian chuẩn từ Server đến đồng hồ máy | Định dạng YYYY-MM-DD HH:mm:ss |
| **M010** | `M010.interlock-check.handler.ts`| ↔ Hai chiều | Kiểm tra khóa liên động an toàn trước khi chạy máy | INTERLOCK_RECIPE/PARAM |

---

## 2. Nhóm Lệnh Riêng: Lò Nung Sấy (Bake Oven - Prefix `B` - Model `IBS_BAKE`)
Thư mục: `src/commands/bake/`

| Mã Lệnh | Tên Lệnh (File Name) | Chiều Truyền | Chức Năng |
|:-------:|:---------------------|:------------:|:----------|
| **B101** | `B101.temp-profile-upload.handler.ts` | Máy → Server | Tải đồ thị nhiệt độ đa vùng (Multi-zone temperature curve) |
| **B102** | `B102.temp-profile-download.handler.ts` | Server → Máy | Nạp biểu đồ cấp nhiệt theo giai đoạn nung sấy |
| **B103** | `B103.zone-temp-monitor.handler.ts` | Máy → Server | Giám sát nhiệt độ tức thời từng vùng buồng nung (Zone 1..N) |
| **B104** | `B104.vacuum-pressure-report.handler.ts`| Máy → Server | Báo cáo áp suất chân không buồng nhiệt (mbar / Pa) |
| **B105** | `B105.bake-cycle-complete.handler.ts` | Máy → Server | Tín hiệu hoàn thành mẻ nung sấy sản phẩm |

---

## 3. Nhóm Lệnh Riêng: Máy Uốn Gấp Jig (Bending Jig - Prefix `J` - Model `IBS_BENDINGJS`)
Thư mục: `src/commands/bending/`

| Mã Lệnh | Tên Lệnh (File Name) | Chiều Truyền | Chức Năng |
|:-------:|:---------------------|:------------:|:----------|
| **J201** | `J201.angle-program-upload.handler.ts` | Máy → Server | Tải thông số tọa độ và góc uốn sản phẩm từ máy |
| **J202** | `J202.angle-program-download.handler.ts` | Server → Máy | Cài đặt thông số chương trình góc uốn mới xuống máy |
| **J203** | `J203.bending-force-report.handler.ts` | Máy → Server | Báo cáo lực ép/uốn thực tế (kN/N) để kiểm soát biến dạng |
| **J204** | `J204.tooling-life-counter.handler.ts` | Máy → Server | Báo cáo bộ đếm số lần dập/uốn của khuôn gá (Tooling Life) |
| **J205** | `J205.angle-compensation.handler.ts` | ↔ Hai chiều | Bù góc tự động theo độ đàn hồi của vật liệu (Springback) |

---

## 4. Nhóm Lệnh Riêng: Máy Gắn Chip & Bề Mặt SMT (Mounter - Prefix `S`)
Thư mục: `src/commands/smt/`

| Mã Lệnh | Tên Lệnh (File Name) | Chiều Truyền | Chức Năng |
|:-------:|:---------------------|:------------:|:----------|
| **S301** | `S301.feeder-setup-verify.handler.ts` | Máy ↔ Server | Xác thực vị trí Feeder liệu và Barcode cuộn linh kiện |
| **S302** | `S302.nozzle-inspection.handler.ts` | Máy → Server | Tình trạng kiểm tra đầu hút Nozzle (Độ mòn, tắc khí) |
| **S303** | `S303.component-drop-rate.handler.ts` | Máy → Server | Tỉ lệ rơi rớt linh kiện bất thường (Pickup error rate) |

---

## 5. Nhóm Lệnh Riêng: Máy Kiểm Tra Quang Học Tự Động (AOI / SPI - Prefix `A`)
Thư mục: `src/commands/aoi/`

| Mã Lệnh | Tên Lệnh (File Name) | Chiều Truyền | Chức Năng |
|:-------:|:---------------------|:------------:|:----------|
| **A401** | `A401.inspection-result.handler.ts` | Máy → Server | Kết quả soi quang học: PASS, NG, Mã lỗi khiếm khuyết |
| **A402** | `A402.defect-image-upload.handler.ts` | Máy → Server | Truyền đường dẫn hoặc ảnh chụp chi tiết vị trí lỗi NG |
| **A403** | `A403.review-station-sync.handler.ts` | Máy ↔ Server | Đồng bộ dữ liệu sang trạm phán định sửa hàng (Review VRS) |

---

## 6. Nhóm Lệnh Riêng: Máy Khắc Laser (Laser Marking - Prefix `L`)
Thư mục: `src/commands/laser/`

| Mã Lệnh | Tên Lệnh (File Name) | Chiều Truyền | Chức Năng |
|:-------:|:---------------------|:------------:|:----------|
| **L501** | `L501.barcode-string-download.handler.ts` | Server → Máy | Cấp chuỗi serial barcode duy nhất từ MES xuống máy khắc |
| **L502** | `L502.marking-confirm.handler.ts` | Máy → Server | Xác nhận đã bắn laser xong kèm hình ảnh đọc lại |
| **L503** | `L503.laser-power-check.handler.ts` | Máy → Server | Kiểm tra công suất phát tia laser và nhiệt độ đầu đốt |
