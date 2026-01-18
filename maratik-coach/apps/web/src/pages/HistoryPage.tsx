import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useApi } from '../hooks/useApi';
import type { Workout, Exercise } from '@maratik/shared';
import { MUSCLE_GROUP_LABELS } from '@maratik/shared';

export default function HistoryPage() {
  const { user } = useTelegram();
  const { get } = useApi();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedExercise) {
      loadWorkoutsByExercise();
    } else if (user) {
      loadAllWorkouts();
    }
  }, [selectedExercise, user]);

  const loadData = async () => {
    try {
      const exercisesData = await get<Exercise[]>(`/api/exercises?userId=${user.telegramId}`);
      setExercises(exercisesData);
      await loadAllWorkouts();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllWorkouts = async () => {
    try {
      const workoutsData = await get<Workout[]>(`/api/workouts?userId=${user.telegramId}`);
      setWorkouts(workoutsData.filter(w => w.completed));
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  const loadWorkoutsByExercise = async () => {
    try {
      const workoutsData = await get<Workout[]>(`/api/workouts?userId=${user.telegramId}&exerciseId=${selectedExercise}`);
      setWorkouts(workoutsData.filter(w => w.completed));
    } catch (error) {
      console.error('Failed to load workouts by exercise:', error);
    }
  };

  const getExerciseStats = (exerciseId: string) => {
    const sets = workouts
      .flatMap(w => w.sets || [])
      .filter(s => s.exerciseId === exerciseId);
    
    if (sets.length === 0) return null;

    const maxWeight = Math.max(...sets.map(s => s.weight || 0));
    const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
    const avgReps = Math.round(totalReps / sets.length);

    return { maxWeight, totalReps, avgReps, totalSets: sets.length };
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh' }}>
        <div>Загрузка истории...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-16">
        <h1>История тренировок</h1>
        <Link to="/" className="btn btn-secondary">
          Назад
        </Link>
      </div>

      {/* Filter by Exercise */}
      <div className="card mb-16">
        <h3 className="mb-16">Фильтр по упражнению</h3>
        <select
          className="select"
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
        >
          <option value="">Все упражнения</option>
          {exercises.map(exercise => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      {selectedExercise && (() => {
        const stats = getExerciseStats(selectedExercise);
        const exercise = exercises.find(ex => ex.id === selectedExercise);
        
        if (!stats || !exercise) return null;

        return (
          <div className="card mb-16">
            <h3 className="mb-16">Статистика: {exercise.name}</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.maxWeight || '—'}</div>
                <div className="stat-label">Макс. вес (кг)</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalSets}</div>
                <div className="stat-label">Всего подходов</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalReps}</div>
                <div className="stat-label">Всего повторений</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.avgReps}</div>
                <div className="stat-label">Среднее повторений</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="card text-center">
          <p className="text-hint">
            {selectedExercise ? 'Нет тренировок с выбранным упражнением' : 'Пока нет завершённых тренировок'}
          </p>
          <Link to="/" className="btn btn-primary mt-16">
            Начать тренировку
          </Link>
        </div>
      ) : (
        <div>
          <h3 className="mb-16">Тренировки ({workouts.length})</h3>
          {workouts.map(workout => (
            <div key={workout.id} className="card">
              <div className="flex-between mb-16">
                <div>
                  <h4>{MUSCLE_GROUP_LABELS[workout.muscleGroup as keyof typeof MUSCLE_GROUP_LABELS]}</h4>
                  <p className="text-hint">{new Date(workout.date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div className="text-center">
                  <div className="stat-number" style={{ fontSize: '18px' }}>
                    {workout.sets?.length || 0}
                  </div>
                  <div className="stat-label">подходов</div>
                </div>
              </div>
              
              {workout.sets && workout.sets.length > 0 && (
                <div>
                  {workout.sets.map((set, index) => {
                    const exercise = exercises.find(ex => ex.id === set.exerciseId);
                    return (
                      <div key={set.id} className="exercise-item">
                        <span>{exercise?.name || 'Неизвестное упражнение'}</span>
                        <span>
                          {set.weight ? `${set.weight}кг × ` : ''}{set.reps} раз
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {workout.duration && (
                <div className="text-hint text-center mt-16">
                  Длительность: {workout.duration} мин
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}