import { useState, useEffect, useCallback, useRef } from 'react';
import { dataRefreshManager } from '../services/api.js';

/**
 * Custom hook for real-time data management
 * Automatically refreshes data when changes occur and provides loading states
 */
export const useRealTimeData = (key, fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const unsubscribeRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = dataRefreshManager.getCached(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          setLastUpdated(new Date());
          return;
        }
      }

      // Fetch fresh data
      const result = await fetchFunction();
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
        setLastUpdated(new Date());
        
        // Cache the data
        dataRefreshManager.setCached(key, result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error(`Error fetching data for key ${key}:`, err);
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      }
    }
  }, [key, fetchFunction, ...dependencies]);

  // Subscribe to data changes
  useEffect(() => {
    // Subscribe to data refresh events
    unsubscribeRef.current = dataRefreshManager.subscribe(key, (newData) => {
      if (isMountedRef.current) {
        if (newData === null) {
          // Cache was invalidated, fetch fresh data
          fetchData(true);
        } else {
          // New data was provided
          setData(newData);
          setLastUpdated(new Date());
        }
      }
    });

    // Initial fetch
    fetchData();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [key, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Invalidate cache function
  const invalidate = useCallback(() => {
    dataRefreshManager.invalidate(key);
  }, [key]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    invalidate
  };
};

/**
 * Hook for managing real-time dashboard data
 */
export const useDashboardData = (userId) => {
  const fetchDashboard = useCallback(async () => {
    const response = await fetch(`/api/batch-progress/dashboard/${userId}`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch dashboard data');
    }
    return result.dashboard;
  }, [userId]);

  return useRealTimeData('dashboard', fetchDashboard, [userId]);
};

/**
 * Hook for managing real-time batch progress data
 */
export const useBatchProgressData = (batchId) => {
  const fetchBatchProgress = useCallback(async () => {
    const response = await fetch(`/api/batch-progress/batch/${batchId}`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch batch progress');
    }
    return result;
  }, [batchId]);

  return useRealTimeData('batch-progress', fetchBatchProgress, [batchId]);
};

/**
 * Hook for managing real-time user progress data
 */
export const useUserProgressData = (userId, batchId) => {
  const fetchUserProgress = useCallback(async () => {
    const response = await fetch(`/api/batch-progress/user/${userId}/${batchId}`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch user progress');
    }
    return result.progress;
  }, [userId, batchId]);

  return useRealTimeData('user-progress', fetchUserProgress, [userId, batchId]);
};

/**
 * Hook for managing real-time tasks data
 */
export const useTasksData = () => {
  const fetchTasks = useCallback(async () => {
    const response = await fetch('/api/task/all', {
      credentials: 'include'
    });
    const result = await response.json();
    return result;
  }, []);

  return useRealTimeData('tasks', fetchTasks);
};

/**
 * Hook for managing real-time batches data
 */
export const useBatchesData = () => {
  const fetchBatches = useCallback(async () => {
    const response = await fetch('/api/batches/', {
      credentials: 'include'
    });
    const result = await response.json();
    return result;
  }, []);

  return useRealTimeData('batches', fetchBatches);
}; 