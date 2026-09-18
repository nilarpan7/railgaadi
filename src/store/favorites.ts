import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteItem {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  addedAt: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (train: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (trainNumber: string) => void;
  isFavorite: (trainNumber: string) => boolean;
  toggleFavorite: (train: Omit<FavoriteItem, 'addedAt'>) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (train) => {
        set((state) => ({
          favorites: [
            { ...train, addedAt: new Date().toISOString() },
            ...state.favorites.filter((f) => f.trainNumber !== train.trainNumber),
          ],
        }));
      },

      removeFavorite: (trainNumber) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.trainNumber !== trainNumber),
        }));
      },

      isFavorite: (trainNumber) => {
        return get().favorites.some((f) => f.trainNumber === trainNumber);
      },

      toggleFavorite: (train) => {
        const state = get();
        if (state.isFavorite(train.trainNumber)) {
          state.removeFavorite(train.trainNumber);
        } else {
          state.addFavorite(train);
        }
      },
    }),
    {
      name: 'railgaadi-favorites',
    }
  )
);
