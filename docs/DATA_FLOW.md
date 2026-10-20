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
