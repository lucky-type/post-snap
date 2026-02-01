import React, { useEffect, useState } from 'react';
import type { CaptureState } from '../../shared/types';
import {
  startCapture,
  stopCapture,
  getCaptureState,
  updateHostToken
} from '../../utils/messaging';
import { Play, Square, Key, Loader2 } from 'lucide-react';

interface CaptureControlsProps {
  selectedHost: string | null;
  selectedCollectionId: string | null;
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export default function CaptureControls({
  selectedHost,
  selectedCollectionId,
  onMessage
}: CaptureControlsProps) {
  const [captureState, setCaptureState] = useState<CaptureState | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    loadCaptureState();
    // Poll for state updates while capturing
    const interval = setInterval(loadCaptureState, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadCaptureState = async () => {
    try {
      const state = await getCaptureState();
      setCaptureState(state);
    } catch (err) {
      console.error('Failed to get capture state:', err);
    }
  };

  const handleStartCapture = async () => {
    if (!selectedHost || !selectedCollectionId) {
      onMessage({ type: 'error', text: 'Please select a host and collection' });
      return;
    }

    setLoading(true);
    try {
      const result = await startCapture(selectedHost, selectedCollectionId);
      onMessage({ type: 'success', text: result.message });
      await loadCaptureState();
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to start capture'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopCapture = async () => {
    setLoading(true);
    try {
      const result = await stopCapture();
      onMessage({ type: 'success', text: result.message });
      await loadCaptureState();
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to stop capture'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateToken = async () => {
    if (!selectedHost || !selectedCollectionId) {
      onMessage({ type: 'error', text: 'Please select a host and collection' });
      return;
    }

    setTokenLoading(true);
    try {
      const result = await updateHostToken(selectedHost, selectedCollectionId);
      onMessage({ type: 'success', text: result.message });
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update token'
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const isCapturing = captureState?.isCapturing || false;

  return (
    <div className="space-y-4">
      {/* Capture Status */}
      {isCapturing && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Capturing: {captureState?.targetHost}
            </span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Captured: {captureState?.capturedCount} | Synced: {captureState?.syncedCount}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {!isCapturing ? (
          <button
            onClick={handleStartCapture}
            disabled={loading || !selectedHost || !selectedCollectionId}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span className="font-semibold">Start Capture</span>
          </button>
        ) : (
          <button
            onClick={handleStopCapture}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="font-semibold">Stop Capture</span>
          </button>
        )}

        <button
          onClick={handleUpdateToken}
          disabled={tokenLoading || !selectedHost || !selectedCollectionId || isCapturing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
        >
          {tokenLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Key className="w-5 h-5 text-slate-400" />
          )}
          <span className="font-semibold">Capture Token</span>
        </button>
      </div>
    </div>
  );
}
