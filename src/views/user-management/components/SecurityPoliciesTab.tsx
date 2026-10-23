import React from 'react';
import { Lock, BadgeCheck, KeyRound } from 'lucide-react';

interface SecurityPoliciesTabProps {
  t: (key: string) => string;
}

export const SecurityPoliciesTab: React.FC<SecurityPoliciesTabProps> = ({ t }) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 font-sans text-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Policy Card 1 */}
        <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Lock className="w-4 h-4" />
            <h4 className="font-bold uppercase tracking-wider text-slate-200">
              {t('users.policies.sessionTitle')}
            </h4>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {t('users.policies.sessionDesc')}
          </p>
          <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300">
            Session Timeout: 60 min • Single-Sign-On Token: JWT RS256
          </div>
        </div>

        {/* Policy Card 2 */}
        <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <BadgeCheck className="w-4 h-4" />
            <h4 className="font-bold uppercase tracking-wider text-slate-200">
              {t('users.policies.auditTitle')}
            </h4>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {t('users.policies.auditDesc')}
          </p>
          <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300">
            Enforcement: NON_REPUDIATION • Log Level: AUDIT_STRICT
          </div>
        </div>

        {/* Policy Card 3 */}
        <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400">
            <KeyRound className="w-4 h-4" />
            <h4 className="font-bold uppercase tracking-wider text-slate-200">
              {t('users.policies.securityTitle')}
            </h4>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {t('users.policies.securityDesc')}
          </p>
          <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300">
            Complexity: 12 Chars (Upper + Number + Symbol) • Lockout: 5 Tries
          </div>
        </div>
      </div>
    </div>
  );
};
