import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.js';
import Cookies from 'js-cookie';

const PointsContext = createContext();

export function PointsProvider({ children }) {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user points from backend
  const fetchUserPoints = useCallback(async () => {
    try {
      const userId = Cookies.get('id');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await apiService.getUser(userId);
      
      setPoints(response.data.xps || 0);
    } catch (error) {
      console.error('Failed to fetch user points:', error);
      setPoints(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update points in backend
  const updatePointsInBackend = async (newPoints) => {
    try {
      const userId = Cookies.get('id');
      if (!userId) return;

      await apiService.updatePoints(userId, { xps: newPoints });
    } catch (error) {
      console.error('Failed to update points in backend:', error);
    }
  };

  useEffect(() => {
    fetchUserPoints();
  }, [fetchUserPoints]);

  const addPoints = async (amount) => {
    const newPoints = points + amount;
    setPoints(newPoints);
    
    // Update in backend
    await updatePointsInBackend(newPoints);
  };

  const setPointsDirectly = async (newPoints) => {
    setPoints(newPoints);
    
    // Update in backend
    await updatePointsInBackend(newPoints);
  };

  return (
    <PointsContext.Provider value={{ 
      points, 
      addPoints, 
      setPoints: setPointsDirectly,
      loading,
      refreshPoints: fetchUserPoints 
    }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}
