import React, { createContext, useContext, useState } from 'react';

const QuizContext = createContext(null);

export const QuizProvider = ({ children }) => {
  const [answers, setAnswers] = useState({
    escolaridade: null,
    area: null,
    areaOutra: '',
    mobilidade: null,
    estado: null,
    salario: null,
    curso: null,
    preparacao: null,
  });

  const setAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const resetQuiz = () => {
    setAnswers({
      escolaridade: null,
      area: null,
      areaOutra: '',
      mobilidade: null,
      estado: null,
      salario: null,
      curso: null,
      preparacao: null,
    });
  };

  return (
    <QuizContext.Provider value={{ answers, setAnswer, resetQuiz }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz debe usarse dentro de QuizProvider');
  return context;
};
