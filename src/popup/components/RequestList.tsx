import React from 'react';
import type { CapturedRequest } from '../../shared/types';
import { Globe, Clock, ShieldCheck, ShieldAlert, Key, Cookie, Database, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface RequestListProps {
  requests: CapturedRequest[];
  selectedRequest: CapturedRequest | null;
  onSelectRequest: (request: CapturedRequest) => void;
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function RequestList({
  requests,
  selectedRequest,
  onSelectRequest
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center p-6 bg-slate-50/50">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Globe className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-800 font-semibold text-sm">No requests captured</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[180px]">
          Browse the web to start capturing API calls automatically
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[250px] scrollbar-hide">
      <div className="divide-y divide-slate-100">
        {requests.map((request) => (
          <RequestListItem
            key={request.id}
            request={request}
            isSelected={selectedRequest?.id === request.id}
            onClick={() => onSelectRequest(request)}
          />
        ))}
      </div>
    </div>
  );
}

interface RequestListItemProps {
  request: CapturedRequest;
  isSelected: boolean;
  onClick: () => void;
}

function RequestListItem({ request, isSelected, onClick }: RequestListItemProps) {
  const getMethodStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'POST': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PUT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'PATCH': return 'bg-violet-100 text-violet-700 border-violet-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getAuthIcon = (authType: string) => {
    if (authType === 'none') return null;

    switch (authType) {
      case 'bearer': return <Key className="w-3 h-3" />;
      case 'basic': return <ShieldCheck className="w-3 h-3" />;
      case 'apikey': return <Database className="w-3 h-3" />;
      case 'cookie': return <Cookie className="w-3 h-3" />;
      default: return <ShieldAlert className="w-3 h-3" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group px-4 py-3 cursor-pointer transition-all duration-200 relative overflow-hidden",
        isSelected
          ? "bg-indigo-50/60"
          : "hover:bg-slate-50"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
      )}

      <div className="flex items-center gap-3 relative z-10">
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold border min-w-[45px] text-center uppercase tracking-wide",
          getMethodStyle(request.method)
        )}>
          {request.method}
        </span>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-700 truncate font-mono mb-1">
            {request.url.replace(/^https?:\/\//, '')}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(request.timestamp)}
            </span>

            {request.authType !== 'none' && (
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
              )}>
                {getAuthIcon(request.authType)}
                <span className="capitalize">{request.authType}</span>
              </span>
            )}
          </div>
        </div>

        {isSelected && (
          <ArrowRight className="w-4 h-4 text-indigo-500 animate-in fade-in slide-in-from-left-2 duration-300" />
        )}
      </div>
    </div>
  );
}
