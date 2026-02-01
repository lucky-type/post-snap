import React, { useState } from 'react';
import { saveApiKey, testConnection } from '../../utils/messaging';
import { Key, Save, Activity, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await saveApiKey(apiKey);
      setMessage({ type: 'success', text: result });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save API key'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key to test' });
      return;
    }

    setTestLoading(true);
    setMessage(null);

    try {
      const result = await testConnection(apiKey);
      setMessage({ type: 'success', text: result.message });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-6 max-w-lg mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-bold text-[#37352F] mb-2 tracking-tight">Configuration</h2>
          <p className="text-sm text-[#787774]">
            Connect PostSnap to your Postman workspace to start syncing requests.
          </p>
        </div>

        <div className="space-y-6">
          {/* API Key Input */}
          <div className="space-y-2">
            <label htmlFor="apiKey" className="flex items-center gap-2 text-sm font-semibold text-[#37352F]">
              <Key className="w-3.5 h-3.5 text-[#787774]" />
              Postman API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="PMAK-xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-white border border-[#E3E3E3] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2383E2] focus:border-[#2383E2] font-mono text-sm shadow-sm transition-all placeholder:text-[#9B9A97]"
              />
            </div>
            <div className="flex justify-end">
              <a
                href="https://postman.co/settings/me/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#787774] hover:text-[#37352F] flex items-center gap-1 hover:underline transition-colors"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleSave}
              disabled={loading || !apiKey.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#37352F] text-white rounded hover:bg-[#2F2F2F] disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors text-sm"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Key
            </button>

            <button
              onClick={handleTest}
              disabled={testLoading || !apiKey.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E3E3E3] text-[#37352F] rounded hover:bg-[#F7F7F5] disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors text-sm"
            >
              {testLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-[#37352F]/20 border-t-[#37352F] rounded-full animate-spin" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              Test Connection
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={cn(
                "p-3 rounded border flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 text-sm",
                message.type === 'success'
                  ? 'bg-white border-[#E3E3E3] text-[#37352F]'
                  : 'bg-[#FFEBEB] border-[#FFD4D4] text-[#D44C47]'
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#33A853] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#D44C47] shrink-0 mt-0.5" />
              )}
              <p className="font-medium leading-relaxed">{message.text}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-[#F7F7F5] rounded border border-[#E3E3E3] p-4 text-sm">
            <h3 className="font-semibold text-[#37352F] mb-3">Quick Setup Guide</h3>
            <ol className="text-[#37352F] space-y-2 list-decimal list-inside pl-1 marker:text-[#9B9A97]">
              <li>Go to Postman Settings &gt; API Keys</li>
              <li>Generate a new API Key for PostSnap</li>
              <li>Paste it above and click "Save Key"</li>
              <li>Verify with "Test Connection"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
