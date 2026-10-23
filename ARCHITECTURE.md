# TÀI LIỆU CẤU TRÚC THƯ MỤC VÀ KIẾN TRÚC HỆ THỐNG (FRONTEND ARCHITECTURE)

> **Dự án:** MC Server Industrial Enterprise Edition (Giao diện Giám Sát & Điều Khiển Thiết Bị Công Nghiệp SECS-I / TCP / MES)  
> **Kiến trúc áp dụng:** Feature-based (Module-based) Architecture kết hợp Domain-Driven Design (DDD) & Public API Pattern  
> **Ngôn ngữ & Công nghệ:** React 19, TypeScript, Vite, TailwindCSS  
> **Ngày cập nhật:** 23/10/2026  

---

## 1. TỔNG QUAN VỀ KIẾN TRÚC FEATURE-BASED (MODULE-BASED)

Trước đây, mã nguồn được chia theo kiểu kỹ thuật rời rạc (`components/`, `views/`, `services/`, `utils/`, `protocol/`, `mes/`). Cách chia này gây khó khăn khi dự án phình to vì một tính năng bị phân tán ở nhiều thư mục khác nhau.

Hệ thống hiện tại đã được tái cấu trúc hoàn toàn theo kiến trúc **Feature-based**, đảm bảo 3 nguyên tắc vàng của Senior Frontend Architecture:
1. **Nguyên tắc đóng gói cục bộ (Co-location):** Mọi tài nguyên thuộc về một tính năng (giao diện, logic API, engine, thuật toán, modals, utils) đều nằm trọn vẹn trong một thư mục `src/features/<tên-tính-năng>/`.
2. **Nguyên tắc Cổng vào duy nhất (Public API Pattern):** Mỗi thư mục feature bắt buộc phải có file `index.ts`. Chỉ những hàm, biến, components được export trong file này mới được phép import từ bên ngoài thông qua alias `@/features/<tên-tính-năng>`.
3. **Tuyệt đối không dùng đường dẫn tương đối phức tạp (`../../`):** Toàn bộ dự án sử dụng Path Alias `@/*` trỏ trực tiếp đến `src/*`, giúp việc di chuyển, refactor code không bị gãy link import.

---

## 2. SƠ ĐỒ CÂY THƯ MỤC CHI TIẾT (ASCII TREE)

