import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEARCH } from '@/lib/constants';

interface RecentSearchItem {
  query: string;
  trainNumber?: string;
  trainName?: string;
  searchedAt: string;
}

interface RecentSearchesState {
  searches: RecentSearchItem[];
  addSearch: (item: Omit<RecentSearchItem, 'searchedAt'>) => void;
  removeSearch: (query: string) => void;
  clearAll: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      searches: [],

      addSearch: (item) => {
        set((state) => {
          const filtered = state.searches.filter(
            (s) => s.query.toLowerCase() !== item.query.toLowerCase()
          );
          return {
            searches: [
              { ...item, searchedAt: new Date().toISOString() },
              ...filtered,
            ].slice(0, SEARCH.MAX_RECENT),
          };
        });
      },

      removeSearch: (query) => {
        set((state) => ({
          searches: state.searches.filter(
            (s) => s.query.toLowerCase() !== query.toLowerCase()
          ),
        }));
      },

      clearAll: () => {
        set({ searches: [] });
      },
    }),
    {
      name: 'railgaadi-recent-searches',
    }
  )
);
