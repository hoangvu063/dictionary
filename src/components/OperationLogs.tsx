import React from 'react';
import { LogEntry } from '../types';
import { Info, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperationLogsProps {
  logs: LogEntry[];
}

const OperationLogs: React.FC<OperationLogsProps> = ({ logs }) => {
  const getIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          Operation Logs
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full uppercase">
          Real-time
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
              <Info className="h-8 w-8" />
              <p className="text-sm">No operations yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="mt-0.5 shrink-0">{getIcon(log.type)}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {log.operation}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {log.message}
                  </p>
                </div>
              </motion.div>
            ))
          ).reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OperationLogs;
