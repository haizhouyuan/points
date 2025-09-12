import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  AnalyticsService, 
  LearningSession, 
  PerformanceMetrics, 
  SkillProgression, 
  LearningInsight 
} from '../services/analytics.service';
import LearningAnalyticsChart from './LearningAnalyticsChart';
import LearningInsightsPanel from './LearningInsightsPanel';

interface LearningAnalyticsDashboardProps {
  userId: string;
  userStats: {
    currentPoints: number;
    currentXP: number;
    currentLevel: number;
    tasksCompleted: number;
  };
}

// 模拟学习会话数据（实际项目中应从API获取）
const generateMockLearningHistory = (userId: string): LearningSession[] => {
  const sessions: LearningSession[] = [];
  const categories = ['数学', '英语', '阅读', '科学', '艺术'];
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const moods: ('frustrated' | 'neutral' | 'confident' | 'excited')[] = ['frustrated', 'neutral', 'confident', 'excited'];
  const tasks = {
    '数学': ['四则运算', '分数计算', '几何图形', '应用题', '数据统计'],
    '英语': ['单词记忆', '语法练习', '阅读理解', '写作训练', '口语对话'],
    '阅读': ['故事理解', '诗歌赏析', '文章分析', '读书笔记', '经典诵读'],
    '科学': ['实验观察', '现象解释', '科学原理', '探索发现', '科技知识'],
    '艺术': ['绘画创作', '音乐欣赏', '手工制作', '创意设计', '艺术鉴赏']
  };
  
  // 生成最近30天的学习数据
  for (let i = 0; i < 45; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(8 + Math.floor(Math.random() * 12)); // 8-20点之间
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const taskList = tasks[category as keyof typeof tasks];
    const taskTitle = taskList[Math.floor(Math.random() * taskList.length)];
    
    const durationMinutes = 15 + Math.floor(Math.random() * 45); // 15-60分钟
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    // 基于时间段影响表现（模拟黄金时段）
    const hour = date.getHours();
    let basePerformance = 70;
    if (hour >= 9 && hour <= 11) basePerformance = 85; // 上午黄金时段
    if (hour >= 15 && hour <= 17) basePerformance = 80; // 下午较好时段
    if (hour >= 19 && hour <= 21) basePerformance = 75; // 晚上一般时段
    
    // 基于难度调整表现
    const difficultyMultiplier = {
      'easy': 1.1,
      'medium': 1.0,
      'hard': 0.85
    }[difficulty];
    
    const completionRate = Math.max(40, Math.min(100, 
      Math.round(basePerformance * difficultyMultiplier + (Math.random() - 0.5) * 20)
    ));
    
    const focusScore = Math.max(50, Math.min(100,
      Math.round(basePerformance + (Math.random() - 0.5) * 30)
    ));
    
    const errorRate = Math.max(0, Math.min(50,
      Math.round((100 - completionRate) * 0.4 + Math.random() * 10)
    ));
    
    const pointsEarned = Math.round(durationMinutes * difficultyMultiplier * (completionRate / 100) * 2);
    const xpEarned = Math.round(pointsEarned * 0.8);
    
    sessions.push({
      id: `session_${userId}_${i}`,
      userId,
      startTime: date.toISOString(),
      endTime: new Date(date.getTime() + durationMinutes * 60000).toISOString(),
      durationMinutes,
      category,
      taskId: `task_${category}_${i}`,
      taskTitle,
      difficulty,
      pointsEarned,
      xpEarned,
      completionRate,
      focusScore,
      errorRate,
      hintsUsed: Math.floor(Math.random() * 3),
      timeSpentThinking: Math.round(durationMinutes * 0.3 * 60), // 秒
      timeSpentActive: Math.round(durationMinutes * 0.7 * 60), // 秒
      mood: moods[Math.floor(Math.random() * moods.length)],
      energyLevel: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)]
    });
  }
  
  // 将数据记录到分析服务
  sessions.forEach(session => {
    AnalyticsService.recordLearningSession(session);
  });
  
  return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
};

