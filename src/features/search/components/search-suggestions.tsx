'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, ArrowRight, X, Search, Train as TrainIcon, Sparkles } from 'lucide-react';
import { useRecentSearchesStore } from '@/store/recent-searches';
import { POPULAR_TRAINS } from '@/services/mock-data';
import { cn, getTrainTypeColor } from '@/lib/utils';
import type { Train } from '@/types/train';

interface SearchSuggestionsProps {
  query: string;
  results: Train[];
  isLoading: boolean;
  selectedIndex: number;
  onSelect: (trainNumber: string, trainName: string) => void;
}

export function SearchSuggestions({
  query,
  results,
  isLoading,
  selectedIndex,
  onSelect,
}: SearchSuggestionsProps) {
  const { searches, removeSearch, clearAll } = useRecentSearchesStore();
  const showResults = query.length >= 2 && results.length > 0;
  const showRecent = query.length < 2 && searches.length > 0;
  const showPopular = query.length < 2;
  const showEmpty = query.length >= 2 && !isLoading && results.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute top-full left-0 right-0 mt-2.5 rounded-2xl border border-border bg-surface shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden z-[100] max-h-[440px] flex flex-col backdrop-blur-xl"
    >
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {/* Search Results */}
        {showResults && (
          <div className="p-2 sm:p-2.5">
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3 text-accent" />
                Matching Trains
              </span>
              <span className="text-[10px] font-bold text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
                {results.length} found
              </span>
            </div>

            <div className="space-y-1">
              {results.slice(0, 6).map((train, i) => (
                <button
                  key={train.number}
                  type="button"
                  onClick={() => onSelect(train.number, train.name)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group',
                    i === selectedIndex
                      ? 'bg-accent-light text-accent ring-1 ring-accent/30'
                      : 'hover:bg-surface-hover text-text-primary'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-colors',
                      i === selectedIndex
                        ? 'bg-accent text-white'
                        : 'bg-surface-alt text-text-secondary group-hover:bg-accent-light group-hover:text-accent'
                    )}>
                      <TrainIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                          {train.name}
                        </span>
                        <span className="font-mono text-xs font-bold text-accent bg-accent-light px-1.5 py-0.5 rounded">
                          #{train.number}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-secondary">
                        <span className="truncate">{train.source.name}</span>
                        <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                        <span className="truncate">{train.destination.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      getTrainTypeColor(train.type)
                    )}>
                      {train.type}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {showRecent && (
          <div className="p-2 sm:p-2.5">
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-accent" />
                Recent Searches
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-[11px] font-semibold text-text-muted hover:text-error transition-colors px-1.5 py-0.5 rounded"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-1">
              {searches.slice(0, 4).map((s) => (
                <div
                  key={s.query}
                  onClick={() => onSelect(s.trainNumber || '', s.trainName || s.query)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left hover:bg-surface-hover transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-alt text-text-muted grid place-items-center shrink-0 group-hover:bg-accent-light group-hover:text-accent transition-colors">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                        {s.trainName || s.query}
                      </p>
                      {s.trainNumber && (
                        <p className="font-mono text-[11px] text-text-muted">
                          #{s.trainNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label="Remove search"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearch(s.query);
                      }}
                      className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Trains */}
        {showPopular && (
          <div className="p-2 sm:p-2.5">
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-accent" />
                Popular Express Trains
              </span>
              <span className="text-[10px] font-semibold text-text-muted">Direct tracking</span>
            </div>

            <div className="space-y-1">
              {POPULAR_TRAINS.slice(0, 4).map((train) => (
                <button
                  key={train.number}
                  type="button"
                  onClick={() => onSelect(train.number, train.name)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-alt text-text-muted grid place-items-center shrink-0 group-hover:bg-accent-light group-hover:text-accent transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                          {train.name}
                        </span>
                        <span className="font-mono text-xs text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                          #{train.number}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {train.source.name} → {train.destination.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      getTrainTypeColor(train.type)
                    )}>
                      {train.type}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {showEmpty && (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-2xl bg-surface-alt text-text-muted grid place-items-center mx-auto mb-2.5">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-text-primary">
              No trains found for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              Try searching with a 5-digit train number (e.g. 12952) or a train name (e.g. Rajdhani, Vande Bharat).
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && query.length >= 2 && (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton w-3/4 h-4 rounded" />
                  <div className="skeleton w-1/2 h-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint Footer */}
      <div className="px-4 py-2 border-t border-border-light bg-surface-alt/50 flex items-center justify-between text-[11px] text-text-muted font-medium">
        <span>Use <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[10px]">↑</kbd> <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[10px]">↓</kbd> to navigate</span>
        <span><kbd className="font-mono bg-surface border border-border px-1.5 py-0.5 rounded text-[10px]">↵</kbd> select · <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[10px]">Esc</kbd> close</span>
      </div>
    </motion.div>
  );
}
