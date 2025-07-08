import React, { createContext, useState, useContext, useEffect } from 'react';

const PointsContext = createContext();

export function PointsProvider({ children }) {
  const [points, setPoints] = useState(() => {
    // Initial load from localStorage or default to 0
    const storedPoints = localStorage.getItem("userPoints");
    return storedPoints ? parseInt(storedPoints, 10) : 0;
  });

  const addPoints = (amount) => {
    setPoints((prev) => {
      const newPoints = prev + amount;
      localStorage.setItem("userPoints", newPoints);
      return newPoints;
    });
  };

  // Optional: Keep in sync if points are updated manually somewhere
  useEffect(() => {
    localStorage.setItem("userPoints", points);
  }, [points]);

  return (
    <PointsContext.Provider value={{ points, addPoints }}>
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
