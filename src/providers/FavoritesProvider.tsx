import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getItem, setItem, StorageKeys } from '@/helpers/storage';

type FavoritesContextValue = {
  /** Stable array of favorited car IDs, sorted by most-recent-first. */
  favorites: string[];
  /** True after the persisted favorites have been loaded from storage. */
  ready: boolean;
  isFavorite: (carId: string) => boolean;
  toggleFavorite: (carId: string) => void;
  addFavorite: (carId: string) => void;
  removeFavorite: (carId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  ready: false,
  isFavorite: () => false,
  toggleFavorite: () => {},
  addFavorite: () => {},
  removeFavorite: () => {},
  clearFavorites: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getItem<string[]>(StorageKeys.FAVORITE_CARS)
      .then(saved => {
        if (Array.isArray(saved)) {
          setFavorites(saved.filter((id): id is string => typeof id === 'string'));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Set used for O(1) membership checks
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    setItem(StorageKeys.FAVORITE_CARS, next).catch(() => {});
  }, []);

  const isFavorite = useCallback(
    (carId: string) => favoriteSet.has(carId),
    [favoriteSet],
  );

  const addFavorite = useCallback(
    (carId: string) => {
      if (!carId) return;
      setFavorites(prev => {
        if (prev.includes(carId)) return prev;
        const next = [carId, ...prev];
        setItem(StorageKeys.FAVORITE_CARS, next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const removeFavorite = useCallback(
    (carId: string) => {
      if (!carId) return;
      setFavorites(prev => {
        if (!prev.includes(carId)) return prev;
        const next = prev.filter(id => id !== carId);
        setItem(StorageKeys.FAVORITE_CARS, next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const toggleFavorite = useCallback(
    (carId: string) => {
      if (!carId) return;
      setFavorites(prev => {
        const exists = prev.includes(carId);
        const next = exists ? prev.filter(id => id !== carId) : [carId, ...prev];
        setItem(StorageKeys.FAVORITE_CARS, next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const clearFavorites = useCallback(() => persist([]), [persist]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      ready,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [favorites, ready, isFavorite, toggleFavorite, addFavorite, removeFavorite, clearFavorites],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