export const LearningAnalyticsDashboard: React.FC<LearningAnalyticsDashboardProps> = ({
  userId,
  userStats
}) => {
  const [learningHistory, setLearningHistory] = useState<LearningSession[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [skillProgression, setSkillProgression] = useState<SkillProgression[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      try {
        // 生成模拟数据（实际项目中从API获取）
        const history = generateMockLearningHistory(userId);
        setLearningHistory(history);
        
        // 分析性能指标
        const metrics = AnalyticsService.analyzePerformanceMetrics(userId);
        setPerformanceMetrics(metrics);
        
        // 分析技能进展
        const skills = AnalyticsService.analyzeSkillProgression(userId);
        setSkillProgression(skills);
        
        // 生成学习洞察
        const insights = AnalyticsService.generateLearningInsights(userId);
        setLearningInsights(insights);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        setIsLoading(false);
      }
    };
    
    loadAnalyticsData();
  }, [userId]);

  const handleInsightAction = (insight: LearningInsight, action: string) => {
    // 处理洞察行动点击
    console.log('执行洞察行动:', insight.title, action);
    // 这里可以集成具体的行动逻辑
  };

  // 准备图表数据
  const prepareChartData = () => {
    if (!performanceMetrics || learningHistory.length === 0) return null;
    
    // 最近7天的学习趋势数据
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      
      const daysSessions = learningHistory.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      const dayAvgScore = daysSessions.length > 0 
        ? Math.round(daysSessions.reduce((sum, s) => sum + s.completionRate, 0) / daysSessions.length)
        : 0;
      
      last7Days.push({
        label: dateStr,
        value: dayAvgScore,
        color: '#58CC02'
      });
    }
    
    // 分类表现数据
    const categoryData = ['数学', '英语', '阅读', '科学', '艺术'].map((category, index) => {
      const categorySessions = learningHistory.filter(s => s.category === category);
      const avgScore = categorySessions.length > 0
        ? Math.round(categorySessions.reduce((sum, s) => sum + s.completionRate, 0) / categorySessions.length)
        : 0;
      
      return {
        label: category,
        value: avgScore,
        color: ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF9CE5'][index]
      };
    });
    
    // 技能雷达图数据
    const skillRadarData = skillProgression.slice(0, 6).map(skill => ({
      label: skill.skillName,
      value: skill.masteryProgress,
      color: '#58CC02'
    }));
    
    // 学习时长热力图数据
    const timeHeatmapData = [];
    for (let hour = 8; hour < 22; hour++) {
      const hourSessions = learningHistory.filter(session => {
        return new Date(session.startTime).getHours() === hour;
      });
      
      timeHeatmapData.push({
        label: `${hour}:00`,
        value: hourSessions.length,
        color: '#1CB0F6'
      });
    }
    
    return {
      trendData: last7Days,
      categoryData,
      skillRadarData,
      timeHeatmapData
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-duolingo-green border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h3 className="text-xl font-semibold text-gray-700">正在分析学习数据...</h3>
          <p className="text-gray-500 mt-2">请稍候，AI正在为你生成个性化洞察</p>
        </motion.div>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <motion.div 
      className="space-y-8 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 仪表板标题 */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📊 学习分析仪表板
          </h1>
          <p className="text-gray-600">
            基于AI分析的个性化学习洞察与建议
          </p>
        </motion.div>
      </div>

      {/* 核心指标卡片 */}
      {performanceMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4 md:p-6 border-2 border-green-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-green-800">
              {performanceMetrics.overall.averageScore}%
            </div>
            <div className="text-sm text-green-700">平均完成率</div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4 md:p-6 border-2 border-blue-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-blue-800">
              {performanceMetrics.overall.consistencyIndex}%
            </div>
            <div className="text-sm text-blue-700">学习一致性</div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-4 md:p-6 border-2 border-orange-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-orange-800">
              {performanceMetrics.overall.optimalSessionLength}min
            </div>
            <div className="text-sm text-orange-700">最佳时长</div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 md:p-6 border-2 border-purple-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-purple-800">
              {performanceMetrics.overall.peakPerformanceTime}
            </div>
            <div className="text-sm text-purple-700">黄金时段</div>
          </motion.div>
        </div>
      )}

      {/* 图表网格 */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* 学习趋势图 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <LearningAnalyticsChart
              type="line"
              data={chartData.trendData}
              title="📈 最近7天学习趋势"
              subtitle="每日平均完成率变化"
              height={300}
              showValues={true}
              animate={true}
            />
          </motion.div>

          {/* 分类表现图 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <LearningAnalyticsChart
              type="bar"
              data={chartData.categoryData}
              title="📊 各分类学习表现"
              subtitle="不同学科平均完成率"
              height={300}
              showValues={true}
              animate={true}
            />
          </motion.div>

          {/* 技能掌握雷达图 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <LearningAnalyticsChart
              type="radar"
              data={chartData.skillRadarData}
              title="🎯 技能掌握程度"
              subtitle="各项技能熟练度评估"
              height={350}
              showValues={true}
              animate={true}
            />
          </motion.div>

          {/* 学习时段热力图 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <LearningAnalyticsChart
              type="heatmap"
              data={chartData.timeHeatmapData}
              title="🕐 学习时段分布"
              subtitle="不同时段学习活跃度"
              height={300}
              showValues={true}
              animate={true}
            />
          </motion.div>
        </div>
      )}

      {/* 学习洞察面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <LearningInsightsPanel
          insights={learningInsights}
          onActionClick={handleInsightAction}
        />
      </motion.div>

      {/* 技能进展详情 */}
      {skillProgression.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🌟 技能发展详情</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillProgression.slice(0, 6).map((skill, index) => (
              <motion.div
                key={skill.skillId}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">{skill.skillName}</h3>
                  <span className="text-sm bg-duolingo-green text-white px-2 py-1 rounded-full">
                    Lv.{skill.currentLevel}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">掌握进度</span>
                    <span className="font-semibold">{skill.masteryProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-duolingo-green h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.masteryProgress}%` }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 1 }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均分数:</span>
                    <span className="font-semibold text-duolingo-green">
                      {skill.averageSessionScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">改进速度:</span>
                    <span className={`font-semibold ${
                      skill.improvementRate > 0 ? 'text-green-600' : 
                      skill.improvementRate < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {skill.improvementRate > 0 ? '+' : ''}{skill.improvementRate}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LearningAnalyticsDashboard;