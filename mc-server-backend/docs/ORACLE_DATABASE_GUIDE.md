# 🗄️ Hướng Dẫn Kết Nối & Tương Tác Cơ Sở Dữ Liệu Oracle

Tài liệu này hướng dẫn chi tiết cách cấu hình, kết nối và quản lý các cơ sở dữ liệu **Oracle Database** trong hệ thống **MC Server Pro Backend**.

---

## 1. Danh Sách Kết Nối Oracle TNS

Hệ thống hỗ trợ 5 phân vùng kết nối Oracle được định nghĩa qua file cấu hình môi trường `.env` hoặc file `tnsnames.ora`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG PHÂN VÙNG ORACLE TNS                        │
├────────────┬─────────────────┬──────┬──────────────┬───────────────────┤
│ TNS Name   │ Host IP         │ Port │ Service Name │ Mục Đích Sử Dụng  │
├────────────┼─────────────────┼──────┼──────────────┼───────────────────┤
│ ITMDEV     │ 112.160.65.212  │ 1521 │ MIGHTY       │ Môi trường Dev    │
│ ITMMES     │ 192.168.80.20   │ 1521 │ ITMMES       │ MES Trụ sở chính  │
│ ITMVMES    │ 192.168.35.202  │ 1521 │ ITMVMES      │ MES Nhà máy VMES  │
│            │ 192.168.35.203  │ 1521 │ (Failover)   │ Dự phòng cấp 2    │
│            │ 192.168.35.204  │ 1521 │ (Failover)   │ Dự phòng cấp 3    │
│ ITMSEMIMES │ 192.168.35.202  │ 1521 │ ITMSEMIMES   │ MES Bán dẫn Semi  │
│ ITMPMES    │ 192.168.1.18    │ 1521 │ ITMPMES      │ MES Nhà máy PMES  │
└────────────┴─────────────────┴──────┴──────────────┴───────────────────┘
```

### Đặc tả TNS Cụ Thể

#### A. ITMDEV (Development Database)
```tns
ITMDEV = 
  (DESCRIPTION = 
    (ADDRESS_LIST = 
      (ADDRESS = (PROTOCOL = TCP)(HOST = 112.160.65.212)(PORT = 1521))
    )
    (CONNECT_DATA = 
      (SERVICE_NAME = MIGHTY)
    )
  )
```

#### B. ITMMES (MES Database)
```tns
ITMMES = 
  (DESCRIPTION = 
    (ADDRESS_LIST = 
      (ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.80.20)(PORT = 1521))
    )
    (CONNECT_DATA = 
      (SERVICE_NAME = ITMMES)
    )
  )
```

#### C. ITMVMES (High-Availability Clustered TNS với 3 IP dự phòng)
```tns
ITMVMES =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.35.202)(PORT = 1521))
    (ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.35.203)(PORT = 1521))
    (ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.35.204)(PORT = 1521))
    (LOAD_BALANCE = yes)
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = ITMVMES)
      (FAILOVER_MODE =
        (TYPE = SELECT)
        (METHOD = BASIC)
        (RETRIES = 180)
        (DELAY = 5)
      )
    )
  )
```

---

## 2. Bảng Dữ Liệu Thiết Bị 18 Cột Chuẩn (`EQUIPMENT_INFO`)

```sql
CREATE TABLE EQUIPMENT_INFO (
    PLANT            VARCHAR2(20)  NOT NULL, -- Ví dụ: ITMVPSG
    HOST_ADDRESS     VARCHAR2(50)  NOT NULL, -- Ví dụ: 127.0.0.1
    HOST_PORT        NUMBER(6)     NOT NULL, -- Ví dụ: 5010
    DEVICE_ID        NUMBER(10)    DEFAULT 0 NOT NULL,
    SERVER_NO        NUMBER(6)     DEFAULT 15 NOT NULL,
    EQUIPMENT_ID     VARCHAR2(50)  NOT NULL, -- Khóa chính thiết bị: BAKE01, BENDINGJ1
    GROUP_NAME       VARCHAR2(30)  DEFAULT 'NET',
    EQUIPMENT_ORDER  NUMBER(10)    DEFAULT 20110,
    EQUIPMENT_MAIN   VARCHAR2(50),
    DESCRIPTION      VARCHAR2(200),
    ENABLE           VARCHAR2(10)  DEFAULT 'YES', -- YES / NO
    FIELD_01         VARCHAR2(100),
    FIELD_02         VARCHAR2(100),
    FIELD_03         VARCHAR2(100),
    INTERLOCK_RECIPE VARCHAR2(20)  DEFAULT 'ITMVIET',
    EQUIPMENT_MODEL  VARCHAR2(50)  NOT NULL, -- IBS_BAKE, IBS_BENDINGJS,...
    INTERLOCK_PARAM  VARCHAR2(20)  DEFAULT 'YES',
    INTERLOCK_TRACE  VARCHAR2(50),
    CREATED_AT       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_EQUIPMENT_INFO PRIMARY KEY (PLANT, EQUIPMENT_ID)
);
```

---

## 3. Quản Lý Connection Pool & Chế Độ Failover

Hệ thống sử dụng thư viện `oracledb` phiên bản 6.x (hỗ trợ cả **Thin Mode** tự động và **Thick Mode** qua Oracle Instant Client).
- Mỗi TNS sở hữu một Connection Pool riêng biệt để đảm bảo không bị tắc nghẽn chéo giữa các nhà máy.
- Tự động kích hoạt cơ chế Circuit Breaker khi kết nối cơ sở dữ liệu gặp sự cố.
