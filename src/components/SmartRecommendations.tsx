import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Sparkles, Clock, TrendingUp, Target, Brain, Zap, ThumbsUp, ThumbsDown, Star } from 'lucide-react';

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
  userAnalytics: UserAnalytics;
  userLevel: number;
  currentXP: number;
  availableTime: number; // 用户当前可用时间（分钟）
  onAcceptTask: (taskId: string) => void;
  onRejectTask: (taskId: string, reason?: string) => void;
  onFeedback: (taskId: string, helpful: boolean) => void;
}

export function SmartRecommendations({ 
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

  // 生成智能推荐
  const generateRecommendations = () => {
    setIsGenerating(true);
    
    // 模拟AI分析和推荐生成
    setTimeout(() => {
      const newRecommendations: RecommendedTask[] = [
        {
          id: 'rec_1',
          title: '数学计算练习',
          description: '完成20道四则运算题，提升计算速度',
          category: '学习',
          difficulty: 'easy',
          estimatedTime: 15,
          xp: 50,
          points: 80,
          tags: ['数学', '基础', '练习'],
          reason: '基于你在学习类任务中的出色表现，推荐这个适合你当前水平的数学练习',
          confidence: 92,
          bestTime: '上午9-11点',
        },
        {
          id: 'rec_2',
          title: '户外跑步30分钟',
          description: '在小区或公园进行30分钟有氧跑步',
          category: '运动',
          difficulty: 'medium',
          estimatedTime: 35,
          xp: 80,
          points: 120,
          tags: ['跑步', '有氧', '户外'],
          reason: '你的运动连击需要恢复，现在是下午，适合进行户外运动',
          confidence: 85,
          bestTime: '下午4-6点',
        },
        {
          id: 'rec_3',
          title: '整理书桌',
          description: '清理和整理学习用的书桌，让学习环境更整洁',
          category: '家务',
          difficulty: 'easy',
          estimatedTime: 10,
          xp: 30,
          points: 60,
          tags: ['整理', '清洁', '学习环境'],
          reason: '快速任务，可以在短时间内完成，为后续学习创造良好环境',
          confidence: 78,
          bestTime: '随时',
        },
        {
          id: 'rec_4',
          title: '阅读科普文章',
          description: '阅读一篇有趣的科普文章，拓展知识面',
          category: '阅读',
          difficulty: 'medium',
          estimatedTime: 20,
          xp: 60,
          points: 90,
          tags: ['科普', '知识', '阅读'],
          reason: '你在阅读方面表现优秀，推荐这个能继续提升你阅读技能的任务',
          confidence: 88,
          bestTime: '晚上7-9点',
        },
        {
          id: 'rec_5',
          title: '学习新单词',
          description: '学习并记忆10个新英语单词',
          category: '学习',
          difficulty: 'medium',
          estimatedTime: 25,
          xp: 70,
          points: 100,
          tags: ['英语', '单词', '记忆'],
          reason: '基于你的学习偏好和当前等级，推荐这个能快速提升的语言任务',
          confidence: 90,
          bestTime: '上午8-10点',
        }
      ];

      // 根据用户分析筛选和排序推荐
      const filteredRecommendations = newRecommendations
        .filter(task => task.estimatedTime <= availableTime + 10) // 允许10分钟缓冲
        .sort((a, b) => {
          // 优先推荐用户偏好的类别
          const aPreferred = userAnalytics.preferredCategories.includes(a.category) ? 1 : 0;
          const bPreferred = userAnalytics.preferredCategories.includes(b.category) ? 1 : 0;
          
          if (aPreferred !== bPreferred) return bPreferred - aPreferred;
          
          // 然后按置信度排序
          return b.confidence - a.confidence;
        })
        .slice(0, 4); // 最多显示4个推荐

      setRecommendations(filteredRecommendations);
      setIsGenerating(false);
    }, 1500);
  };

  // 组件加载时生成推荐
  useEffect(() => {
    generateRecommendations();
  }, [userAnalytics, availableTime]);

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
    </div>
  );
}