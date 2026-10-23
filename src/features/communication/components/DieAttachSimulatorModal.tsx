import React, { useState } from 'react';
import {
  X,
  Cpu,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

interface DieAttachSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DieAttachSimulatorModal: React.FC<DieAttachSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [daEquipment, setDaEquipment] = useState<string>('CLEAN001');
  const [daLot, setDaLot] = useState<string>('BC6430E');
  const [daPcbId, setDaPcbId] = useState<string>('A3526169031004800260828');
  const [daConfig, setDaConfig] = useState<string>('SSDB08R-B');
  const [daRecipe, setDaRecipe] = useState<string>('ITMRecipe');
  const [daLoading, setDaLoading] = useState<boolean>(false);
  const [daResult, setDaResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleTestDieAttach = async () => {
    setDaLoading(true);
    setDaResult(null);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const currentTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const res = await fetch('http://localhost:3005/api/v1/interlock/work-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: daEquipment,
          lotNumber: daLot,
          config: daConfig,
          recipe: daRecipe,
          pcbId: daPcbId,
          transTime: currentTime,
        }),
      });
      const data = await res.json();
      setDaResult(data);
    } catch (err: any) {
      setDaResult({ error: err.message || 'Lỗi kết nối tới máy chủ MC Server' });
    } finally {
      setDaLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 font-sans">
      <div className="bg-[#0B111E] border border-cyan-500/50 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.25)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-xs uppercase tracking-wider text-cyan-200">
                Thử Nghiệm Giao Tiếp Die Attach Interlock (S050 / S051)
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Kiểm thử trực tiếp luồng nghiệp vụ Oracle SP & Quy tắc BIZ_ILRULE_INFO
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-11 gap-4 overflow-y-auto flex-1 font-mono text-xs">
          {/* Left Column: Input Payload */}
          <div className="md:col-span-5 space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="font-bold text-slate-200 pb-1 border-b border-slate-800 uppercase text-[11px] flex items-center justify-between">
              <span>Bản Tin Gửi Đi Từ Máy (S050)</span>
              <span className="text-cyan-400 font-mono text-[10px]">EQP ➔ Server</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Mã Thiết Bị (EQUIPMENT):</label>
                <input
                  type="text"
                  value={daEquipment}
                  onChange={(e) => setDaEquipment(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Mã LOT Sản Xuất (LOT_NUMBER):</label>
                <input
                  type="text"
                  value={daLot}
                  onChange={(e) => setDaLot(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Mã Vạch Bản Mạch (PCB_ID):</label>
                <input
                  type="text"
                  value={daPcbId}
                  onChange={(e) => setDaPcbId(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-cyan-500/60 rounded text-cyan-300 font-bold text-xs focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Thiết Bị (CONFIG):</label>
                  <input
                    type="text"
                    value={daConfig}
                    onChange={(e) => setDaConfig(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Chương Trình (RECIPE):</label>
                  <input
                    type="text"
                    value={daRecipe}
                    onChange={(e) => setDaRecipe(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 space-y-1">
              <div className="text-slate-300 font-semibold">Chuỗi Giao Thức Mẫu:</div>
              <div className="break-all text-slate-400 font-mono text-[9px] bg-slate-950 p-1.5 rounded">
                {daEquipment} S050WORKIN ;&#123;&quot;DATA&quot;:[&#123;&quot;PCB_ID&quot;:&quot;{daPcbId}&quot;,...&#125;]&#125;;WORKIN
              </div>
            </div>

            <button
              disabled={daLoading}
              onClick={handleTestDieAttach}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
            >
              {daLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Thực Thi Interlock Oracle...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-cyan-200" />
                  <span>GỬI KIỂM TRA INTERLOCK (S050)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: MES Check Result */}
          <div className="md:col-span-6 space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex flex-col">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                Kết Quả Phản Hồi MES (S051)
              </span>
              {daResult && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    daResult.isValid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                      : 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                  }`}
                >
                  {daResult.isValid ? 'INTERLOCK OK' : 'INTERLOCK NG'}
                </span>
              )}
            </div>

            {daResult ? (
              <div className="space-y-2.5 flex-1 flex flex-col">
                {/* Status Box */}
                <div
                  className={`p-3 rounded-lg border ${
                    daResult.isValid
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {daResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide">
                        {daResult.isValid
                          ? '[EPBV001S] BarcodeVerification successfully completed.'
                          : `[${daResult.rtnMsgID || 'EPBV002F'}] ${daResult.rtnMsg || 'Interlock Failed'}`}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1 font-mono">
                        Máy Ánh Xạ DB: <span className="text-cyan-400 font-bold">{daResult.dbEquipmentName}</span> | Công Đoạn: <span className="text-cyan-400">{daResult.operation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stored Procedure Audit */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">RtnYN (Kết Quả):</span>
                    <span className={`font-bold ${daResult.rtnYN === 'OK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {daResult.rtnYN || (daResult.isValid ? 'OK' : 'NG')}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">RtnMsgID:</span>
                    <span className="text-cyan-300 font-bold">{daResult.rtnMsgID || 'N/A'}</span>
                  </div>
                </div>

                {/* Danh Sách Rule BIZ_ILRULE_INFO Khớp Ưu Tiên */}
                {daResult.appliedRules && daResult.appliedRules.length > 0 && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/90 space-y-1.5">
                    <div className="text-[10px] text-cyan-400 uppercase font-semibold flex items-center justify-between">
                      <span>Quy Tắc Interlock Khớp (Ưu Tiên Cụ Thể &gt; ALL):</span>
                      <span className="text-slate-400 text-[9px]">
                        {daResult.appliedRules.length} Rules
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {daResult.appliedRules.map((r: any, idx: number) => {
                        const isSpecific = r.ruleKeyGroup1 !== 'ALL' || r.ruleKeyGroup2 !== 'ALL' || r.ruleKeyGroup3 !== 'ALL' || r.ruleKeyGroup4 !== 'ALL';
                        return (
                          <div key={idx} className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80 text-[10px] space-y-0.5 font-mono">
                            <div className="flex items-center justify-between text-slate-200">
                              <span className="font-bold text-cyan-300">{r.ruleId} ({r.ruleKey})</span>
                              <span className={`px-1 rounded text-[9px] font-bold ${isSpecific ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'}`}>
                                {isSpecific ? 'Ưu Tiên Cụ Thể' : 'Cấu Hình ALL'}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400">
                              Khóa: [{r.ruleKeyGroup1}, {r.ruleKeyGroup2}, {r.ruleKeyGroup3}, {r.ruleKeyGroup4}] | Kiểu: {r.checkType} ({r.bindItem})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Response Message Frame */}
                <div className="space-y-1 flex-1 flex flex-col">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Gói Tin Chuẩn Gửi Về Máy (S051):
                  </div>
                  <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-mono overflow-x-auto flex-1 max-h-48 whitespace-pre leading-relaxed">
                    {daResult.responseMessage || JSON.stringify(daResult, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 italic space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-700" />
                <span>Nhấn &quot;GỬI KIỂM TRA INTERLOCK&quot; để thực thi thủ tục Oracle và quan sát chuỗi phản hồi S051 thời gian thực.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Giao thức chuẩn hóa DIE ATTACH S050/S051
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
