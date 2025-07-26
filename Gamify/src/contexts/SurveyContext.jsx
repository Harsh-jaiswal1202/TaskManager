import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.js';
import Cookies from 'js-cookie';

const SurveyContext = createContext();

export const SurveyProvider = ({ children }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch survey responses from backend
  const fetchSurveyResponses = useCallback(async () => {
    try {
      const userId = Cookies.get('id');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await apiService.getSurveyResponses(userId);
      
      setResponses(response.data.responses || []);
    } catch (error) {
      console.error('Failed to fetch survey responses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save survey response to backend
  const saveSurveyResponse = async (categoryId, answers) => {
    try {
      const userId = Cookies.get('id');
      if (!userId) return;

      const response = await apiService.submitSurveyResponse({
        userId,
        categoryId,
        answers,
        timestamp: new Date().toISOString()
      });

      // Add to local state
      setResponses(prev => [...prev, response.data.response]);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save survey response:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to save response' 
      };
    }
  };

  useEffect(() => {
    fetchSurveyResponses();
  }, [fetchSurveyResponses]);

  const addResponse = async (categoryId, answers) => {
    return await saveSurveyResponse(categoryId, answers);
  };

  return (
    <SurveyContext.Provider value={{ 
      responses, 
      addResponse, 
      loading,
      refreshResponses: fetchSurveyResponses 
    }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => useContext(SurveyContext);
