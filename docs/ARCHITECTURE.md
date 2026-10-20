# MC SERVER ENTERPRISE - ARCHITECTURE DESIGN

## 1. Modular Layered Architecture

Hệ thống được thiết kế theo mô hình phân tầng chặt chẽ (Clean Layered Architecture), tuân thủ nguyên tắc SOLID, Dependency Inversion và Decoupling:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│    (Industrial Control Center UI - React 19 + Tailwind v4)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ UI State & Actions
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Layer                        │
│   (State Orchestrator, Session Manager, i18n, User RBAC)    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Communication Layer     ││        Business Layer        │
│ - TCP Session Manager       ││ - Handshake Validator        │
│ - Socket Watchdog           ││ - Recipe / Parameter Checker │
│ - Ring Buffer & Fragmentation││ - Carrier Move-In/Out Engine │
│ - Exponential Backoff Reconn││ - Interlock Safety Guard     │
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│        Protocol Layer       ││     MES Integration Layer    │
│ - Industrial Frame Decoder  ││ - Outbox Pattern & Queue     │
│ - Checksum Engine (LRC/CRC) ││ - Circuit Breaker            │
│ - 20013 vs 20014 Boundary   ││ - Correlation ID Tracer      │
│ - Payload Serialization     ││ - Mock & Real REST/gRPC Adap │
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│             Persistence & Diagnostics Layer                 │
│ - IndexedDB Storage Engine (Device Master, Logs, Alarms)    │
│ - Structured Logger & Performance Percentiles (p50/95/99)   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Key Components
1. **Device Session Engine**: Duy trì trạng thái độc lập của từng máy trạm. Nếu máy trạm SMT-01 gặp sự cố mất mạng hoặc frame bị hỏng, session của SMT-02 và AOI-01 hoàn toàn không bị ảnh hưởng.
2. **Buffer Stream Slicer**: Xử lý tình trạng TCP Streaming khi mạng bị phân mảnh (TCP Fragmentation: 1 gói đến làm 3-4 lần đọc) hoặc dồn gói (TCP Coalescing: 2 gói gộp làm 1 lần đọc).
3. **MES Resiliency Circuit Breaker**: Khi hệ thống MES nhà máy bị nghẽn (quá 3 lần timeout 3000ms), Circuit Breaker chuyển sang trạng thái `OPEN`, định tuyến các giao dịch vào buffer hàng đợi và không gây sập kết nối thiết bị.
4. **Localization Engine**: Hỗ trợ chuyển đổi tức thì 4 ngôn ngữ (Tiếng Việt `vi-VN`, English `en-US`, 한국어 `ko-KR`, 简体中文 `zh-CN`) mà không cần tải lại trang.
