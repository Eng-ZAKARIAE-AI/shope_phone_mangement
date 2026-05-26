import React from 'react';
import { InventoryLog } from '../types.ts';
import { FileText, Calendar, User, ShoppingBag, ArrowRight } from 'lucide-react';

interface AuditLogLedgerProps {
  logs: InventoryLog[];
}

export default function AuditLogLedger({ logs }: AuditLogLedgerProps) {
  
  const getActionBadge = (act: InventoryLog['action']) => {
    switch (act) {
      case 'create':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400">Create</span>;
      case 'delete':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400">Purge</span>;
      case 'adjust_increment':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide bg-teal-50 dark:bg-teal-950/25 text-teal-600 dark:text-teal-400">stock +</span>;
      case 'adjust_decrement':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">stock -</span>;
      case 'update':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide bg-indigo-50 dark:bg-indigo-955/20 text-indigo-650 dark:text-indigo-400">Modify</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide bg-slate-50 text-slate-500">Seed</span>;
    }
  };

  const parseTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    // Handle standard server Timestamp
    if (ts.toDate) {
      return ts.toDate().toLocaleString();
    }
    // Handle standard date or ISO
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden" id="audit-logs-card">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 select-none">
        <div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">System Audit Logs</span>
          <p className="text-xs text-slate-400 font-medium">Trace all catalog mutations back to the specific operator</p>
        </div>
        <FileText size={18} className="text-slate-400" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="audit-logs-table">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest select-none">
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Action Type</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4 text-center text-xs">Transform</th>
              <th className="px-6 py-4 text-right">Registered Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-600 dark:text-slate-350">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-slate-400 italic">
                  Awaiting product audit events logs...
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors" id={`log-row-${log.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-400 dark:text-slate-505">
                    <span className="inline-flex items-center gap-1.5 matches-datetime">
                      <Calendar size={12} />
                      <span>{parseTimestamp(log.timestamp)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 select-none">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5 truncate max-w-xs">
                      <ShoppingBag size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{log.productName}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">
                    <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-xs text-slate-450">{log.preQuantity}</span>
                      <ArrowRight size={10} className="text-slate-400 shrink-0" />
                      <span className="text-xs text-teal-500 dark:text-teal-400 font-extrabold">{log.postQuantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-semibold text-slate-550 dark:text-slate-405">
                    <div className="inline-flex items-center gap-1.5">
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span className="select-all block max-m-wide truncate">{log.operatorEmail}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
