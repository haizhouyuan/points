import React from 'react';
import { motion } from 'motion/react';
import { LearningInsight } from '../services/analytics.service';

interface LearningInsightsPanelProps {
  insights: LearningInsight[];
  onActionClick?: (insight: LearningInsight, action: string) => void;
}

// 洞察类型图标映射
const INSIGHT_ICONS = {
  strength: '💪',
  improvement: '📈',
  pattern: '🔍',
  prediction: '🔮',
  recommendation: '💡'
};

// 影响级别样式
const IMPACT_STYLES = {
  high: {
    bgColor: 'from-red-100 to-red-200',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    accentColor: 'bg-red-500'
  },
  medium: {
    bgColor: 'from-yellow-100 to-yellow-200',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    accentColor: 'bg-yellow-500'
  },
  low: {
    bgColor: 'from-blue-100 to-blue-200',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    accentColor: 'bg-blue-500'
  }
};

export const LearningInsightsPanel: React.FC<LearningInsightsPanelProps> = ({
  insights,
  onActionClick
}) => {
  if (!insights || insights.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">暂无学习洞察</h3>
        <p className="text-gray-500">完成更多学习任务后，我将为你提供个性化的学习分析！</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📈 学习洞察分析</h2>
        <div className="text-sm text-gray-500">
          基于最近30天学习数据分析
        </div>
      </div>

      {insights.map((insight, index) => {
        const impactStyle = IMPACT_STYLES[insight.impact];
        const icon = INSIGHT_ICONS[insight.type];
        
        return (
          <motion.div
            key={insight.id}
            className={`
              bg-gradient-to-br ${impactStyle.bgColor}
              border-2 ${impactStyle.borderColor}
              rounded-2xl p-6 shadow-lg relative overflow-hidden
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* 背景装饰 */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div className={`w-full h-full rounded-full ${impactStyle.accentColor}`}></div>
            </div>
            
            {/* 顶部标识 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{icon}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-lg font-bold ${impactStyle.textColor}`}>
                      {insight.title}
                    </h3>
                    {/* 影响级别标识 */}
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                      ${impactStyle.accentColor} text-white
                    `}>
                      {insight.impact}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {insight.type === 'strength' && '优势发现'}
                    {insight.type === 'improvement' && '改进建议'}
                    {insight.type === 'pattern' && '模式识别'}
                    {insight.type === 'prediction' && '趋势预测'}
                    {insight.type === 'recommendation' && '智能推荐'}
                  </div>
                </div>
              </div>
              
              {/* 置信度指示器 */}
              <div className="flex flex-col items-end">
                <div className="text-xs text-gray-600 mb-1">置信度</div>
                <div className="flex items-center space-x-1">
                  <div className="w-16 h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${impactStyle.accentColor} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${insight.confidence}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {insight.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* 描述内容 */}
            <p className={`${impactStyle.textColor} mb-4 leading-relaxed`}>
              {insight.description}
            </p>

            {/* 相关技能标签 */}
            {insight.relatedSkills && insight.relatedSkills.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-600 mb-2">相关技能：</div>
                <div className="flex flex-wrap gap-2">
                  {insight.relatedSkills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-2 py-1 bg-white bg-opacity-70 rounded-full text-xs font-medium text-gray-700"
                    >
                      🎯 {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 可执行行动 */}
            {insight.actionable && insight.actions && insight.actions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white border-opacity-30">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  💡 建议行动：
                </div>
                <div className="space-y-2">
                  {insight.actions.map((action, actionIndex) => (
                    <motion.button
                      key={actionIndex}
                      className={`
                        w-full text-left p-3 rounded-xl bg-white bg-opacity-50
                        hover:bg-opacity-80 transition-all duration-200
                        border border-white border-opacity-30
                        text-sm ${impactStyle.textColor}
                        hover:shadow-md hover:scale-[1.02]
                      `}
                      onClick={() => onActionClick?.(insight, action)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">✅</span>
                        <span className="flex-1">{action}</span>
                        <span className="text-xs opacity-70">点击执行</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 生成时间 */}
            <div className="mt-4 pt-2 border-t border-white border-opacity-20">
              <div className="text-xs text-gray-600">
                🕒 生成时间: {new Date(insight.generatedAt).toLocaleString('zh-CN')}
              </div>
            </div>

            {/* 特殊效果 - 高影响力洞察 */}
            {insight.impact === 'high' && (
              <div className="absolute top-2 right-2">
                <motion.div
                  className="w-3 h-3 bg-red-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </div>
            )}
          </motion.div>
        );
      })}

      {/* 底部总结 */}
      <motion.div 
        className="bg-gradient-to-r from-duolingo-green-subtle to-duolingo-blue-subtle rounded-2xl p-6 border border-duolingo-green/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: insights.length * 0.1 + 0.3, duration: 0.5 }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-2xl">🎯</div>
          <h3 className="text-lg font-bold text-duolingo-green-dark">
            智能分析总结
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-duolingo-green">
              {insights.filter(i => i.type === 'strength').length}
            </div>
            <div className="text-sm text-gray-600">发现优势</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-duolingo-orange">
              {insights.filter(i => i.type === 'improvement').length}
            </div>
            <div className="text-sm text-gray-600">改进机会</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-duolingo-blue">
              {insights.filter(i => i.actionable).reduce((sum, i) => sum + (i.actions?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">可执行行动</div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-700 bg-white bg-opacity-50 rounded-xl p-3">
          <strong>💡 学习建议：</strong>
          {insights.filter(i => i.impact === 'high').length > 0 
            ? "重点关注高影响力的洞察，这些将对你的学习效果产生显著提升。"
            : "保持当前的学习节奏，继续积累数据以获得更精准的个性化建议。"
          }
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearningInsightsPanel;