import React, { useState } from 'react';
import type { CapturedRequest } from '../../shared/types';

interface RequestDetailProps {
  request: CapturedRequest;
}

export default function RequestDetail({ request }: RequestDetailProps) {
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'auth'>('headers');

  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'from-green-500 to-green-600';
      case 'POST':
        return 'from-blue-500 to-blue-600';
      case 'PUT':
        return 'from-yellow-500 to-yellow-600';
      case 'DELETE':
        return 'from-red-500 to-red-600';
      case 'PATCH':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Request Summary Header */}
      <div className={`bg-gradient-to-r ${getMethodColor(request.method)} px-4 py-3`}>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-md text-white text-xs font-bold tracking-wide">
            {request.method}
          </span>
          <span className="text-sm font-mono text-white break-all flex-1">{request.url}</span>
        </div>
        <div className="text-xs text-white text-opacity-80 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          {new Date(request.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-4 bg-gray-50">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'headers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Headers
            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 text-xs font-bold">
              {request.headers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'body'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Body
            {request.body && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'auth'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Auth
            {request.authType !== 'none' && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[200px] overflow-y-auto overflow-x-hidden">
        {activeTab === 'headers' && (
          <div className="space-y-2">
            {request.headers.map((header, index) => (
              <div key={index} className="flex gap-3 text-xs py-1.5 hover:bg-gray-50 rounded px-2 -mx-2">
                <span className="font-bold text-blue-700 min-w-[140px] flex-shrink-0">
                  {header.key}:
                </span>
                <span className="text-gray-700 break-all font-mono">{header.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="w-full">
            {request.body ? (
              <pre className="text-xs font-mono text-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-200 max-w-full">
                {typeof request.body === 'object'
                  ? formatJson(request.body)
                  : request.body}
              </pre>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 mx-auto text-gray-300 mb-2">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 italic">No request body</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600">Type:</span>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  request.authType === 'bearer'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : request.authType === 'basic'
                    ? 'bg-pink-100 text-pink-800 border border-pink-200'
                    : request.authType === 'apikey'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : request.authType === 'cookie'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                {request.authType === 'bearer' && '🔑'}
                {request.authType === 'basic' && '🔐'}
                {request.authType === 'apikey' && '🗝️'}
                {request.authType === 'cookie' && '🍪'}
                {request.authType.toUpperCase()}
              </span>
            </div>

            {request.authValue && request.authType !== 'none' && (
              <div className="w-full">
                <span className="text-xs font-bold text-gray-600 block mb-2">
                  Value:
                </span>
                <pre className="text-xs font-mono text-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg overflow-x-auto break-all border border-gray-200 max-w-full">
                  {request.authType === 'bearer' ? `Bearer ${request.authValue}` : request.authValue}
                </pre>
              </div>
            )}

            {request.authType === 'none' && (
              <div className="text-center py-6">
                <div className="w-10 h-10 mx-auto text-gray-300 mb-2">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 italic">No authentication detected</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
