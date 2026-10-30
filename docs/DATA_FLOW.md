# MC SERVER ENTERPRISE - DATA FLOW SPECIFICATION

## 1. Luồng Giao tiếp Thiết bị -> MC Server -> MES (Move-In Handshake S005/S006)

```
[Equipment / PLC]          [MC Server TCP Core]          [Business / Parser]          [MES System]
       │                             │                            │                         │
       │─── 1. S005 Raw Frame ──────>│                            │                         │
       │    (STX..EQP..S005..ETX)    │                            │                         │
       │                             │─── 2. Slice & Checksum ───>│                         │
       │                             │    Verify LRC & Length     │                         │
       │                             │                            │── 3. Validate Recipe ──>│
       │                             │                            │   & Interlock Status    │
       │                             │                            │<──4. Return Pass/NG ────│
       │                             │<── 5. Generate S006 Frame ─│   (Lot Authorized)      │
       │<── 6. S006 Grant Move-In ───│                            │                         │
       │    (Unlock Conveyor/Cylinder)                            │                         │
       │                             │─── 7. Record Audit Log ───>│                         │
```

## 2. Luồng Xử lý Frame Dồn gói (TCP Coalescing)
Khi Buffer nhận chuỗi byte liên tiếp chứa 2 frame:
`[STX]...Frame1...[ETX][STX]...Frame2...[ETX]`
1. Parser quét tìm `STX (0x02)`.
2. Đọc 4 byte `LENGTH` để xác định biên độ dự kiến.
3. Tìm `ETX (0x03)` ở vị trí tương ứng.
4. Trích xuất `Frame 1`, tính Checksum. Nếu hợp lệ, chuyển giao cho Dispatcher.
5. Cập nhật con trỏ buffer (Buffer Offset) trỏ đến `STX` tiếp theo của `Frame 2`.
6. Lặp lại quá trình mà không làm rơi rớt dữ liệu hoặc rò rỉ bộ nhớ.

---

## 3. Luồng Xác Thực Đối Chiếu Nhóm Công Đoạn & Thiết Bị (Group Category Validation)

```
[Thiết Bị / Client]           [Interlock Controller]          [Oracle Database (ITMVMES)]
        │                                │                                │
        │─── 1. Gửi Lệnh Interlock M010 ─>│                                │
        │    (Operation, EquipmentId)    │                                │
        │                                │─── 2. Query EIF_OPER_GROUP ───>│
        │                                │    (ADM_GROUP_CATEGORY_DATA)   │
        │                                │<── 3. Trả về Oper Group Value ─│
        │                                │                                │
        │                                │─── 4. Query EIF_EQP_GROUP ────>│
        │                                │    (ADM_GROUP_CATEGORY_DATA)   │
        │                                │<── 5. Trả về Eqp Group Value ──│
        │                                │                                │
        │                                │ [So Sánh Oper vs Eqp Group]    │
        │                                │  - KHỚP: Tiếp tục Interlock    │
        │                                │  - LỆCH: Từ chối & Báo lỗi     │
        │<── 6. Trả Kết Quả PASS / NG ───│                                │
```

---

## 4. Luồng Ghi Nhận Lịch Sử Quét Mã Vạch MES (`AFA_SEMI_WB_SCAN_HIS`)

```
[Giao dịch Hợp lệ]           [IlruleHistory Service]         [Oracle Table: AFA_SEMI_WB_SCAN_HIS]
        │                                │                                │
        │─── 1. Trigger Ghi Lịch Sử ────>│                                │
        │    (Barcode, Lot, Equip, Oper) │                                │
        │                                │─── 2. UPDATE APPLY_FLAG = 'N'─>│ (Đánh dấu bản ghi cũ)
        │                                │<── 3. Rows Affected: N ────────│
        │                                │                                │
        │                                │─── 4. INSERT APPLY_FLAG = 'Y'─>│ (Chèn bản ghi mới nhất)
        │                                │<── 5. Insert Thành Công ───────│
        │<── 6. Phản hồi Hoàn Tất ───────│                                │
```

---

## 5. Luồng Dữ Liệu Thời Gian Thực SSE & Đồng Bộ Throttling (30s)

```
[Equipment Sockets] ──> [TCP Gateway] ──> [SSE Stream] ──(<50ms)──> [Frontend State (React.memo)]
                                                                           │ (Render 50 dòng/trang)
[Oracle MIGHTY]     <── [Backend Cache] <── [Device Sync (Mỗi 30s)] <──────┘ (Giảm 87% HTTP REST)
```
