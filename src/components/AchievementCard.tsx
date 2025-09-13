import React from 'react';
import { DynamicAchievement } from '../services/achievement.service';
import '../styles/achievements.css';

interface AchievementCardProps {
  achievement: DynamicAchievement;
  onClaim?: (achievementId: string) => void;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// 稀有度主题配置
const RARITY_THEMES = {
  common: {
    bgGradient: 'from-green-100 to-green-200',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    iconBg: 'bg-green-500',
    glowClass: 'shadow-sm',
    accentColor: '#22c55e'
  },
  rare: {
    bgGradient: 'from-blue-100 to-blue-200', 
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    iconBg: 'bg-blue-500',
    glowClass: 'shadow-md shadow-blue-200',
    accentColor: '#3b82f6'
  },
  epic: {
    bgGradient: 'from-purple-100 to-purple-200',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800', 
    iconBg: 'bg-purple-500',
    glowClass: 'shadow-lg shadow-purple-300',
    accentColor: '#8b5cf6'
  },
  legendary: {
    bgGradient: 'from-orange-100 to-yellow-200',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-800',
    iconBg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    glowClass: 'shadow-xl shadow-orange-300',
    accentColor: '#f59e0b'
  },
  mythic: {
    bgGradient: 'from-red-100 via-pink-100 to-purple-200',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    iconBg: 'bg-gradient-to-r from-red-500 via-pink-500 to-purple-500',
    glowClass: 'shadow-2xl shadow-red-400 animate-pulse',
    accentColor: '#ef4444'
  }
};

// 尺寸配置
const SIZE_CONFIGS = {
  small: {
    cardWidth: 'w-48',
    iconSize: 'w-8 h-8 text-lg',
    titleSize: 'text-sm',
    descSize: 'text-xs',
    padding: 'p-3'
  },
  medium: {
    cardWidth: 'w-64', 
    iconSize: 'w-12 h-12 text-xl',
    titleSize: 'text-base',
    descSize: 'text-sm',
    padding: 'p-4'
  },
  large: {
    cardWidth: 'w-80',
    iconSize: 'w-16 h-16 text-2xl', 
    titleSize: 'text-lg',
    descSize: 'text-base',
    padding: 'p-6'
  }
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onClaim,
  showProgress = true,
  size = 'medium'
}) => {
  const theme = RARITY_THEMES[achievement.rarity];
  const sizeConfig = SIZE_CONFIGS[size];
  
  const handleClaim = () => {
    if (achievement.isCompleted && onClaim) {
      onClaim(achievement.id);
    }
  };

  const formatTimeRemaining = (validUntil?: string): string => {
    if (!validUntil) return '';
    
    const now = new Date();
    const deadline = new Date(validUntil);
    const diffHours = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours <= 0) return '已过期';
    if (diffHours < 24) return `${diffHours}小时后过期`;
    
    const days = Math.ceil(diffHours / 24);
    return `${days}天后过期`;
  };

  return (
    <div className={`
      achievement-card rarity-${achievement.rarity}
      ${sizeConfig.cardWidth} 
      bg-gradient-to-br ${theme.bgGradient}
      border-2 ${theme.borderColor}
      rounded-xl ${sizeConfig.padding}
      ${theme.glowClass}
      ${achievement.isCompleted ? 'cursor-pointer hover:shadow-2xl' : ''}
      ${achievement.isHidden && !achievement.isCompleted ? 'opacity-50' : ''}
      relative overflow-hidden
    `}
    onClick={handleClaim}
    >
      {/* 稀有度标识 */}
      <div className="absolute top-2 right-2">
        <div className={`
          px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${theme.textColor} ${theme.borderColor} border
        `}>
          {achievement.rarity}
        </div>
      </div>

      {/* 限时标识 */}
      {achievement.validUntil && (
        <div className="absolute top-2 left-2">
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
            ⏰ {formatTimeRemaining(achievement.validUntil)}
          </div>
        </div>
      )}

      {/* 成就完成标识 */}
      {achievement.isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-yellow-200 opacity-30 pointer-events-none"></div>
      )}

      {/* 图标区域 */}
      <div className="flex justify-center mb-3">
        <div className={`
          ${sizeConfig.iconSize} 
          ${theme.iconBg}
          rounded-full flex items-center justify-center
          text-white font-bold
          ${achievement.rarity === 'mythic' ? 'animate-bounce' : ''}
        `}>
          {achievement.icon}
        </div>
      </div>

      {/* 标题 */}
      <h3 className={`
        ${sizeConfig.titleSize} font-bold ${theme.textColor}
        text-center mb-2 leading-tight
      `}>
        {achievement.title}
      </h3>

      {/* 描述 */}
      <p className={`
        ${sizeConfig.descSize} ${theme.textColor} opacity-80
        text-center mb-3 leading-relaxed
      `}>
        {achievement.description}
      </p>

      {/* 进度条 */}
      {showProgress && !achievement.isCompleted && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className={theme.textColor}>进度</span>
            <span className={theme.textColor}>{Math.round(achievement.progress)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-50 rounded-full h-2 progress-bar">
            <div 
              className="h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${achievement.progress}%`,
                backgroundColor: theme.accentColor,
                boxShadow: `0 0 8px ${theme.accentColor}50`
              }}
            ></div>
          </div>
        </div>
      )}

      {/* 奖励信息 */}
      <div className="space-y-2">
        {/* 积分奖励 */}
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">🏆</span>
          <span className={`${theme.textColor} font-semibold`}>
            +{achievement.rewards.points} 积分
          </span>
        </div>

        {/* 徽章奖励 */}
        {achievement.rewards.badges && achievement.rewards.badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {achievement.rewards.badges.map((badge, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-white bg-opacity-50 rounded-full text-xs font-medium"
              >
                🎖️ {badge}
              </span>
            ))}
          </div>
        )}

        {/* 称号奖励 */}
        {achievement.rewards.title && (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-full text-sm font-bold text-yellow-800">
              👑 {achievement.rewards.title}
            </span>
          </div>
        )}
      </div>

      {/* 完成状态 */}
      {achievement.isCompleted && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <span>✅</span>
            <span>点击领取奖励</span>
          </div>
        </div>
      )}

      {/* 神话级成就特效 */}
      {achievement.rarity === 'mythic' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 -skew-x-12 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default AchievementCard;