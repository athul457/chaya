import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { FoodCourt } from "../types";
import {
  fetchShopsWithItems,
  saveShopToSupabase,
  deleteShopFromSupabase,
  getCachedCourts,
  saveCachedCourts,
} from "../services/shopService";

interface CourtsContextType {
  courts: FoodCourt[];
  isLoadingCourts: boolean;
  isAddShopModalOpen: boolean;
  setIsAddShopModalOpen: (open: boolean) => void;
  handleAddShop: (newShop: FoodCourt) => void;
  handleDeleteShop: (courtId: string) => void;
  handleUpdateCourt: (updated: FoodCourt) => void;
  refreshCourts: () => Promise<void>;
  getCourtById: (id: string) => FoodCourt | undefined;
}

const CourtsContext = createContext<CourtsContextType | undefined>(undefined);

export const CourtsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courts, setCourts] = useState<FoodCourt[]>(getCachedCourts);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);

  // Initial fetch from Supabase
  const refreshCourts = useCallback(async () => {
    try {
      const loaded = await fetchShopsWithItems();
      if (loaded && loaded.length > 0) {
        setCourts(loaded);
        saveCachedCourts(loaded);
      }
    } finally {
      setIsLoadingCourts(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchShopsWithItems().then((loaded) => {
      if (active) {
        if (loaded && loaded.length > 0) {
          setCourts(loaded);
          saveCachedCourts(loaded);
        }
        setIsLoadingCourts(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist courts changes to local cache
  useEffect(() => {
    saveCachedCourts(courts);
  }, [courts]);

  const handleAddShop = (newShop: FoodCourt) => {
    setCourts((prev) => [...prev, newShop]);
    saveShopToSupabase(newShop);
  };

  const handleDeleteShop = (courtId: string) => {
    setCourts((prev) => prev.filter((c) => c.id !== courtId));
    deleteShopFromSupabase(courtId);
  };

  const handleUpdateCourt = (updated: FoodCourt) => {
    setCourts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const getCourtById = useCallback(
    (id: string) => courts.find((c) => c.id === id),
    [courts]
  );

  return (
    <CourtsContext.Provider
      value={{
        courts,
        isLoadingCourts,
        isAddShopModalOpen,
        setIsAddShopModalOpen,
        handleAddShop,
        handleDeleteShop,
        handleUpdateCourt,
        refreshCourts,
        getCourtById,
      }}
    >
      {children}
    </CourtsContext.Provider>
  );
};

export function useCourts() {
  const context = useContext(CourtsContext);
  if (!context) {
    throw new Error("useCourts must be used within a CourtsProvider");
  }
  return context;
}
