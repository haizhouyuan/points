import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LearningPathService, 
  PathGenerationConfig, 
  SmartRecommendation,
  LearningPath,
  LearningPathNode
} from '@/services/learning-path.service';

interface LearningPathPlannerProps {
  userId: string;
  userLevel: number;
  onPathSelected: (pathId: string) => void;
}

// 技能选项
const SKILL_OPTIONS = [
  { id: '数学', label: '数学', icon: '🔢', description: '数字运算与逻辑思维' },
  { id: '英语', label: '英语', icon: '🌍', description: '语言交流与表达能力' },
  { id: '阅读', label: '阅读', icon: '📚', description: '阅读理解与分析能力' },
  { id: '科学', label: '科学', icon: '🔬', description: '科学探索与实验能力' },
  { id: '艺术', label: '艺术', icon: '🎨', description: '创意表达与审美能力' },
  { id: '编程', label: '编程', icon: '💻', description: '逻辑编程与问题解决' }
];

// 学习目标选项
const GOAL_OPTIONS = [
  { id: 'mastery', label: '深度掌握', icon: '🎯', description: '全面深入理解知识点' },
  { id: 'certification', label: '考试认证', icon: '🏆', description: '准备相关考试或认证' },
  { id: 'exploration', label: '兴趣探索', icon: '🌟', description: '广泛了解感兴趣的领域' },
  { id: 'project', label: '项目实践', icon: '🚀', description: '通过实际项目应用学习' }
];

