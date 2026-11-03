import React, { useState } from 'react';
import {
  RefreshCw,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  FileSearch,
  Sliders,
  Gauge,
  Thermometer,
} from 'lucide-react';

interface ReflowWorkInTabProps {
  selectedPlant: string;
  onOpenRuleAudit?: (params: { equip: string; oper: string }) => void;
}

export const ReflowWorkInTab: React.FC<ReflowWorkInTabProps> = ({
  selectedPlant,
  onOpenRuleAudit,
}) => {
  const [equipment, setEquipment] = useState<string>('REFLOW12A');
  const [lotNumber, setLotNumber] = useState<string>('6412V');
  const [operation, setOperation] = useState<string>('200');
  const [pcbId, setPcbId] = useState<string>('B3626202040042400182325');
  const [config, setConfig] = useState<string>('SP4743C-N-A-BW');
  const [recipe, setRecipe] = useState<string>('ON3-ON4-LANE1-R01');
  const [conveyorSpeed, setConveyorSpeed] = useState<string>('120.00');
  const [n2Ppm, setN2Ppm] = useState<string>('1000');
  const [showZones, setShowZones] = useState<boolean>(false);

  // Mặc định nhiệt độ 13 Zone theo log thực tế
  const [tempTopZ1, setTempTopZ1] = useState<string>('150');
  const [tempTopZ6, setTempTopZ6] = useState<string>('200');
  const [tempTopZ11, setTempTopZ11] = useState<string>('295');
  const [tempTopC1, setTempTopC1] = useState<string>('130');

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleTestReflow = async () => {
    setLoading(true);
    setResult(null);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const currentTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const res = await fetch('http://localhost:3005/api/v1/interlock/reflow-work-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: equipment,
          plant: selectedPlant,
          lotNumber: lotNumber,
          operation: operation.trim() || '200',
          config: config,
          recipe: recipe,
          pcbId: pcbId,
          transTime: currentTime,
          conveyorSpeed: conveyorSpeed,
          n2Ppm: n2Ppm,
          tempTopZ1: tempTopZ1,
          tempTopZ6: tempTopZ6,
          tempTopZ11: tempTopZ11,
          tempTopC1: tempTopC1,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message || 'Lỗi kết nối tới máy chủ MC Server' });
    } finally {
      setLoading(false);
    }
  };

  const handleFillStandardSample = () => {
    setEquipment('REFLOW12A');
    setLotNumber('6412V');
    setOperation('200');
    setConfig('SP4743C-N-A-BW');
    setRecipe('ON3-ON4-LANE1-R01');
    setPcbId('B3626202040042400182325');
    setConveyorSpeed('120.00');
    setN2Ppm('1000');
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Banner Quy Tắc Nghiệp Vụ Model REFLOW */}
      <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-950/20 text-orange-200">
        <div className="flex items-center gap-2 mb-1.5">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="font-bold text-orange-300">Quy Tắc Liên Khóa Model REFLOW:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-orange-200/90 leading-relaxed">
          <div className="p-2 rounded bg-black/30 border border-orange-500/20">
            <span className="text-orange-400 font-semibold block">Mã Lệnh Gửi:</span>
            Bắt buộc mã lệnh chuẩn <span className="font-bold text-white bg-orange-600/50 px-1 py-0.5 rounded">S090</span> (phản hồi <span className="font-bold text-emerald-300">S091</span>).
          </div>
          <div className="p-2 rounded bg-black/30 border border-orange-500/20">
            <span className="text-orange-400 font-semibold block">Nhóm Thiết Bị & Loại:</span>
            EIF_EQP_GROUP: <span className="text-white font-bold">REFLOW</span> | EIF_EQP_TYPE: <span className="text-white font-bold">SMT</span>.
          </div>
          <div className="p-2 rounded bg-black/30 border border-orange-500/20">
            <span className="text-orange-400 font-semibold block">Scan History Bảng:</span>
            Tự động lưu vào <span className="text-cyan-300 font-bold">AFA_SEMI_REFLOW_SCAN_HIS</span> khi Pass.
          </div>
        </div>
      </div>

      {/* Form Nhập Thông Số */}
      <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Thông Số Bản Tin REFLOW WORK-IN (S090)</span>
          </div>
          <button
            type="button"
            onClick={handleFillStandardSample}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-colors"
          >
            Điền Mẫu Chuẩn (Log Thực Tế)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Mã Thiết Bị (EQUIPMENT)</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
              placeholder="REFLOW12A"
            />
            <span className="text-[9px] text-slate-500 mt-0.5 block">Ánh xạ DB: XREFL012A</span>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Mã Lot (LOT_NUMBER)</label>
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
              placeholder="6412V"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Mã Công Đoạn (OPERATION)</label>
            <input
              type="text"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
              placeholder="200"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Mã Cấu Hình (CONFIG / DEVICE)</label>
            <input
              type="text"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
              placeholder="SP4743C-N-A-BW"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Công Thức (RECIPE)</label>
            <input
              type="text"
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
              placeholder="ON3-ON4-LANE1-R01"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Mã Vạch PCB (PCB_ID)</label>
            <input
              type="text"
              value={pcbId}
              onChange={(e) => setPcbId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-hidden"
              placeholder="B3626202040042400182325"
            />
          </div>
        </div>

        {/* Thông số kỹ thuật lò Reflow */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-orange-300 flex items-center gap-1.5">
              <Gauge className="w-3 h-3 text-orange-400" />
              Thông Số Vận Hành Lò Hàn Reflow (Conveyor & N2 & Nhiệt Độ Zone)
            </span>
            <button
              type="button"
              onClick={() => setShowZones(!showZones)}
              className="text-[9px] text-slate-400 hover:text-slate-200 underline"
            >
              {showZones ? 'Thu gọn các Zone' : 'Mở rộng 13 Zone nhiệt'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[9px] text-slate-400 block">Tốc độ băng chuyền (P_CONVEYOR_SP)</label>
              <input
                type="text"
                value={conveyorSpeed}
                onChange={(e) => setConveyorSpeed(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block">Nồng độ khí Nitơ (P_N2_PPM)</label>
              <input
                type="text"
                value={n2Ppm}
                onChange={(e) => setN2Ppm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block">Nhiệt Zone Đốt Đỉnh (Zone 11)</label>
              <input
                type="text"
                value={tempTopZ11}
                onChange={(e) => setTempTopZ11(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block">Zone Làm Mát C1 (P_TEMP_TOP_C1)</label>
              <input
                type="text"
                value={tempTopC1}
                onChange={(e) => setTempTopC1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
              />
            </div>
          </div>

          {showZones && (
            <div className="mt-2.5 p-2 bg-slate-950/60 rounded border border-slate-800 text-[9px] text-slate-400">
              <span className="block mb-1 text-slate-300 font-semibold">13 Vùng Gia Nhiệt (Zone 1 - Zone 13):</span>
              Zone 1 (150°C) → Zone 2 (160°C) → Zone 3 (170°C) → Zone 4 (180°C) → Zone 5 (190°C) → Zone 6 (200°C) → Zone 7 (210°C) → Zone 8 (210°C) → Zone 9 (220°C) → Zone 10 (245°C) → Zone 11 (295°C Peak) → Zone 12 (295°C) → Zone 13 (240°C) → Cool 1 (130°C).
            </div>
          )}
        </div>

        {/* Nút Thực Hiện */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleTestReflow}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-950/50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang Gửi & Kiểm Tra Interlock...</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5" />
                <span>Kiểm Tra Liên Khóa REFLOW (S090)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hiển Thị Kết Quả Trả Về */}
      {result && (
        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Kết Quả Trả Về Từ MC-Server (Phản Hồi S091)
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  result.isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                KẾT QUẢ: {result.isValid ? 'PASS (HỢP LỆ)' : 'BLOCKED (BỊ CHẶN)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  result.pcbIdResult === 'OK'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                PCB_ID_RESULT: {result.pcbIdResult || 'N/A'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  result.paramResult === 'OK'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                PARAM_RESULT: {result.paramResult || 'N/A'}
              </span>
            </div>
          </div>

          {/* Chi tiết thông tin đối soát */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Thiết Bị / DB Name:</span>
              <span className="font-bold text-cyan-300">{result.equipment}</span>
              <span className="text-slate-400 block text-[9px]">({result.dbEquipmentName || 'XREFL012A'})</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Nhóm Thiết Bị & Loại:</span>
              <span className="font-bold text-slate-200">{result.equipGroup || 'REFLOW'}</span>
              <span className="text-slate-400 block text-[9px]">(Loại: {result.equipType || 'SMT'})</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Mã Công Đoạn & Nhà Máy:</span>
              <span className="font-bold text-slate-200">{result.operation || '200'}</span>
              <span className="text-slate-400 block text-[9px]">({result.plant || selectedPlant})</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Bảng Scan History:</span>
              <span className="font-bold text-emerald-400">{result.scanHistoryTable || 'AFA_SEMI_REFLOW_SCAN_HIS'}</span>
              <span className="text-slate-400 block text-[9px]">{result.scanHistoryInserted ? 'Đã Insert thành công' : 'Chưa ghi (Do NG)'}</span>
            </div>
          </div>

          {/* Thông điệp từ MES */}
          <div
            className={`p-2.5 rounded border ${
              result.isValid
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {result.isValid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Thông Điệp MES ({result.rtnMsgID || 'EIF-INFO'}):</span>
            </div>
            <p className="text-[11px] leading-relaxed font-sans">{result.rtnMsg || result.pcbIdMsg || 'Không có thông báo'}</p>
          </div>

          {/* Chuỗi phản hồi gốc gửi lại EQP */}
          {result.responseMessage && (
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Chuỗi Phản Hồi Send Message (S091):</span>
              <pre className="p-2.5 bg-black/50 border border-slate-800 rounded text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
                {result.responseMessage}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
