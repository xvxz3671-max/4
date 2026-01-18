import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useApi } from '../hooks/useApi';
import { formatTime } from '../utils/date';
import type { Workout, Exercise, WorkoutSet, MuscleGroup } from '@maratik/shared';
import { MUSCLE_GROUP_LABELS } from '@maratik/shared';

export default function WorkoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, sendData } = useTelegram();
  const { get, post, put } = useApi();
  
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const muscleGroup = searchParams.get('muscleGroup') as MuscleGroup;
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const loadData = async () => {
    try {
      // Get or create workout
      const workouts = await get<Workout[]>(`/api/workouts?userId=${user.telegramId}&date=${date}`);
      let currentWorkout = workouts.find(w => w.muscleGroup === muscleGroup);
      
      if (!currentWorkout) {
        currentWorkout = await post<Workout>('/api/workouts', {
          userId: user.telegramId,
          date,
          muscleGroup
        });
      }
      
      setWorkout(currentWorkout);
      
      // Load exercises for muscle group
      const allExercises = await get<Exercise[]>(`/api/exercises?userId=${user.telegramId}`);
      const filteredExercises = allExercises.filter(ex => ex.muscleGroup === muscleGroup);
      setExercises(filteredExercises);
      
      if (filteredExercises.length > 0) {
        setSelectedExercise(filteredExercises[0]);
      }
    } catch (error) {
      console.error('Failed to load workout data:', error);
    }
  };

  const addSet = async () => {
    if (!workout || !selectedExercise || !reps) return;

    try {
      const set = await post<WorkoutSet>('/api/workout-sets', {
        workoutId: workout.id,
        exerciseId: selectedExercise.id,
        weight: weight ? parseFloat(weight) : undefined,
        reps: parseInt(reps),
        restTime: 90 // Default rest time
      });

      // Update workout with new set
      const updatedWorkout = {
        ...workout,
        sets: [...(workout.sets || []), set]
      };
      setWorkout(updatedWorkout);

      // Start rest timer
      setRestTimer(90);
      setIsResting(true);
      
      // Clear inputs
      setWeight('');
      setReps('');
    } catch (error) {
      console.error('Failed to add set:', error);
    }
  };

  const completeWorkout = async () => {
    if (!workout) return;

    try {
      const duration = Math.round((Date.now() - startTime) / 60000); // minutes
      const completedWorkout = await put<any>(`/api/workouts/${workout.id}/complete`, { duration });
      
      // Send data to Telegram bot
      sendData({
        type: 'workout_completed',
        payload: {
          muscleGroup: MUSCLE_GROUP_LABELS[muscleGroup],
          sets: workout.sets?.length || 0,
          duration,
          date
        }
      });
      
      navigate('/');
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  if (!workout) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh' }}>
        <div>Загрузка тренировки...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-16">
        <h1>{MUSCLE_GROUP_LABELS[muscleGroup]}</h1>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Назад
        </button>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <div className="card text-center mb-16" style={{ backgroundColor: 'var(--warning-color)', color: 'white' }}>
          <div className="timer">{formatTime(restTimer)}</div>
          <p>Отдых между подходами</p>
          <button 
            className="btn btn-secondary mt-16"
            onClick={() => {
              setIsResting(false);
              setRestTimer(0);
            }}
          >
            Пропустить
          </button>
        </div>
      )}

      {/* Exercise Selection */}
      <div className="card mb-16">
        <h3 className="mb-16">Упражнение</h3>
        <select 
          className="select mb-16"
          value={selectedExercise?.id || ''}
          onChange={(e) => {
            const exercise = exercises.find(ex => ex.id === e.target.value);
            setSelectedExercise(exercise || null);
          }}
        >
          {exercises.map(exercise => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Set */}
      <div className="card mb-16">
        <h3 className="mb-16">Добавить подход</h3>
        <div className="grid grid-2 mb-16">
          <div>
            <label className="text-hint">Вес (кг)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="text-hint">Повторения</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              required
            />
          </div>
        </div>
        <button 
          className="btn btn-primary"
          onClick={addSet}
          disabled={!reps || isResting}
          style={{ width: '100%' }}
        >
          Добавить подход
        </button>
      </div>

      {/* Current Sets */}
      {workout.sets && workout.sets.length > 0 && (
        <div className="card mb-16">
          <h3 className="mb-16">Выполненные подходы ({workout.sets.length})</h3>
          {workout.sets.map((set, index) => (
            <div key={set.id} className="exercise-item">
              <span>
                {exercises.find(ex => ex.id === set.exerciseId)?.name}
              </span>
              <span>
                {set.weight ? `${set.weight}кг × ` : ''}{set.reps} раз
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Complete Workout */}
      <button
        className="btn btn-primary"
        onClick={completeWorkout}
        disabled={!workout.sets || workout.sets.length === 0}
        style={{ 
          width: '100%', 
          fontSize: '18px', 
          padding: '16px',
          backgroundColor: 'var(--success-color)'
        }}
      >
        ✅ Завершить тренировку
      </button>
    </div>
  );
}