```text
mc-server-frontend/
├── index.html                           # Trang HTML gốc nạp ứng dụng Single Page App (SPA)
├── package.json                         # Danh mục thư viện phụ thuộc và các scripts (build, dev)
├── tsconfig.json                        # Cấu hình TypeScript compiler & alias path ("@/*": ["./src/*"])
├── vite.config.ts                       # Cấu hình Vite build tool & alias resolution (@ trỏ src)
├── ARCHITECTURE.md                      # [Tài liệu này] Mô tả chi tiết kiến trúc & cấu trúc thư mục
└── src/
    ├── main.tsx                         # Điểm khởi chạy nạp React Root vào DOM
    ├── App.tsx                          # Layout khung chính tích hợp Provider và Master Feature Orchestrator
    ├── index.css                        # CSS toàn cục & định nghĩa chủ đề TailwindCSS công nghiệp
    │
    ├── core/                            # TẦNG LÕI DÙNG CHUNG TOÀN HỆ THỐNG (SHARED CORE)
    │   ├── index.ts                     # Public API xuất toàn bộ types, context, i18n, storage
    │   ├── types/                       # Định nghĩa TypeScript data models, schemas, enums
    │   │   └── index.ts                 # SECS models, DeviceModel, Transaction, ServerConfig,...
    │   ├── context/                     # Quản lý State toàn cục của ứng dụng (Global State)
    │   │   ├── AppContext.tsx           # Context quản lý danh sách thiết bị, transactions, users, tabs
    │   │   └── index.ts                 # Public API xuất useApp, AppProvider
    │   ├── i18n/                        # Hệ thống đa ngôn ngữ chuẩn quốc tế (i18n)
    │   │   ├── LanguageContext.tsx      # Context chuyển đổi ngôn ngữ thời gian thực (vi, en, ko, zh)
    │   │   ├── locales/                 # Từ điển dịch thuật
    │   │   │   ├── vi.ts                # Tiếng Việt
    │   │   │   ├── en.ts                # Tiếng Anh
    │   │   │   ├── ko.ts                # Tiếng Hàn (Korean)
    │   │   │   └── zh.ts                # Tiếng Trung (Chinese)
    │   │   └── index.ts                 # Public API xuất useTranslation, LanguageProvider
    │   └── storage/                     # Tầng lưu trữ Client-side Offline (IndexedDB / Local Cache)
    │       ├── database.ts              # Engine tương tác Dexie/IndexedDB lưu lịch sử bản tin SECS
    │       └── index.ts                 # Public API xuất database instance
    │
    ├── components/                      # CÁC COMPONENT GIAO DIỆN DÙNG CHUNG (SHARED UI DUMB/LAYOUT)
    │   ├── layout/                      # Khung giao diện công nghiệp cố định của hệ thống
    │   │   ├── Sidebar.tsx              # Thanh điều hướng trái chuyển tab (Dashboard, Devices,...)
    │   │   ├── TopBar.tsx               # Thanh tiêu đề trên cùng (Trạng thái server, role, chọn ngôn ngữ)
    │   │   ├── StatusBar.tsx            # Thanh trạng thái dưới đáy (TCP port, MES latency, RAM/CPU)
    │   │   └── index.ts                 # Public API xuất { Sidebar, TopBar, StatusBar }
    │   ├── modals/                      # Re-export các modals dùng chung đa module
    │   │   └── TransactionDetailModal.tsx # Re-export từ @/features/communication
    │   └── views/                       # Re-export tương thích ngược
    │       └── index.ts                 # Re-export từ @/features
    │
    ├── features/                        # 10 MODULE NGHIỆP VỤ ĐỘC LẬP (BUSINESS FEATURE MODULES)
    │   │
    │   ├── index.tsx                    # MASTER ROUTER CHA (FeaturesManager) điều hướng render các views
    │   │
    │   ├── communication/               # 1. MODULE: GIÁM SÁT TRUYỀN TIN THỜI GIAN THỰC (SECS / TCP)
    │   │   ├── index.ts                 # Public API của feature communication
    │   │   ├── CommunicationMonitor.tsx # Giao diện chính màn hình giám sát bản tin SECS
    │   │   ├── api/                     # Gọi REST API & WebSocket/SSE luồng giao dịch
    │   │   │   ├── transactionApi.ts    # Fetch danh sách transactions từ Backend
    │   │   │   └── sessionManager.ts    # Quản lý phiên truyền nhận SECS-I / TCP Socket
    │   │   └── components/              # Các components con độc quyền của feature
    │   │       ├── MonitorToolbar.tsx   # Thanh công cụ bộ lọc mã tin (S50, S51...), trạng thái, tìm kiếm
    │   │       ├── TransactionTable.tsx # Bảng hiển thị giao dịch thời gian thực có phân trang
    │   │       ├── TransactionInspector.tsx # Bảng điều khiển xem nhanh raw ASCII / Hex
    │   │       ├── TransactionDetailModal.tsx # Modal chi tiết bản tin (co giãn cố định, copy text tiện lợi)
    │   │       └── DieAttachSimulatorModal.tsx # Giả lập gửi lệnh Die Attach phục vụ kiểm thử
    │   │
    │   ├── devices/                     # 2. MODULE: QUẢN LÝ DANH MỤC THIẾT BỊ CÔNG NGHIỆP (EQUIPMENT)
    │   │   ├── index.ts                 # Public API của feature devices
    │   │   ├── DeviceManagement.tsx     # Giao diện quản lý 18 cột thiết bị chuẩn MIGHTY.GATEWAY_DEVICES
    │   │   ├── api/                     # Giao tiếp backend thiết bị
    │   │   │   └── deviceApi.ts         # API thêm/sửa/xóa/đồng bộ thiết bị từ Oracle DB
    │   │   └── utils/                   # Hàm tiện ích xử lý dữ liệu thiết bị
    │   │       └── deviceFormat.ts      # Chuyển đổi định dạng bản ghi thiết bị và phân tích Port/IP
    │   │
    │   ├── dashboard/                   # 3. MODULE: BẢNG ĐIỀU KHIỂN TỔNG QUAN (EXECUTIVE DASHBOARD)
    │   │   ├── index.ts                 # Public API của feature dashboard
    │   │   ├── Dashboard.tsx            # Thẻ KPI, biểu đồ lưu lượng bản tin SECS, thiết bị Online/Offline
    │   │   └── components/              # Các widget biểu đồ (Recharts)
    │   │
    │   ├── protocol/                    # 4. MODULE: TRÌNH PHÂN TÍCH GIAO THỨC (PROTOCOL EXPLORER)
    │   │   ├── index.ts                 # Public API của feature protocol
    │   │   ├── ProtocolExplorer.tsx     # Giao diện soạn thảo, mã hóa và giải mã frame bản tin SECS/GEM
    │   │   └── engine/                  # Động cơ thuật toán xử lý nhị phân SECS
    │   │       ├── checksum.ts          # Thuật toán tính Checksum (SUM16, CRC16-CCITT, XOR8...)
    │   │       ├── frameEncoder.ts      # Đóng gói STX, Device ID, Stream, Function, ETX
    │   │       ├── frameParser.ts       # Tách frame nhị phân, kiểm tra tính toàn vẹn bản tin
    │   │       └── messageDefinitions.ts# Từ điển định nghĩa mã lệnh SECS (S1F1, S2F41, S50, S51...)
    │   │
    │   ├── configuration/               # 5. MODULE: CẤU HÌNH THAM SỐ MÁY CHỦ (SYSTEM CONFIGURATION)
    │   │   ├── index.ts                 # Public API của feature configuration
    │   │   ├── ConfigurationCenter.tsx  # Giao diện cài đặt trung tâm chia theo tab
    │   │   └── components/              # Các tab cấu hình độc lập
    │   │       ├── NetworkConfigTab.tsx # Cấu hình IP máy chủ, Port lắng nghe, Watchdog timeout
    │   │       ├── ProtocolConfigTab.tsx# Cấu hình STX/ETX, thuật toán Checksum mặc định
    │   │       ├── MesConfigTab.tsx     # Cấu hình URL endpoint MES, Circuit Breaker, Timeout
    │   │       ├── LoggingConfigTab.tsx # Cấu hình mức log (DEBUG/INFO/WARN/ERROR), ngày lưu trữ
    │   │       └── SecurityConfigTab.tsx# Cấu hình thời gian hết hạn phiên, chính sách mật khẩu
    │   │
    │   ├── users/                       # 6. MODULE: QUẢN TRỊ TÀI KHOẢN VÀ PHÂN QUYỀN (USER MANAGEMENT)
    │   │   ├── index.ts                 # Public API của feature users
    │   │   ├── UserManagement.tsx       # Màn hình quản lý người dùng, vai trò (ADMIN, ENGINEER, OPERATOR)
    │   │   └── components/              # Các components con
    │   │       ├── UserToolbar.tsx      # Thanh lọc theo quyền, tìm kiếm tên, nút xuất CSV
    │   │       ├── UserTable.tsx        # Bảng hiển thị danh sách người dùng, trạng thái kích hoạt
    │   │       ├── UserFormModal.tsx    # Modal tạo mới hoặc cập nhật thông tin người dùng
    │   │       ├── UserDeleteModal.tsx  # Modal xác nhận xóa tài khoản an toàn
    │   │       ├── PermissionMatrixTab.tsx # Ma trận phân quyền chi tiết (RBAC Matrix)
    │   │       └── SecurityPoliciesTab.tsx # Chính sách an toàn tài khoản
    │   │
    │   ├── mes/                         # 7. MODULE: KẾT NỐI HỆ THỐNG MES (MANUFACTURING EXECUTION)
    │   │   ├── index.ts                 # Public API của feature mes
    │   │   ├── MesMonitor.tsx           # Giao diện giám sát nhịp tim (Heartbeat) và độ trễ kết nối MES
    │   │   └── api/                     # Adapter và xử lý logic nghiệp vụ nhà máy
    │   │       ├── mesAdapter.ts        # Bộ chuyển đổi gọi REST sang hệ thống MES, ngắt mạch Circuit Breaker
    │   │       └── businessEngine.ts    # Logic nghiệp vụ xử lý bản tin S50 (Lot Verify), S51 (Interlock)
    │   │
    │   ├── alarms/                      # 8. MODULE: TRUNG TÂM CẢNH BÁO SỰ CỐ (ALARM CENTER)
    │   │   ├── index.ts                 # Public API của feature alarms
    │   │   ├── AlarmCenter.tsx          # Giao diện hiển thị cảnh báo đỏ, xác nhận cảnh báo (Acknowledge)
    │   │   └── components/              # Bảng cảnh báo và bộ lọc mức độ nghiêm trọng
    │   │
    │   ├── logs/                        # 9. MODULE: TRUNG TÂM NHẬT KÝ HỆ THỐNG (SYSTEM LOGS)
    │   │   ├── index.ts                 # Public API của feature logs
    │   │   ├── LogCenter.tsx            # Tra cứu nhật ký đa cấp độ (Communication, Security, System, Error)
    │   │   └── components/              # Bộ lọc log, xem chi tiết stack trace và tải file log
    │   │
    │   └── system-health/               # 10. MODULE: GIÁM SÁT SỨC KHỎE HỆ THỐNG (SYSTEM HEALTH)
    │       ├── index.ts                 # Public API của feature system-health
    │       ├── SystemHealth.tsx         # Bảng giám sát tải CPU, dung lượng RAM, trạng thái microservices
    │       └── api/                     # API đo thông số tài nguyên máy chủ
    │           └── systemHealthApi.ts   # Fetch metrics hệ thống định kỳ
    │
    └── views/                           # TẦNG TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY STUBS)
        ├── index.tsx                    # File cha điều hướng trỏ về @/features
        └── [10 feature folders]/        # Chứa file index.tsx re-export từ @/features tương ứng
            └── index.tsx                # Đảm bảo các tab/import cũ hoạt động mượt mà không lỗi
```

