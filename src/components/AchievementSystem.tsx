import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { Trophy, Star, Crown, Zap, Target, Heart, Flame, Book, Dumbbell, Home, Users, Palette, Medal, Award, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'milestone' | 'streak' | 'social' | 'mastery' | 'special';
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
  icon: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  dateCompleted?: string;
  requirements: string[];
  rewards: {
    points: number;
    xp: number;
    title?: string;
    badge?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

interface AchievementSystemProps {
  achievements: Achievement[];
  userStats: {
    totalTasks: number;
    totalStreaks: number;
    totalPoints: number;
    totalXP: number;
    maxStreak: number;
    familyInteractions: number;
  };
  onClaimReward: (achievementId: string) => void;
}

export function AchievementSystem({ achievements, userStats, onClaimReward }: AchievementSystemProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');

  // 成就分类配置
  const categories = {
    all: { 
      label: '全部成就', 
      icon: Trophy, 
      color: 'duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle'
    },
    milestone: { 
      label: '里程碑', 
      icon: Target, 
      color: 'duolingo-green',
      bgColor: 'bg-duolingo-green-subtle'
    },
    streak: { 
      label: '连击大师', 
      icon: Flame, 
      color: 'duolingo-orange',
      bgColor: 'bg-duolingo-orange-subtle'
    },
    social: { 
      label: '社交达人', 
      icon: Users, 
      color: 'duolingo-pink',
      bgColor: 'bg-duolingo-pink-subtle'
    },
    mastery: { 
      label: '技能精通', 
      icon: Crown, 
      color: 'duolingo-purple',
      bgColor: 'bg-duolingo-purple-subtle'
    },
    special: { 
      label: '特殊成就', 
      icon: Star, 
      color: 'duolingo-yellow',
      bgColor: 'bg-duolingo-yellow-subtle'
    }
  };

  // 成就等级配置
  const achievementTypes = {
    bronze: {
      label: '青铜',
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-200 to-orange-300',
      borderColor: 'border-orange-400',
      shadowColor: 'shadow-orange-400/40',
      emoji: '🥉'
    },
    silver: {
      label: '白银',
      color: 'text-gray-600',
      bgColor: 'bg-gradient-to-br from-gray-200 to-gray-300',
      borderColor: 'border-gray-400',
      shadowColor: 'shadow-gray-400/40',
      emoji: '🥈'
    },
    gold: {
      label: '黄金',
      color: 'text-yellow-600',
      bgColor: 'bg-gradient-to-br from-yellow-200 to-yellow-300',
      borderColor: 'border-yellow-400',
      shadowColor: 'shadow-yellow-400/40',
      emoji: '🥇'
    },
    platinum: {
      label: '铂金',
      color: 'text-cyan-600',
      bgColor: 'bg-gradient-to-br from-cyan-200 to-cyan-300',
      borderColor: 'border-cyan-400',
      shadowColor: 'shadow-cyan-400/40',
      emoji: '🏆'
    },
    diamond: {
      label: '钻石',
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-200 to-blue-300',
      borderColor: 'border-blue-400',
      shadowColor: 'shadow-blue-400/40',
      emoji: '💎'
    },
    legendary: {
      label: '传说',
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-200 to-purple-300',
      borderColor: 'border-purple-400',
      shadowColor: 'shadow-purple-400/40',
      emoji: '👑'
    }
  };

  // 稀有度配置
  const rarityStyles = {
    common: { label: '普通', color: 'text-warm-gray-600', glow: '' },
    rare: { label: '稀有', color: 'text-duolingo-blue', glow: 'shadow-duolingo-blue/30' },
    epic: { label: '史诗', color: 'text-duolingo-purple', glow: 'shadow-duolingo-purple/40' },
    legendary: { label: '传说', color: 'text-duolingo-orange', glow: 'shadow-duolingo-orange/50' },
    mythic: { label: '神话', color: 'text-duolingo-pink', glow: 'shadow-duolingo-pink/60' }
  };

  // 过滤成就
  const filteredAchievements = currentTab === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === currentTab);

  // 获取完成的成就数量
  const completedCount = achievements.filter(a => a.isCompleted).length;
  const totalCount = achievements.length;
  const completionRate = Math.round((completedCount / totalCount) * 100);

  // 处理成就点击
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementDialog(true);
  };

  // 处理奖励领取
  const handleClaimReward = (achievement: Achievement) => {
    onClaimReward(achievement.id);
    setShowAchievementDialog(false);
    
    toast.success(`🎉 恭喜获得成就！`, {
      description: `${achievement.title} - 获得 ${achievement.rewards.points} 积分！`,
      duration: 4000,
    });
  };

  return (
    <div className="space-y-6">
      {/* 🏆 成就系统总览 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-duolingo-yellow-subtle via-white to-duolingo-orange-subtle border-4 border-duolingo-yellow/40 shadow-2xl shadow-duolingo-yellow/30 rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-yellow via-duolingo-orange to-duolingo-yellow"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-duolingo-orange/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-duolingo-yellow/15 rounded-full translate-y-10 -translate-x-10"></div>
          
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="flex items-center gap-4 text-3xl font-black">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                className="text-4xl"
              >
                🏆
              </motion.div>
              <div>
                <span className="bg-gradient-to-r from-duolingo-yellow to-duolingo-orange bg-clip-text text-transparent">
                  成就收集馆
                </span>
                <div className="text-sm font-medium text-warm-gray-600 mt-1">
                  解锁成就，收集徽章，展示你的成长历程！
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-4">
            {/* 完成度统计 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border-2 border-duolingo-green/20 text-center">
                <div className="text-2xl font-black text-duolingo-green">{completedCount}</div>
                <div className="text-sm text-warm-gray-600">已完成</div>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-duolingo-blue/20 text-center">
                <div className="text-2xl font-black text-duolingo-blue">{totalCount}</div>
                <div className="text-sm text-warm-gray-600">总成就</div>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-duolingo-orange/20 text-center">
                <div className="text-2xl font-black text-duolingo-orange">{completionRate}%</div>
                <div className="text-sm text-warm-gray-600">完成度</div>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-duolingo-purple/20 text-center">
                <div className="text-2xl font-black text-duolingo-purple">
                  {achievements.filter(a => a.rarity === 'legendary' || a.rarity === 'mythic').filter(a => a.isCompleted).length}
                </div>
                <div className="text-sm text-warm-gray-600">稀有成就</div>
              </div>
            </div>

            {/* 完成度进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-warm-gray-600">
                <span>总体进度</span>
                <span>{completedCount} / {totalCount}</span>
              </div>
              <div className="relative">
                <Progress value={completionRate} className="h-3" />
                <motion.div
                  className="absolute inset-0 h-3 bg-gradient-to-r from-duolingo-green to-duolingo-blue rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🎯 成就分类标签 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-2xl rounded-[2rem] p-3 border-4 border-duolingo-blue-subtle backdrop-blur-sm relative overflow-hidden min-h-16">
            {Object.entries(categories).map(([key, category]) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger 
                  key={key}
                  value={key}
                  className="relative z-10 rounded-[1rem] font-bold py-3 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:shadow-xl data-[state=active]:scale-105"
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-1 text-center"
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs font-bold">{category.label}</span>
                  </motion.span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* 🏅 成就网格展示 */}
          <TabsContent value={currentTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredAchievements.map((achievement, index) => {
                  const typeConfig = achievementTypes[achievement.type];
                  const rarityStyle = rarityStyles[achievement.rarity];
                  const progress = Math.min((achievement.progress / achievement.maxProgress) * 100, 100);
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <Card 
                        className={`relative overflow-hidden cursor-pointer transition-all duration-300 rounded-[1.5rem] border-4 ${
                          achievement.isCompleted 
                            ? `${typeConfig.borderColor} ${typeConfig.shadowColor} shadow-xl` 
                            : achievement.isUnlocked
                            ? 'border-warm-gray-300 shadow-lg hover:shadow-xl'
                            : 'border-warm-gray-200 shadow-md opacity-60'
                        } ${rarityStyle.glow}`}
                        onClick={() => handleAchievementClick(achievement)}
                      >
                        {/* 稀有度光环 */}
                        {achievement.rarity !== 'common' && achievement.isCompleted && (
                          <div className={`absolute inset-0 ${typeConfig.bgColor} opacity-20 rounded-[1.5rem]`}></div>
                        )}

                        {/* 成就类型角标 */}
                        <div className="absolute top-3 right-3">
                          <Badge className={`${typeConfig.bgColor} ${typeConfig.color} border-0 px-2 py-1 rounded-full text-xs font-bold`}>
                            {typeConfig.emoji} {typeConfig.label}
                          </Badge>
                        </div>

                        {/* 未解锁遮罩 */}
                        {!achievement.isUnlocked && (
                          <div className="absolute inset-0 bg-warm-gray-100/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-[1.5rem]">
                            <div className="text-center">
                              <div className="text-4xl mb-2">🔒</div>
                              <p className="text-sm font-semibold text-warm-gray-600">未解锁</p>
                            </div>
                          </div>
                        )}

                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <CardTitle className="text-lg font-bold text-warm-gray-800 mb-1">
                                {achievement.title}
                              </CardTitle>
                              
                              {/* 稀有度标签 */}
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={`${rarityStyle.color} border-current text-xs px-2 py-1`}>
                                  {rarityStyle.label}
                                </Badge>
                                {achievement.isCompleted && (
                                  <Badge className="bg-duolingo-green text-white px-2 py-1 rounded-full text-xs">
                                    ✅ 已完成
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-warm-gray-600">{achievement.description}</p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* 进度条 */}
                          {!achievement.isCompleted && achievement.isUnlocked && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-warm-gray-500">
                                <span>进度</span>
                                <span>{achievement.progress} / {achievement.maxProgress}</span>
                              </div>
                              <div className="relative">
                                <Progress value={progress} className="h-2" />
                                <motion.div
                                  className={`absolute inset-0 h-2 ${typeConfig.bgColor} rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                />
                              </div>
                            </div>
                          )}

                          {/* 奖励信息 */}
                          <div className="flex justify-between items-center text-xs text-warm-gray-500 pt-2 border-t border-warm-gray-200">
                            <span>奖励:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-duolingo-green">
                                +{achievement.rewards.points}积分
                              </span>
                              <span className="font-semibold text-duolingo-blue">
                                +{achievement.rewards.xp}XP
                              </span>
                            </div>
                          </div>

                          {/* 完成时间 */}
                          {achievement.isCompleted && achievement.dateCompleted && (
                            <div className="text-xs text-warm-gray-500 text-center pt-2">
                              完成于 {new Date(achievement.dateCompleted).toLocaleDateString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* 成就详情对话框 */}
      <Dialog open={showAchievementDialog} onOpenChange={setShowAchievementDialog}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-4 border-duolingo-blue/30 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Trophy className="w-6 h-6 text-duolingo-blue" />
              {selectedAchievement?.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedAchievement?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAchievement && (
            <div className="space-y-4">
              {/* 成就展示卡片 */}
              <div className={`p-6 rounded-xl ${achievementTypes[selectedAchievement.type].bgColor} border-2 ${achievementTypes[selectedAchievement.type].borderColor}`}>
                <div className="text-center">
                  <div className="text-6xl mb-3">{selectedAchievement.icon}</div>
                  <div className="text-2xl font-black text-warm-gray-800 mb-2">
                    {selectedAchievement.title}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Badge className={`${achievementTypes[selectedAchievement.type].bgColor} ${achievementTypes[selectedAchievement.type].color} border-0 px-3 py-1`}>
                      {achievementTypes[selectedAchievement.type].emoji} {achievementTypes[selectedAchievement.type].label}
                    </Badge>
                    <Badge variant="outline" className={`${rarityStyles[selectedAchievement.rarity].color} border-current`}>
                      {rarityStyles[selectedAchievement.rarity].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 要求列表 */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-warm-gray-800">完成要求</h3>
                <div className="space-y-2">
                  {selectedAchievement.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-warm-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-duolingo-blue rounded-full"></div>
                      <span className="text-sm text-warm-gray-700">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 奖励详情 */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-warm-gray-800">奖励详情</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-duolingo-green-subtle rounded-lg p-3 text-center">
                    <div className="text-xl font-black text-duolingo-green">
                      +{selectedAchievement.rewards.points}
                    </div>
                    <div className="text-sm text-warm-gray-600">积分</div>
                  </div>
                  <div className="bg-duolingo-blue-subtle rounded-lg p-3 text-center">
                    <div className="text-xl font-black text-duolingo-blue">
                      +{selectedAchievement.rewards.xp}
                    </div>
                    <div className="text-sm text-warm-gray-600">经验值</div>
                  </div>
                </div>
                
                {selectedAchievement.rewards.title && (
                  <div className="bg-duolingo-yellow-subtle rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-duolingo-yellow">
                      👑 {selectedAchievement.rewards.title}
                    </div>
                    <div className="text-sm text-warm-gray-600">专属称号</div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAchievementDialog(false)}
                  className="rounded-xl"
                >
                  关闭
                </Button>
                {selectedAchievement.isCompleted && !selectedAchievement.rewards.title && (
                  <Button
                    onClick={() => handleClaimReward(selectedAchievement)}
                    className="bg-gradient-to-r from-duolingo-green to-duolingo-blue text-white font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    领取奖励
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}