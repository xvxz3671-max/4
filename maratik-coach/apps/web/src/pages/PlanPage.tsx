import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useApi } from '../hooks/useApi';
import { getCurrentWeek, getWeekDays, getDayName } from '../utils/date';
import type { WeekPlan, MuscleGroup } from '@maratik/shared';
import { MUSCLE_GROUP_LABELS } from '@maratik/shared';

export default function PlanPage() {
  const { user, isReady } = useTelegram();
  const { get, put } = useApi();
  const navigate = useNavigate();
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [currentWeek] = useState(getCurrentWeek());
  const weekDays = getWeekDays(currentWeek);

  useEffect(() => {
    if (isReady && user) {
      loadWeekPlan();
    }
  }, [isReady, user]);

  const loadWeekPlan = async () => {
    try {
      const data = await get<WeekPlan>(`/api/week-plan?userId=${user.telegramId}&week=${currentWeek}`);
      setWeekPlan(data);
    } catch (error) {
      console.error('Failed to load week plan:', error);
    }
  };

  const updateDay = async (dayKey: string, muscleGroup: MuscleGroup | null) => {
    if (!weekPlan) return;

    const updatedPlan = {
      ...weekPlan,
      [dayKey]: muscleGroup
    };

    try {
      await put<WeekPlan>('/api/week-plan', updatedPlan);
      setWeekPlan(updatedPlan);
    } catch (error) {
      console.error('Failed to update week plan:', error);
    }
  };

  if (!isReady || !user || !weekPlan) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const muscleGroups = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

  return (
    <div className="container">
      <div className="flex-between mb-16">
        <h1>План недели</h1>
        <Link to="/" className="btn btn-secondary">
          Назад
        </Link>
      </div>

      <div className="card mb-16">
        <p className="text-hint mb-16">
          Выберите группы мышц для каждого дня недели. Оставьте пустым для дня отдыха.
        </p>

        {weekDays.map((day, index) => {
          const dayKey = dayKeys[index];
          const currentMuscleGroup = weekPlan[dayKey];

          return (
            <div key={index} className="mb-16">
              <h3 className="mb-16">{getDayName(index)} ({day.getDate()}.{day.getMonth() + 1})</h3>
              
              <div className="grid grid-3">
                <button
                  className={`btn ${!currentMuscleGroup ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateDay(dayKey, null)}
                >
                  Отдых
                </button>
                
                {muscleGroups.slice(0, 2).map(group => (
                  <button
                    key={group}
                    className={`btn ${currentMuscleGroup === group ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateDay(dayKey, group)}
                  >
                    {MUSCLE_GROUP_LABELS[group]}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-3 mt-16">
                {muscleGroups.slice(2).map(group => (
                  <button
                    key={group}
                    className={`btn ${currentMuscleGroup === group ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateDay(dayKey, group)}
                  >
                    {MUSCLE_GROUP_LABELS[group]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            // Quick plan: Push/Pull/Legs
            const quickPlan = {
              monday: 'chest' as MuscleGroup,
              tuesday: 'back' as MuscleGroup,
              wednesday: 'legs' as MuscleGroup,
              thursday: null,
              friday: 'shoulders' as MuscleGroup,
              saturday: 'abs' as MuscleGroup,
              sunday: null
            };
            
            Object.entries(quickPlan).forEach(([day, group]) => {
              updateDay(day, group);
            });
          }}
        >
          Быстрый план
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          Готово
        </button>
      </div>
    </div>
  );
}