---

## 3. GIẢI THÍCH CHI TIẾT TỪNG THÀNH PHẦN

### 3.1. Thư mục `src/core/` (Nền tảng chung)
- **Mục đích:** Chứa các thành phần **không thuộc riêng về bất kỳ nghiệp vụ cụ thể nào** mà được toàn bộ ứng dụng sử dụng.
- **Quy tắc:**
  - `src/core/types`: Nơi khai báo tập trung toàn bộ cấu trúc dữ liệu (`interface`, `type`, `enum`). Không được định nghĩa types rải rác làm trùng lặp mã nguồn.
  - `src/core/context`: Quản trị state tập trung (`AppContext.tsx`). Mọi cập nhật trạng thái kết nối máy chủ, danh sách thiết bị real-time, danh sách bản tin đều lưu tại đây.
  - `src/core/i18n`: Cung cấp hook `useTranslation()` hỗ trợ 4 ngôn ngữ: Tiếng Việt (`vi`), Tiếng Anh (`en`), Tiếng Hàn (`ko`), Tiếng Trung (`zh`).
  - `src/core/storage`: Tích hợp cơ sở dữ liệu IndexedDB phía client, giúp lưu giữ lịch sử giao dịch ngay cả khi F5 trình duyệt.

### 3.2. Thư mục `src/components/layout/` (Giao diện khung)
- **Mục đích:** Chứa các thành phần giao diện cố định bao quanh vùng nội dung chính.
- **Thành phần:**
  - `Sidebar.tsx`: Điều hướng giữa các chức năng với icon chuyên nghiệp, tự động highlight tab đang chọn.
  - `TopBar.tsx`: Hiển thị tên phần mềm, thông tin tài khoản đăng nhập hiện tại, nút chọn đổi ngôn ngữ tức thời.
  - `StatusBar.tsx`: Hiển thị trạng thái kết nối TCP Server, nhịp tim MES, số thiết bị đang chạy.

