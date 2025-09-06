import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import { motion } from "motion/react";
import { User, UserCheck, Sparkles } from "lucide-react";

import { PointsHeader } from "./components/PointsHeader";
import { RewardCard } from "./components/RewardCard";
import { TaskHistory } from "./components/TaskHistory";
import { FamilyLeaderboard } from "./components/FamilyLeaderboard";
import { ParentDashboard } from "./components/ParentDashboard";
import { HabitTracker } from "./components/HabitTracker";
import { TaskPlanning } from "./components/TaskPlanning";

export default function App() {
  const [currentUser, setCurrentUser] = useState<"student" | "parent">("student");
  
  // 学生数据
  const [studentData, setStudentData] = useState({
    name: "小明",
    currentPoints: 2580,
    level: 6,
    levelProgress: 65,
    nextLevelPoints: 3000
  });

  // 任务历史数据
  const [taskHistory] = useState([
    {
      id: "1",
      title: "完成数学作业",
      description: "按时完成今天的数学练习题",
      points: 100,
      completedAt: "2025-01-06T10:30:00Z",
      category: "学习",
      streak: 5
    },
    {
      id: "2", 
      title: "整理房间",
      description: "把房间收拾干净整齐",
      points: 80,
      completedAt: "2025-01-05T16:00:00Z",
      category: "家务"
    },
    {
      id: "3",
      title: "阅读30分钟",
      description: "阅读课外书籍30分钟",
      points: 60,
      completedAt: "2025-01-05T19:00:00Z",
      category: "阅读",
      streak: 3
    },
    {
      id: "4",
      title: "户外运动1小时",
      description: "在小区公园跑步和锻炼",
      points: 120,
      completedAt: "2025-01-04T17:30:00Z",
      category: "运动"
    }
  ]);

  // 奖励数据
  const [rewards] = useState([
    {
      id: "1",
      title: "乐高积木套装",
      description: "经典城市系列，包含警察局和消防站",
      cost: 2500,
      category: "玩具",
      available: true,
      image: "https://images.unsplash.com/photo-1613825787641-2dbbd4f96a1c?w=300"
    },
    {
      id: "2",
      title: "儿童图书套装",
      description: "包含5本精选儿童文学作品",
      cost: 800,
      category: "图书",
      available: true
    },
    {
      id: "3",
      title: "游乐园门票",
      description: "迪士尼乐园一日游门票",
      cost: 5000,
      category: "户外",
      available: true
    },
    {
      id: "4",
      title: "平板电脑",
      description: "iPad Air 适合学习和娱乐",
      cost: 8000,
      category: "电子",
      available: false
    },
    {
      id: "5",
      title: "美味零食大礼包",
      description: "包含各种健康美味的儿童零食",
      cost: 300,
      category: "零食",
      available: true
    },
    {
      id: "6",
      title: "新款运动鞋",
      description: "Nike儿童运动鞋，舒适透气",
      cost: 1500,
      category: "服装",
      available: true
    }
  ]);

  // 家庭成员数据
  const [familyMembers] = useState([
    {
      id: "1",
      name: "小明",
      points: 2580,
      isCurrentUser: true,
      weeklyGrowth: 350
    },
    {
      id: "2", 
      name: "小红",
      points: 3200,
      weeklyGrowth: 180
    },
    {
      id: "3",
      name: "小强",
      points: 1950,
      weeklyGrowth: -50
    }
  ]);

  // 家长端数据
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: "1",
      childName: "小明",
      rewardTitle: "乐高积木套装",
      pointsCost: 2500,
      requestedAt: "2025-01-06T14:30:00Z",
      category: "玩具"
    },
    {
      id: "2",
      childName: "小红",
      rewardTitle: "儿童图书套装",
      pointsCost: 800,
      requestedAt: "2025-01-06T12:15:00Z",
      category: "图书"
    }
  ]);

  const [redemptionHistory, setRedemptionHistory] = useState([
    {
      id: "1",
      childName: "小强",
      rewardTitle: "美味零食大礼包",
      pointsCost: 300,
      approvedAt: "2025-01-05T10:00:00Z",
      status: "fulfilled" as const
    },
    {
      id: "2",
      childName: "小明",
      rewardTitle: "新款运动鞋",
      pointsCost: 1500,
      approvedAt: "2025-01-04T16:20:00Z",
      status: "approved" as const
    }
  ]);

  // 打卡习惯数据
  const [habitStreaks] = useState([
    {
      id: "1",
      category: "学习",
      currentStreak: 5,
      maxStreak: 8,
      lastCompletedDate: "2025-01-06",
      icon: "📚",
      color: "blue"
    },
    {
      id: "2",
      category: "运动",
      currentStreak: 12,
      maxStreak: 15,
      lastCompletedDate: "2025-01-05",
      icon: "🏃",
      color: "green"
    },
    {
      id: "3",
      category: "阅读",
      currentStreak: 21,
      maxStreak: 21,
      lastCompletedDate: "2025-01-06",
      icon: "📖",
      color: "purple"
    }
  ]);

  // 处理任务完成（从任务规划页面）
  const handleTaskCompletedFromPlanning = (task: any) => {
    // 更新积分
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + task.points
    }));

    // 添加到任务历史
    const newHistoryItem = {
      id: `history_${Date.now()}`,
      title: task.title,
      description: task.description,
      points: task.points,
      completedAt: new Date().toISOString(),
      category: task.category
    };
    // 这里可以更新taskHistory状态，但由于它是只读的，我们只显示toast
  };

  // 处理打卡奖励领取
  const handleClaimHabitReward = (category: string, milestone: number) => {
    const rewardPoints = milestone === 7 ? 200 : milestone === 14 ? 400 : milestone === 21 ? 800 : milestone * 20;
    
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + rewardPoints
    }));

    toast.success(
      `恭喜！🎉 ${category}打卡达到${milestone}天里程碑！`,
      {
        description: `获得${rewardPoints}积分奖励！继续保持好习惯吧！`,
        duration: 5000,
      }
    );
  };

  // 处理奖励兑换
  const handleRedeem = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (studentData.currentPoints < reward.cost) {
      toast.error("积分不足！继续完成任务来获得更多积分吧 💪");
      return;
    }

    // 模拟兑换成功
    toast.success(
      `兑换申请已提交！🎉\n${reward.title} (${reward.cost.toLocaleString()}积分)\n等待家长审批中...`,
      {
        duration: 4000,
      }
    );

    // 添加到待审批列表
    const newApproval = {
      id: `pending_${Date.now()}`,
      childName: studentData.name,
      rewardTitle: reward.title,
      pointsCost: reward.cost,
      requestedAt: new Date().toISOString(),
      category: reward.category
    };
    setPendingApprovals(prev => [newApproval, ...prev]);
  };

  // 家长审批功能
  const handleApprove = (approvalId: string) => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;

    // 移除待审批项
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
    
    // 添加到历史记录
    const newRecord = {
      id: `history_${Date.now()}`,
      childName: approval.childName,
      rewardTitle: approval.rewardTitle,
      pointsCost: approval.pointsCost,
      approvedAt: new Date().toISOString(),
      status: "approved" as const
    };
    setRedemptionHistory(prev => [newRecord, ...prev]);

    toast.success(`已批准 ${approval.childName} 的兑换申请！✅`);
  };

  const handleReject = (approvalId: string) => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;

    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
    toast.error(`已拒绝 ${approval?.childName} 的兑换申请`);
  };

  const handleMarkFulfilled = (recordId: string) => {
    setRedemptionHistory(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, status: "fulfilled" as const }
          : record
      )
    );
    toast.success("已标记为发放完成！🎁");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <Toaster position="top-center" richColors />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 角色切换 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl p-1 shadow-xl border border-emerald-100">
            <Button
              variant={currentUser === "student" ? "default" : "ghost"}
              onClick={() => setCurrentUser("student")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                currentUser === "student" 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200" 
                  : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              <User className="w-4 h-4" />
              学生端
            </Button>
            <Button
              variant={currentUser === "parent" ? "default" : "ghost"}
              onClick={() => setCurrentUser("parent")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                currentUser === "parent" 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              家长端
            </Button>
          </div>
        </div>

        {currentUser === "student" ? (
          /* 学生端界面 */
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="mb-8"
              >
                <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-white via-gray-50 to-white shadow-2xl rounded-3xl p-4 border-2 border-gradient-to-r border-emerald-100 backdrop-blur-sm relative overflow-hidden min-h-20 h-auto">
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/20 via-blue-50/20 to-purple-50/20 rounded-3xl"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 rounded-t-3xl"></div>
                  
                  {/* 标签按钮 */}
                  <TabsTrigger 
                    value="overview" 
                    className="relative z-10 rounded-2xl font-bold py-4 px-3 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-emerald-200 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-emerald-50 data-[state=inactive]:hover:text-emerald-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1"
                    >
                      ✨ 积分概览
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="rewards" 
                    className="relative z-10 rounded-2xl font-bold py-4 px-3 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-200 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-orange-50 data-[state=inactive]:hover:text-orange-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1"
                    >
                      🎁 兑换奖励
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="planning" 
                    className="relative z-10 rounded-2xl font-bold py-4 px-3 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-200 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-blue-50 data-[state=inactive]:hover:text-blue-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1"
                    >
                      📅 任务规划
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="habits" 
                    className="relative z-10 rounded-2xl font-bold py-4 px-3 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-purple-200 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-purple-50 data-[state=inactive]:hover:text-purple-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1"
                    >
                      🔥 打卡习惯
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="history" 
                    className="relative z-10 rounded-2xl font-bold py-4 px-3 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-teal-200 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-teal-50 data-[state=inactive]:hover:text-teal-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1"
                    >
                      📋 历史记录
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="leaderboard" 
                    className="relative z-10 rounded-2xl font-bold py-4 px-3 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-pink-200 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-pink-50 data-[state=inactive]:hover:text-pink-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1"
                    >
                      🏆 家庭排行
                    </motion.span>
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="overview" className="space-y-6">
                {/* 积分头部 - 只在概览页显示 */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <PointsHeader
                    currentPoints={studentData.currentPoints}
                    level={studentData.level}
                    levelProgress={studentData.levelProgress}
                    nextLevelPoints={studentData.nextLevelPoints}
                    userName={studentData.name}
                  />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 本周成就 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg shadow-yellow-100">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                          本周成就
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="font-medium">完成任务</span>
                            <span className="font-bold text-blue-600 text-lg">12次</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="font-medium">获得积分</span>
                            <span className="font-bold text-emerald-600 text-lg">+980</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="font-medium">连续打卡</span>
                            <span className="font-bold text-orange-600 text-lg">5天</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 近期任务 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <TaskHistory tasks={taskHistory.slice(0, 3)} />
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <RewardCard
                        {...reward}
                        userPoints={studentData.currentPoints}
                        onRedeem={handleRedeem}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="planning">
                <TaskPlanning onTaskCompleted={handleTaskCompletedFromPlanning} />
              </TabsContent>

              <TabsContent value="habits">
                <HabitTracker 
                  habits={habitStreaks} 
                  onClaimReward={handleClaimHabitReward}
                />
              </TabsContent>

              <TabsContent value="history">
                <TaskHistory tasks={taskHistory} />
              </TabsContent>

              <TabsContent value="leaderboard">
                <FamilyLeaderboard members={familyMembers} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* 家长端界面 */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ParentDashboard
              pendingApprovals={pendingApprovals}
              redemptionHistory={redemptionHistory}
              onApprove={handleApprove}
              onReject={handleReject}
              onMarkFulfilled={handleMarkFulfilled}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}