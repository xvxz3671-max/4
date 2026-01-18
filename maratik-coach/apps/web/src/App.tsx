import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useApi } from './hooks/useApi';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import ExercisesPage from './pages/ExercisesPage';

function App() {
  const { user, isReady } = useTelegram();
  const { post } = useApi();

  useEffect(() => {
    if (isReady && user) {
      // Initialize user in database
      post('/api/users', user).catch(console.error);
    }
  }, [isReady, user]);

  if (!isReady) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh' }}>
        <div>
          <img src="/maratik.svg" alt="Маратик" className="maratik" />
          <p className="text-center">Загрузка Maratik Coach...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
      </Routes>
    </Router>
  );
}

export default App;