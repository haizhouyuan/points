import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LearningPathService, 
  LearningPath,
  LearningPathNode,
  PathAdaptation
} from '../services/learning-path.service';

interface LearningPathExecutorProps {
  pathId: string;
  userId: string;
  onPathComplete: () => void;
  onBackToPlanning: () => void;
}

interface NodeProgress {
  nodeId: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  score?: number;
  timeSpent?: number;
  attempts?: number;
}

export const LearningPathExecutor: React.FC<LearningPathExecutorProps> = ({
  pathId,
  userId,
  onPathComplete,
  onBackToPlanning
}) => {
  const [pathProgress, setPathProgress] = useState<any>(null);
  const [currentNode, setCurrentNode] = useState<LearningPathNode | null>(null);
  const [nodeProgresses, setNodeProgresses] = useState<NodeProgress[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [showAdaptation, setShowAdaptation] = useState(false);
  const [latestAdaptation, setLatestAdaptation] = useState<PathAdaptation | null>(null);
  const [learningSessionActive, setLearningSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadPathProgress();
  }, [pathId]);

  const loadPathProgress = () => {
    const progress = LearningPathService.getPathProgress(pathId);
    if (progress) {
      setPathProgress(progress);
      
      // 初始化节点进度
      const progresses: NodeProgress[] = progress.path.nodes.map((node, index) => {
        if (progress.path.completedNodes.includes(node.id)) {
          return { nodeId: node.id, status: 'completed', score: 85 + Math.random() * 15 };
        } else if (node.id === progress.path.currentNodeId) {
          return { nodeId: node.id, status: 'available', attempts: 0 };
        } else {
          // 检查前置条件
          const prerequisitesMet = node.prerequisiteNodes.every(prereq => 
            progress.path.completedNodes.includes(prereq)
          );
          return { 
            nodeId: node.id, 
            status: prerequisitesMet ? 'available' : 'locked',
            attempts: 0
          };
        }
      });
      
      setNodeProgresses(progresses);
      
      // 设置当前节点
      if (progress.path.currentNodeId) {
        const current = progress.path.nodes.find(n => n.id === progress.path.currentNodeId);
        setCurrentNode(current || null);
      }
    }
  };

  const startLearningSession = (node: LearningPathNode) => {
    setCurrentNode(node);
    setIsLearning(true);
    setLearningSessionActive(true);
    setSessionStartTime(new Date());
    
    // 更新节点状态为进行中
    setNodeProgresses(prev => 
      prev.map(p => 
        p.nodeId === node.id 
          ? { ...p, status: 'in-progress' as const }
          : p
      )
    );
  };

  const completeLearningSession = async (success: boolean, score: number = 0) => {
    if (!currentNode || !sessionStartTime) return;
    
    const timeSpent = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60);
    
    // 更新节点进度
    setNodeProgresses(prev => 
      prev.map(p => {
        if (p.nodeId === currentNode.id) {
          const newAttempts = (p.attempts || 0) + 1;
          return {
            ...p,
            status: success && score >= currentNode.masteryThreshold ? 'completed' : 'available',
            score: success ? score : p.score,
            timeSpent: (p.timeSpent || 0) + timeSpent,
            attempts: newAttempts
          };
        }
        return p;
      })
    );

    // 如果成功完成，更新路径进度
    if (success && score >= currentNode.masteryThreshold && pathProgress) {
      const updatedPath = { ...pathProgress.path };
      if (!updatedPath.completedNodes.includes(currentNode.id)) {
        updatedPath.completedNodes.push(currentNode.id);
        updatedPath.progress = Math.round((updatedPath.completedNodes.length / updatedPath.nodes.length) * 100);
        
        // 找到下一个可用节点
        const nextNode = findNextAvailableNode(updatedPath);
        updatedPath.currentNodeId = nextNode?.id || null;
        
        setPathProgress({ ...pathProgress, path: updatedPath });
        
        // 检查是否需要路径适应
        await checkForAdaptation();
        
        // 解锁下一个节点
        unlockNextNodes(updatedPath);
      }
    }

    setIsLearning(false);
    setLearningSessionActive(false);
    setSessionStartTime(null);
    
    // 检查是否完成整个路径
    if (pathProgress && pathProgress.path.progress >= 100) {
      setTimeout(() => onPathComplete(), 1000);
    }
  };

  const findNextAvailableNode = (path: LearningPath): LearningPathNode | null => {
    return path.nodes.find(node => 
      !path.completedNodes.includes(node.id) &&
      node.prerequisiteNodes.every(prereq => path.completedNodes.includes(prereq))
    ) || null;
  };

  const unlockNextNodes = (path: LearningPath) => {
    setNodeProgresses(prev => 
      prev.map(p => {
        const node = path.nodes.find(n => n.id === p.nodeId);
        if (node && p.status === 'locked') {
          const prerequisitesMet = node.prerequisiteNodes.every(prereq => 
            path.completedNodes.includes(prereq)
          );
          return prerequisitesMet ? { ...p, status: 'available' as const } : p;
        }
        return p;
      })
    );
  };

  const checkForAdaptation = async () => {
    // 模拟检查适应性调整
    const shouldAdapt = Math.random() < 0.3; // 30% 概率触发适应
    
    if (shouldAdapt && pathProgress) {
      const mockPerformance = [{
        id: 'mock_session',
        userId,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: 30,
        category: currentNode?.category || 'general',
        taskId: currentNode?.id || 'mock',
        taskTitle: currentNode?.title || 'Mock Task',
        difficulty: currentNode?.difficulty || 'medium',
        pointsEarned: 50,
        xpEarned: 40,
        completionRate: 75,
        focusScore: 80,
        errorRate: 20,
        hintsUsed: 2,
        timeSpentThinking: 600,
        timeSpentActive: 1200,
        mood: 'confident' as const,
        energyLevel: 'medium' as const
      }];

      const adaptation = LearningPathService.adaptLearningPath(pathId, mockPerformance);
      
      if (adaptation) {
        setLatestAdaptation(adaptation);
        setShowAdaptation(true);
        
        // 重新加载路径进度以反映适应性更改
        setTimeout(() => {
          loadPathProgress();
        }, 2000);
      }
    }
  };

  const getNodeStatusColor = (status: NodeProgress['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'in-progress': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'available': return 'bg-white border-gray-300 text-gray-800 hover:border-duolingo-green';
      case 'locked': return 'bg-gray-50 border-gray-200 text-gray-400';
      default: return 'bg-white border-gray-300 text-gray-800';
    }
  };

  const getNodeStatusIcon = (status: NodeProgress['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'available': return '🎯';
      case 'locked': return '🔒';
      default: return '⭕';
    }
  };

  if (!pathProgress) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <div className="text-gray-600">加载学习路径中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 路径头部信息 */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {pathProgress.path.title}
            </h2>
            <p className="text-gray-600">{pathProgress.path.description}</p>
          </div>
          <motion.button
            onClick={onBackToPlanning}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-white/50"
            whileHover={{ scale: 1.05 }}
          >
            🔙 返回规划
          </motion.button>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>整体进度</span>
            <span>{pathProgress.currentProgress}% ({pathProgress.path.completedNodes.length}/{pathProgress.path.nodes.length})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-duolingo-green to-green-400 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pathProgress.currentProgress}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{pathProgress.estimatedTimeRemaining}</div>
            <div className="text-sm text-gray-600">剩余时间(分钟)</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">
              {pathProgress.path.adaptationHistory.length}
            </div>
            <div className="text-sm text-gray-600">智能调整次数</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">
              {pathProgress.nextRecommendations.length}
            </div>
            <div className="text-sm text-gray-600">推荐节点数</div>
          </div>
        </div>
      </motion.div>

      {/* 学习节点网格 */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 学习路径</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pathProgress.path.nodes.map((node: LearningPathNode, index: number) => {
            const progress = nodeProgresses.find(p => p.nodeId === node.id);
            const isCurrentNode = pathProgress.path.currentNodeId === node.id;
            
            return (
              <motion.div
                key={node.id}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  getNodeStatusColor(progress?.status || 'locked')
                } ${isCurrentNode ? 'ring-2 ring-duolingo-green ring-opacity-50' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={progress?.status === 'available' ? { scale: 1.02 } : {}}
                onClick={() => {
                  if (progress?.status === 'available' && !learningSessionActive) {
                    startLearningSession(node);
                  }
                }}
              >
                {/* 节点编号和状态 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-semibold border">
                    {index + 1}
                  </div>
                  <div className="text-xl">
                    {getNodeStatusIcon(progress?.status || 'locked')}
                  </div>
                </div>

                {/* 节点信息 */}
                <h4 className="font-bold mb-2">{node.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {node.description}
                </p>

                {/* 节点详情 */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>类别:</span>
                    <span className="font-medium">{node.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>时长:</span>
                    <span className="font-medium">{node.estimatedDuration}分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span>难度:</span>
                    <span className="font-medium">
                      {node.difficulty === 'easy' ? '简单' : 
                       node.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                  </div>
                  {progress?.score && (
                    <div className="flex justify-between text-green-600">
                      <span>得分:</span>
                      <span className="font-medium">{Math.round(progress.score)}%</span>
                    </div>
                  )}
                </div>

                {/* 当前节点指示器 */}
                {isCurrentNode && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-duolingo-green text-white rounded-full flex items-center justify-center text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    ⭐
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 推荐建议 */}
      {pathProgress.adaptationSuggestions.length > 0 && (
        <motion.div
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-bold text-gray-800 mb-2">💡 智能建议</h4>
          <div className="space-y-1">
            {pathProgress.adaptationSuggestions.map((suggestion: string, index: number) => (
              <div key={index} className="text-sm text-gray-700">
                • {suggestion}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 学习会话模态框 */}
      <AnimatePresence>
        {isLearning && currentNode && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  📚 学习中: {currentNode.title}
                </h3>
                <p className="text-gray-600">{currentNode.description}</p>
              </div>

              {/* 模拟学习内容 */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center text-4xl">
                      📖
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      正在学习 <strong>{currentNode.category}</strong> 相关内容...
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>⏱️ 预计用时: {currentNode.estimatedDuration} 分钟</div>
                      <div>🎯 掌握目标: {currentNode.masteryThreshold}%</div>
                      <div>📊 认知负荷: {currentNode.cognitiveLoad}/5</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 学习资源 */}
              {currentNode.resources.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">📚 学习资源</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentNode.resources.map((resource, index) => (
                      <div key={resource.id} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{resource.title}</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {resource.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          ⏱️ {resource.duration}分钟 • 
                          ⭐ 效果: {resource.effectiveness}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 完成按钮 */}
              <div className="flex justify-center space-x-4">
                <motion.button
                  onClick={() => setIsLearning(false)}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  whileHover={{ scale: 1.05 }}
                >
                  暂停学习
                </motion.button>
                <motion.button
                  onClick={() => {
                    const score = 75 + Math.random() * 25; // 模拟分数
                    completeLearningSession(true, score);
                  }}
                  className="px-8 py-2 bg-duolingo-green text-white rounded-lg hover:bg-green-600 font-semibold"
                  whileHover={{ scale: 1.05 }}
                >
                  完成学习
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 适应性调整通知 */}
      <AnimatePresence>
        {showAdaptation && latestAdaptation && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🤖</div>
                <h3 className="text-xl font-bold text-gray-800">AI智能调整</h3>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 text-center">
                  {latestAdaptation.reason}
                </p>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <div className="space-y-1">
                  {latestAdaptation.changes.added.length > 0 && (
                    <div>✅ 新增内容: {latestAdaptation.changes.added.length} 项</div>
                  )}
                  {latestAdaptation.changes.modified.length > 0 && (
                    <div>🔄 调整内容: {latestAdaptation.changes.modified.length} 项</div>
                  )}
                  {latestAdaptation.changes.removed.length > 0 && (
                    <div>➖ 移除内容: {latestAdaptation.changes.removed.length} 项</div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <motion.button
                  onClick={() => setShowAdaptation(false)}
                  className="px-6 py-2 bg-duolingo-green text-white rounded-lg hover:bg-green-600"
                  whileHover={{ scale: 1.05 }}
                >
                  了解了
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningPathExecutor;