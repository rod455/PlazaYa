// src/context/QuizContext.js
// Estado global do quiz de onboarding

import React, { createContext, useContext, useState } from 'react';

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
  const [answers, setAnswers] = useState({
    escolaridade: null,  // Quiz1
    area:         null,  // Quiz2
    mobilidade:   null,  // Quiz3
    estado:       null,  // Quiz4
    salario:      null,  // Quiz5
    curso:        null,  // Quiz6
    preparacao:   null,  // Quiz7
  });

  function setAnswer(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function resetAnswers() {
    setAnswers({
      escolaridade: null,
      area:         null,
      mobilidade:   null,
      estado:       null,
      salario:      null,
      curso:        null,
      preparacao:   null,
    });
  }

  return (
    <QuizContext.Provider value={{ answers, setAnswer, resetAnswers }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz deve ser usado dentro de QuizProvider');
  return ctx;
}
