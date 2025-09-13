import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Palette, Crown, Shirt, Eye, Smile, Star, Zap, Gift, Save, RotateCcw, Sparkles } from 'lucide-react';

interface AvatarConfig {
  skin: string;
  hair: string;
  eyes: string;
  mouth: string;
  outfit: string;
  accessory: string;
  background: string;
  level: number;
}

interface AvatarItem {
  id: string;
  name: string;
  emoji: string;
  category: 'skin' | 'hair' | 'eyes' | 'mouth' | 'outfit' | 'accessory' | 'background';
  cost: number;
  isUnlocked: boolean;
  requiredLevel?: number;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface PersonalizedAvatarProps {
  currentAvatar: AvatarConfig;
  availableItems: AvatarItem[];
  userPoints: number;
  userLevel: number;
  onSaveAvatar: (config: AvatarConfig) => void;
  onUnlockItem: (itemId: string, cost: number) => void;
}

export function PersonalizedAvatar({ 
  currentAvatar, 
  availableItems, 
  userPoints, 
  userLevel,
  onSaveAvatar,
  onUnlockItem 
}: PersonalizedAvatarProps) {
  const [previewAvatar, setPreviewAvatar] = useState<AvatarConfig>(currentAvatar);
  const [selectedCategory, setSelectedCategory] = useState<string>('skin');
  const [showPreview, setShowPreview] = useState(false);

  // 类别配置
  const categories = {
    skin: {
      label: '肌肤',
      icon: Palette,
      color: 'duolingo-orange',
      bgColor: 'bg-duolingo-orange-subtle'
    },
    hair: {
      label: '发型',
      icon: Crown,
      color: 'duolingo-yellow',
      bgColor: 'bg-duolingo-yellow-subtle'
    },
    eyes: {
      label: '眼睛',
      icon: Eye,
      color: 'duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle'
    },
    mouth: {
      label: '嘴巴',
      icon: Smile,
      color: 'duolingo-pink',
      bgColor: 'bg-duolingo-pink-subtle'
    },
    outfit: {
      label: '服装',
      icon: Shirt,
      color: 'duolingo-purple',
      bgColor: 'bg-duolingo-purple-subtle'
    },
    accessory: {
      label: '配饰',
      icon: Star,
      color: 'duolingo-green',
      bgColor: 'bg-duolingo-green-subtle'
    },
    background: {
      label: '背景',
      icon: Sparkles,
      color: 'duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle'
    }
  };

  // 稀有度配置
  const rarityConfig = {
    common: {
      label: '普通',
      color: 'text-warm-gray-600',
      bgColor: 'bg-warm-gray-100',
      borderColor: 'border-warm-gray-300'
    },
    rare: {
      label: '稀有',
      color: 'text-duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle',
      borderColor: 'border-duolingo-blue'
    },
    epic: {
      label: '史诗',
      color: 'text-duolingo-purple',
      bgColor: 'bg-duolingo-purple-subtle',
      borderColor: 'border-duolingo-purple'
    },
    legendary: {
      label: '传说',
      color: 'text-duolingo-yellow',
      bgColor: 'bg-duolingo-yellow-subtle',
      borderColor: 'border-duolingo-yellow'
    }
  };

  // 获取分类中的物品
  const getCategoryItems = (category: string) => {
    return availableItems.filter(item => item.category === category);
  };

  // 渲染头像预览
  const renderAvatarPreview = (config: AvatarConfig, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClass = size === 'small' ? 'w-16 h-16 text-lg' : 
                     size === 'medium' ? 'w-24 h-24 text-2xl' : 
                     'w-40 h-40 text-6xl';
    
    return (
      <div className={`${sizeClass} relative rounded-full flex items-center justify-center font-bold overflow-hidden`}>
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-duolingo-blue to-duolingo-purple opacity-80"></div>
        
        {/* 角色组合 */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* 头发在上方 */}
          <div className="absolute -top-2">{config.hair}</div>
          
          {/* 主要脸部 */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {config.skin}
              {/* 眼睛 */}
              <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 scale-75">
                {config.eyes}
              </div>
              <div className="absolute top-1/3 right-1/3 transform translate-x-1/2 -translate-y-1/2 scale-75">
                {config.eyes}
              </div>
              {/* 嘴巴 */}
              <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-1/2 scale-75">
                {config.mouth}
              </div>
            </div>
          </div>
          
          {/* 服装在下方 */}
          <div className="absolute bottom-0">{config.outfit}</div>
          
          {/* 配饰在前方 */}
          <div className="absolute top-0 right-0 scale-75">{config.accessory}</div>
        </div>
      </div>
    );
  };

  // 处理物品选择
  const handleItemSelect = (item: AvatarItem) => {
    if (!item.isUnlocked) {
      // 检查是否可以解锁
      if (item.cost > userPoints) {
        toast.error(`积分不足！需要 ${item.cost} 积分`, {
          description: '继续完成任务获得更多积分吧！',
          duration: 3000,
        });
        return;
      }
      
      if (item.requiredLevel && item.requiredLevel > userLevel) {
        toast.error(`等级不足！需要达到 ${item.requiredLevel} 级`, {
          description: '继续学习提升等级吧！',
          duration: 3000,
        });
        return;
      }

      // 解锁物品
      onUnlockItem(item.id, item.cost);
      toast.success(`🎉 解锁成功！`, {
        description: `${item.name} 已解锁并应用`,
        duration: 3000,
      });
    }

    // 应用到预览
    setPreviewAvatar(prev => ({
      ...prev,
      [item.category]: item.emoji
    }));
  };

  // 保存头像
  const handleSaveAvatar = () => {
    onSaveAvatar(previewAvatar);
    setShowPreview(false);
    
    toast.success('🎨 头像保存成功！', {
      description: '你的新形象已更新',
      duration: 3000,
    });
  };

  // 重置预览
  const handleResetPreview = () => {
    setPreviewAvatar(currentAvatar);
    toast.info('🔄 已重置为当前头像', {
      duration: 2000,
    });
  };

  // 随机生成头像
  const handleRandomAvatar = () => {
    const randomConfig = { ...previewAvatar };
    
    Object.keys(categories).forEach(category => {
      const categoryItems = getCategoryItems(category).filter(item => item.isUnlocked);
      if (categoryItems.length > 0) {
        const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
        randomConfig[category as keyof AvatarConfig] = randomItem.emoji;
      }
    });
    
    setPreviewAvatar(randomConfig);
    toast.success('🎲 随机头像生成完成！', {
      duration: 2000,
    });
  };

  const hasChanges = JSON.stringify(previewAvatar) !== JSON.stringify(currentAvatar);

  return (
    <div className="space-y-6">
      {/* 🎨 头像定制标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-duolingo-purple-subtle via-white to-duolingo-pink-subtle border-4 border-duolingo-purple/40 shadow-2xl shadow-duolingo-purple/30 rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-purple via-duolingo-pink to-duolingo-purple"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-duolingo-pink/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-duolingo-purple/15 rounded-full translate-y-10 -translate-x-10"></div>
          
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-4 text-2xl font-black">
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                    className="text-4xl"
                  >
                    🎨
                  </motion.div>
                  <span className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink bg-clip-text text-transparent">
                    个性化头像定制
                  </span>
                </CardTitle>
                <p className="text-sm font-medium text-warm-gray-600 mt-2">
                  创造独一无二的专属形象！
                </p>
              </div>
              
              {/* 当前头像展示 */}
              <div className="text-center">
                <div className="mb-2">
                  {renderAvatarPreview(currentAvatar, 'medium')}
                </div>
                <Badge className="bg-duolingo-green text-white px-3 py-1 rounded-full">
                  当前头像
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-warm-gray-600">
                  可用积分: <span className="font-bold text-duolingo-green">{userPoints}</span>
                </div>
                <div className="text-sm text-warm-gray-600">
                  等级: <span className="font-bold text-duolingo-blue">Lv.{userLevel}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRandomAvatar}
                  variant="outline"
                  className="rounded-xl font-bold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  随机生成
                </Button>
                <Button
                  onClick={() => setShowPreview(true)}
                  className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white font-bold rounded-xl hover:scale-105 transition-transform"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  预览头像
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🎯 定制界面 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 头像预览区 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-[2rem] border-4 border-duolingo-blue/30 shadow-xl h-fit">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3">
                <Eye className="w-6 h-6 text-duolingo-blue" />
                预览区域
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {/* 大预览头像 */}
              <div className="flex justify-center">
                {renderAvatarPreview(previewAvatar, 'large')}
              </div>
              
              {/* 操作按钮 */}
              <div className="space-y-3">
                <Button
                  onClick={handleResetPreview}
                  variant="outline"
                  className="w-full rounded-xl font-bold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
                
                <Button
                  onClick={handleSaveAvatar}
                  disabled={!hasChanges}
                  className="w-full bg-gradient-to-r from-duolingo-green to-duolingo-blue text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {hasChanges ? '保存头像' : '无更改'}
                </Button>
              </div>
              
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-duolingo-orange font-semibold"
                >
                  ✨ 检测到更改
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 物品选择区 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-7 bg-white shadow-xl rounded-[2rem] p-3 border-4 border-duolingo-purple-subtle backdrop-blur-sm">
              {Object.entries(categories).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={key}
                    value={key}
                    className="relative z-10 rounded-[1rem] font-bold py-3 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:shadow-xl data-[state=active]:scale-105"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs font-bold">{category.label}</span>
                    </motion.span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* 物品网格 */}
            {Object.entries(categories).map(([categoryKey, categoryConfig]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="mt-6">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {getCategoryItems(categoryKey).map((item, index) => {
                    const rarityStyle = rarityConfig[item.rarity];
                    const isSelected = previewAvatar[categoryKey as keyof AvatarConfig] === item.emoji;
                    const canUnlock = item.cost <= userPoints && (!item.requiredLevel || item.requiredLevel <= userLevel);
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card 
                          className={`relative cursor-pointer transition-all duration-300 rounded-xl border-2 ${
                            isSelected
                              ? 'border-duolingo-green bg-duolingo-green-subtle shadow-lg shadow-duolingo-green/30'
                              : item.isUnlocked
                              ? `${rarityStyle.borderColor} ${rarityStyle.bgColor} hover:shadow-lg`
                              : 'border-warm-gray-300 bg-warm-gray-100 opacity-60'
                          }`}
                          onClick={() => handleItemSelect(item)}
                        >
                          {/* 稀有度角标 */}
                          <div className="absolute top-1 right-1">
                            <Badge className={`${rarityStyle.color} ${rarityStyle.bgColor} border-0 px-1 py-0.5 rounded text-xs`}>
                              {item.rarity === 'common' ? '🤍' : 
                               item.rarity === 'rare' ? '💙' :
                               item.rarity === 'epic' ? '💜' : '💛'}
                            </Badge>
                          </div>

                          {/* 选中指示器 */}
                          {isSelected && (
                            <div className="absolute top-1 left-1">
                              <Badge className="bg-duolingo-green text-white border-0 px-1 py-0.5 rounded text-xs">
                                ✓
                              </Badge>
                            </div>
                          )}

                          {/* 锁定遮罩 */}
                          {!item.isUnlocked && (
                            <div className="absolute inset-0 bg-warm-gray-200/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                              <div className="text-center">
                                <div className="text-lg mb-1">🔒</div>
                                <div className="text-xs font-semibold text-warm-gray-600">
                                  {item.cost}积分
                                </div>
                                {item.requiredLevel && (
                                  <div className="text-xs text-warm-gray-500">
                                    Lv.{item.requiredLevel}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <CardContent className="p-3 text-center">
                            <div className="text-3xl mb-2">{item.emoji}</div>
                            <div className="text-xs font-semibold text-warm-gray-800 mb-1">
                              {item.name}
                            </div>
                            
                            {!item.isUnlocked && (
                              <div className={`text-xs font-bold ${canUnlock ? 'text-duolingo-green' : 'text-warm-gray-500'}`}>
                                {item.cost} 积分
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>

      {/* 头像预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-4 border-duolingo-purple/30">
          <DialogHeader>
            <DialogTitle className="text-center">
              🎨 头像预览
            </DialogTitle>
            <DialogDescription className="text-center">
              这就是你的新形象！
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 text-center">
            {/* 大头像展示 */}
            <div className="flex justify-center">
              {renderAvatarPreview(previewAvatar, 'large')}
            </div>
            
            {/* 对比展示 */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="mb-2">{renderAvatarPreview(currentAvatar, 'small')}</div>
                <Badge variant="outline" className="text-xs">当前头像</Badge>
              </div>
              <div>
                <div className="mb-2">{renderAvatarPreview(previewAvatar, 'small')}</div>
                <Badge className="bg-duolingo-green text-white text-xs">新头像</Badge>
              </div>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="rounded-xl"
              >
                继续编辑
              </Button>
              <Button
                onClick={handleSaveAvatar}
                className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Save className="w-4 h-4 mr-2" />
                保存头像
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
