import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import {
  WorkoutSchema,
  WeekPlanSchema,
  ExerciseSchema,
  UserStatsSchema,
  ApiResponse,
  DEFAULT_EXERCISES,
  MUSCLE_GROUP_LABELS
} from '@maratik/shared';

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production'
});

// CORS setup
fastify.register(cors, {
  origin: true,
  credentials: true
});

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Get or create user
fastify.post<{
  Body: { telegramId: string; username?: string; firstName?: string; lastName?: string }
}>('/api/users', async (request) => {
  const { telegramId, username, firstName, lastName } = request.body;
  
  let user = await prisma.user.findUnique({
    where: { telegramId },
    include: { stats: true }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        username,
        firstName,
        lastName,
        stats: {
          create: {}
        }
      },
      include: { stats: true }
    });

    // Create default exercises for user
    await prisma.exercise.createMany({
      data: DEFAULT_EXERCISES.map(ex => ({
        ...ex,
        userId: user!.id
      }))
    });
  }

  return { success: true, data: user } as ApiResponse;
});

// Get exercises
fastify.get<{
  Querystring: { userId: string }
}>('/api/exercises', async (request) => {
  const { userId } = request.query;
  
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [
        { userId },
        { isCustom: false, userId: null }
      ]
    }
  });

  return { success: true, data: exercises } as ApiResponse;
});

// Create exercise
fastify.post<{
  Body: { name: string; muscleGroup: string; userId: string }
}>('/api/exercises', async (request) => {
  const { name, muscleGroup, userId } = request.body;
  
  const exercise = await prisma.exercise.create({
    data: {
      id: nanoid(),
      name,
      muscleGroup,
      isCustom: true,
      userId
    }
  });

  return { success: true, data: exercise } as ApiResponse;
});

// Get week plan
fastify.get<{
  Querystring: { userId: string; week: string }
}>('/api/week-plan', async (request) => {
  const { userId, week } = request.query;
  
  let weekPlan = await prisma.weekPlan.findUnique({
    where: {
      userId_week: { userId, week }
    }
  });

  if (!weekPlan) {
    weekPlan = await prisma.weekPlan.create({
      data: {
        id: nanoid(),
        userId,
        week
      }
    });
  }

  return { success: true, data: weekPlan } as ApiResponse;
});

// Update week plan
fastify.put<{
  Body: { userId: string; week: string; [key: string]: any }
}>('/api/week-plan', async (request) => {
  const { userId, week, ...days } = request.body;
  
  const weekPlan = await prisma.weekPlan.upsert({
    where: {
      userId_week: { userId, week }
    },
    update: days,
    create: {
      id: nanoid(),
      userId,
      week,
      ...days
    }
  });

  return { success: true, data: weekPlan } as ApiResponse;
});

// Get workouts
fastify.get<{
  Querystring: { userId: string; date?: string; exerciseId?: string }
}>('/api/workouts', async (request) => {
  const { userId, date, exerciseId } = request.query;
  
  const where: any = { userId };
  if (date) where.date = date;
  
  const workouts = await prisma.workout.findMany({
    where,
    include: {
      sets: {
        include: { exercise: true },
        ...(exerciseId && { where: { exerciseId } })
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { success: true, data: workouts } as ApiResponse;
});

// Create workout
fastify.post<{
  Body: { userId: string; date: string; muscleGroup: string }
}>('/api/workouts', async (request) => {
  const { userId, date, muscleGroup } = request.body;
  
  const workout = await prisma.workout.create({
    data: {
      id: nanoid(),
      userId,
      date,
      muscleGroup
    }
  });

  return { success: true, data: workout } as ApiResponse;
});

// Complete workout
fastify.put<{
  Params: { id: string }
  Body: { duration?: number }
}>('/api/workouts/:id/complete', async (request) => {
  const { id } = request.params;
  const { duration } = request.body;
  
  const workout = await prisma.workout.update({
    where: { id },
    data: { completed: true, duration },
    include: { user: { include: { stats: true } } }
  });

  // Update user stats
  if (workout.user.stats) {
    const stats = await prisma.userStats.update({
      where: { userId: workout.userId },
      data: {
        totalWorkouts: { increment: 1 },
        currentStreak: { increment: 1 },
        bestStreak: Math.max(workout.user.stats.bestStreak, workout.user.stats.currentStreak + 1)
      }
    });

    return { success: true, data: { workout, stats } } as ApiResponse;
  }

  return { success: true, data: workout } as ApiResponse;
});

// Add workout set
fastify.post<{
  Body: { workoutId: string; exerciseId: string; weight?: number; reps: number; restTime?: number }
}>('/api/workout-sets', async (request) => {
  const { workoutId, exerciseId, weight, reps, restTime } = request.body;
  
  const set = await prisma.workoutSet.create({
    data: {
      id: nanoid(),
      workoutId,
      exerciseId,
      weight,
      reps,
      restTime
    },
    include: { exercise: true }
  });

  return { success: true, data: set } as ApiResponse;
});

// Get user stats
fastify.get<{
  Querystring: { userId: string }
}>('/api/stats', async (request) => {
  const { userId } = request.query;
  
  const stats = await prisma.userStats.findUnique({
    where: { userId }
  });

  return { success: true, data: stats } as ApiResponse;
});

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await fastify.ready();
  fastify.server.emit('request', req, res);
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    try {
      await fastify.listen({ port: 3001, host: '0.0.0.0' });
      console.log('API server running on http://localhost:3001');
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  start();
}