import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Flame, Star, Trophy, Gift, Zap, Crown, Award } from "lucide-react";
import { motion } from "motion/react";

interface HabitStreak {
  id: string;
  category: string;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string;
  icon: string;
  color: string;
}

interface HabitTrackerProps {
  habits: HabitStreak[];
  onClaimReward: (category: string, milestone: number) => void;
}

export function HabitTracker({ habits, onClaimReward }: HabitTrackerProps) {
  const getStreakLevel = (streak: number) => {
    if (streak >= 100) return { 
      level: "传奇大师", 
      color: "text-duolingo-purple", 
      bgColor: "bg-duolingo-purple-subtle", 
      icon: "👑",
      borderColor: "border-duolingo-purple"
    };
    if (streak >= 50) return { 
      level: "钻石专家", 
      color: "text-duolingo-blue", 
      bgColor: "bg-duolingo-blue-subtle", 
      icon: "💎",
      borderColor: "border-duolingo-blue"
    };
    if (streak >= 21) return { 
      level: "黄金大师", 
      color: "text-duolingo-orange", 
      bgColor: "bg-duolingo-yellow-subtle", 
      icon: "🏆",
      borderColor: "border-duolingo-yellow"
    };
    if (streak >= 14) return { 
      level: "白银专家", 
      color: "text-duolingo-orange", 
      bgColor: "bg-duolingo-orange-subtle", 
      icon: "🥈",
      borderColor: "border-duolingo-orange"
    };
    if (streak >= 7) return { 
      level: "青铜达人", 
      color: "text-duolingo-green", 
      bgColor: "bg-duolingo-green-subtle", 
      icon: "🥉",
      borderColor: "border-duolingo-green"
    };
    if (streak >= 3) return { 
      level: "火苗新星", 
      color: "text-warm-gray-600", 
      bgColor: "bg-warm-gray-100", 
      icon: "✨",
      borderColor: "border-warm-gray-300"
    };
    return { 
      level: "萌新学员", 
      color: "text-warm-gray-500", 
      bgColor: "bg-warm-gray-50", 
      icon: "🌱",
      borderColor: "border-warm-gray-200"
    };
  };

  const getNextMilestone = (streak: number) => {
    if (streak < 7) return 7;
    if (streak < 14) return 14;
    if (streak < 21) return 21;
    return Math.ceil((streak + 1) / 7) * 7;
  };

  const getMilestoneReward = (milestone: number) => {
    if (milestone === 7) return 200;
    if (milestone === 14) return 400;
    if (milestone === 21) return 800;
    return milestone * 20;
  };

  const canClaimReward = (streak: number, milestone: number) => {
    return streak >= milestone && (streak === milestone || streak % 7 === 0);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      "学习": "📚",
      "运动": "🏃",
      "阅读": "📖",
      "家务": "🧹",
      "社交": "👥",
    };
    return icons[category as keyof typeof icons] || "⭐";
  };

  return (
    <Card className="bg-gradient-to-br from-duolingo-purple-subtle via-white to-duolingo-pink-subtle border-4 border-duolingo-purple/40 shadow-2xl shadow-duolingo-purple/30 rounded-[2rem] overflow-hidden relative">
      {/* 🎨 装饰背景 */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-duolingo-yellow/15 rounded-full -translate-y-12 translate-x-12"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-duolingo-pink/20 rounded-full translate-y-10 -translate-x-10"></div>
      <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-duolingo-orange/10 rounded-full"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-4 text-2xl font-black">
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="text-4xl"
          >
            🔥
          </motion.div>
          <span className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink bg-clip-text text-transparent">
            习惯打卡系统
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-6">
          {habits.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🌱
              </motion.div>
              <h3 className="text-xl font-bold text-warm-gray-700 mb-2">开始你的习惯之旅</h3>
              <p className="text-warm-gray-500 mb-4">完成同类型任务来建立连续打卡记录！</p>
              <Button className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white font-bold rounded-xl">
                <Zap className="w-4 h-4 mr-2" />
                创建第一个习惯
              </Button>
            </motion.div>
          ) : (
            habits.map((habit, index) => {
              const streakLevel = getStreakLevel(habit.currentStreak);
              const nextMilestone = getNextMilestone(habit.currentStreak);
              const progress = ((habit.currentStreak % 7) / 7) * 100;
              const milestoneReward = getMilestoneReward(nextMilestone);
              const canClaim = canClaimReward(habit.currentStreak, nextMilestone);

              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white rounded-[1.5rem] p-6 border-4 border-warm-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                >
                  {/* 装饰元素 */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-duolingo-yellow/20 to-duolingo-orange/20 rounded-full -translate-y-8 translate-x-8"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-duolingo-purple/15 to-duolingo-pink/15 rounded-full translate-y-6 -translate-x-6"></div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                      {/* 分类图标 */}
                      <motion.div 
                        className="text-4xl bg-gradient-to-r from-duolingo-green-subtle to-duolingo-blue-subtle rounded-xl p-3 border-2 border-duolingo-green/30"
                        animate={{ rotate: habit.currentStreak > 0 ? [0, 5, -5, 0] : 0 }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        {getCategoryIcon(habit.category)}
                      </motion.div>
                      <div>
                        <h4 className="font-bold text-lg text-warm-gray-800">{habit.category}打卡</h4>
                        <Badge 
                          className={`${streakLevel.bgColor} ${streakLevel.color} ${streakLevel.borderColor} border-2 font-bold px-3 py-1 rounded-full flex items-center gap-1`}
                        >
                          <span className="text-sm">{streakLevel.icon}</span>
                          {streakLevel.level}
                        </Badge>
                      </div>
                    </div>

                    {/* 连续天数 - 更加突出 */}
                    <div className="text-center bg-gradient-to-br from-duolingo-orange-subtle to-duolingo-yellow-subtle rounded-xl p-4 border-2 border-duolingo-orange/30">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <motion.div
                          animate={{ 
                            scale: habit.currentStreak > 0 ? [1, 1.2, 1] : 1,
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          🔥
                        </motion.div>
                        <span className="text-3xl font-black text-duolingo-orange">
                          {habit.currentStreak}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-duolingo-orange-dark">连续天数</span>
                    </div>
                  </div>

                  {/* 🎯 进度条和里程碑 - 更加游戏化 */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-warm-gray-700">🎯 下个里程碑</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-duolingo-blue">
                          还需 {nextMilestone - habit.currentStreak} 天
                        </span>
                        {canClaim && (
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onClaimReward(habit.category, nextMilestone)}
                            className="flex items-center gap-1 bg-gradient-to-r from-duolingo-yellow to-duolingo-orange text-white px-3 py-1 rounded-full font-bold shadow-lg"
                            animate={{ 
                              boxShadow: [
                                "0 0 0px rgba(255, 198, 0, 0.5)",
                                "0 0 20px rgba(255, 198, 0, 0.8)",
                                "0 0 0px rgba(255, 198, 0, 0.5)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Award className="w-4 h-4" />
                            +{milestoneReward}
                          </motion.button>
                        )}
                      </div>
                    </div>
                    
                    {/* 游戏化进度条 */}
                    <div className="relative">
                      <div className="w-full bg-warm-gray-200 rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="h-4 bg-gradient-to-r from-duolingo-green via-duolingo-blue to-duolingo-purple rounded-full relative"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${habit.currentStreak >= nextMilestone ? 100 : progress}%` 
                          }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        >
                          {/* 闪光效果 */}
                          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                        </motion.div>
                      </div>
                      
                      {/* 里程碑标记 */}
                      <div className="absolute -bottom-8 left-0 right-0 flex justify-between items-center text-xs">
                        <span className="font-medium text-warm-gray-500">
                          {habit.currentStreak}天
                        </span>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-duolingo-yellow" />
                          <span className="font-bold text-duolingo-orange">
                            {nextMilestone}天
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 📊 统计信息 */}
                  <div className="mt-6 pt-4 border-t-2 border-warm-gray-200 space-y-4">
                    {/* 历史最高记录 */}
                    <div className="bg-gradient-to-r from-duolingo-yellow-subtle to-duolingo-orange-subtle rounded-xl p-3 border-2 border-duolingo-yellow/30">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-warm-gray-700">🏆 历史最高</span>
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-duolingo-yellow" />
                          <span className="font-black text-duolingo-orange text-lg">{habit.maxStreak} 天</span>
                        </div>
                      </div>
                    </div>

                    {/* 🎁 里程碑奖励展示 */}
                    {habit.currentStreak < 100 && (
                      <div className="bg-gradient-to-r from-duolingo-purple-subtle to-duolingo-pink-subtle rounded-xl p-4 border-2 border-duolingo-purple/30">
                        <div className="text-center mb-3">
                          <span className="font-bold text-duolingo-purple">🎁 里程碑奖励</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between items-center bg-white rounded-lg px-2 py-1">
                            <span>🥉 7天:</span>
                            <span className="font-bold text-duolingo-green">+200</span>
                          </div>
                          <div className="flex justify-between items-center bg-white rounded-lg px-2 py-1">
                            <span>🥈 14天:</span>
                            <span className="font-bold text-duolingo-blue">+400</span>
                          </div>
                          <div className="flex justify-between items-center bg-white rounded-lg px-2 py-1">
                            <span>🥇 21天:</span>
                            <span className="font-bold text-duolingo-orange">+800</span>
                          </div>
                          <div className="flex justify-between items-center bg-white rounded-lg px-2 py-1">
                            <span>💎 50天:</span>
                            <span className="font-bold text-duolingo-purple">+2000</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}