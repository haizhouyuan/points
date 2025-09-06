import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Flame, Star, Trophy, Gift } from "lucide-react";
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
    if (streak >= 21) return { level: "大师", color: "text-purple-600", bgColor: "bg-purple-100" };
    if (streak >= 14) return { level: "专家", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (streak >= 7) return { level: "达人", color: "text-green-600", bgColor: "bg-green-100" };
    if (streak >= 3) return { level: "入门", color: "text-orange-600", bgColor: "bg-orange-100" };
    return { level: "新手", color: "text-gray-600", bgColor: "bg-gray-100" };
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          打卡习惯追踪
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>还没有建立打卡习惯</p>
              <p className="text-sm">完成同类型任务来建立连续打卡记录吧！</p>
            </div>
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
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    habit.currentStreak >= 7 
                      ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200" 
                      : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* 分类图标 */}
                      <div className="text-2xl">{getCategoryIcon(habit.category)}</div>
                      <div>
                        <h4 className="font-semibold">{habit.category}打卡</h4>
                        <Badge 
                          variant="secondary" 
                          className={`${streakLevel.bgColor} ${streakLevel.color} border-0`}
                        >
                          {streakLevel.level}
                        </Badge>
                      </div>
                    </div>

                    {/* 连续天数 */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-2xl font-bold text-orange-600">
                          {habit.currentStreak}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">连续天数</span>
                    </div>
                  </div>

                  {/* 进度条和里程碑 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>距离下个里程碑</span>
                      <span className="font-semibold">
                        {nextMilestone - habit.currentStreak} 天
                      </span>
                    </div>
                    
                    <Progress 
                      value={habit.currentStreak >= nextMilestone ? 100 : progress} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        当前: {habit.currentStreak}天
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {nextMilestone}天里程碑
                        </span>
                        {canClaim && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onClaimReward(habit.category, nextMilestone)}
                            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-semibold transition-colors"
                          >
                            <Gift className="w-3 h-3" />
                            +{milestoneReward}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 历史最高记录 */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">历史最高记录</span>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{habit.maxStreak} 天</span>
                      </div>
                    </div>
                  </div>

                  {/* 里程碑奖励说明 */}
                  {habit.currentStreak < 21 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>7天奖励:</span>
                          <span className="font-semibold text-green-600">+200积分</span>
                        </div>
                        <div className="flex justify-between">
                          <span>14天奖励:</span>
                          <span className="font-semibold text-blue-600">+400积分</span>
                        </div>
                        <div className="flex justify-between">
                          <span>21天奖励:</span>
                          <span className="font-semibold text-purple-600">+800积分</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}