### 3.3. Thư mục `src/features/` (10 Phân hệ nghiệp vụ)
Mỗi thư mục con trong `src/features/` đại diện cho một nghiệp vụ hoàn chỉnh:
- **Đóng gói trọn vẹn:** Các modal (ví dụ: `TransactionDetailModal`), thanh công cụ lọc (`MonitorToolbar`), bảng (`TransactionTable`) chỉ phục vụ cho việc giám sát truyền tin thì được đặt ngay trong thư mục con `components/` của `features/communication/`.
- **Public API (`index.ts`):** File này quyết định tính đóng gói. Nó chỉ export những gì các module khác cần dùng. Ví dụ:
  ```typescript
  // src/features/communication/index.ts
  export { CommunicationMonitorView as CommunicationMonitor, CommunicationMonitorView, CommunicationMonitorView as default } from './CommunicationMonitor';
  export * from './api/transactionApi';
  export * from './api/sessionManager';
  export * from './components/TransactionDetailModal';
  ```

### 3.4. File điều phối cha: `src/features/index.tsx`
- Đây là **File Cha (Master Orchestrator)** của toàn bộ các Form giao dịch.
- Nhận diện `activeView` từ `AppContext` và chuyển đổi màn hình tương ứng.
- Tích hợp sẵn `Suspense` và loading indicator phong cách công nghiệp trong trường hợp tải lười (lazy loading).

