import React, { useState } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  FileSearch,
} from 'lucide-react';

interface DeviceChangeTabProps {
  selectedPlant: string;
  onOpenRuleAudit?: (params: { equip: string; transCode: string }) => void;
}

export const DeviceChangeTab: React.FC<DeviceChangeTabProps> = ({
  selectedPlant,
  onOpenRuleAudit,
}) => {
  const [dvcEquip, setDvcEquip] = useState<string>('XNGM003');
  const [dvcDeviceName, setDvcDeviceName] = useState<string>('SP4743D-N-A-BW');
  const [dvcDeviceType, setDvcDeviceType] = useState<string>('SEMI');
  const [dvcLoading, setDvcLoading] = useState<boolean>(false);
  const [dvcResult, setDvcResult] = useState<any>(null);

  const handleTestDeviceChange = async () => {
    setDvcLoading(true);
    setDvcResult(null);
    try {
      const res = await fetch('http://localhost:3005/api/v1/interlock/device-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: dvcEquip.trim(),
          plant: selectedPlant,
          deviceName: dvcDeviceName.trim(),
          deviceType: dvcDeviceType.trim(),
        }),
      });
      const data = await res.json();
      setDvcResult(data);
    } catch (err: any) {
      setDvcResult({
        isValid: false,
        responseString: 'ERR^Lỗi kết nối máy chủ backend',
        error: err.message || 'Lỗi kết nối tới máy chủ MC Server',
      });
    } finally {
      setDvcLoading(false);
    }
  };

  const ruleResult = dvcResult?.checkResult || dvcResult?.ruleResult;
  const isValid = dvcResult?.isValid ?? ruleResult?.isValid ?? false;
  const respStr = dvcResult?.responseString || dvcResult?.responseMessage || '';

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 h-full min-h-0 overflow-hidden font-mono text-xs">
      {/* Left Column: Input Payload (5/12) */}
      <div className="md:col-span-5 h-full min-h-0 flex flex-col bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 overflow-hidden">
        <div className="font-bold text-slate-200 pb-1.5 border-b border-slate-800 uppercase text-[11px] flex items-center justify-between shrink-0">
          <span className="whitespace-nowrap">Bản Tin Gửi Đi Từ Thiết Bị (S000)</span>
          <span className="text-cyan-400 font-mono text-[10px]">EQP ➔ Server</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-2 pr-1">
          <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300">
            <span className="font-bold text-cyan-200">Quy Tắc EIF-IR010 (Giao Dịch EDVC):</span> Áp dụng cho{' '}
            <b className="text-white">TẤT CẢ MODEL THIẾT BỊ</b>. Thiết bị gửi lệnh{' '}
            <code className="text-white bg-slate-900 px-1 rounded">S000</code> với DIV là{' '}
            <code className="text-emerald-300">CONFIG</code> để kiểm tra trạng thái trước khi vận hành.
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1 whitespace-nowrap truncate" title="Mã Thiết Bị (EQUIPMENT ID)">
                Mã Thiết Bị (EQUIPMENT):
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={dvcEquip}
                  onChange={(e) => setDvcEquip(e.target.value)}
                  placeholder="XNGM003, AOI1ST12-1A..."
                  className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => setDvcEquip('XNGM003')}
                  className="px-2 py-1 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-slate-700 whitespace-nowrap"
                  title="Ví dụ log người dùng"
                >
                  XNGM003
                </button>
                <button
                  type="button"
                  onClick={() => setDvcEquip('AOI1ST12-1A')}
                  className="px-2 py-1 rounded bg-slate-800 text-[10px] text-amber-300 hover:bg-slate-700 whitespace-nowrap"
                  title="Máy có Active Flag = Y"
                >
                  AOI1ST
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1 whitespace-nowrap truncate" title="Tên Cấu Hình / Thiết Bị (DEVICE NAME)">
                  Cấu Hình (DEVICE):
                </label>
                <input
                  type="text"
                  value={dvcDeviceName}
                  onChange={(e) => setDvcDeviceName(e.target.value)}
                  placeholder="SP4743D-N-A-BW"
                  className="w-full px-2 py-1 bg-slate-900 border border-cyan-500/50 rounded text-cyan-200 text-xs focus:border-cyan-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1 whitespace-nowrap truncate" title="Loại Thiết Bị (DEVICE TYPE)">
                  Loại Máy (TYPE):
                </label>
                <input
                  type="text"
                  value={dvcDeviceType}
                  onChange={(e) => setDvcDeviceType(e.target.value)}
                  placeholder="SEMI"
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Chuỗi Giao Thức Mẫu */}
          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="whitespace-nowrap">Chuỗi SECS Gửi Đến Server:</span>
              <span className="text-cyan-400 font-mono text-[9px]">S000CONFIG</span>
            </div>
            <div className="break-all text-slate-300 font-mono text-[9.5px] bg-slate-950 p-2 rounded border border-slate-800/80">
              {dvcEquip.padEnd(10, ' ')}S000CONFIG        ;{dvcDeviceName}^{dvcDeviceType};CONFIG        
            </div>
          </div>
        </div>

        {/* Pinned Bottom Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2 shrink-0">
          <button
            disabled={dvcLoading}
            onClick={handleTestDeviceChange}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {dvcLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang Kiểm Tra Quy Tắc EIF-IR010...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-200" />
                <span>GỬI KIỂM TRA ĐỔI CẤU HÌNH (S000)</span>
              </>
            )}
          </button>

          {onOpenRuleAudit && (
            <button
              type="button"
              onClick={() => onOpenRuleAudit({ equip: dvcEquip, transCode: 'EDVC' })}
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tra Cứu BIZ_ILRULE_INFO (Giao Dịch EDVC)</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Column: MES Check Result (7/12) */}
      <div className="md:col-span-7 h-full min-h-0 flex flex-col bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0">
          <span className="font-bold text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            Kết Quả Phản Hồi MES (S001)
          </span>
          {dvcResult && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isValid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                  : 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
              }`}
            >
              {isValid ? 'INTERLOCK OK' : 'INTERLOCK NG'}
            </span>
          )}
        </div>

        {dvcResult ? (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-2 pr-1">
            {/* Status Box */}
            <div
              className={`p-3 rounded-lg border ${
                isValid
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide">
                    {isValid
                      ? '[EDVC001S] Device Change successfully completed.'
                      : `[EDVC001E] ${ruleResult?.errorMsg || dvcResult?.error || 'Device Change Failed'}`}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 font-mono">
                    Mã Thiết Bị:{' '}
                    <span className="text-cyan-400 font-bold">{ruleResult?.equipment || dvcResult?.equipmentId || dvcEquip}</span>{' '}
                    | Quy Tắc: <span className="text-cyan-400 font-bold">EIF-IR010</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chi Tiết Khớp Quy Tắc EIF-IR010 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px] whitespace-nowrap">Model Thiết Bị:</span>
                <span className="text-cyan-300 font-bold truncate block">{ruleResult?.model || 'Tất Cả'}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px] whitespace-nowrap">Nhóm EQP:</span>
                <span className="text-cyan-300 font-bold truncate block">{ruleResult?.equipGroup || 'N/A'}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px] whitespace-nowrap">Trạng Thái Active:</span>
                <span className={`font-bold ${ruleResult?.activeFlag === 'Y' ? 'text-amber-400' : 'text-slate-400'}`}>
                  {ruleResult?.activeFlag === 'Y' ? 'Active (Check)' : 'Inactive (Bypass)'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px] whitespace-nowrap">Rule Key:</span>
                <span className="text-emerald-400 font-bold truncate block">{ruleResult?.ruleKey || 'Chung (ALL)'}</span>
              </div>
            </div>

            {/* Câu Lệnh SQL Kiểm Tra Trong BIZ_ILRULE_INFO */}
            {ruleResult?.sql && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                <div className="text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                  <span>Câu Lệnh Oracle SQL Kiểm Tra (CHECK_SQL):</span>
                  <span className="text-cyan-400 font-mono">Bảng: AEM_EQUIPMENT_STATUS</span>
                </div>
                <pre className="p-1.5 bg-slate-900 rounded text-[9.5px] text-cyan-300 font-mono overflow-x-auto whitespace-pre">
                  {ruleResult.sql}
                </pre>
              </div>
            )}

            {/* Chuỗi Phản Hồi Send To EQP S001 */}
            <div className="space-y-1 flex-1 flex flex-col">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                <span>Bản Tin Gửi Về Máy (Send to EQP - S001):</span>
                <span className="text-emerald-400 font-mono text-[9px]">Khớp chuẩn log thiết bị</span>
              </div>
              <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-300 font-mono overflow-x-auto flex-1 max-h-48 whitespace-pre leading-relaxed">
                {respStr}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 italic space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-700" />
            <span>Nhấn &quot;GỬI KIỂM TRA ĐỔI CẤU HÌNH (S000)&quot; để kiểm tra quy tắc EIF-IR010 và quan sát bản tin S001 thời gian thực.</span>
          </div>
        )}
      </div>
    </div>
  );
};
