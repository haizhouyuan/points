export { AchievementService } from './services/achievement.service';
export { StreakService } from './services/streak.service';
export { LevelService } from './services/level.service';
export { GamificationController } from './controllers/gamification.controller';
export { gamificationRoutes } from './routes/gamification.routes';

// 模型导出
export { Achievement, UserAchievement } from './models/achievement.model';
export { UserStreak } from './models/streak.model';
export { UserLevel } from './models/level.model';

// 类型导出
export type { IAchievement, IUserAchievement } from './models/achievement.model';
export type { IUserStreak } from './models/streak.model';
export type { IUserLevel } from './models/level.model';