export const LearningPathPlanner: React.FC<LearningPathPlannerProps> = ({
  userId,
  userLevel,
  onPathSelected
}) => {
  const [step, setStep] = useState<'config' | 'generating' | 'recommendations' | 'path-details'>('config');
  const [config, setConfig] = useState<PathGenerationConfig>({
    targetSkills: [],
    currentLevel: userLevel,
    availableTimePerWeek: 5,
    preferredDifficulty: 'medium',
    learningGoal: 'mastery'
  });
  const [recommendations, setRecommendations] = useState<SmartRecommendation | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSkillToggle = (skillId: string) => {
    setConfig(prev => ({
      ...prev,
      targetSkills: prev.targetSkills.includes(skillId)
        ? prev.targetSkills.filter(id => id !== skillId)
        : [...prev.targetSkills, skillId]
    }));
  };

  const handleConfigChange = (key: keyof PathGenerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generatePath = async () => {
    if (config.targetSkills.length === 0) {
      setError('请至少选择一个学习技能');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('generating');

    try {
      // 模拟生成时间
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const recommendation = LearningPathService.generateLearningPath(userId, config);
      setRecommendations(recommendation);
      setStep('recommendations');
    } catch (err) {
      setError('路径生成失败，请重试');
      setStep('config');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPath = (pathId: string) => {
    const pathProgress = LearningPathService.getPathProgress(pathId);
    if (pathProgress) {
      setSelectedPath(pathProgress.path);
      setStep('path-details');
    }
  };

  const confirmPath = () => {
    if (selectedPath) {
      onPathSelected(selectedPath.id);
    }
  };

  const resetPlanner = () => {
    setStep('config');
    setConfig({
      targetSkills: [],
      currentLevel: userLevel,
      availableTimePerWeek: 5,
      preferredDifficulty: 'medium',
      learningGoal: 'mastery'
    });
    setRecommendations(null);
    setSelectedPath(null);
    setError(null);
  };

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 头部 */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🧭 智能学习路径规划
          </h2>
          <p className="text-gray-600">
            基于AI算法为你定制最适合的个性化学习路径
          </p>
        </motion.div>

        {/* 进度指示器 */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-4">
            {['config', 'generating', 'recommendations', 'path-details'].map((stepName, index) => {
              const isActive = step === stepName;
              const isCompleted = ['config', 'generating', 'recommendations', 'path-details'].indexOf(step) > index;
              
              return (
                <React.Fragment key={stepName}>
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isActive ? 'bg-duolingo-green text-white' :
                      isCompleted ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}
                    whileScale={isActive ? 1.1 : 1}
                    transition={{ duration: 0.2 }}
                  >
                    {index + 1}
                  </motion.div>
                  {index < 3 && (
                    <div className={`w-12 h-1 ${
                      isCompleted ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* 步骤1：配置学习偏好 */}
        {step === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* 技能选择 */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">📚 选择学习技能</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = config.targetSkills.includes(skill.id);
                  
                  return (
                    <motion.button
                      key={skill.id}
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-duolingo-green bg-green-50 text-duolingo-green' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{skill.icon}</div>
                      <div className="font-semibold">{skill.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{skill.description}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 学习目标 */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 学习目标</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = config.learningGoal === goal.id;
                  
                  return (
                    <motion.button
                      key={goal.id}
                      onClick={() => handleConfigChange('learningGoal', goal.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-duolingo-green bg-green-50 text-duolingo-green' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{goal.icon}</span>
                        <div>
                          <div className="font-semibold">{goal.label}</div>
                          <div className="text-sm text-gray-600">{goal.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 学习配置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 每周可用时间 */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  ⏰ 每周可用时间
                </label>
                <div className="space-y-3">
                  {[
                    { value: 2, label: '2小时 - 轻松学习' },
                    { value: 5, label: '5小时 - 标准节奏' },
                    { value: 10, label: '10小时 - 强化学习' },
                    { value: 15, label: '15小时+ - 密集训练' }
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleConfigChange('availableTimePerWeek', option.value)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        config.availableTimePerWeek === option.value
                          ? 'border-duolingo-green bg-green-50 text-duolingo-green'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 难度偏好 */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  📈 难度偏好
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'easy', label: '简单 - 稳步前进', icon: '🚶' },
                    { value: 'medium', label: '中等 - 平衡挑战', icon: '🏃' },
                    { value: 'hard', label: '困难 - 快速突破', icon: '🏋️' }
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleConfigChange('preferredDifficulty', option.value)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        config.preferredDifficulty === option.value
                          ? 'border-duolingo-green bg-green-50 text-duolingo-green'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* 生成按钮 */}
            <div className="text-center">
              <motion.button
                onClick={generatePath}
                disabled={config.targetSkills.length === 0}
                className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
                  config.targetSkills.length > 0
                    ? 'bg-duolingo-green text-white hover:bg-green-600 shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={config.targetSkills.length > 0 ? { scale: 1.05 } : {}}
                whileTap={config.targetSkills.length > 0 ? { scale: 0.95 } : {}}
              >
                🚀 生成智能学习路径
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 步骤2：生成中 */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <motion.div
              className="w-20 h-20 border-4 border-duolingo-green border-t-transparent rounded-full mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🤖 AI正在分析...</h3>
            <div className="space-y-2 text-gray-600">
              <p>✨ 分析你的学习偏好和能力水平</p>
              <p>🎯 匹配最适合的学习内容</p>
              <p>📊 优化学习路径和时间安排</p>
              <p>🔄 预测学习效果和调整策略</p>
            </div>
          </motion.div>
        )}

        {/* 步骤3：推荐结果 */}
        {step === 'recommendations' && recommendations && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                🎉 为你生成了专属学习路径！
              </h3>
              <p className="text-gray-600">
                置信度: <span className="font-semibold text-duolingo-green">{recommendations.confidence}%</span>
              </p>
            </div>

            {/* 主要推荐路径 */}
            <motion.div
              className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-duolingo-green"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    🌟 推荐路径
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📊 成功率: {recommendations.estimatedSuccessRate}%</span>
                    <span>🔄 适应性: {recommendations.adaptationPotential}%</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => selectPath(recommendations.pathId)}
                  className="bg-duolingo-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  查看详情
                </motion.button>
              </div>

              {/* 推荐理由 */}
              <div className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2">🎯 推荐理由：</h5>
                <div className="space-y-1">
                  {recommendations.reasoning.map((reason, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center text-sm text-gray-700"
                    >
                      <span className="text-green-500 mr-2">✓</span>
                      {reason}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 个性化优势 */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">🌈 个性化优势：</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recommendations.personalizedBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white/50 rounded-lg px-3 py-2 text-sm text-gray-700"
                    >
                      {benefit}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={resetPlanner}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
              >
                重新规划
              </motion.button>
              <motion.button
                onClick={() => selectPath(recommendations.pathId)}
                className="px-8 py-2 bg-duolingo-green text-white rounded-lg hover:bg-green-600"
                whileHover={{ scale: 1.05 }}
              >
                开始学习
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 步骤4：路径详情 */}
        {step === 'path-details' && selectedPath && (
          <motion.div
            key="path-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* 路径概览 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedPath.title}
              </h3>
              <p className="text-gray-600 mb-4">{selectedPath.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{selectedPath.nodes.length}</div>
                  <div className="text-sm text-gray-600">学习节点</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{selectedPath.estimatedTotalTime}h</div>
                  <div className="text-sm text-gray-600">预计时长</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedPath.difficulty === 'beginner' ? '初级' : 
                     selectedPath.difficulty === 'intermediate' ? '中级' : '高级'}
                  </div>
                  <div className="text-sm text-gray-600">难度等级</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{selectedPath.progress}%</div>
                  <div className="text-sm text-gray-600">当前进度</div>
                </div>
              </div>
            </div>

            {/* 学习节点预览 */}
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-4">📋 学习内容预览</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedPath.nodes.slice(0, 6).map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-duolingo-green text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{node.title}</div>
                      <div className="text-sm text-gray-600">{node.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        📚 {node.category} • ⏱️ {node.estimatedDuration}分钟 • 
                        📊 {node.difficulty === 'easy' ? '简单' : 
                            node.difficulty === 'medium' ? '中等' : '困难'}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {selectedPath.nodes.length > 6 && (
                  <div className="text-center text-gray-500 py-2">
                    ... 还有 {selectedPath.nodes.length - 6} 个学习节点
                  </div>
                )}
              </div>
            </div>

            {/* 确认按钮 */}
            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={() => setStep('recommendations')}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
              >
                返回选择
              </motion.button>
              <motion.button
                onClick={confirmPath}
                className="px-8 py-2 bg-duolingo-green text-white rounded-lg hover:bg-green-600 font-semibold"
                whileHover={{ scale: 1.05 }}
              >
                🎯 确认并开始学习
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LearningPathPlanner;
