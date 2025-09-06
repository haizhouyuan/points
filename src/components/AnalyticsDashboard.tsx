import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  Target, 
  Calendar,
  Clock,
  Award,
  Zap,
  Brain,
  Heart,
  Star,
  Trophy,
  Flame,
  BookOpen,
  Dumbbell,
  Home,
  Palette,
  Users,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    currentStreak: number;
    averageScore: number;
    weeklyGrowth: number;
  };
  timeAnalysis: {
    daily: Array<{
      date: string;
      tasks: number;
      points: number;
      xp: number;
      streak: number;
    }>;
    weekly: Array<{
      week: string;
      tasks: number;
      points: number;
      averageTime: number;
      efficiency: number;
    }>;
    monthly: Array<{
      month: string;
      tasks: number;
      points: number;
      growth: number;
    }>;
  };
  categoryAnalysis: {
    performance: Array<{
      category: string;
      completed: number;
      total: number;
      averageScore: number;
      timeSpent: number;
      color: string;
    }>;
    preferences: Array<{
      category: string;
      value: number;
      color: string;
    }>;
  };
  skillAnalysis: {
    strengths: string[];
    improvements: string[];
    radar: Array<{
      skill: string;
      current: number;
      potential: number;
    }>;
  };
  habitsAnalysis: {
    streaks: Array<{
      habit: string;
      current: number;
      longest: number;
      consistency: number;
    }>;
    patterns: Array<{
      time: string;
      activity: number;
    }>;
  };
  predictions: {
    nextWeekPoints: number;
    levelUpDate: string;
    recommendedGoals: Array<{
      goal: string;
      probability: number;
      impact: string;
    }>;
  };
}

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData;
  currentPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

const COLORS = {
  primary: '#58CC02',
  secondary: '#1CB0F6',
  accent: '#FF9600',
  purple: '#CE82FF',
  pink: '#FF9CE5',
  yellow: '#FFC800',
  red: '#FF4757',
  gray: '#78716C'
};

