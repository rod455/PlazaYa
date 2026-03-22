// src/screens/quiz/QuizScreen.js
// Tela de Quiz de Conocimientos — acessada pelo botão flutuante 🧠
// Redireciona para o KnowledgeQuizScreen

import React from 'react';
import KnowledgeQuizScreen from '../knowledge/KnowledgeQuizScreen';

export default function QuizScreen(props) {
  return <KnowledgeQuizScreen {...props} />;
}
