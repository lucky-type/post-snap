import React, { useEffect, useState } from 'react';
import type { HostInfo } from '../../shared/types';
import { getHosts } from '../../utils/messaging';
import { RefreshCw } from 'lucide-react';

interface HostSelectorProps {
  selectedHost: string | null;
  onSelectHost: (host: string | null) => void;
  disabled?: boolean;
}

export default function HostSelector({
  selectedHost,
  onSelectHost,
  disabled
}: HostSelectorProps) {
  const [hosts, setHosts] = useState<HostInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = async () => {
    setLoading(true);
    try {
      const data = await getHosts();
      setHosts(data);
    } catch (err) {
      console.error('Failed to load hosts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Target Host
        </label>
        <button
          onClick={loadHosts}
          disabled={loading || disabled}
          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <select
        value={selectedHost || ''}
        onChange={(e) => onSelectHost(e.target.value || null)}
        disabled={disabled || loading}
        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select a host...</option>
        {hosts.map((host) => (
          <option key={host.host} value={host.host}>
            {host.host} ({host.requestCount} requests){host.hasAuth ? ' *' : ''}
          </option>
        ))}
      </select>

      {hosts.length === 0 && !loading && (
        <p className="mt-2 text-xs text-slate-400">
          No hosts captured yet. Browse some websites to capture requests.
        </p>
      )}
    </div>
  );
}
