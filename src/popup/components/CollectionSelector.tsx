import React, { useEffect, useState } from 'react';
import type { PostmanCollection } from '../../shared/types';
import { getCollections } from '../../utils/messaging';
import { Folder, RefreshCw, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CollectionSelectorProps {
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string) => void;
}

export default function CollectionSelector({
  selectedCollectionId,
  onSelectCollection
}: CollectionSelectorProps) {
  const [collections, setCollections] = useState<PostmanCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCollections();
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#787774] py-1">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Loading collections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2.5 bg-[#FFEBEB] border border-[#FFD4D4] rounded flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#D44C47] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-[#D44C47] font-medium mb-1">Failed to load collections</p>
          <button
            onClick={loadCollections}
            className="text-xs text-[#D44C47] font-bold hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="p-3 bg-[#F7F7F5] border border-[#E3E3E3] rounded flex items-center gap-2">
        <p className="text-sm text-[#787774]">
          No collections found.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="collection" className="text-xs font-semibold text-[#787774] uppercase tracking-wide mb-1.5 block">
        Target Collection
      </label>
      <div className="relative">
        <select
          id="collection"
          value={selectedCollectionId || ''}
          onChange={(e) => onSelectCollection(e.target.value)}
          className="w-full pl-3 pr-8 py-2 bg-white border border-[#E3E3E3] rounded focus:outline-none focus:ring-1 focus:ring-[#2383E2] focus:border-[#2383E2] text-sm text-[#37352F] cursor-pointer hover:bg-[#F7F7F5] transition-colors appearance-none shadow-sm"
        >
          <option value="">Select a collection...</option>
          {collections.map((collection) => (
            <option key={collection.uid} value={collection.uid}>
              {collection.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-3.5 h-3.5 text-[#9B9A97]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
