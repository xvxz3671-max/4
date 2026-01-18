import { z } from 'zod';

// Muscle Groups
export const MuscleGroup = z.enum([
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 
  'legs', 'glutes', 'abs', 'cardio'
]);

export type MuscleGroup = z.infer<typeof MuscleGroup>;

// Exercise
export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: MuscleGroup,
  isCustom: z.boolean().default(false),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

// Workout Set
export const WorkoutSetSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  weight: z.number().optional(),
  reps: z.number(),
  restTime: z.number().optional(), // seconds
});

export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;

// Workout
export const WorkoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(), // ISO date
  muscleGroup: MuscleGroup,
  sets: z.array(WorkoutSetSchema),
  duration: z.number().optional(), // minutes
  completed: z.boolean().default(false),
});

export type Workout = z.infer<typeof WorkoutSchema>;

// User Stats
export const UserStatsSchema = z.object({
  userId: z.string(),
  currentStreak: z.number().default(0),
  bestStreak: z.number().default(0),
  totalWorkouts: z.number().default(0),
  badges: z.array(z.string()).default([]),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

// Week Plan
export const WeekPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  week: z.string(), // ISO week (YYYY-WW)
  monday: MuscleGroup.optional(),
  tuesday: MuscleGroup.optional(),
  wednesday: MuscleGroup.optional(),
  thursday: MuscleGroup.optional(),
  friday: MuscleGroup.optional(),
  saturday: MuscleGroup.optional(),
  sunday: MuscleGroup.optional(),
});

export type WeekPlan = z.infer<typeof WeekPlanSchema>;

// API Responses
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Telegram WebApp Data
export const TelegramWebAppDataSchema = z.object({
  type: z.enum(['workout_completed', 'stats_update']),
  payload: z.any(),
});

export type TelegramWebAppData = z.infer<typeof TelegramWebAppDataSchema>;

// Muscle group translations
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  back: 'Спина', 
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  legs: 'Ноги',
  glutes: 'Ягодицы',
  abs: 'Пресс',
  cardio: 'Кардио'
};

// Default exercises
export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'push-ups', name: 'Отжимания', muscleGroup: 'chest', isCustom: false },
  { id: 'pull-ups', name: 'Подтягивания', muscleGroup: 'back', isCustom: false },
  { id: 'squats', name: 'Приседания', muscleGroup: 'legs', isCustom: false },
  { id: 'plank', name: 'Планка', muscleGroup: 'abs', isCustom: false },
  { id: 'bench-press', name: 'Жим лёжа', muscleGroup: 'chest', isCustom: false },
  { id: 'deadlift', name: 'Становая тяга', muscleGroup: 'back', isCustom: false },
];