import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  Plus, 
  Trophy, 
  Star, 
  Clock, 
  Target, 
  Zap, 
  Crown, 
  Award,
  Calendar,
  CheckCircle,
  UserCheck,
  Gift,
  Flame,
  Sparkles,
  Heart,
  MessageCircle
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  role: 'child' | 'parent';
  isOnline: boolean;
}

interface CollaborativeTask {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'individual' | 'collaborative' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard';
  totalPoints: number;
  participants: {
    memberId: string;
    role: 'leader' | 'participant';
    progress: number;
    contribution: number;
    status: 'pending' | 'active' | 'completed';
  }[];
  deadline: string;
  createdBy: string;
  status: 'active' | 'completed' | 'paused';
  requirements: string[];
  rewards: {
    individual: number;
    bonus: number;
    badges?: string[];
    title?: string;
  };
  progress: number;
  milestones: {
    id: string;
    title: string;
    description: string;
    targetProgress: number;
    reward: number;
    completed: boolean;
    completedBy?: string;
    completedAt?: string;
  }[];
}

interface FamilyChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  duration: number; // days
  startDate: string;
  endDate: string;
  participants: string[];
  leaderboard: {
    memberId: string;
    score: number;
    badges: string[];
  }[];
  prizes: {
    first: { points: number; title: string; badge: string };
    second: { points: number; title: string; badge: string };
    third: { points: number; title: string; badge: string };
    participation: { points: number; badge: string };
  };
  status: 'upcoming' | 'active' | 'completed';
}

interface FamilyCollaborationProps {
  familyMembers: FamilyMember[];
  currentUserId: string;
  currentUserRole: 'child' | 'parent';
  collaborativeTasks: CollaborativeTask[];
  familyChallenges: FamilyChallenge[];
  onCreateTask: (task: Partial<CollaborativeTask>) => void;
  onJoinTask: (taskId: string, userId: string) => void;
  onUpdateProgress: (taskId: string, userId: string, progress: number) => void;
  onCompleteTask: (taskId: string, userId: string) => void;
  onCreateChallenge: (challenge: Partial<FamilyChallenge>) => void;
  onJoinChallenge: (challengeId: string, userId: string) => void;
}

