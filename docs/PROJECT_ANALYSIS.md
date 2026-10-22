# MC SERVER INDUSTRIAL ENTERPRISE EDITION - PROJECT ANALYSIS

## 1. Tổng quan Dự án (Project Overview)
- **Tên hệ thống**: MC Server Industrial Enterprise Edition (Manufacturing Communication Server)
- **Mục tiêu**: Xây dựng máy chủ truyền thông công nghiệp cấp Enterprise điều phối luồng dữ liệu TCP/IP hai chiều giữa các máy sản xuất (Equipment/Stations) và Hệ thống điều hành sản xuất MES (Manufacturing Execution System).
- **Môi trường hoạt động**: Nhà máy sản xuất công nghệ cao (SMT, Test, Assembly, Packaging).
- **Tiêu chuẩn chất lượng**: High-Availability (24/7/365), Zero-Data-Loss, Strict Frame Parsing, Real-time Health Diagnostics, Multi-lingual (vi-VN, en-US, ko-KR, zh-CN).

---

## 2. Đánh giá Hiện trạng & Công nghệ (Tech Stack Analysis)
- **Frontend / Client**: React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Icons & Typography**: Lucide Icons, IBM Plex Sans, JetBrains Mono (cho Hex Dump/Frames), Noto Sans KR/SC (cho tiếng Hàn & Trung).
- **Backend / Communication Core**: 
  - Mô hình Socket Server / Session Manager module hóa.
  - Bộ tách khung TCP (Frame Delimiter, Length Header, Checksum LRC/CRC16/Mod256).
  - Trình phân tích Payload JSON / Tag-Value / Fixed-width 20.013 vs 20.014 bytes.
  - Quản lý đồng thời đa thiết bị (Multi-device concurrent connection engine) với cơ chế Backpressure và Bounded Buffer.
- **MES Integration Layer**: Circuit Breaker, Idempotency token (UUID/Correlation ID), Retry với Exponential Backoff & Jitter.
- **Persistence**: IndexedDB / LocalStorage với schema phân lớp (Device Master, Transaction Log, Alarm Log, Audit Trail, Configuration Store).
- **Localization**: Hệ thống i18n chuyên dụng cho 4 ngôn ngữ (Tiếng Việt, English, 한국어, 简体中文).

---

## 3. Rủi ro & Chiến lược Xử lý (Risk Mitigation)
| Rủi ro kỹ thuật | Mức độ | Biện pháp giải quyết |
| :--- | :--- | :--- |
| **TCP Fragmentation & Coalescing** (1 frame đến qua nhiều chunk hoặc nhiều frame ghép 1 chunk) | Cực cao | Sử dụng Ring Buffer / Bounded Accumulator kết hợp xác thực STX/ETX và Length Header trước khi cắt frame. |
| **Xung đột Frame 20.013 vs 20.014 bytes** | Cao | Triển khai Dual-spec Parser với dynamic padding detector và checksum recalculation độc lập. |
| **MES Latency / Downtime** | Cao | Circuit Breaker (Closed / Open / Half-Open) kết hợp Dead-Letter Queue (DLQ) và Outbox Pattern, không chặn socket loop của thiết bị. |
| **Nghẽn UI khi lưu lượng message cao** | Cao | Throttling UI updates (60fps requestAnimationFrame), virtualized table, offload analytics. |
| **Mất kết nối đột ngột của thiết bị** | Trung bình | Heartbeat Watchdog timer + Keep-alive ping, Reconnect policy exponential backoff. |

---

## 4. Lộ trình Triển khai (Execution Roadmap)
- [x] **Phase 1: Discovery & Analysis** - Kiểm tra môi trường, phân tích cấu trúc, tạo tài liệu phân tích.
- [x] **Phase 2: Architecture & Protocols** - Đặc tả frame, message codes (M001, S000, S002, S005, S030, S040), checksum algorithms.
- [x] **Phase 3: Core Communication Engine** - Quản lý Session, TCP parser, buffer chống tràn, reconnect watchdog.
- [x] **Phase 4: MES Integration & Business Engine** - Handshake, Recipe validation, Carrier/PCB Move-In/Move-Out, Safety interlocks.
- [x] **Phase 5: Persistence, Audit & Alarms** - Local DB, Correlation ID tracking, Alarm lifecycle (Active, Ack, Cleared).
- [x] **Phase 6: Industrial UI/UX & 4-Language Localization** - Dashboard KPI, Hex Monitor, Protocol Workbench, Device Manager, vi/en/ko/zh switcher (100% key parity).
- [x] **Phase 7: Comprehensive Testing & Verification** - Unit tests cho parser/checksum, simulation tests cho multi-device concurrency.
- [x] **Phase 8: Enterprise Master Table Schema & Tabless Form Architecture** - Chuẩn hóa 18 cột Master Table (ITM Industrial Schema), sao chép/dán TSV từ Excel, trích xuất CSV, tự động phân nhóm thiết bị, tái cấu trúc modal Thêm/Sửa theo hệ lưới 6 cột căn thẳng hàng, nhãn ngắn gọn và chuyển đổi 4 ngôn ngữ trực tiếp trong modal.
