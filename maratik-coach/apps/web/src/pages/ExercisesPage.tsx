import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useApi } from '../hooks/useApi';
import type { Exercise, MuscleGroup } from '@maratik/shared';
import { MUSCLE_GROUP_LABELS } from '@maratik/shared';

export default function ExercisesPage() {
  const { user } = useTelegram();
  const { get, post } = useApi();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroup: 'chest' as MuscleGroup
  });
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | ''>('');

  useEffect(() => {
    if (user) {
      loadExercises();
    }
  }, [user]);

  const loadExercises = async () => {
    try {
      const data = await get<Exercise[]>(`/api/exercises?userId=${user.telegramId}`);
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;

    try {
      const exercise = await post<Exercise>('/api/exercises', {
        ...newExercise,
        userId: user.telegramId
      });
      
      setExercises([...exercises, exercise]);
      setNewExercise({ name: '', muscleGroup: 'chest' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const filteredExercises = selectedMuscleGroup 
    ? exercises.filter(ex => ex.muscleGroup === selectedMuscleGroup)
    : exercises;

  const exercisesByGroup = Object.keys(MUSCLE_GROUP_LABELS).reduce((acc, group) => {
    acc[group as MuscleGroup] = exercises.filter(ex => ex.muscleGroup === group);
    return acc;
  }, {} as Record<MuscleGroup, Exercise[]>);

  return (
    <div className="container">
      <div className="flex-between mb-16">
        <h1>Упражнения</h1>
        <Link to="/" className="btn btn-secondary">
          Назад
        </Link>
      </div>

      {/* Add Exercise Button */}
      <div className="mb-16">
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Отмена' : '+ Добавить упражнение'}
        </button>
      </div>

      {/* Add Exercise Form */}
      {showAddForm && (
        <div className="card mb-16">
          <h3 className="mb-16">Новое упражнение</h3>
          <form onSubmit={addExercise}>
            <div className="mb-16">
              <label className="text-hint">Название</label>
              <input
                type="text"
                className="input"
                placeholder="Название упражнения"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-16">
              <label className="text-hint">Группа мышц</label>
              <select
                className="select"
                value={newExercise.muscleGroup}
                onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value as MuscleGroup })}
              >
                {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Добавить
            </button>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="card mb-16">
        <h3 className="mb-16">Фильтр по группе мышц</h3>
        <select
          className="select"
          value={selectedMuscleGroup}
          onChange={(e) => setSelectedMuscleGroup(e.target.value as MuscleGroup | '')}
        >
          <option value="">Все группы</option>
          {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Exercises by Group */}
      {selectedMuscleGroup ? (
        <div>
          <h3 className="mb-16">
            {MUSCLE_GROUP_LABELS[selectedMuscleGroup]} ({filteredExercises.length})
          </h3>
          {filteredExercises.map(exercise => (
            <div key={exercise.id} className="exercise-item">
              <div>
                <div>{exercise.name}</div>
                {exercise.isCustom && (
                  <div className="badge">Моё</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {Object.entries(exercisesByGroup).map(([group, groupExercises]) => (
            <div key={group} className="mb-16">
              <h3 className="mb-16">
                {MUSCLE_GROUP_LABELS[group as MuscleGroup]} ({groupExercises.length})
              </h3>
              {groupExercises.length === 0 ? (
                <p className="text-hint">Нет упражнений в этой группе</p>
              ) : (
                groupExercises.map(exercise => (
                  <div key={exercise.id} className="exercise-item">
                    <div>
                      <div>{exercise.name}</div>
                      {exercise.isCustom && (
                        <div className="badge">Моё</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {exercises.length === 0 && (
        <div className="card text-center">
          <p className="text-hint">Пока нет упражнений</p>
          <button
            className="btn btn-primary mt-16"
            onClick={() => setShowAddForm(true)}
          >
            Добавить первое упражнение
          </button>
        </div>
      )}
    </div>
  );
}