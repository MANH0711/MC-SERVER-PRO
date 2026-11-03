import React, { useState } from 'react';
import {
  RefreshCw,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  FileSearch,
} from 'lucide-react';

interface ReflowWorkInTabProps {
  selectedPlant: string;
  onOpenRuleAudit?: (params: { equip: string; oper: string }) => void;
}

export const ReflowWorkInTab: React.FC<ReflowWorkInTabProps> = ({
  selectedPlant,
  onOpenRuleAudit,
}) => {
  const [rfEquipment, setRfEquipment] = useState<string>('REFLOW12A');
  const [rfLot, setRfLot] = useState<string>('6412V');
  const [rfOperation, setRfOperation] = useState<string>('200');
  const [rfPcbId, setRfPcbId] = useState<string>('B3626202040042400182325');
  const [rfConfig, setRfConfig] = useState<string>('SP4743C-N-A-BW');
  const [rfRecipe, setRfRecipe] = useState<string>('ON3-ON4-LANE1-R01');
  const [rfConveyorSpeed, setRfConveyorSpeed] = useState<string>('120.00');
  const [rfN2Ppm, setRfN2Ppm] = useState<string>('1000');
  const [rfLoading, setRfLoading] = useState<boolean>(false);
  const [rfResult, setRfResult] = useState<any>(null);

  const handleTestReflow = async () => {
    setRfLoading(true);
    setRfResult(null);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const currentTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const res = await fetch('http://localhost:3005/api/v1/interlock/reflow-work-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: rfEquipment,
          plant: selectedPlant,
          lotNumber: rfLot,
          operation: rfOperation.trim() || undefined,
          config: rfConfig,
          recipe: rfRecipe,
          pcbId: rfPcbId,
          transTime: currentTime,
          conveyorSpeed: rfConveyorSpeed,
          n2Ppm: rfN2Ppm,
        }),
      });
      const data = await res.json();
      setRfResult(data);
    } catch (err: any) {
      setRfResult({ error: err.message || 'Lỗi kết nối tới máy chủ MC Server' });
    } finally {
      setRfLoading(false);
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-11 gap-4 overflow-y-auto flex-1 font-mono text-xs">
      {/* Left Column: Input Payload (5/11) */}
      <div className="md:col-span-5 space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="font-bold text-slate-200 pb-1 border-b border-slate-800 uppercase text-[11px] flex items-center justify-between">
          <span>Bản Tin Gửi Đi Từ Máy (S090)</span>
          <span className="text-orange-400 font-mono text-[10px]">EQP ➔ Server</span>
        </div>

        <div className="p-2 rounded bg-orange-950/40 border border-orange-500/30 text-[10px] text-orange-300">
          <span className="font-bold text-orange-200">Quy Tắc Model REFLOW:</span> Bắt buộc mã lệnh{' '}
          <code className="text-white bg-slate-900 px-1 rounded">S090</code>, nhóm thiết bị (
          <code className="text-orange-300">EIF_EQP_GROUP</code>) là{' '}
          <span className="font-bold text-orange-400">REFLOW</span>, loại thiết bị (
          <code className="text-emerald-300">EIF_EQP_TYPE</code>) là{' '}
          <span className="font-bold text-emerald-400">SMT</span>.
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Mã Thiết Bị (EQUIPMENT):</label>
            <input
              type="text"
              value={rfEquipment}
              onChange={(e) => setRfEquipment(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Mã LOT (LOT_NUMBER):</label>
              <input
                type="text"
                value={rfLot}
                onChange={(e) => setRfLot(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Công Đoạn (OPERATION):</label>
              <input
                type="text"
                value={rfOperation}
                placeholder="200 (SMT)..."
                onChange={(e) => setRfOperation(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Mã Vạch Bản Mạch (PCB_ID):</label>
            <input
              type="text"
              value={rfPcbId}
              onChange={(e) => setRfPcbId(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-orange-500/60 rounded text-orange-300 font-bold text-xs focus:border-orange-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Thiết Bị (CONFIG):</label>
              <input
                type="text"
                value={rfConfig}
                onChange={(e) => setRfConfig(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Chương Trình (RECIPE):</label>
              <input
                type="text"
                value={rfRecipe}
                onChange={(e) => setRfRecipe(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Tốc Độ Băng Tải (P_CONVEYOR_SP):</label>
              <input
                type="text"
                value={rfConveyorSpeed}
                onChange={(e) => setRfConveyorSpeed(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Nồng Độ Khí N2 (P_N2_PPM):</label>
              <input
                type="text"
                value={rfN2Ppm}
                onChange={(e) => setRfN2Ppm(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-orange-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 space-y-1">
          <div className="text-slate-300 font-semibold">Chuỗi Giao Thức Mẫu:</div>
          <div className="break-all text-slate-400 font-mono text-[9px] bg-slate-950 p-1.5 rounded">
            {rfEquipment} S090WORKIN ;&#123;&quot;DATA&quot;:[&#123;&quot;PCB_ID&quot;:&quot;{rfPcbId}&quot;,&quot;P_CONVEYOR_SP&quot;:&quot;{rfConveyorSpeed}&quot;,...&#125;]&#125;;WORKIN
          </div>
        </div>

        <button
          disabled={rfLoading}
          onClick={handleTestReflow}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 cursor-pointer"
        >
          {rfLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang Thực Thi Interlock Oracle...</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 text-orange-200" />
              <span>GỬI KIỂM TRA INTERLOCK (S090)</span>
            </>
          )}
        </button>

        {onOpenRuleAudit && (
          <button
            type="button"
            onClick={() => onOpenRuleAudit({ equip: rfEquipment, oper: rfOperation })}
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tra Cứu BIZ_ILRULE_INFO Cho Máy Này</span>
          </button>
        )}
      </div>

      {/* Right Column: MES Check Result (6/11) */}
      <div className="md:col-span-6 space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex flex-col">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="font-bold text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />
            Kết Quả Phản Hồi MES (S091)
          </span>
          {rfResult && (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  rfResult.isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                    : 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                }`}
              >
                {rfResult.isValid ? 'INTERLOCK OK' : 'INTERLOCK NG'}
              </span>
            </div>
          )}
        </div>

        {rfResult ? (
          <div className="space-y-2.5 flex-1 flex flex-col">
            {/* Status Box */}
            <div
              className={`p-3 rounded-lg border ${
                rfResult.isValid
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {rfResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide">
                    {rfResult.isValid
                      ? '[EPBV001S] BarcodeVerification successfully completed.'
                      : `[${rfResult.rtnMsgID || 'EPBV002F'}] ${rfResult.rtnMsg || rfResult.pcbIdMsg || 'Interlock Failed'}`}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 font-mono">
                    Máy Ánh Xạ DB: <span className="text-orange-400 font-bold">{rfResult.dbEquipmentName}</span> | Công Đoạn:{' '}
                    <span className="text-orange-400">{rfResult.operation}</span> | PCB Result:{' '}
                    <span className={rfResult.pcbIdResult === 'OK' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {rfResult.pcbIdResult || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stored Procedure Audit & Group Verification */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px]">RtnYN (Kết Quả):</span>
                <span className={`font-bold ${rfResult.rtnYN === 'OK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {rfResult.rtnYN || (rfResult.isValid ? 'OK' : 'NG')}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px]">Mã Lệnh SECS:</span>
                <span className="text-orange-300 font-bold">S090 / S091</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px]">Model Thiết Bị:</span>
                <span className="text-orange-300 font-bold">{rfResult.equipmentModel || 'REFLOW'}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px]">Nhóm (Oper/Equip):</span>
                <span className={`font-bold ${rfResult.equipGroup === 'REFLOW' ? 'text-orange-300' : 'text-slate-300'}`}>
                  {rfResult.operGroup || 'SMT'} / {rfResult.equipGroup || 'REFLOW'}
                </span>
              </div>
            </div>

            {/* Scan History Record Badge khi Check Thành Công */}
            {rfResult.isValid && rfResult.scanHistoryTable && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[10px] space-y-1">
                <div className="font-bold flex items-center justify-between text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã Ghi Lịch Sử Quét Sản Xuất (Scan History)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                    {rfResult.scanHistoryInserted ? 'INSERTED' : 'OK'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-300 font-mono pt-0.5 border-t border-emerald-500/20">
                  <div>Bảng Đích: <span className="text-cyan-300 font-bold">{rfResult.scanHistoryTable}</span></div>
                  <div>Nhóm Máy: <span className="text-cyan-300 font-bold">{rfResult.equipGroup || 'REFLOW'}</span></div>
                  <div>Loại Máy: <span className="text-slate-200">{rfResult.equipType || 'SMT'}</span></div>
                  <div>Trạng Thái: <span className="text-emerald-400 font-bold">PROCESS=O, APPLY=Y</span></div>
                </div>
              </div>
            )}

            {/* Danh Sách Rule BIZ_ILRULE_INFO Khớp Ưu Tiên */}
            {rfResult.appliedRules && rfResult.appliedRules.length > 0 && (
              <div className="p-2 rounded bg-slate-950 border border-slate-800/90 space-y-1.5">
                <div className="text-[10px] text-orange-400 uppercase font-semibold flex items-center justify-between">
                  <span>Quy Tắc Interlock Khớp (Ưu Tiên Cụ Thể &gt; ALL):</span>
                  <span className="text-slate-400 text-[9px]">{rfResult.appliedRules.length} Rules</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {rfResult.appliedRules.map((r: any, idx: number) => {
                    const isSpecific =
                      r.isSpecific !== undefined
                        ? r.isSpecific
                        : (
                            (r.ruleKeyGroup1 ?? r.RULE_KEY_GROUP1 ?? 'ALL') !== 'ALL' ||
                            (r.ruleKeyGroup2 ?? r.RULE_KEY_GROUP2 ?? 'ALL') !== 'ALL' ||
                            (r.ruleKeyGroup3 ?? r.RULE_KEY_GROUP3 ?? 'ALL') !== 'ALL' ||
                            (r.ruleKeyGroup4 ?? r.RULE_KEY_GROUP4 ?? 'ALL') !== 'ALL'
                          );
                    return (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80 text-[10px] space-y-0.5 font-mono"
                      >
                        <div className="flex items-center justify-between text-slate-200">
                          <span className="font-bold text-orange-300">
                            {r.ruleId || r.RULE_ID} ({r.ruleKey || r.RULE_KEY})
                          </span>
                          <span
                            className={`px-1 rounded text-[9px] font-bold ${
                              isSpecific
                                ? 'bg-orange-900/60 text-orange-200 border border-orange-500/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isSpecific ? 'Ưu Tiên Cụ Thể' : 'Cấu Hình ALL'}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Khóa: [{r.ruleKeyGroup1 ?? r.RULE_KEY_GROUP1 ?? 'ALL'}, {r.ruleKeyGroup2 ?? r.RULE_KEY_GROUP2 ?? 'ALL'}, {r.ruleKeyGroup3 ?? r.RULE_KEY_GROUP3 ?? 'ALL'}, {r.ruleKeyGroup4 ?? r.RULE_KEY_GROUP4 ?? 'ALL'}] | {r.errorMsg || r.ERROR_MSG_E || ''}
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
                Gói Tin Chuẩn Gửi Về Máy (S091):
              </div>
              <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono overflow-x-auto flex-1 max-h-48 whitespace-pre leading-relaxed">
                {rfResult.responseMessage || JSON.stringify(rfResult, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 italic space-y-2">
            <Flame className="w-10 h-10 text-slate-700" />
            <span>Nhấn &quot;GỬI KIỂM TRA INTERLOCK (S090)&quot; để thực thi thủ tục Oracle và quan sát chuỗi phản hồi S091 thời gian thực.</span>
          </div>
        )}
      </div>
    </div>
  );
};
