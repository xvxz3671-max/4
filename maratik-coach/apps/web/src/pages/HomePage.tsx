import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useApi } from '../hooks/useApi';
import { getCurrentWeek, getWeekDays, getDayName, formatDate } from '../utils/date';
import type { WeekPlan, UserStats } from '@maratik/shared';
import { MUSCLE_GROUP_LABELS } from '@maratik/shared';

export default function HomePage() {
  const { user, isReady } = useTelegram();
  const { get } = useApi();
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [currentWeek] = useState(getCurrentWeek());
  const weekDays = getWeekDays(currentWeek);

  useEffect(() => {
    if (isReady && user) {
      loadData();
    }
  }, [isReady, user]);

  const loadData = async () => {
    try {
      const [weekPlanData, statsData] = await Promise.all([
        get<WeekPlan>(`/api/week-plan?userId=${user.telegramId}&week=${currentWeek}`),
        get<UserStats>(`/api/stats?userId=${user.telegramId}`)
      ]);
      setWeekPlan(weekPlanData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  if (!isReady || !user) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <div className="container">
      {/* Header with Maratik */}
      <div className="text-center mb-16">
        <img src="/maratik.svg" alt="Маратик" className="maratik" />
        <h1>Привет, {user.firstName}!</h1>
        <p className="text-hint">Готов к тренировке?</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.currentStreak}</div>
            <div className="stat-label">Текущий стрик</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.bestStreak}</div>
            <div className="stat-label">Лучший стрик</div>
          </div>
        </div>
      )}

      {/* Week Plan */}
      <div className="card">
        <div className="flex-between mb-16">
          <h2>План недели</h2>
          <Link to="/plan" className="btn btn-secondary">
            Изменить
          </Link>
        </div>
        
        <div className="week-grid">
          {weekDays.map((day, index) => {
            const dayKey = dayKeys[index];
            const muscleGroup = weekPlan?.[dayKey];
            const isToday = formatDate(day) === formatDate(new Date());
            
            return (
              <Link
                key={index}
                to={muscleGroup ? `/workout?date=${formatDate(day)}&muscleGroup=${muscleGroup}` : '#'}
                className={`day-card ${isToday ? 'active' : ''}`}
                style={{ 
                  pointerEvents: muscleGroup ? 'auto' : 'none',
                  opacity: muscleGroup ? 1 : 0.5 
                }}
              >
                <div>{getDayName(index)}</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>
                  {muscleGroup ? MUSCLE_GROUP_LABELS[muscleGroup as keyof typeof MUSCLE_GROUP_LABELS] : '—'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-2 mt-16">
        <Link to="/history" className="btn btn-secondary">
          📊 История
        </Link>
        <Link to="/exercises" className="btn btn-secondary">
          💪 Упражнения
        </Link>
      </div>

      {/* Today's Workout */}
      <div className="mt-16">
        {(() => {
          const today = new Date();
          const todayIndex = (today.getDay() + 6) % 7; // Convert to Monday = 0
          const todayMuscleGroup = weekPlan?.[dayKeys[todayIndex]];
          
          if (todayMuscleGroup) {
            return (
              <Link 
                to={`/workout?date=${formatDate(today)}&muscleGroup=${todayMuscleGroup}`}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '18px', padding: '16px' }}
              >
                🔥 Начать тренировку: {MUSCLE_GROUP_LABELS[todayMuscleGroup as keyof typeof MUSCLE_GROUP_LABELS]}
              </Link>
            );
          }
          
          return (
            <div className="card text-center">
              <p className="text-hint">На сегодня тренировка не запланирована</p>
              <Link to="/plan" className="btn btn-primary mt-16">
                Составить план
              </Link>
            </div>
          );
        })()}
      </div>
    </div>
  );
}