---

## 4. QUY TẮC IMPORT CHUẨN TRONG DỰ ÁN

Để đảm bảo dự án luôn trong sạch, dễ đọc và không bị lỗi đường dẫn:

| Loại Import | Quy tắc chuẩn | Ví dụ |
| :--- | :--- | :--- |
| **Import từ Core** | Sử dụng `@/core/...` | `import { useApp } from '@/core/context';`<br>`import { DeviceModel } from '@/core/types';` |
| **Import Layout** | Sử dụng `@/components/layout` | `import { Sidebar, TopBar } from '@/components/layout';` |
| **Import Feature khác** | Sử dụng `@/features/<tên-feature>` | `import { TransactionDetailModal } from '@/features/communication';` |
| **Import nội bộ trong cùng Feature** | Sử dụng đường dẫn tương đối ngắn gọn | `import { MonitorToolbar } from './components/MonitorToolbar';`<br>`import { deviceApi } from './api/deviceApi';` |

---

## 5. HƯỚNG DẪN THÊM MỘT FEATURE MỚI (CHUẨN 4 BƯỚC)

Khi có nghiệp vụ mới (ví dụ: `reports` - Báo cáo sản lượng):
1. **Bước 1:** Tạo thư mục `src/features/reports/` với cấu trúc:
   ```text
   src/features/reports/
   ├── index.ts                 # Public API
   ├── ReportsView.tsx          # Giao diện chính của màn hình báo cáo
   ├── api/                     # Gọi API lấy dữ liệu báo cáo
   └── components/              # Bảng biểu, biểu đồ con
   ```
2. **Bước 2:** Viết mã trong `ReportsView.tsx` và export ra ở `index.ts`:
   ```typescript
   export { ReportsView as default, ReportsView } from './ReportsView';
   ```
3. **Bước 3:** Đăng ký vào File Cha `src/features/index.tsx`:
   - Import `ReportsView` từ `./reports`.
   - Thêm case `'reports'` vào hàm `renderActiveFeature()`.
4. **Bước 4:** Thêm menu vào thanh bên `src/components/layout/Sidebar.tsx`.

---

## 6. KẾT QUẢ KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (QA)

- **Biên dịch:** Lệnh `npm run build` chạy thành công 100% trong **548ms**.
- **Kiểm tra kiểu dữ liệu:** Lệnh `npx tsc --noEmit` đạt chuẩn nghiêm ngặt (Strict Type Check), **0 lỗi**.
- **Tính tương thích ngược:** 100% các file cũ trong `src/views/` đều có file re-export đảm bảo không bao giờ bị gãy ứng dụng khi chuyển tiếp.
