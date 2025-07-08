import React, { createContext, useContext, useState, useEffect } from 'react';

const SurveyContext = createContext();

export const SurveyProvider = ({ children }) => {
  const [responses, setResponses] = useState([]);

  // Load from localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem("surveyResponses");
    if (stored) {
      setResponses(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever responses change
  useEffect(() => {
    localStorage.setItem("surveyResponses", JSON.stringify(responses));
  }, [responses]);

  const addResponse = (categoryId, answers) => {
    setResponses((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        categoryId,
        answers,
        timestamp: new Date().toISOString(), // safer format
      },
    ]);
  };

  return (
    <SurveyContext.Provider value={{ responses, addResponse }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => useContext(SurveyContext);
