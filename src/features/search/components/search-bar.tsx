'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTrainSearch } from '../hooks/useTrainSearch';
import { SearchSuggestions } from './search-suggestions';
import { useRecentSearchesStore } from '@/store/recent-searches';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  autoFocus?: boolean;
  onTrainSelect?: (trainNumber: string) => void;
}

export function SearchBar({ variant = 'hero', autoFocus = false, onTrainSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { addSearch } = useRecentSearchesStore();
  const { data: results, isLoading } = useTrainSearch(query);

  // Open on focus: an empty query shows recent searches and popular trains.
  const showSuggestions = isFocused;

  // Keyboard shortcut: "/" to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFocused]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (trainNumber: string, trainName: string) => {
      addSearch({ query: trainName, trainNumber, trainName });
      setQuery('');
      setIsFocused(false);
      if (onTrainSelect) {
        onTrainSelect(trainNumber);
      } else {
        router.push(`/tracking/${trainNumber}`);
      }
    },
    [addSearch, onTrainSelect, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results || [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      handleSelect(items[selectedIndex].number, items[selectedIndex].name);
    } else if (e.key === 'Enter' && query.trim().length >= 2) {
      e.preventDefault();
      if (items.length > 0) {
        handleSelect(items[0].number, items[0].name);
      } else {
        router.push(`/tracking/${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={cn('relative w-full transition-[z-index]', isFocused ? 'z-50' : 'z-30')}>
      <div
        className={cn(
          'relative flex items-center rounded-2xl border transition-all duration-200',
          isHero
            ? 'h-14 bg-surface shadow-lg sm:h-16'
            : 'h-11 bg-surface shadow-2xs',
          isFocused
            ? 'border-accent shadow-glow ring-4 ring-accent/15'
            : 'border-border hover:border-accent/40'
        )}
      >
        <Search
          className={cn(
            'shrink-0 ml-4 sm:ml-5 transition-colors',
            isHero ? 'w-5 h-5' : 'w-4 h-4',
            isFocused ? 'text-accent' : 'text-text-muted'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by train name or number..."
          autoFocus={autoFocus}
          className={cn(
            'flex-1 bg-transparent outline-none px-3 text-text-primary placeholder:text-text-muted',
            isHero ? 'text-base sm:text-lg' : 'text-sm'
          )}
          aria-label="Search trains"
        />

        {/* Loading / Clear */}
        <div className="shrink-0 mr-3 sm:mr-4 flex items-center gap-2">
          {isLoading && query.length >= 2 && (
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          )}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full hover:bg-surface-alt transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
          {!isFocused && !query && isHero && (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-surface-alt text-[10px] font-mono text-text-muted border border-border-light">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <SearchSuggestions
            query={query}
            results={results || []}
            isLoading={isLoading}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
