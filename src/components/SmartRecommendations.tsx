import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Sparkles, Clock, TrendingUp, Target, Brain, Zap, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { RecommendationService, RecommendationResponse } from '../services/recommendation.service';
import { BehaviorAnalysisService, BehaviorAnalysisResult } from '../services/behavior-analysis.service';
import { Task } from '../types/task';
import { User } from '../types/user';

interface RecommendedTask {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 分钟
  xp: number;
  points: number;
  tags: string[];
  reason: string; // AI推荐理由
  confidence: number; // 推荐置信度 0-100
  bestTime?: string; // 建议完成时间
  prerequisites?: string[];
}

interface UserAnalytics {
  preferredCategories: string[];
  preferredDifficulty: string;
  averageCompletionTime: number;
  mostActiveHours: number[];
  streakCategories: string[];
  weakCategories: string[];
}

interface SmartRecommendationsProps {
  user?: User;
  availableTasks?: Task[];
  userAnalytics?: UserAnalytics;
  userLevel: number;
  currentXP: number;
  availableTime: number; // 用户当前可用时间（分钟）
  onAcceptTask: (taskId: string) => void;
  onRejectTask: (taskId: string, reason?: string) => void;
  onFeedback: (taskId: string, helpful: boolean) => void;
}

export function SmartRecommendations({ 
  user,
  availableTasks = [],
  userAnalytics, 
  userLevel, 
  currentXP, 
  availableTime,
  onAcceptTask,
  onRejectTask,
  onFeedback 
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<RecommendedTask | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<BehaviorAnalysisResult | null>(null);
  const [recommendationResponse, setRecommendationResponse] = useState<RecommendationResponse | null>(null);

  // 生成模拟数据
  const generateMockData = () => {
    const mockUser: User = user || {
      id: 'user_1',
      username: '小明',
      email: 'xiaoming@example.com',
      role: 'student' as any,
      points: currentXP || 0
    };

    // 生成模拟学习会话
    const mockSessions = Array.from({ length: 15 }, (_, i) => ({
      id: `session_${i}`,
      userId: mockUser.id,
      taskId: `task_${i}`,
      startTime: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000 + Math.random() * 8 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000 + Math.random() * 8 * 60 * 60 * 1000 + (20 + Math.random() * 40) * 60 * 1000),
      duration: 20 + Math.random() * 40,
      completed: Math.random() > 0.2,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
      category: ['exercise', 'reading', 'learning', 'creativity', 'chores'][Math.floor(Math.random() * 5)],
      points: Math.floor(Math.random() * 100) + 20,
      engagement: Math.random() * 2 + 3
    }));

    // 生成模拟任务
    const mockTasks: Task[] = availableTasks.length > 0 ? availableTasks : [
      {
        id: 'task_1',
        title: '数学口算练习',
        description: '完成20道口算题，提升计算速度',
        category: 'learning',
        difficulty: 'easy',
        points: 80,
        estimatedDuration: 15,
        requirements: [],
        tags: ['数学', '口算'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task_2', 
        title: '阅读科普文章',
        description: '阅读一篇有趣的科普文章',
        category: 'reading',
        difficulty: 'medium',
        points: 90,
        estimatedDuration: 20,
        requirements: [],
        tags: ['阅读', '科普'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task_3',
        title: '户外运动30分钟',
        description: '进行30分钟户外运动',
        category: 'exercise', 
        difficulty: 'medium',
        points: 120,
        estimatedDuration: 30,
        requirements: [],
        tags: ['运动', '户外'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return { mockUser, mockSessions, mockTasks };
  };

  // 生成智能推荐
  const generateRecommendations = async () => {
    setIsGenerating(true);
    
    try {
      const { mockUser, mockSessions, mockTasks } = generateMockData();
      
      // 生成行为分析
      const analysis = BehaviorAnalysisService.analyzeUserBehavior(mockSessions);
      setBehaviorAnalysis(analysis);
      
      // 生成用户行为数据
      const behaviorData = BehaviorAnalysisService.generateUserBehaviorFromHistory(
        mockUser,
        mockSessions.filter(s => s.completed).map(s => ({
          id: s.taskId,
          title: `任务 ${s.taskId}`,
          description: '模拟任务',
          category: s.category,
          difficulty: s.difficulty,
          points: s.points,
          estimatedDuration: s.duration,
          requirements: [],
          tags: [],
          isActive: true,
          createdAt: s.startTime,
          updatedAt: s.endTime
        })),
        mockSessions
      );
      
      // 生成推荐
      const response = RecommendationService.generateRecommendations(
        mockUser,
        behaviorData,
        mockTasks
      );
      setRecommendationResponse(response);
      
      // 转换为组件格式
      const convertedRecommendations: RecommendedTask[] = response.recommendations.map(rec => ({
        id: rec.task.id,
        title: rec.task.title,
        description: rec.task.description,
        category: rec.task.category,
        difficulty: rec.task.difficulty as 'easy' | 'medium' | 'hard',
        estimatedTime: rec.task.estimatedDuration,
        xp: Math.round(rec.task.points * 0.8), // XP通常比积分少一些
        points: rec.task.points,
        tags: rec.task.tags,
        reason: rec.reason,
        confidence: Math.round(rec.confidence * 100),
        bestTime: rec.estimatedEngagement > 0.8 ? '黄金时间' : '任意时间'
      }));
      
      setRecommendations(convertedRecommendations);
      
    } catch (error) {
      console.error('推荐生成失败:', error);
      // 回退到简单推荐
      setRecommendations([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 组件加载时生成推荐
  useEffect(() => {
    generateRecommendations();
  }, [user, availableTasks, userAnalytics, availableTime]);

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

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-duolingo-green';
    if (confidence >= 75) return 'text-duolingo-blue';
    if (confidence >= 60) return 'text-duolingo-orange';
    return 'text-warm-gray-500';
  };

  // 处理任务接受
  const handleAcceptTask = (task: RecommendedTask) => {
    onAcceptTask(task.id);
    setRecommendations(prev => prev.filter(t => t.id !== task.id));
    
    toast.success(`📋 任务已加入计划！`, {
      description: `${task.title} - 预计${task.estimatedTime}分钟`,
      duration: 4000,
    });
  };

  // 处理任务拒绝
  const handleRejectTask = (task: RecommendedTask, reason?: string) => {
    onRejectTask(task.id, reason);
    setRecommendations(prev => prev.filter(t => t.id !== task.id));
    
    toast.info(`👋 任务已拒绝`, {
      description: '我们会根据你的反馈改进推荐',
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      {/* 🤖 智能推荐标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-duolingo-purple-subtle via-white to-duolingo-pink-subtle border-4 border-duolingo-purple/40 shadow-2xl shadow-duolingo-purple/30 rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-purple via-duolingo-pink to-duolingo-purple"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-duolingo-pink/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-duolingo-purple/15 rounded-full translate-y-10 -translate-x-10"></div>
          
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="flex items-center gap-4 text-2xl font-black">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className="text-4xl"
              >
                🤖
              </motion.div>
              <div>
                <span className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink bg-clip-text text-transparent">
                  AI智能推荐
                </span>
                <div className="text-sm font-medium text-warm-gray-600 mt-1">
                  基于你的学习习惯和兴趣，为你量身定制
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-warm-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>可用时间: {availableTime}分钟</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-warm-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>等级: Lv.{userLevel}</span>
                </div>
              </div>
              
              <Button
                onClick={generateRecommendations}
                disabled={isGenerating}
                className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Brain className="w-4 h-4 mr-2" />
                {isGenerating ? '生成中...' : '刷新推荐'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🎯 推荐任务列表 */}
      <AnimatePresence mode="popLayout">
        {isGenerating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-4"
            >
              🤖
            </motion.div>
            <h3 className="text-xl font-bold text-warm-gray-700 mb-2">AI正在分析中...</h3>
            <p className="text-warm-gray-500">根据你的学习数据生成个性化推荐</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-warm-gray-700 mb-2">暂无推荐</h3>
                <p className="text-warm-gray-500 mb-4">尝试调整可用时间或完成更多任务来获得更好的推荐</p>
                <Button
                  onClick={generateRecommendations}
                  className="bg-gradient-to-r from-duolingo-blue to-duolingo-purple text-white font-bold rounded-xl"
                >
                  重新生成推荐
                </Button>
              </motion.div>
            ) : (
              recommendations.map((task, index) => {
                const difficultyConfig = getDifficultyConfig(task.difficulty);
                const confidenceColor = getConfidenceColor(task.confidence);
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <Card className="bg-white rounded-[1.5rem] border-4 border-warm-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                      {/* 置信度指示条 */}
                      <div 
                        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-duolingo-green to-duolingo-blue transition-all duration-1000"
                        style={{ width: `${task.confidence}%` }}
                      />
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg font-bold text-warm-gray-800">
                                {task.title}
                              </CardTitle>
                              <Badge className={`${difficultyConfig.bgColor} ${difficultyConfig.color} border-0 px-2 py-1 rounded-full text-xs flex items-center gap-1`}>
                                <span>{difficultyConfig.emoji}</span>
                                {difficultyConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-warm-gray-600 mb-3">{task.description}</p>
                            
                            {/* AI推荐理由 */}
                            <div className="bg-duolingo-blue-subtle rounded-lg p-3 mb-3">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-duolingo-blue mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-semibold text-duolingo-blue mb-1">AI推荐理由</div>
                                  <p className="text-sm text-warm-gray-700">{task.reason}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 置信度分数 */}
                          <div className="text-right ml-4">
                            <div className={`font-bold text-lg ${confidenceColor}`}>
                              {task.confidence}%
                            </div>
                            <div className="text-xs text-warm-gray-500">匹配度</div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* 任务信息 */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-duolingo-orange-subtle rounded-lg p-2">
                            <div className="font-bold text-duolingo-orange">{task.estimatedTime}分</div>
                            <div className="text-xs text-warm-gray-600">预计时长</div>
                          </div>
                          <div className="bg-duolingo-blue-subtle rounded-lg p-2">
                            <div className="font-bold text-duolingo-blue">+{task.xp}</div>
                            <div className="text-xs text-warm-gray-600">经验值</div>
                          </div>
                          <div className="bg-duolingo-green-subtle rounded-lg p-2">
                            <div className="font-bold text-duolingo-green">+{task.points}</div>
                            <div className="text-xs text-warm-gray-600">积分</div>
                          </div>
                        </div>

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag, tagIndex) => (
                            <Badge 
                              key={tagIndex}
                              variant="outline" 
                              className="text-xs border-warm-gray-300 text-warm-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* 建议时间 */}
                        {task.bestTime && (
                          <div className="flex items-center gap-2 text-sm text-warm-gray-600">
                            <Target className="w-4 h-4" />
                            <span>建议时间: {task.bestTime}</span>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex items-center justify-between pt-4 border-t border-warm-gray-200">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onFeedback(task.id, true)}
                              className="rounded-lg border-duolingo-green text-duolingo-green hover:bg-duolingo-green-subtle"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              有用
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onFeedback(task.id, false)}
                              className="rounded-lg border-warm-gray-300 text-warm-gray-600 hover:bg-warm-gray-100"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              无用
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectTask(task)}
                              className="rounded-lg"
                            >
                              跳过
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptTask(task)}
                              className="bg-gradient-to-r from-duolingo-green to-duolingo-blue text-white font-bold rounded-lg hover:scale-105 transition-transform"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              开始任务
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </AnimatePresence>

      {/* 🧠 个性化洞察面板 */}
      {behaviorAnalysis && recommendationResponse && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-duolingo-blue-subtle via-white to-duolingo-purple-subtle border-4 border-duolingo-blue/40 shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-black">
                <Brain className="w-6 h-6 text-duolingo-blue" />
                <span className="bg-gradient-to-r from-duolingo-blue to-duolingo-purple bg-clip-text text-transparent">
                  个性化学习洞察
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 学习目标 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-duolingo-green-subtle rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-duolingo-green" />
                    <h3 className="font-bold text-duolingo-green">当前目标</h3>
                  </div>
                  <p className="text-warm-gray-700 text-sm">{recommendationResponse.learningGoal}</p>
                </div>
                <div className="bg-duolingo-orange-subtle rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-duolingo-orange" />
                    <h3 className="font-bold text-duolingo-orange">下个里程碑</h3>
                  </div>
                  <p className="text-warm-gray-700 text-sm">{recommendationResponse.nextMilestone}</p>
                </div>
              </div>

              {/* 学习画像 */}
              <div className="bg-white rounded-2xl p-4 border-2 border-warm-gray-200">
                <h3 className="font-bold text-warm-gray-800 mb-3 flex items-center gap-2">
                  <div className="text-2xl">👤</div>
                  你的学习画像
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-duolingo-purple-subtle rounded-xl">
                    <div className="font-bold text-duolingo-purple">学习风格</div>
                    <div className="text-warm-gray-700 mt-1">
                      {{
                        'visual': '视觉型 👁️',
                        'auditory': '听觉型 👂',
                        'kinesthetic': '动手型 ✋',
                        'mixed': '综合型 🌟'
                      }[behaviorAnalysis.userProfile.learningStyle]}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-duolingo-blue-subtle rounded-xl">
                    <div className="font-bold text-duolingo-blue">动机类型</div>
                    <div className="text-warm-gray-700 mt-1">
                      {{
                        'achievement': '成就导向 🏆',
                        'social': '社交导向 👥',
                        'mastery': '掌握导向 📚',
                        'autonomy': '自主导向 🎯'
                      }[behaviorAnalysis.userProfile.motivationType]}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-duolingo-green-subtle rounded-xl">
                    <div className="font-bold text-duolingo-green">一致性得分</div>
                    <div className="text-warm-gray-700 mt-1">
                      {behaviorAnalysis.userProfile.consistencyScore}/100 📊
                    </div>
                  </div>
                </div>
              </div>

              {/* 行为建议 */}
              {behaviorAnalysis.recommendations.length > 0 && (
                <div className="bg-duolingo-pink-subtle rounded-2xl p-4">
                  <h3 className="font-bold text-duolingo-pink mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI 个性化建议
                  </h3>
                  <div className="space-y-2">
                    {behaviorAnalysis.recommendations.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-warm-gray-700">
                        <div className="w-2 h-2 bg-duolingo-pink rounded-full mt-2 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 学习模式分析 */}
              {behaviorAnalysis.learningPatterns.length > 0 && (
                <div className="bg-warm-gray-50 rounded-2xl p-4">
                  <h3 className="font-bold text-warm-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-warm-gray-600" />
                    发现的学习模式
                  </h3>
                  <div className="grid gap-3">
                    {behaviorAnalysis.learningPatterns.slice(0, 2).map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-warm-gray-200">
                        <div>
                          <div className="font-medium text-warm-gray-800">{pattern.pattern}</div>
                          <div className="text-xs text-warm-gray-600 mt-1">{pattern.recommendation}</div>
                        </div>
                        <Badge 
                          className={`${
                            pattern.impact === 'high' ? 'bg-duolingo-green text-white' :
                            pattern.impact === 'medium' ? 'bg-duolingo-orange text-white' :
                            'bg-warm-gray-200 text-warm-gray-700'
                          } border-0`}
                        >
                          {pattern.impact === 'high' ? '高影响' : pattern.impact === 'medium' ? '中影响' : '低影响'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}