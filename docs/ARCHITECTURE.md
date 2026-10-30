# MC SERVER ENTERPRISE - ARCHITECTURE DESIGN

## 1. Modular Layered Architecture

Hệ thống được thiết kế theo mô hình phân tầng chặt chẽ (Clean Layered Architecture), tuân thủ nguyên tắc SOLID, Dependency Inversion và Decoupling:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│    (Industrial Control Center UI - React 19 + Tailwind v4)  │
│    - Error Boundary Container (Crash Isolation)             │
│    - Dynamic Code-Splitting (React.lazy / Rolldown Chunks)  │
│    - Virtualized & Memoized Transaction Table               │
└──────────────────────────────┬──────────────────────────────┘
                               │ UI State & Actions (SSE <50ms)
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Layer                        │
│   (State Orchestrator, Session Manager, i18n, User RBAC)    │
│   - Throttled Device Sync (30s Interval)                    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Communication Layer     ││        Business Layer        │
│ - TCP Session Manager       ││ - Handshake Validator        │
│ - Socket Watchdog (Keepalive││ - Recipe / Parameter Checker │
│ - Ring Buffer & Slicer      ││ - Group Category Matching    │
│ - Exponential Backoff Reconn││   (EIF_OPER_GROUP = EQP_GRP) │
│ - 1,000+ Sockets Concurrency││ - Interlock Safety Guard     │
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│        Protocol Layer       ││     MES Integration Layer    │
│ - Industrial Frame Decoder  ││ - Outbox Pattern & Queue     │
│ - Checksum Engine (LRC/CRC) ││ - Circuit Breaker            │
│ - 20013 vs 20014 Boundary   ││ - Correlation ID Tracer      │
│ - Payload Serialization     ││ - Scan History Auto-ApplyFlag│
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│             Persistence & Oracle Database Layer             │
│ - Oracle Service with On-demand Lazy Connection Pooling     │
│ - Multi-TNS Routing (ITMVMES, ITMMES, ITMSEMIMES, ITMDEV)   │
│ - 45s Heartbeat Ping (SELECT 1 FROM DUAL) & Auto-Reconnect  │
│ - Thick Mode Instant Client (Verifier 0x939 for 11g/12c)    │
│ - IndexedDB Storage Engine (Device Master, Logs, Alarms)    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Key Components
1. **Device Session Engine**: Duy trì trạng thái độc lập của từng máy trạm. Nếu máy trạm SMT-01 gặp sự cố mất mạng hoặc frame bị hỏng, session của SMT-02 và AOI-01 hoàn toàn không bị ảnh hưởng.
2. **Buffer Stream Slicer**: Xử lý tình trạng TCP Streaming khi mạng bị phân mảnh (TCP Fragmentation: 1 gói đến làm 3-4 lần đọc) hoặc dồn gói (TCP Coalescing: 2 gói gộp làm 1 lần đọc).
3. **MES Resiliency Circuit Breaker**: Khi hệ thống MES nhà máy bị nghẽn (quá 3 lần timeout 3000ms), Circuit Breaker chuyển sang trạng thái `OPEN`, định tuyến các giao dịch vào buffer hàng đợi và không gây sập kết nối thiết bị.
4. **Localization Engine**: Hỗ trợ chuyển đổi tức thì 4 ngôn ngữ (Tiếng Việt `vi-VN`, English `en-US`, 한국어 `ko-KR`, 简体中文 `zh-CN`) với độ phủ 100% (642 keys mỗi ngôn ngữ).
5. **Device Master Data & TSV/CSV Sync Engine**: Đồng bộ bảng dữ liệu thiết bị 18 cột theo đặc tả nhà máy công nghiệp (ITM Industrial Schema), hỗ trợ sao chép / dán TSV từ Excel, trích xuất CSV và tự động phân nhóm thiết bị (`device_groups`).
6. **Unified Industrial Form Architecture**: Thiết kế modal không phân tab, tổ chức theo hệ thống lưới 6 cột căn chỉnh thẳng hàng tuyệt đối (pixel-perfect alignment), nhãn ngắn gọn chống tràn dòng và tích hợp bộ chọn ngôn ngữ trực tiếp ngay trong header modal.

---

## 3. Backend High-Availability & Oracle Database Integration
1. **On-Demand Lazy Connection Pooling**:
   - Thay vì khởi tạo tĩnh toàn bộ các TNS gây lãng phí socket, `OracleService` triển khai phương thức `getOrCreatePool(targetTns)`. Khi nghiệp vụ yêu cầu query đến `ITMVMES`, `ITMMES`, `ITMSEMIMES` hoặc `ITMDEV`, pool tương ứng sẽ được khởi tạo độc lập và gán vào cache memory.
2. **Cơ chế Tự Động Phục Hồi Kết Nối (Auto-Reconnect)**:
   - Khi truy vấn gặp lỗi rớt mạng hoặc đứt session (`ORA-03113`, `ORA-03114`, `NJS-510`, `ORA-12541`, `ORA-12170`), service tự động đóng pool hỏng, xóa khỏi cache, tái tạo pool mới và retry lại transaction một lần duy nhất.
3. **Heartbeat Keep-Alive định kỳ 45s**:
   - Chạy timer ngầm `SELECT 1 FROM DUAL` trên các pool đang hoạt động để giữ kết nối xuyên suốt qua hệ thống Firewall nhà máy, chống timeout khi máy nghỉ ngơi ca đêm.
4. **Hỗ trợ Oracle Thick Mode (Client 12.2 / 11g)**:
   - Nạp native library qua `oracledb.initOracleClient()` để tương thích mật khẩu verifier `0x939` của Oracle Database nhà máy.

---

## 4. MES Interlock & Group Category Matching
1. **Kiểm Tra Nhóm Công Đoạn vs Thiết Bị (`ADM_GROUP_CATEGORY_DATA`)**:
   - Truy vấn 1: `SELECT GROUP_VALUE FROM ADM_GROUP_CATEGORY_DATA WHERE PLANT='ITMVIET' AND GROUP_TARGET='OPERATION' AND GROUP_OBJECT=:operation AND GROUP_INDEX='22' AND GROUP_CATEGORY='EIF_OPER_GROUP'`
   - Truy vấn 2: `SELECT GROUP_VALUE FROM ADM_GROUP_CATEGORY_DATA WHERE PLANT='ITMVIET' AND GROUP_TARGET='EQUIPMENT' AND GROUP_OBJECT=:equipmentId AND GROUP_INDEX='13' AND GROUP_CATEGORY='EIF_EQP_GROUP'`
   - **Quy tắc**: Nếu 2 giá trị `GROUP_VALUE` khác nhau hoặc không tìm thấy, hệ thống chặn mở chốt máy và trả về cảnh báo chi tiết: `"Mã công đoạn [{oper}] (Nhóm: {operGroup}) và thiết bị [{equip}] (Nhóm: {equipGroup}) không cùng nhóm phân loại nghiệp vụ"`.
2. **Quản Lý Lịch Sử Quét MES (`AFA_SEMI_WB_SCAN_HIS`)**:
   - Khi ghi nhận lượt quét mã vạch mới, hệ thống tự động chạy lệnh cập nhật bản ghi cũ có cùng `(EQUIPMENT_ID, EQUIPMENT_TYPE, EQUIPMENT_GROUP, OPERATION, BARCODE_TYPE, BARCODE_ID)` về `APPLY_FLAG = 'N'`.
   - Chèn bản ghi mới với `APPLY_FLAG = 'Y'` để đảm bảo duy nhất 1 bản ghi có hiệu lực tại một thời điểm.

---

## 5. Frontend Performance & Resilience Architecture
1. **Error Boundary Container**:
   - `ErrorBoundary.tsx` bao bọc toàn bộ dynamic viewport của ứng dụng, cách ly mọi lỗi phát sinh từ component con, hiển thị giao diện phục hồi chuyên nghiệp với nút *"Thử lại giao diện"*.
2. **Code-Splitting với React.lazy & Rolldown Chunks**:
   - Tách các module phụ (`interlock-history`, `users`, `system-health`, `logs`, `alarms`, `protocol`, `configuration`, `mes`) thành các file chunk riêng biệt.
   - Kích thước bundle chính giảm từ **789 kB xuống còn 388 kB** (nén Gzip chỉ còn **94 kB**).
3. **Tối Ưu Bảng Giao Dịch (`TransactionTable`)**:
   - Component `TransactionTableRow` được bọc `React.memo` với custom comparator ngăn ngừa re-render thừa cho 499 dòng khi có dòng mới từ SSE.
   - Tích hợp thanh phân trang linh hoạt (`50`, `100`, `200`, `Tất cả`), giảm tải DOM từ 4,500 nodes xuống còn 450 nodes.
4. **Throttled Device Sync**:
   - Nâng chu kỳ đồng bộ thiết bị từ 4s lên 30s, giảm 87% lượng request HTTP REST mà vẫn đảm bảo tính kịp thời của dữ liệu trạng thái máy.