export function AnalyticsDashboard({
  analyticsData,
  currentPeriod,
  onPeriodChange
}: AnalyticsDashboardProps) {
  const [currentTab, setCurrentTab] = useState('overview');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-duolingo-green" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-warm-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-duolingo-green';
    if (value < 0) return 'text-red-500';
    return 'text-warm-gray-500';
  };

  const StatCard = ({ 
    title, 
    value, 
    trend, 
    icon: Icon, 
    color = 'duolingo-green',
    suffix = '',
    description 
  }: {
    title: string;
    value: string | number;
    trend?: number;
    icon: any;
    color?: string;
    suffix?: string;
    description?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`bg-gradient-to-br from-${color}-subtle to-white border-3 border-${color}/20 shadow-xl shadow-${color}/10 rounded-[1.5rem] overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-warm-gray-600 mb-1">{title}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black text-${color}`}>
                  {value}{suffix}
                </span>
                {trend !== undefined && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(trend)}
                    <span className={`text-sm font-bold ${getTrendColor(trend)}`}>
                      {Math.abs(trend)}%
                    </span>
                  </div>
                )}
              </div>
              {description && (
                <p className="text-xs text-warm-gray-500 mt-1">{description}</p>
              )}
            </div>
            <div className={`p-3 bg-${color}/20 rounded-xl`}>
              <Icon className={`w-8 h-8 text-${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* 🎨 Duolingo风格头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className="bg-gradient-to-br from-duolingo-blue-subtle via-white to-duolingo-purple-subtle border-4 border-duolingo-blue/30 shadow-2xl shadow-duolingo-blue/20 rounded-[2rem] overflow-hidden">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-duolingo-blue/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-duolingo-purple/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-duolingo-yellow/20 rounded-full -translate-x-8 -translate-y-8"></div>
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="text-5xl"
                >
                  📊
                </motion.div>
                <div>
                  <CardTitle className="text-3xl font-black bg-gradient-to-r from-duolingo-blue to-duolingo-purple bg-clip-text text-transparent">
                    数据洞察中心
                  </CardTitle>
                  <p className="text-warm-gray-600 text-lg mt-1">
                    深入了解学习进展，发现成长规律
                  </p>
                </div>
              </div>
              
              {/* 时间周期选择器 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-warm-gray-600">时间周期:</span>
                <Select value={currentPeriod} onValueChange={onPeriodChange}>
                  <SelectTrigger className="w-32 rounded-xl border-2 border-duolingo-blue/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">本周</SelectItem>
                    <SelectItem value="month">本月</SelectItem>
                    <SelectItem value="year">本年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* 🎯 导航标签页 */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-white via-warm-gray-50 to-white shadow-xl rounded-[2rem] p-2 border-4 border-duolingo-blue-subtle">
          <TabsTrigger 
            value="overview" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-green data-[state=active]:to-duolingo-green-light data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex flex-col items-center gap-1" whileHover={{ scale: 1.05 }}>
              <Activity className="w-4 h-4" />
              <span className="text-xs">总览</span>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-orange data-[state=active]:to-duolingo-orange-light data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex flex-col items-center gap-1" whileHover={{ scale: 1.05 }}>
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">表现</span>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-blue data-[state=active]:to-duolingo-blue-light data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex flex-col items-center gap-1" whileHover={{ scale: 1.05 }}>
              <PieChartIcon className="w-4 h-4" />
              <span className="text-xs">分类</span>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="skills" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-purple data-[state=active]:to-duolingo-pink data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex flex-col items-center gap-1" whileHover={{ scale: 1.05 }}>
              <Brain className="w-4 h-4" />
              <span className="text-xs">技能</span>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="habits" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-pink data-[state=active]:to-duolingo-purple data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex flex-col items-center gap-1" whileHover={{ scale: 1.05 }}>
              <Flame className="w-4 h-4" />
              <span className="text-xs">习惯</span>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="predictions" 
            className="rounded-[1.5rem] font-bold py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-duolingo-yellow data-[state=active]:to-duolingo-orange data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <motion.div className="flex flex-col items-center gap-1" whileHover={{ scale: 1.05 }}>
              <Eye className="w-4 h-4" />
              <span className="text-xs">预测</span>
            </motion.div>
          </TabsTrigger>
        </TabsList>

        {/* 总览页面 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="完成任务"
              value={analyticsData.overview.completedTasks}
              trend={12}
              icon={Target}
              color="duolingo-green"
              suffix="个"
              description="本周新增3个"
            />
            <StatCard
              title="获得积分"
              value={analyticsData.overview.totalPoints}
              trend={8}
              icon={Star}
              color="duolingo-orange"
              suffix="分"
              description="超越85%的用户"
            />
            <StatCard
              title="连续天数"
              value={analyticsData.overview.currentStreak}
              trend={-2}
              icon={Flame}
              color="duolingo-blue"
              suffix="天"
              description="保持良好势头"
            />
            <StatCard
              title="平均分数"
              value={analyticsData.overview.averageScore}
              trend={15}
              icon={Trophy}
              color="duolingo-purple"
              suffix="%"
              description="持续进步中"
            />
          </div>

          {/* 趋势图表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border-3 border-duolingo-green/20 shadow-xl rounded-[1.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-warm-gray-800">
                  📈 学习趋势分析
                </CardTitle>
                <div className="flex gap-2">
                  {(['bar', 'line'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={chartType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType(type)}
                      className="rounded-lg"
                    >
                      {type === 'bar' ? <BarChart3 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={analyticsData.timeAnalysis.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasks" fill={COLORS.primary} name="完成任务" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="points" fill={COLORS.accent} name="获得积分" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={analyticsData.timeAnalysis.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="tasks" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 6 }} />
                        <Line type="monotone" dataKey="points" stroke={COLORS.accent} strokeWidth={3} dot={{ r: 6 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* 表现分析页面 */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 周表现对比 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-white border-3 border-duolingo-orange/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800">
                    📊 周表现对比
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.timeAnalysis.weekly}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="efficiency" fill={COLORS.secondary} name="效率%" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 时间分布 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-white border-3 border-duolingo-purple/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800">
                    ⏰ 活跃时间分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.habitsAnalysis.patterns}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="activity" stroke={COLORS.purple} strokeWidth={4} dot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* 分类分析页面 */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 类别偏好分布 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-white border-3 border-duolingo-blue/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800">
                    🎯 类别偏好分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.categoryAnalysis.preferences}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.categoryAnalysis.preferences.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 类别表现详情 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white border-3 border-duolingo-green/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800">
                    📈 类别表现详情
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.categoryAnalysis.performance.map((category, index) => {
                    const completionRate = (category.completed / category.total) * 100;
                    const categoryIcons: { [key: string]: string } = {
                      '学习': '📚',
                      '运动': '🏃',
                      '家务': '🏠',
                      '创意': '🎨',
                      '社交': '👥'
                    };
                    
                    return (
                      <motion.div
                        key={category.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-warm-gray-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{categoryIcons[category.category] || '⭐'}</span>
                            <div>
                              <p className="font-bold text-warm-gray-800">{category.category}</p>
                              <p className="text-sm text-warm-gray-600">
                                {category.completed}/{category.total} 完成
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-duolingo-green">{completionRate.toFixed(0)}%</p>
                            <p className="text-xs text-warm-gray-500">完成率</p>
                          </div>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* 技能分析页面 */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 技能雷达图 */}
            <motion.div
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
            >
              <Card className="bg-white border-3 border-duolingo-purple/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800">
                    🎯 技能能力雷达
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analyticsData.skillAnalysis.radar}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name="当前水平" dataKey="current" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} strokeWidth={3} />
                        <Radar name="潜在能力" dataKey="potential" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 优势与改进 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* 优势技能 */}
              <Card className="bg-gradient-to-br from-duolingo-green-subtle to-white border-3 border-duolingo-green/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-duolingo-green flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    优势技能
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.skillAnalysis.strengths.map((strength, index) => (
                      <motion.div
                        key={strength}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 p-2 bg-duolingo-green-subtle rounded-lg"
                      >
                        <Trophy className="w-4 h-4 text-duolingo-green" />
                        <span className="font-semibold text-warm-gray-800">{strength}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 待改进技能 */}
              <Card className="bg-gradient-to-br from-duolingo-orange-subtle to-white border-3 border-duolingo-orange/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-duolingo-orange flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    改进机会
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.skillAnalysis.improvements.map((improvement, index) => (
                      <motion.div
                        key={improvement}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 p-2 bg-duolingo-orange-subtle rounded-lg"
                      >
                        <Zap className="w-4 h-4 text-duolingo-orange" />
                        <span className="font-semibold text-warm-gray-800">{improvement}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* 习惯分析页面 */}
        <TabsContent value="habits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {analyticsData.habitsAnalysis.streaks.map((streak, index) => (
              <motion.div
                key={streak.habit}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-duolingo-pink-subtle to-white border-3 border-duolingo-pink/20 shadow-xl rounded-[1.5rem]">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-warm-gray-800 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-duolingo-pink" />
                      {streak.habit}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-duolingo-pink-subtle rounded-xl">
                        <p className="text-2xl font-black text-duolingo-pink">{streak.current}</p>
                        <p className="text-xs text-warm-gray-600">当前连击</p>
                      </div>
                      <div className="text-center p-3 bg-duolingo-orange-subtle rounded-xl">
                        <p className="text-2xl font-black text-duolingo-orange">{streak.longest}</p>
                        <p className="text-xs text-warm-gray-600">最长连击</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-warm-gray-700">一致性</span>
                        <span className="text-sm font-bold text-duolingo-green">{streak.consistency}%</span>
                      </div>
                      <Progress value={streak.consistency} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 预测页面 */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 预测指标 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-duolingo-yellow-subtle to-white border-3 border-duolingo-yellow/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-duolingo-yellow" />
                    智能预测
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-duolingo-green-subtle rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warm-gray-700">下周预计积分</span>
                      <span className="text-2xl font-black text-duolingo-green">
                        +{analyticsData.predictions.nextWeekPoints}
                      </span>
                    </div>
                    <p className="text-sm text-warm-gray-600 mt-1">基于当前学习趋势</p>
                  </div>
                  
                  <div className="p-4 bg-duolingo-blue-subtle rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warm-gray-700">预计升级时间</span>
                      <span className="text-lg font-bold text-duolingo-blue">
                        {analyticsData.predictions.levelUpDate}
                      </span>
                    </div>
                    <p className="text-sm text-warm-gray-600 mt-1">保持当前进度</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 推荐目标 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-duolingo-purple-subtle to-white border-3 border-duolingo-purple/20 shadow-xl rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-warm-gray-800 flex items-center gap-2">
                    <Target className="w-5 h-5 text-duolingo-purple" />
                    推荐目标
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analyticsData.predictions.recommendedGoals.map((goal, index) => (
                    <motion.div
                      key={goal.goal}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-white rounded-xl border-2 border-duolingo-purple/20 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-warm-gray-800">{goal.goal}</span>
                        <Badge className={`${
                          goal.impact === 'high' ? 'bg-duolingo-green text-white' :
                          goal.impact === 'medium' ? 'bg-duolingo-orange text-white' :
                          'bg-warm-gray-500 text-white'
                        }`}>
                          {goal.probability}%
                        </Badge>
                      </div>
                      <p className="text-sm text-warm-gray-600 mt-1">
                        {goal.impact === 'high' ? '高影响' : goal.impact === 'medium' ? '中等影响' : '低影响'}
                      </p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}