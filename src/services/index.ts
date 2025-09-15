// Import services
import { apiClient, ApiClient } from './api-client';
import { authService, AuthService } from './auth.service';
import { taskService, TaskService } from './task.service';
import { pointsService, PointsService } from './points.service';
import { gamificationService, GamificationService } from './gamification.service';

// Phase 2 Advanced Services
import { AnalyticsService } from './analytics.service';
import { LearningPathService } from './learning-path.service';
import { AchievementService } from './achievement.service';
import { BehaviorAnalysisService } from './behavior-analysis.service';
import { RecommendationService } from './recommendation.service';

// Export all services
export { apiClient, ApiClient };
export { authService, AuthService };
export { taskService, TaskService };
export { pointsService, PointsService };
export { gamificationService, GamificationService };

// Export Phase 2 services
export { AnalyticsService };
export { LearningPathService };
export { AchievementService };
export { BehaviorAnalysisService };
export { RecommendationService };

// Export types
export * from './types';

// Service initialization helper
export const initializeServices = () => {
  console.log('Services initialized');
  
  // Auto-refresh token on startup if available
  if (authService.isAuthenticated()) {
    authService.getCurrentUser().catch((error) => {
      console.warn('Failed to refresh user data on startup:', error);
      authService.logout();
    });
  }
};

// Global error handler for unhandled service errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled service error:', event.reason);
  
  // Log to analytics service if available
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    // Analytics tracking could go here
  }
});