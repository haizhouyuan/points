import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Star, Lock, Crown, Zap, Trophy, BookOpen, Dumbbell, Home, Users, Palette } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  level: number;
  maxLevel: number;
  xp: number;
  maxXP: number;
  isUnlocked: boolean;
  prerequisites: string[];
  rewards: {
    points: number;
    xp: number;
    badge?: string;
  };
  tasks: {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    xp: number;
    points: number;
    completed: boolean;
  }[];
}

interface SkillTreeProps {
  skills: Skill[];
  onStartTask: (skillId: string, taskId: string) => void;
  onUnlockSkill: (skillId: string, cost: number) => void;
  userPoints: number;
}

export function SkillTree({ skills, onStartTask, onUnlockSkill, userPoints }: SkillTreeProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showSkillDialog, setShowSkillDialog] = useState(false);

  // 技能分类配置
  const categories = {
    '学习': { 
      icon: BookOpen, 
      color: 'duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle',
      borderColor: 'border-duolingo-blue'
    },
    '运动': { 
      icon: Dumbbell, 
      color: 'duolingo-green',
      bgColor: 'bg-duolingo-green-subtle',
      borderColor: 'border-duolingo-green'
    },
    '家务': { 
      icon: Home, 
      color: 'duolingo-orange',
      bgColor: 'bg-duolingo-orange-subtle',
      borderColor: 'border-duolingo-orange'
    },
    '社交': { 
      icon: Users, 
      color: 'duolingo-purple',
      bgColor: 'bg-duolingo-purple-subtle',
      borderColor: 'border-duolingo-purple'
    },
    '创意': { 
      icon: Palette, 
      color: 'duolingo-pink',
      bgColor: 'bg-duolingo-pink-subtle',
      borderColor: 'border-duolingo-pink'
    }
  };

  // 获取难度配置
  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { 
          label: '简单', 
          color: 'text-duolingo-green', 
          bgColor: 'bg-duolingo-green-subtle',
          emoji: '🌱' 
        };
      case 'medium':
        return { 
          label: '普通', 
          color: 'text-duolingo-orange', 
          bgColor: 'bg-duolingo-orange-subtle',
          emoji: '🔥' 
        };
      case 'hard':
        return { 
          label: '困难', 
          color: 'text-duolingo-purple', 
          bgColor: 'bg-duolingo-purple-subtle',
          emoji: '⚡' 
        };
      default:
        return { 
          label: '普通', 
          color: 'text-duolingo-blue', 
          bgColor: 'bg-duolingo-blue-subtle',
          emoji: '🎯' 
        };
    }
  };

  // 获取技能等级颜色
  const getSkillLevelStyle = (level: number, maxLevel: number) => {
    const progress = level / maxLevel;
    if (progress >= 1) return {
      bgClass: 'bg-gradient-to-br from-duolingo-yellow to-duolingo-orange',
      textColor: 'text-white',
      borderColor: 'border-duolingo-yellow',
      glow: 'shadow-duolingo-yellow/50'
    };
    if (progress >= 0.8) return {
      bgClass: 'bg-gradient-to-br from-duolingo-purple to-duolingo-pink',
      textColor: 'text-white',
      borderColor: 'border-duolingo-purple',
      glow: 'shadow-duolingo-purple/40'
    };
    if (progress >= 0.6) return {
      bgClass: 'bg-gradient-to-br from-duolingo-blue to-duolingo-blue-light',
      textColor: 'text-white',
      borderColor: 'border-duolingo-blue',
      glow: 'shadow-duolingo-blue/40'
    };
    if (progress >= 0.4) return {
      bgClass: 'bg-gradient-to-br from-duolingo-orange to-duolingo-orange-light',
      textColor: 'text-white',
      borderColor: 'border-duolingo-orange',
      glow: 'shadow-duolingo-orange/40'
    };
    return {
      bgClass: 'bg-gradient-to-br from-duolingo-green to-duolingo-green-light',
      textColor: 'text-white',
      borderColor: 'border-duolingo-green',
      glow: 'shadow-duolingo-green/40'
    };
  };

  // 处理技能点击
  const handleSkillClick = (skill: Skill) => {
    if (!skill.isUnlocked) {
      // 显示解锁提示
      const unlockCost = skill.level * 100;
      if (userPoints >= unlockCost) {
        onUnlockSkill(skill.id, unlockCost);
        toast.success(`🎉 解锁新技能：${skill.name}！`, {
          description: `花费 ${unlockCost} 积分解锁成功！`,
          duration: 4000,
        });
      } else {
        toast.error(`积分不足！需要 ${unlockCost} 积分解锁此技能`, {
          description: '继续完成任务获得更多积分吧！',
          duration: 4000,
        });
      }
      return;
    }

    setSelectedSkill(skill);
    setShowSkillDialog(true);
  };

  // 按分类分组技能
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-8">
      {/* 🌟 技能树标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Card className="bg-gradient-to-br from-duolingo-blue-subtle via-white to-duolingo-purple-subtle border-4 border-duolingo-blue/40 shadow-2xl shadow-duolingo-blue/30 rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-green via-duolingo-orange via-duolingo-blue to-duolingo-purple"></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-center gap-4 text-3xl font-black">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="text-4xl"
              >
                🌟
              </motion.div>
              <span className="bg-gradient-to-r from-duolingo-blue to-duolingo-purple bg-clip-text text-transparent">
                技能树系统
              </span>
            </CardTitle>
            <p className="text-warm-gray-600 text-lg">解锁技能、完成任务、收获成长！</p>
          </CardHeader>
        </Card>
      </motion.div>

      {/* 🎯 技能分类展示 */}
      <div className="space-y-8">
        {Object.entries(skillsByCategory).map(([category, categorySkills], categoryIndex) => {
          const categoryConfig = categories[category as keyof typeof categories];
          const IconComponent = categoryConfig?.icon || Star;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              {/* 分类标题 */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${categoryConfig?.bgColor} ${categoryConfig?.borderColor} border-2`}>
                  <IconComponent className={`w-6 h-6 text-${categoryConfig?.color}`} />
                </div>
                <h2 className="text-2xl font-black text-warm-gray-800">{category}技能</h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-warm-gray-200 to-transparent rounded-full"></div>
              </div>

              {/* 技能卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorySkills.map((skill, skillIndex) => {
                  const levelStyle = getSkillLevelStyle(skill.level, skill.maxLevel);
                  const completedTasks = skill.tasks.filter(task => task.completed).length;
                  const totalTasks = skill.tasks.length;
                  const progressPercent = (skill.xp / skill.maxXP) * 100;

                  return (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (categoryIndex * 0.1) + (skillIndex * 0.05) }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card 
                        className={`relative overflow-hidden cursor-pointer transition-all duration-300 rounded-[1.5rem] border-4 ${
                          skill.isUnlocked 
                            ? `${levelStyle.borderColor} shadow-xl ${levelStyle.glow}` 
                            : 'border-warm-gray-300 shadow-lg opacity-75'
                        }`}
                        onClick={() => handleSkillClick(skill)}
                      >
                        {/* 未解锁遮罩 */}
                        {!skill.isUnlocked && (
                          <div className="absolute inset-0 bg-warm-gray-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="text-center">
                              <Lock className="w-8 h-8 text-warm-gray-400 mx-auto mb-2" />
                              <p className="text-sm font-semibold text-warm-gray-600">
                                需要 {skill.level * 100} 积分解锁
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 装饰背景 */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-white/15 to-transparent rounded-full translate-y-8 -translate-x-8"></div>

                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-warm-gray-800">
                              {skill.name}
                            </CardTitle>
                            
                            {/* 技能等级徽章 */}
                            <Badge className={`${levelStyle.bgClass} ${levelStyle.textColor} font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
                              {skill.level === skill.maxLevel ? (
                                <Crown className="w-3 h-3" />
                              ) : (
                                <Star className="w-3 h-3" />
                              )}
                              Lv.{skill.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-warm-gray-600">{skill.description}</p>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* 经验值进度 */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-warm-gray-500">
                              <span>经验值</span>
                              <span>{skill.xp} / {skill.maxXP} XP</span>
                            </div>
                            <div className="relative">
                              <Progress value={progressPercent} className="h-2" />
                              <motion.div
                                className={`absolute inset-0 h-2 ${levelStyle.bgClass} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, delay: skillIndex * 0.1 }}
                              />
                            </div>
                          </div>

                          {/* 任务进度 */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-warm-gray-600">任务进度</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-warm-gray-800">
                                {completedTasks}/{totalTasks}
                              </span>
                              {completedTasks === totalTasks && (
                                <Trophy className="w-4 h-4 text-duolingo-yellow" />
                              )}
                            </div>
                          </div>

                          {/* 奖励预览 */}
                          <div className="flex justify-between items-center text-xs text-warm-gray-500 pt-2 border-t border-warm-gray-200">
                            <span>完成奖励:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-duolingo-green">
                                +{skill.rewards.points}积分
                              </span>
                              <span className="font-semibold text-duolingo-blue">
                                +{skill.rewards.xp}XP
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 技能详情对话框 */}
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-4 border-duolingo-blue/30 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Star className="w-6 h-6 text-duolingo-blue" />
              {selectedSkill?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedSkill?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSkill && (
            <div className="space-y-4">
              {/* 技能信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-duolingo-green-subtle rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-duolingo-green">
                    Lv.{selectedSkill.level}
                  </div>
                  <div className="text-sm text-warm-gray-600">当前等级</div>
                </div>
                <div className="bg-duolingo-blue-subtle rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-duolingo-blue">
                    {selectedSkill.xp}/{selectedSkill.maxXP}
                  </div>
                  <div className="text-sm text-warm-gray-600">经验值</div>
                </div>
              </div>

              {/* 可用任务 */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-warm-gray-800">可用任务</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedSkill.tasks.map((task) => {
                    const difficultyConfig = getDifficultyConfig(task.difficulty);
                    
                    return (
                      <motion.div
                        key={task.id}
                        className={`p-3 rounded-xl border-2 ${
                          task.completed 
                            ? 'border-duolingo-green bg-duolingo-green-subtle opacity-60' 
                            : 'border-warm-gray-200 hover:border-warm-gray-300 cursor-pointer'
                        }`}
                        whileHover={!task.completed ? { scale: 1.02 } : {}}
                        onClick={() => !task.completed && onStartTask(selectedSkill.id, task.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-warm-gray-800">{task.title}</h4>
                              <Badge className={`${difficultyConfig.bgColor} ${difficultyConfig.color} border-0 px-2 py-1 rounded-full text-xs`}>
                                {difficultyConfig.emoji} {difficultyConfig.label}
                              </Badge>
                              {task.completed && (
                                <Badge className="bg-duolingo-green text-white px-2 py-1 rounded-full text-xs">
                                  ✅ 已完成
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-warm-gray-600 mt-1">{task.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-duolingo-orange">+{task.points}</div>
                            <div className="text-xs text-warm-gray-500">{task.xp}XP</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSkillDialog(false)}
                  className="rounded-xl"
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}