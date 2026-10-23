import React from 'react';
import { Check, X } from 'lucide-react';

interface RbacCategory {
  category: string;
  permissions: {
    name: string;
    desc: string;
    OPERATOR: boolean;
    SUPERVISOR: boolean;
    ENGINEER: boolean;
    ADMIN: boolean;
  }[];
}

interface PermissionMatrixTabProps {
  rbacMatrix: RbacCategory[];
  t: (key: string) => string;
}

export const PermissionMatrixTab: React.FC<PermissionMatrixTabProps> = ({
  rbacMatrix,
  t,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-auto rounded border border-slate-800/90 bg-slate-900/60 shadow-inner font-sans">
      <table className="w-full text-left font-mono text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-2 px-3 min-w-[280px]">{t('users.matrix.headerAction')}</th>
            <th className="py-2 px-3 w-[100px] text-center text-emerald-400">OPERATOR</th>
            <th className="py-2 px-3 w-[110px] text-center text-sky-400">SUPERVISOR</th>
            <th className="py-2 px-3 w-[110px] text-center text-indigo-400">ENGINEER</th>
            <th className="py-2 px-3 w-[100px] text-center text-rose-400">ADMIN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {rbacMatrix.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {/* Category Section Header */}
              <tr className="bg-slate-950/80">
                <td colSpan={5} className="py-1.5 px-3 text-[11px] font-bold text-slate-300 tracking-wider">
                  {group.category}
                </td>
              </tr>

              {/* Actions */}
              {group.permissions.map((perm, pIdx) => (
                <tr key={pIdx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-1.5 px-3 font-sans">
                    <span className="font-medium text-slate-100 text-xs block">{perm.name}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{perm.desc}</span>
                  </td>

                  {/* OPERATOR */}
                  <td className="py-1.5 px-3 text-center">
                    {perm.OPERATOR ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                        <X className="w-3 h-3" />
                      </div>
                    )}
                  </td>

                  {/* SUPERVISOR */}
                  <td className="py-1.5 px-3 text-center">
                    {perm.SUPERVISOR ? (
                      <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                        <X className="w-3 h-3" />
                      </div>
                    )}
                  </td>

                  {/* ENGINEER */}
                  <td className="py-1.5 px-3 text-center">
                    {perm.ENGINEER ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                        <X className="w-3 h-3" />
                      </div>
                    )}
                  </td>

                  {/* ADMIN */}
                  <td className="py-1.5 px-3 text-center">
                    {perm.ADMIN ? (
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                        <X className="w-3 h-3" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
