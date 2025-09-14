import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Heart, Clock, Zap, RefreshCw, AlertTriangle, Shield } from 'lucide-react';

interface LifeSystemProps {
  currentHearts: number;
  maxHearts: number;
  heartRegenTime: number; // 分钟
  lastRegenTime: string;
  userPoints: number;
  onBuyHearts: (cost: number) => void;
  onWatchAd?: () => void; // 可选的看广告恢复
}

export function LifeSystem({ 
  currentHearts, 
  maxHearts, 
  heartRegenTime, 
  lastRegenTime,
  userPoints,
  onBuyHearts,
  onWatchAd 
}: LifeSystemProps) {
  const [timeToNextHeart, setTimeToNextHeart] = useState<number>(0);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showLowHeartsWarning, setShowLowHeartsWarning] = useState(false);

  // 计算下一颗爱心恢复时间
  useEffect(() => {
    const updateTimer = () => {
      if (currentHearts >= maxHearts) {
        setTimeToNextHeart(0);
        return;
      }

      const lastRegen = new Date(lastRegenTime);
      const now = new Date();
      const timeSinceLastRegen = now.getTime() - lastRegen.getTime();
      const timeForNextHeart = heartRegenTime * 60 * 1000; // 转换为毫秒
      const remaining = timeForNextHeart - (timeSinceLastRegen % timeForNextHeart);
      
      setTimeToNextHeart(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentHearts, maxHearts, heartRegenTime, lastRegenTime]);

  // 低生命值警告
  useEffect(() => {
    if (currentHearts <= 1 && currentHearts > 0) {
      setShowLowHeartsWarning(true);
    }
  }, [currentHearts]);

  // 格式化时间显示
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 爱心购买选项
  const heartPackages = [
    { hearts: 1, cost: 50, popular: false },
    { hearts: 3, cost: 120, popular: true },
    { hearts: 5, cost: 180, popular: false },
    { hearts: 'full', cost: 250, popular: false }
  ];

  // 处理购买爱心
  const handleBuyHearts = (cost: number, hearts: number | string) => {
    if (userPoints < cost) {
      toast.error('积分不足！继续完成任务获得更多积分吧 💪');
      return;
    }

    onBuyHearts(cost);
    setShowBuyDialog(false);
    
    const heartCount = hearts === 'full' ? maxHearts : hearts;
    toast.success(
      `💝 爱心已补充！`,
      {
        description: `${hearts === 'full' ? '爱心已满' : `+${heartCount} 爱心`}`,
        duration: 4000,
      }
    );
  };

  // 处理看广告恢复
  const handleWatchAd = () => {
    if (onWatchAd) {
      onWatchAd();
      toast.success('看广告获得 +1 爱心！感谢支持 🎬');
    }
  };

  // 获取爱心显示状态
  const getHeartDisplay = () => {
    const hearts = [];
    for (let i = 0; i < maxHearts; i++) {
      const isActive = i < currentHearts;
      hearts.push(
        <motion.div
          key={i}
          className={`text-4xl ${isActive ? 'text-red-500' : 'text-gray-300'}`}
          animate={isActive ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
        >
          ❤️
        </motion.div>
      );
    }
    return hearts;
  };

  // 获取生命值状态颜色
  const getLifeStatusColor = () => {
    const percentage = (currentHearts / maxHearts) * 100;
    if (percentage <= 20) return 'duolingo-orange'; // 危险
    if (percentage <= 50) return 'duolingo-yellow'; // 警告
    return 'duolingo-green'; // 安全
  };

  const getLifeStatusText = () => {
    const percentage = (currentHearts / maxHearts) * 100;
    if (percentage === 0) return '生命值耗尽';
    if (percentage <= 20) return '生命值危险';
    if (percentage <= 50) return '生命值偏低';
    return '生命值充足';
  };

  return (
    <div className="space-y-4">
      {/* 🫀 生命系统主卡片 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Card className="bg-gradient-to-br from-red-50 via-pink-50 to-red-50 border-4 border-red-200 shadow-2xl shadow-red-200/40 rounded-[2rem] overflow-hidden relative">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200/40 rounded-full translate-y-8 -translate-x-8"></div>
          
          <CardHeader className="relative z-10 pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: currentHearts <= 1 ? [1, 1.3, 1] : 1,
                    rotate: currentHearts === 0 ? [0, -10, 10, -10, 0] : 0
                  }}
                  transition={{ 
                    duration: currentHearts <= 1 ? 1 : 0,
                    repeat: currentHearts <= 1 ? Infinity : 0 
                  }}
                  className="text-3xl"
                >
                  💖
                </motion.div>
                <div>
                  <span className="text-xl font-black text-warm-gray-800">生命值</span>
                  <Badge 
                    className={`ml-2 bg-${getLifeStatusColor()} text-white font-semibold px-2 py-1 rounded-full`}
                  >
                    {getLifeStatusText()}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentHearts < maxHearts && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBuyDialog(true)}
                    className="bg-red-100 border-red-300 hover:bg-red-200 text-red-700 font-semibold rounded-xl"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    补充
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-4">
            {/* 爱心显示 */}
            <div className="flex justify-center items-center gap-2 py-4">
              {getHeartDisplay()}
            </div>

            {/* 生命值信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-3 text-center border-2 border-red-200">
                <div className="text-2xl font-black text-red-500">
                  {currentHearts}
                </div>
                <div className="text-sm text-warm-gray-600 font-semibold">当前生命</div>
              </div>
              
              <div className="bg-white rounded-xl p-3 text-center border-2 border-pink-200">
                <div className="text-2xl font-black text-pink-500">
                  {maxHearts}
                </div>
                <div className="text-sm text-warm-gray-600 font-semibold">最大生命</div>
              </div>
            </div>

            {/* 恢复时间显示 */}
            {currentHearts < maxHearts && timeToNextHeart > 0 && (
              <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-warm-gray-700">下一颗爱心</span>
                  </div>
                  <div className="font-bold text-blue-500 text-lg">
                    {formatTime(timeToNextHeart)}
                  </div>
                </div>
                
                <div className="mt-2">
                  <Progress 
                    value={((heartRegenTime * 60 * 1000 - timeToNextHeart) / (heartRegenTime * 60 * 1000)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}

            {/* 满血状态 */}
            {currentHearts === maxHearts && (
              <motion.div
                className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-300 text-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-700">生命值已满！准备挑战更多任务吧！</span>
                </div>
              </motion.div>
            )}

            {/* 免费恢复选项 */}
            {currentHearts < maxHearts && onWatchAd && (
              <Button
                onClick={handleWatchAd}
                variant="outline"
                className="w-full bg-yellow-50 border-yellow-300 hover:bg-yellow-100 text-yellow-700 font-semibold rounded-xl py-3"
              >
                📺 看广告获得 +1 爱心 (免费)
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 购买爱心对话框 */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-4 border-red-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Heart className="w-6 h-6 text-red-500" />
              补充生命值
            </DialogTitle>
            <DialogDescription className="text-base">
              使用积分立即恢复生命值，继续你的学习之旅！
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {heartPackages.map((pkg, index) => {
              const heartsToAdd = pkg.hearts === 'full' ? maxHearts - currentHearts : pkg.hearts as number;
              const finalHearts = pkg.hearts === 'full' ? maxHearts : Math.min(currentHearts + (pkg.hearts as number), maxHearts);
              
              return (
                <motion.div
                  key={index}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                    pkg.popular
                      ? 'border-duolingo-orange bg-duolingo-orange-subtle shadow-lg'
                      : 'border-warm-gray-200 hover:border-warm-gray-300'
                  }`}
                  onClick={() => handleBuyHearts(pkg.cost, pkg.hearts)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-duolingo-orange text-white font-bold">
                      推荐
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {Array(Math.min(pkg.hearts === 'full' ? 5 : pkg.hearts as number, 5)).fill(0).map((_, i) => (
                          <span key={i} className="text-xl">❤️</span>
                        ))}
                        {pkg.hearts === 'full' && <span className="text-xl">✨</span>}
                      </div>
                      <div>
                        <div className="font-bold text-lg">
                          {pkg.hearts === 'full' ? '满血恢复' : `+${pkg.hearts} 爱心`}
                        </div>
                        <div className="text-sm text-warm-gray-500">
                          恢复到 {finalHearts}/{maxHearts}
                        </div>
                      </div>
                    </div>
                    <div className={`font-black text-xl ${userPoints >= pkg.cost ? 'text-duolingo-green' : 'text-warm-gray-400'}`}>
                      {pkg.cost} 积分
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-warm-gray-500">
                你的积分: {userPoints.toLocaleString()}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowBuyDialog(false)}
                className="rounded-xl"
              >
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 低生命值警告 */}
      <Dialog open={showLowHeartsWarning} onOpenChange={setShowLowHeartsWarning}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-4 border-orange-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl text-orange-600">
              <AlertTriangle className="w-6 h-6" />
              生命值不足警告
            </DialogTitle>
            <DialogDescription className="text-base">
              你的生命值快用完了！失败的任务会消耗生命值，建议先恢复再继续挑战。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-700">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-semibold">当前: {currentHearts}/{maxHearts} 爱心</div>
                  <div className="text-sm">建议补充生命值后再继续</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLowHeartsWarning(false)}
                className="flex-1 rounded-xl"
              >
                继续挑战
              </Button>
              <Button 
                onClick={() => {
                  setShowLowHeartsWarning(false);
                  setShowBuyDialog(true);
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Zap className="w-4 h-4 mr-2" />
                补充生命
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}