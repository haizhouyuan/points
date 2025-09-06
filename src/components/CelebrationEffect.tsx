import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface CelebrationEffectProps {
  show: boolean;
  type?: 'levelUp' | 'milestone' | 'streak' | 'reward' | 'daily';
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
  duration?: number;
}

export function CelebrationEffect({ 
  show, 
  type = 'milestone', 
  message, 
  subMessage, 
  onComplete,
  duration = 4000 
}: CelebrationEffectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!mounted) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'levelUp':
        return {
          emoji: '🎉',
          bgClass: 'bg-gradient-to-br from-duolingo-blue via-white to-duolingo-purple',
          title: message || '升级了！',
          subtitle: subMessage || '恭喜达到新等级！'
        };
      case 'streak':
        return {
          emoji: '🔥',
          bgClass: 'bg-gradient-to-br from-duolingo-orange via-white to-duolingo-yellow',
          title: message || '连击达成！',
          subtitle: subMessage || '保持这个节奏！'
        };
      case 'reward':
        return {
          emoji: '🎁',
          bgClass: 'bg-gradient-to-br from-duolingo-pink via-white to-duolingo-purple',
          title: message || '奖励获得！',
          subtitle: subMessage || '太棒了！'
        };
      case 'daily':
        return {
          emoji: '🏆',
          bgClass: 'bg-gradient-to-br from-duolingo-green via-white to-duolingo-blue',
          title: message || '每日目标完成！',
          subtitle: subMessage || '今天表现很棒！'
        };
      default:
        return {
          emoji: '✨',
          bgClass: 'bg-gradient-to-br from-duolingo-green via-white to-duolingo-blue',
          title: message || '成就达成！',
          subtitle: subMessage || '继续加油！'
        };
    }
  };

  const config = getTypeConfig();

  // 生成彩带粒子
  const generateConfetti = () => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: ['#58CC02', '#FF9600', '#1CB0F6', '#CE82FF', '#FF9CE5'][Math.floor(Math.random() * 5)]
    }));
  };

  const confetti = generateConfetti();

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          style={{ pointerEvents: 'none' }}
        >
          {/* 彩带效果 */}
          <div className="absolute inset-0 overflow-hidden">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-3 h-8 rounded-sm"
                style={{
                  backgroundColor: particle.color,
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                }}
                initial={{
                  y: -100,
                  rotation: particle.rotation,
                  scale: particle.scale,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotation: particle.rotation + 360,
                  scale: particle.scale,
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 2,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* 主庆祝内容 */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className={`${config.bgClass} p-12 rounded-[3rem] shadow-2xl text-center max-w-md mx-4 relative overflow-hidden`}
          >
            {/* 装饰背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/15 rounded-full translate-y-10 -translate-x-10"></div>

            <div className="relative z-10">
              {/* 主要emoji */}
              <motion.div
                className="text-8xl mb-6"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                {config.emoji}
              </motion.div>

              {/* 标题 */}
              <motion.h1
                className="text-4xl font-black text-white mb-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {config.title}
              </motion.h1>

              {/* 副标题 */}
              <motion.p
                className="text-xl text-white/90 font-semibold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                {config.subtitle}
              </motion.p>

              {/* 闪光效果 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                style={{
                  transform: 'rotate(-45deg)',
                }}
              />
            </div>
          </motion.div>

          {/* 周围的星星效果 */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${20 + (i % 4) * 20}%`,
                  top: `${20 + Math.floor(i / 4) * 20}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              >
                ⭐
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}