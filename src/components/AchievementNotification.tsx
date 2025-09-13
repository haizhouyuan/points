import React, { useState, useEffect } from 'react';
import { DynamicAchievement } from '../services/achievement.service';

interface AchievementNotificationProps {
  achievement: DynamicAchievement;
  isVisible: boolean;
  onClose: () => void;
  onClaim: (achievementId: string) => void;
  autoCloseDelay?: number; // ms
}

// 稀有度配置
const RARITY_CONFIG = {
  common: {
    bgGradient: 'from-green-400 to-green-600',
    particleColor: '#22c55e',
    soundEffect: 'achievement-common',
    animationClass: 'animate-bounce-in'
  },
  rare: {
    bgGradient: 'from-blue-400 to-blue-600',
    particleColor: '#3b82f6',
    soundEffect: 'achievement-rare', 
    animationClass: 'animate-slide-up-glow'
  },
  epic: {
    bgGradient: 'from-purple-400 to-purple-600',
    particleColor: '#8b5cf6',
    soundEffect: 'achievement-epic',
    animationClass: 'animate-scale-glow'
  },
  legendary: {
    bgGradient: 'from-orange-400 via-yellow-500 to-orange-600',
    particleColor: '#f59e0b',
    soundEffect: 'achievement-legendary',
    animationClass: 'animate-epic-entrance'
  },
  mythic: {
    bgGradient: 'from-red-500 via-pink-500 to-purple-600',
    particleColor: '#ef4444',
    soundEffect: 'achievement-mythic',
    animationClass: 'animate-mythic-reveal'
  }
};

// 粒子效果组件
const Particles: React.FC<{ color: string; count: number }> = ({ color, count }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-70 animate-float"
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      ))}
    </div>
  );
};

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose,
  onClaim,
  autoCloseDelay = 5000
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const rarityConfig = RARITY_CONFIG[achievement.rarity];

  // 自动关闭计时器
  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay]);

  // 声音效果（可选）
  useEffect(() => {
    if (isVisible) {
      // 这里可以添加音效播放逻辑
      // playSound(rarityConfig.soundEffect);
    }
  }, [isVisible, rarityConfig.soundEffect]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleClaim = () => {
    onClaim(achievement.id);
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className={`
          fixed inset-0 bg-black bg-opacity-50 z-50 
          transition-opacity duration-300
          ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}
        `}
        onClick={handleClose}
      />
      
      {/* 通知卡片 */}
      <div className={`
        fixed inset-0 flex items-center justify-center z-50 p-4
        ${isAnimatingOut ? 'animate-fade-out' : rarityConfig.animationClass}
      `}>
        <div className={`
          relative max-w-md w-full
          bg-gradient-to-br ${rarityConfig.bgGradient}
          rounded-2xl p-6 text-white
          shadow-2xl transform
          ${achievement.rarity === 'mythic' ? 'animate-pulse' : ''}
        `}>
          
          {/* 粒子效果 */}
          <Particles 
            color={rarityConfig.particleColor} 
            count={achievement.rarity === 'mythic' ? 20 : achievement.rarity === 'legendary' ? 15 : 10} 
          />
          
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center text-white"
          >
            ✕
          </button>

          {/* 成就解锁标题 */}
          <div className="text-center mb-4">
            <div className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">
              🎉 成就解锁
            </div>
            <div className="text-xs opacity-70 uppercase tracking-widest">
              {achievement.rarity}
            </div>
          </div>

          {/* 成就图标 */}
          <div className="flex justify-center mb-4">
            <div className={`
              w-20 h-20 rounded-full bg-white bg-opacity-20
              flex items-center justify-center text-4xl
              ${achievement.rarity === 'mythic' ? 'animate-bounce' : ''}
              ${achievement.rarity === 'legendary' ? 'animate-pulse' : ''}
            `}>
              {achievement.icon}
            </div>
          </div>

          {/* 成就名称 */}
          <h2 className="text-2xl font-bold text-center mb-2 leading-tight">
            {achievement.title}
          </h2>

          {/* 成就描述 */}
          <p className="text-center opacity-90 mb-4 leading-relaxed">
            {achievement.description}
          </p>

          {/* 奖励展示 */}
          <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold mb-2">🏆 获得奖励</div>
              
              {/* 积分奖励 */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">💎</span>
                <span className="text-xl font-bold">+{achievement.rewards.points} 积分</span>
              </div>

              {/* 徽章奖励 */}
              {achievement.rewards.badges && achievement.rewards.badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  {achievement.rewards.badges.map((badge, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium"
                    >
                      🎖️ {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* 称号奖励 */}
              {achievement.rewards.title && (
                <div className="mb-2">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full text-sm font-bold text-yellow-900">
                    👑 {achievement.rewards.title}
                  </span>
                </div>
              )}

              {/* 解锁内容 */}
              {achievement.rewards.unlocks && achievement.rewards.unlocks.length > 0 && (
                <div className="text-sm opacity-90">
                  <div className="mb-1">🔓 解锁内容：</div>
                  <div className="space-y-1">
                    {achievement.rewards.unlocks.map((unlock, index) => (
                      <div key={index} className="text-xs bg-white bg-opacity-10 rounded px-2 py-1">
                        {unlock}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={handleClaim}
              className={`
                flex-1 py-3 rounded-xl font-bold text-lg
                bg-white text-transparent bg-clip-text
                bg-gradient-to-r ${rarityConfig.bgGradient}
                border-2 border-white
                hover:bg-opacity-10 hover:text-white
                transition-all duration-300
                transform hover:scale-105
              `}
            >
              🎁 立即领取
            </button>
            
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-xl font-medium bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
            >
              稍后领取
            </button>
          </div>

          {/* 稀有度特效 */}
          {achievement.rarity === 'mythic' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-conic from-transparent via-white to-transparent opacity-10 animate-spin-slow rounded-2xl"></div>
            </div>
          )}
          
          {achievement.rarity === 'legendary' && (
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl opacity-50 animate-pulse pointer-events-none"></div>
          )}
        </div>
      </div>
    </>
  );
};

export default AchievementNotification;