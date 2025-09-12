import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Star, Target, Zap, Trophy, Settings, Sparkles, Crown } from 'lucide-react';

interface ExperienceSystemProps {
  currentXP: number;
  level: number;
  dailyGoal: number;
  dailyProgress: number;
  weeklyXP: number;
  onSetDailyGoal: (goal: number) => void;
  onClaimDailyReward: () => void;
  canClaimDaily: boolean;
}

export function ExperienceSystem({ 
  currentXP, 
  level, 
  dailyGoal, 
  dailyProgress, 
  weeklyXP,
  onSetDailyGoal,
  onClaimDailyReward,
  canClaimDaily
}: ExperienceSystemProps) {
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(dailyGoal);
  const [showCelebration, setShowCelebration] = useState(false);

  // 等级经验值计算
  const getXPForLevel = (lvl: number) => lvl * lvl * 100;
  const getCurrentLevelXP = () => getXPForLevel(level);
  const getNextLevelXP = () => getXPForLevel(level + 1);
  const getLevelProgress = () => {
    const currentLevelXP = getCurrentLevelXP();
    const nextLevelXP = getNextLevelXP();
    const progressInLevel = currentXP - currentLevelXP;
    const totalLevelXP = nextLevelXP - currentLevelXP;
    return Math.min((progressInLevel / totalLevelXP) * 100, 100);
  };

  // 每日目标选项
  const goalOptions = [
    { 
      value: 100, 
      label: '轻松', 
      description: '适合新手', 
      borderColor: 'border-duolingo-green',
      bgColor: 'bg-duolingo-green-subtle',
      textColor: 'text-duolingo-green',
      icon: '🌱' 
    },
    { 
      value: 200, 
      label: '正常', 
      description: '日常挑战', 
      borderColor: 'border-duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle',
      textColor: 'text-duolingo-blue',
      icon: '🎯' 
    },
    { 
      value: 300, 
      label: '挑战', 
      description: '高强度学习', 
      borderColor: 'border-duolingo-orange',
      bgColor: 'bg-duolingo-orange-subtle',
      textColor: 'text-duolingo-orange',
      icon: '🔥' 
    },
    { 
      value: 500, 
      label: '疯狂', 
      description: '极限模式', 
      borderColor: 'border-duolingo-purple',
      bgColor: 'bg-duolingo-purple-subtle',
      textColor: 'text-duolingo-purple',
      icon: '⚡' 
    }
  ];

  // 获得等级徽章样式
  const getLevelBadgeStyle = (lvl: number) => {
    if (lvl >= 50) return {
      bgClass: 'bg-gradient-to-r from-duolingo-purple to-duolingo-pink',
      icon: '👑'
    };
    if (lvl >= 25) return {
      bgClass: 'bg-gradient-to-r from-duolingo-orange to-duolingo-yellow',
      icon: '💎'
    };
    if (lvl >= 10) return {
      bgClass: 'bg-gradient-to-r from-duolingo-blue to-duolingo-blue-light',
      icon: '🏆'
    };
    return {
      bgClass: 'bg-gradient-to-r from-duolingo-green to-duolingo-green-light',
      icon: '⭐'
    };
  };

  // 获得等级称号
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 50) return '传说大师';
    if (lvl >= 25) return '钻石学者';
    if (lvl >= 10) return '黄金专家';
    if (lvl >= 5) return '白银新星';
    return '青铜萌新';
  };

  // 处理每日目标设置
  const handleSetGoal = () => {
    onSetDailyGoal(selectedGoal);
    setShowGoalDialog(false);
    
    const selectedOption = goalOptions.find(opt => opt.value === selectedGoal);
    toast.success(
      `🎯 每日目标已设置！`,
      {
        description: `${selectedOption?.icon} ${selectedOption?.label}模式 - ${selectedGoal}XP/天`,
        duration: 4000,
      }
    );
  };

  // 处理每日奖励
  const handleClaimDaily = () => {
    onClaimDailyReward();
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // 监听等级提升
  useEffect(() => {
    const shouldShowLevelUp = currentXP >= getNextLevelXP();
    if (shouldShowLevelUp) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [currentXP, level]);

  return (
    <div className="space-y-6">
      {/* 🏆 经验系统主卡片 */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        <Card className="bg-gradient-to-br from-duolingo-blue-subtle via-white to-duolingo-purple-subtle border-4 border-duolingo-blue/40 shadow-2xl shadow-duolingo-blue/30 rounded-[2rem] overflow-hidden relative">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-duolingo-yellow/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-duolingo-purple/15 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="absolute top-1/3 left-1/4 w-20 h-20 bg-duolingo-green/10 rounded-full"></div>
          
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-4 text-2xl font-black">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="text-4xl"
                >
                  ⭐
                </motion.div>
                <div>
                  <span className="bg-gradient-to-r from-duolingo-blue to-duolingo-purple bg-clip-text text-transparent">
                    经验系统
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className={`${getLevelBadgeStyle(level).bgClass} text-white font-bold px-3 py-1 rounded-full flex items-center gap-1`}
                    >
                      <span className="text-sm">{getLevelBadgeStyle(level).icon}</span>
                      Lv.{level}
                    </Badge>
                    <span className="text-sm text-warm-gray-500">{getLevelTitle(level)}</span>
                  </div>
                </div>
              </CardTitle>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalDialog(true)}
                className="bg-white/80 border-duolingo-blue hover:bg-duolingo-blue-subtle rounded-xl"
              >
                <Settings className="w-4 h-4 mr-2" />
                设置目标
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-6">
            {/* 等级进度 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-warm-gray-700">等级进度</span>
                <span className="text-sm font-medium text-warm-gray-500">
                  {currentXP.toLocaleString()} / {getNextLevelXP().toLocaleString()} XP
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={getLevelProgress()} 
                  className="h-4 bg-warm-gray-200 rounded-full overflow-hidden"
                />
                <motion.div
                  className="absolute inset-0 h-4 bg-gradient-to-r from-duolingo-blue via-duolingo-purple to-duolingo-pink rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getLevelProgress()}%` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
                <div className="absolute inset-0 h-4 bg-white/20 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* 每日目标进度 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-duolingo-orange" />
                  <span className="font-semibold text-warm-gray-700">今日目标</span>
                </div>
                <span className="text-sm font-medium text-warm-gray-500">
                  {dailyProgress} / {dailyGoal} XP
                </span>
              </div>
              
              <div className="relative">
                <Progress 
                  value={(dailyProgress / dailyGoal) * 100} 
                  className="h-3 bg-warm-gray-200 rounded-full"
                />
                <motion.div
                  className="absolute inset-0 h-3 bg-gradient-to-r from-duolingo-orange to-duolingo-yellow rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((dailyProgress / dailyGoal) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                
                {/* 每日目标完成特效 */}
                {dailyProgress >= dailyGoal && (
                  <motion.div
                    className="absolute inset-0 h-3 bg-gradient-to-r from-duolingo-yellow to-duolingo-orange rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>

              {/* 每日奖励领取按钮 */}
              {canClaimDaily && dailyProgress >= dailyGoal && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Button
                    onClick={handleClaimDaily}
                    className="w-full bg-gradient-to-r from-duolingo-yellow to-duolingo-orange text-white font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-duolingo-orange/40"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    领取每日奖励 (+{Math.floor(dailyGoal * 0.3)} 积分)
                  </Button>
                </motion.div>
              )}
            </div>

            {/* 本周统计 */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-green/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl font-black text-duolingo-green">
                  {weeklyXP.toLocaleString()}
                </div>
                <div className="text-sm text-warm-gray-600 font-semibold">本周XP</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-blue/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl font-black text-duolingo-blue">
                  {Math.floor(weeklyXP / 7)}
                </div>
                <div className="text-sm text-warm-gray-600 font-semibold">日均XP</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-purple/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl font-black text-duolingo-purple">
                  {getNextLevelXP() - currentXP}
                </div>
                <div className="text-sm text-warm-gray-600 font-semibold">升级还需</div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 目标设定对话框 */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-4 border-duolingo-blue/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Target className="w-6 h-6 text-duolingo-blue" />
              设置每日目标
            </DialogTitle>
            <DialogDescription className="text-base">
              选择适合你的每日经验值目标，坚持完成可获得额外奖励！
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {goalOptions.map((option) => (
              <motion.div
                key={option.value}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedGoal === option.value
                    ? `${option.borderColor} ${option.bgColor} shadow-lg`
                    : 'border-warm-gray-200 hover:border-warm-gray-300'
                }`}
                onClick={() => setSelectedGoal(option.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-bold text-lg">{option.label}</div>
                      <div className="text-sm text-warm-gray-500">{option.description}</div>
                    </div>
                  </div>
                  <div className={`font-black text-xl ${option.textColor}`}>
                    {option.value} XP
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowGoalDialog(false)}
                className="rounded-xl"
              >
                取消
              </Button>
              <Button 
                onClick={handleSetGoal}
                className="bg-gradient-to-r from-duolingo-blue to-duolingo-purple text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Zap className="w-4 h-4 mr-2" />
                设置目标
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 庆祝动画 */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              className="bg-gradient-to-br from-duolingo-yellow via-duolingo-orange to-duolingo-pink p-8 rounded-[3rem] shadow-2xl text-center max-w-md mx-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: 2 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">恭喜！</h2>
              <p className="text-xl text-white/90">
                {canClaimDaily ? '完成每日目标！' : `升级到 Lv.${level + 1}！`}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
