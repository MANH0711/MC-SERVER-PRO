# MC Server Industrial Enterprise Edition

> **A mission-critical Manufacturing Communication (MC) Server for high-throughput smart factory shopfloors.**
> Coordinates bi-directional TCP/IP communication with production equipment, implements strict framing & checksum verification, provides resilient MES integration with Circuit Breaker, and offers a premium Industrial Control Center interface supporting 4 languages (**Tiếng Việt**, **English**, **한국어**, **简体中文**).

---

## 1. Key Capabilities & Architecture

- **High-Performance TCP/IP Framing Engine**:
  - Handles TCP fragmentation (frames arriving in multiple chunks) and TCP coalescing (multiple frames in single packet).
  - Dual boundary support for **20.013 bytes** (Standard ETX `0x03`) and **20.014 bytes** (Extended ETX + LF `0x0A` or Null `0x00`) with auto-boundary detection to prevent ring buffer drift.
  - Checksum validation: LRC (Modulo 256), XOR (8-bit), and CRC16-CCITT.
- **Production Shopfloor Business Handshakes**:
  - `M001 / M002`: Periodic keepalive and readiness handshake.
  - `S000 / S001`: Carrier / Magazine inquiry and dispatch authorization.
  - `S002 / S003`: Recipe & parameter tolerance validation with MES.
  - `S005 / S006`: Station Move-In permission handshake with upstream step interlock verification.
  - `S030 / S031`: Station Move-Out, cycle time logging, and defect classification.
  - `S040 / S041`: Machine alarm and emergency interlock event recording.
- **Resilient MES Integration Layer**:
  - Three-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF-OPEN`) preventing cascading socket failures during upstream network sluggishness.
  - Outbox Retry Queue buffer for zero-loss offline store-and-forward.
  - Percentile latency monitoring (Median p50, 95th, 99th percentile).
- **Industrial Control Center UI**:
  - Built with React 19, TypeScript, Tailwind CSS v4, Lucide icons, and IBM Plex Sans + JetBrains Mono typography.
  - Real-time packet sniffer with Hex Dump offset inspector (`0000 02 30 30...`), ASCII decode, and structured JSON tree view.
  - Protocol Diagnostic Workbench with frame construction, decoding, and direct socket injection.
  - 4-language instantaneous dynamic translation without page reload.
  - Full Role-Based Access Control (RBAC): `OPERATOR`, `SUPERVISOR`, `ENGINEER`, `ADMIN`.

---

## 2. Directory Structure

```text
├── docs/
│   ├── PROJECT_ANALYSIS.md        # Initial state analysis and implementation plan
│   ├── ARCHITECTURE.md            # Modular layered architecture specifications
│   ├── PROTOCOL_SPECIFICATION.md  # Binary framing, message codes, and checksum specs
│   ├── DATA_FLOW.md               # End-to-end data flow and sequence diagrams
│   ├── DATABASE_SCHEMA.md         # Database schema for devices, tx logs, and alarms
│   ├── LOCALIZATION.md            # Multi-language implementation standards
│   ├── TROUBLESHOOTING.md         # Field troubleshooting and diagnosis guide
│   ├── DEPLOYMENT.md              # Factory production deployment guidelines
│   ├── SECURITY.md                # Cybersecurity and RBAC permission matrix
│   └── TEST_PLAN.md               # Comprehensive verification and test cases
├── config/
│   └── server-config.example.json # Sample production server configuration
├── src/
│   ├── types/                     # Core TypeScript domain models & interfaces
│   ├── protocol/                  # Industrial frame encoder, parser, and checksums
│   ├── communication/             # Multi-device session manager & socket engine
│   ├── business/                  # Production business logic and handshakes
│   ├── mes/                       # MES adapter with Circuit Breaker and Outbox
│   ├── storage/                   # Database seed and persistent storage layer
│   ├── i18n/                      # 4-language dictionaries (vi, en, ko, zh)
│   ├── context/                   # Central React application orchestrator
│   └── components/                # Industrial control center UI components
│       ├── Sidebar.tsx            # High-density collapsible navigation
│       ├── TopBar.tsx             # Plant breadcrumbs, clock, status, lang switcher
│       ├── StatusBar.tsx          # Real-time socket telemetry & memory stats
│       └── views/                 # 10 dedicated operational views
└── README.md
```

---

## 3. Running & Verifying the Application

### Development Server
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to interact with the MC Server Enterprise console.

### Build Production Bundle
```bash
npm run build
npm run preview
```

### Self-Test Diagnostics
Go to **System Health** view in the sidebar and click **Run Self-Test Diagnostics** to verify:
1. TCP Stream Slicer & Coalescing Ring Buffer
2. Dual-Boundary 20.013 vs 20.014 detection
3. Industrial Checksum Engine (LRC & CRC16)
4. MES Circuit Breaker State Transition
5. Multi-device Session Isolation