export function FamilyCollaboration({
  familyMembers,
  currentUserId,
  currentUserRole,
  collaborativeTasks,
  familyChallenges,
  onCreateTask,
  onJoinTask,
  onUpdateProgress,
  onCompleteTask,
  onCreateChallenge,
  onJoinChallenge
}: FamilyCollaborationProps) {
  const [currentTab, setCurrentTab] = useState('tasks');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState<CollaborativeTask | null>(null);
  const [newTask, setNewTask] = useState<Partial<CollaborativeTask>>({
    title: '',
    description: '',
    category: 'learning',
    type: 'collaborative',
    difficulty: 'medium',
    totalPoints: 200,
    participants: [],
    requirements: []
  });

  const currentUser = familyMembers.find(m => m.id === currentUserId);
  const activeTasks = collaborativeTasks.filter(t => t.status === 'active');
  const completedTasks = collaborativeTasks.filter(t => t.status === 'completed');
  const activeChallenges = familyChallenges.filter(c => c.status === 'active');

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description) {
      toast.error('请填写任务标题和描述！');
      return;
    }

    const task: Partial<CollaborativeTask> = {
      ...newTask,
      id: `task_${Date.now()}`,
      createdBy: currentUserId,
      status: 'active',
      progress: 0,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: [{
        memberId: currentUserId,
        role: 'leader',
        progress: 0,
        contribution: 0,
        status: 'active'
      }],
      milestones: [
        {
          id: 'milestone_1',
          title: '25%完成',
          description: '任务进度达到25%',
          targetProgress: 25,
          reward: Math.floor((newTask.totalPoints || 200) * 0.1),
          completed: false
        },
        {
          id: 'milestone_2',
          title: '50%完成',
          description: '任务进度达到50%',
          targetProgress: 50,
          reward: Math.floor((newTask.totalPoints || 200) * 0.15),
          completed: false
        },
        {
          id: 'milestone_3',
          title: '75%完成',
          description: '任务进度达到75%',
          targetProgress: 75,
          reward: Math.floor((newTask.totalPoints || 200) * 0.2),
          completed: false
        }
      ]
    };

    onCreateTask(task);
    setNewTask({
      title: '',
      description: '',
      category: 'learning',
      type: 'collaborative',
      difficulty: 'medium',
      totalPoints: 200,
      participants: [],
      requirements: []
    });
    setShowCreateDialog(false);
    
    toast.success('🎯 协作任务创建成功！', {
      description: '邀请家庭成员一起完成任务吧！',
      duration: 3000,
    });
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <Target className="w-4 h-4" />;
      case 'collaborative': return <Users className="w-4 h-4" />;
      case 'challenge': return <Trophy className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-duolingo-green bg-duolingo-green-subtle border-duolingo-green';
      case 'medium': return 'text-duolingo-orange bg-duolingo-orange-subtle border-duolingo-orange';
      case 'hard': return 'text-red-600 bg-red-50 border-red-300';
      default: return 'text-warm-gray-600 bg-warm-gray-100 border-warm-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return '📚';
      case 'exercise': return '🏃';
      case 'household': return '🏠';
      case 'creativity': return '🎨';
      case 'social': return '👥';
      default: return '⭐';
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎨 Duolingo风格头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className="bg-gradient-to-br from-duolingo-purple-subtle via-white to-duolingo-pink-subtle border-4 border-duolingo-purple/30 shadow-2xl shadow-duolingo-purple/20 rounded-[2rem] overflow-hidden">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-duolingo-purple/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-duolingo-pink/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-duolingo-yellow/20 rounded-full -translate-x-8 -translate-y-8"></div>
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="text-5xl"
                >
                  👨‍👩‍👧‍👦
                </motion.div>
                <div>
                  <CardTitle className="text-3xl font-black bg-gradient-to-r from-duolingo-purple to-duolingo-pink bg-clip-text text-transparent">
                    家庭协作中心
                  </CardTitle>
                  <p className="text-warm-gray-600 text-lg mt-1">
                    与家人一起完成任务，共同成长！
                  </p>
                </div>
              </div>
              
              {/* 在线家庭成员 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-warm-gray-600">在线成员:</span>
                <div className="flex -space-x-2">
                  {familyMembers.filter(m => m.isOnline).map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-duolingo-green to-duolingo-blue rounded-full flex items-center justify-center text-white font-bold border-3 border-white shadow-lg">
                        {member.avatar}
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-duolingo-green rounded-full border-2 border-white"></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* 🎯 导航标签页 */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-white via-warm-gray-50 to-white shadow-xl rounded-[2rem] p-2 border-4 border-duolingo-green-subtle">
          <TabsTrigger 
            value="tasks" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-green data-[state=active]:to-duolingo-green-light data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <Users className="w-4 h-4" />
              协作任务
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="challenges" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-orange data-[state=active]:to-duolingo-orange-light data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <Trophy className="w-4 h-4" />
              家庭挑战
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-blue data-[state=active]:to-duolingo-blue-light data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <Award className="w-4 h-4" />
              完成历史
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-purple data-[state=active]:to-duolingo-pink data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <Plus className="w-4 h-4" />
              创建任务
            </motion.div>
          </TabsTrigger>
        </TabsList>

        {/* 协作任务页面 */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-white border-3 border-duolingo-green/20 shadow-xl shadow-duolingo-green/10 rounded-[1.5rem] overflow-hidden hover:shadow-2xl hover:shadow-duolingo-green/20 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getCategoryIcon(task.category)}</div>
                        <div>
                          <CardTitle className="text-xl font-bold text-warm-gray-800">
                            {task.title}
                          </CardTitle>
                          <p className="text-sm text-warm-gray-600 mt-1">
                            {task.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getDifficultyColor(task.difficulty)} px-2 py-1`}>
                          {getTaskTypeIcon(task.type)}
                          <span className="ml-1">{task.difficulty}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 进度条 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-warm-gray-700">完成进度</span>
                        <span className="text-sm font-bold text-duolingo-green">{task.progress}%</span>
                      </div>
                      <Progress 
                        value={task.progress} 
                        className="h-3 bg-warm-gray-200 rounded-full overflow-hidden"
                      />
                    </div>

                    {/* 参与者 */}
                    <div>
                      <span className="text-sm font-semibold text-warm-gray-700 mb-2 block">参与成员</span>
                      <div className="flex items-center gap-2">
                        {task.participants.map((participant) => {
                          const member = familyMembers.find(m => m.id === participant.memberId);
                          if (!member) return null;
                          
                          return (
                            <div key={participant.memberId} className="relative">
                              <div className="w-8 h-8 bg-gradient-to-br from-duolingo-blue to-duolingo-purple rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {member.avatar}
                              </div>
                              {participant.role === 'leader' && (
                                <Crown className="absolute -top-1 -right-1 w-4 h-4 text-duolingo-yellow" />
                              )}
                            </div>
                          );
                        })}
                        {task.participants.length < familyMembers.length && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 rounded-full p-0 border-2 border-dashed border-duolingo-green text-duolingo-green hover:bg-duolingo-green hover:text-white"
                            onClick={() => onJoinTask(task.id, currentUserId)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 奖励信息 */}
                    <div className="flex items-center justify-between p-3 bg-duolingo-yellow-subtle rounded-xl border-2 border-duolingo-yellow/30">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-duolingo-orange" />
                        <span className="font-semibold text-warm-gray-700">总奖励</span>
                      </div>
                      <div className="text-xl font-black text-duolingo-orange">
                        {task.totalPoints} 积分
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setShowTaskDetails(task)}
                        variant="outline"
                        className="flex-1 rounded-xl font-semibold border-2 border-duolingo-blue text-duolingo-blue hover:bg-duolingo-blue hover:text-white"
                      >
                        查看详情
                      </Button>
                      {task.participants.some(p => p.memberId === currentUserId) && (
                        <Button
                          onClick={() => onCompleteTask(task.id, currentUserId)}
                          className="flex-1 bg-gradient-to-r from-duolingo-green to-duolingo-green-light text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          完成任务
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {activeTasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl font-semibold text-warm-gray-600 mb-2">
                暂无活跃的协作任务
              </p>
              <p className="text-warm-gray-500 mb-6">
                创建一个新任务，邀请家人一起完成吧！
              </p>
              <Button
                onClick={() => setCurrentTab('create')}
                className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white rounded-xl font-bold px-8 py-3 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5 mr-2" />
                创建协作任务
              </Button>
            </motion.div>
          )}
        </TabsContent>

        {/* 家庭挑战页面 */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-duolingo-yellow-subtle to-duolingo-orange-subtle border-4 border-duolingo-orange/30 shadow-2xl shadow-duolingo-orange/20 rounded-[2rem] overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-duolingo-orange" />
                      <div>
                        <CardTitle className="text-2xl font-black text-warm-gray-800">
                          {challenge.title}
                        </CardTitle>
                        <p className="text-warm-gray-600">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 排行榜 */}
                    <div className="space-y-2">
                      {challenge.leaderboard.slice(0, 3).map((entry, index) => {
                        const member = familyMembers.find(m => m.id === entry.memberId);
                        const medals = ['🥇', '🥈', '🥉'];
                        
                        return (
                          <div key={entry.memberId} className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-duolingo-orange/20">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{medals[index]}</span>
                              <div>
                                <p className="font-bold text-warm-gray-800">{member?.name}</p>
                                <div className="flex gap-1">
                                  {entry.badges.map((badge, i) => (
                                    <span key={i} className="text-sm">{badge}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="text-xl font-black text-duolingo-orange">
                              {entry.score} 分
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 创建任务页面 */}
        <TabsContent value="create" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-duolingo-purple-subtle to-duolingo-pink-subtle border-4 border-duolingo-purple/30 shadow-2xl rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-duolingo-purple to-duolingo-pink bg-clip-text text-transparent">
                  🎯 创建协作任务
                </CardTitle>
                <p className="text-warm-gray-600">
                  设计一个有趣的任务，邀请家人一起完成！
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-warm-gray-700 mb-2">任务标题</label>
                      <Input
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="给任务起个有趣的名字..."
                        className="rounded-xl border-2 border-duolingo-purple/30 focus:border-duolingo-purple"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-warm-gray-700 mb-2">任务描述</label>
                      <Textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="详细描述任务内容和要求..."
                        className="rounded-xl border-2 border-duolingo-purple/30 focus:border-duolingo-purple"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-warm-gray-700 mb-2">任务类别</label>
                      <Select value={newTask.category} onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="rounded-xl border-2 border-duolingo-purple/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="learning">📚 学习</SelectItem>
                          <SelectItem value="exercise">🏃 运动</SelectItem>
                          <SelectItem value="household">🏠 家务</SelectItem>
                          <SelectItem value="creativity">🎨 创意</SelectItem>
                          <SelectItem value="social">👥 社交</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-warm-gray-700 mb-2">难度等级</label>
                      <Select value={newTask.difficulty} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, difficulty: value }))}>
                        <SelectTrigger className="rounded-xl border-2 border-duolingo-purple/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">🟢 简单</SelectItem>
                          <SelectItem value="medium">🟡 中等</SelectItem>
                          <SelectItem value="hard">🔴 困难</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-warm-gray-700 mb-2">总积分奖励</label>
                      <Input
                        type="number"
                        value={newTask.totalPoints}
                        onChange={(e) => setNewTask(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 200 }))}
                        placeholder="200"
                        className="rounded-xl border-2 border-duolingo-purple/30 focus:border-duolingo-purple"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    onClick={handleCreateTask}
                    className="w-full bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white rounded-xl font-bold py-4 text-lg hover:scale-105 transition-transform"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    创建协作任务
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* 任务详情弹窗 */}
      {showTaskDetails && (
        <Dialog open={!!showTaskDetails} onOpenChange={() => setShowTaskDetails(null)}>
          <DialogContent className="max-w-4xl rounded-[2rem] border-4 border-duolingo-green/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-duolingo-green">
                {showTaskDetails.title}
              </DialogTitle>
              <DialogDescription className="text-warm-gray-600">
                {showTaskDetails.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 里程碑进度 */}
              <div>
                <h3 className="font-bold text-lg text-warm-gray-800 mb-4">任务里程碑</h3>
                <div className="space-y-3">
                  {showTaskDetails.milestones.map((milestone) => (
                    <div key={milestone.id} className={`p-4 rounded-xl border-2 ${milestone.completed ? 'bg-duolingo-green-subtle border-duolingo-green' : 'bg-warm-gray-50 border-warm-gray-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-duolingo-green text-white' : 'bg-warm-gray-300 text-warm-gray-600'}`}>
                            {milestone.completed ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{milestone.targetProgress}%</span>}
                          </div>
                          <div>
                            <p className="font-bold text-warm-gray-800">{milestone.title}</p>
                            <p className="text-sm text-warm-gray-600">{milestone.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-duolingo-orange text-white">
                          +{milestone.reward} 积分
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 参与者详情 */}
              <div>
                <h3 className="font-bold text-lg text-warm-gray-800 mb-4">参与成员</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showTaskDetails.participants.map((participant) => {
                    const member = familyMembers.find(m => m.id === participant.memberId);
                    if (!member) return null;
                    
                    return (
                      <div key={participant.memberId} className="p-4 bg-white rounded-xl border-2 border-duolingo-blue/20 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-duolingo-blue to-duolingo-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-warm-gray-800">{member.name}</p>
                              <Badge variant="outline" className={`text-xs ${participant.role === 'leader' ? 'text-duolingo-orange border-duolingo-orange' : 'text-warm-gray-600'}`}>
                                {participant.role === 'leader' ? '👑 队长' : '👤 成员'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-warm-gray-600">贡献度</p>
                            <p className="font-bold text-duolingo-green">{participant.contribution}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}