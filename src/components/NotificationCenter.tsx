import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Heart, 
  Star, 
  Trophy, 
  Gift, 
  Users, 
  MessageCircle, 
  Clock, 
  Calendar, 
  Zap, 
  Crown, 
  Target, 
  Flame, 
  Award,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'achievement' | 'social' | 'task' | 'system' | 'reminder' | 'family';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  actionLabel?: string;
  senderAvatar?: string;
  senderName?: string;
  metadata?: {
    points?: number;
    badge?: string;
    taskId?: string;
    achievementId?: string;
    familyMemberId?: string;
  };
}

interface NotificationSettings {
  achievements: boolean;
  social: boolean;
  tasks: boolean;
  system: boolean;
  reminders: boolean;
  family: boolean;
  sound: boolean;
  push: boolean;
  email: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onNotificationAction: (notification: Notification) => void;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  settings,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onUpdateSettings,
  onNotificationAction
}: NotificationCenterProps) {
  const [showCenter, setShowCenter] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // 分类筛选通知
  const filteredNotifications = notifications.filter(notification => {
    if (currentTab === 'all') return true;
    if (currentTab === 'unread') return !notification.isRead;
    if (currentTab === 'important') return notification.isImportant;
    return notification.type === currentTab;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-5 h-5 text-duolingo-yellow" />;
      case 'social': return <Users className="w-5 h-5 text-duolingo-pink" />;
      case 'task': return <Target className="w-5 h-5 text-duolingo-green" />;
      case 'system': return <Settings className="w-5 h-5 text-duolingo-blue" />;
      case 'reminder': return <Clock className="w-5 h-5 text-duolingo-orange" />;
      case 'family': return <Heart className="w-5 h-5 text-duolingo-purple" />;
      default: return <Bell className="w-5 h-5 text-warm-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'border-duolingo-yellow bg-duolingo-yellow-subtle';
      case 'social': return 'border-duolingo-pink bg-duolingo-pink-subtle';
      case 'task': return 'border-duolingo-green bg-duolingo-green-subtle';
      case 'system': return 'border-duolingo-blue bg-duolingo-blue-subtle';
      case 'reminder': return 'border-duolingo-orange bg-duolingo-orange-subtle';
      case 'family': return 'border-duolingo-purple bg-duolingo-purple-subtle';
      default: return 'border-warm-gray-300 bg-warm-gray-50';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return time.toLocaleDateString();
  };

  const handleSettingsUpdate = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handleQuietHoursUpdate = (key: string, value: any) => {
    const newQuietHours = { ...localSettings.quietHours, [key]: value };
    handleSettingsUpdate('quietHours', newQuietHours);
  };

  return (
    <>
      {/* 通知按钮 */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCenter(true)}
          className="relative rounded-full p-2 hover:bg-duolingo-green-subtle hover:text-duolingo-green"
        >
          <motion.div
            animate={unreadCount > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          >
            {unreadCount > 0 ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </motion.div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </div>

      {/* 通知中心弹窗 */}
      <Dialog open={showCenter} onOpenChange={setShowCenter}>
        <DialogContent className="max-w-4xl h-[80vh] rounded-[2rem] border-4 border-duolingo-blue/30 overflow-hidden">
          <DialogHeader className="relative z-10 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Bell className="w-8 h-8 text-duolingo-blue" />
                </motion.div>
                <div>
                  <DialogTitle className="text-2xl font-black bg-gradient-to-r from-duolingo-blue to-duolingo-purple bg-clip-text text-transparent">
                    通知中心
                  </DialogTitle>
                  <DialogDescription className="text-warm-gray-600">
                    {unreadCount > 0 ? `${unreadCount} 条未读消息` : '所有消息已读'}
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="rounded-xl"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  设置
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    全部已读
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
              {/* 标签页导航 */}
              <TabsList className="grid w-full grid-cols-7 bg-gradient-to-r from-white via-warm-gray-50 to-white shadow-lg rounded-[1.5rem] p-2 border-2 border-duolingo-blue-subtle mb-4">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-blue data-[state=active]:text-white"
                >
                  全部
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-green data-[state=active]:text-white"
                >
                  未读
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-duolingo-green text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="important" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-orange data-[state=active]:text-white"
                >
                  重要
                </TabsTrigger>
                <TabsTrigger 
                  value="achievement" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-yellow data-[state=active]:text-white"
                >
                  成就
                </TabsTrigger>
                <TabsTrigger 
                  value="social" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-pink data-[state=active]:text-white"
                >
                  社交
                </TabsTrigger>
                <TabsTrigger 
                  value="task" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-purple data-[state=active]:text-white"
                >
                  任务
                </TabsTrigger>
                <TabsTrigger 
                  value="family" 
                  className="rounded-xl font-semibold data-[state=active]:bg-duolingo-blue data-[state=active]:text-white"
                >
                  家庭
                </TabsTrigger>
              </TabsList>

              {/* 通知列表 */}
              <div className="flex-1 overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="text-6xl mb-4">🔔</div>
                      <p className="text-xl font-semibold text-warm-gray-600 mb-2">
                        暂无通知
                      </p>
                      <p className="text-warm-gray-500">
                        {currentTab === 'unread' ? '所有通知都已阅读完毕！' : '没有找到相关通知'}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                        >
                          <Card className={`${getNotificationColor(notification.type)} ${
                            !notification.isRead ? 'border-l-4 border-l-duolingo-blue' : ''
                          } rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
                            onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* 通知图标 */}
                                <div className="flex-shrink-0">
                                  {notification.senderAvatar ? (
                                    <div className="w-10 h-10 bg-gradient-to-br from-duolingo-green to-duolingo-blue rounded-full flex items-center justify-center text-white font-bold">
                                      {notification.senderAvatar}
                                    </div>
                                  ) : (
                                    <div className={`p-2 rounded-xl ${getNotificationColor(notification.type)}`}>
                                      {getNotificationIcon(notification.type)}
                                    </div>
                                  )}
                                </div>

                                {/* 通知内容 */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className={`font-bold text-warm-gray-800 ${!notification.isRead ? 'text-duolingo-blue' : ''}`}>
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-warm-gray-600 mt-1">
                                        {notification.message}
                                      </p>
                                      {notification.senderName && (
                                        <p className="text-xs text-warm-gray-500 mt-1">
                                          来自 {notification.senderName}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                      <span className="text-xs text-warm-gray-500">
                                        {formatRelativeTime(notification.timestamp)}
                                      </span>
                                      {notification.isImportant && (
                                        <AlertCircle className="w-4 h-4 text-duolingo-orange" />
                                      )}
                                      {!notification.isRead && (
                                        <div className="w-2 h-2 bg-duolingo-blue rounded-full"></div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 元数据展示 */}
                                  {notification.metadata && (
                                    <div className="flex items-center gap-2 mt-2">
                                      {notification.metadata.points && (
                                        <Badge className="bg-duolingo-green text-white">
                                          +{notification.metadata.points} 积分
                                        </Badge>
                                      )}
                                      {notification.metadata.badge && (
                                        <Badge variant="outline">
                                          {notification.metadata.badge}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {/* 操作按钮 */}
                                  {notification.actionLabel && (
                                    <div className="flex items-center gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onNotificationAction(notification);
                                        }}
                                        className="bg-duolingo-green text-white rounded-lg hover:bg-duolingo-green-dark"
                                      >
                                        {notification.actionLabel}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteNotification(notification.id);
                                        }}
                                        className="text-warm-gray-500 hover:text-red-500"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* 通知设置弹窗 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-4 border-duolingo-purple/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-duolingo-purple to-duolingo-pink bg-clip-text text-transparent">
              🔔 通知设置
            </DialogTitle>
            <DialogDescription className="text-warm-gray-600">
              自定义您的通知偏好和提醒方式
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 通知类型设置 */}
            <div>
              <h3 className="font-bold text-lg text-warm-gray-800 mb-4">通知类型</h3>
              <div className="space-y-4">
                {[
                  { key: 'achievements', label: '成就通知', icon: Trophy, color: 'duolingo-yellow' },
                  { key: 'social', label: '社交互动', icon: Users, color: 'duolingo-pink' },
                  { key: 'tasks', label: '任务提醒', icon: Target, color: 'duolingo-green' },
                  { key: 'family', label: '家庭消息', icon: Heart, color: 'duolingo-purple' },
                  { key: 'system', label: '系统通知', icon: Settings, color: 'duolingo-blue' },
                  { key: 'reminders', label: '学习提醒', icon: Clock, color: 'duolingo-orange' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${color}-subtle rounded-lg`}>
                        <Icon className={`w-5 h-5 text-${color}`} />
                      </div>
                      <span className="font-semibold text-warm-gray-800">{label}</span>
                    </div>
                    <Switch
                      checked={localSettings[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(checked) => handleSettingsUpdate(key as keyof NotificationSettings, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 通知方式设置 */}
            <div>
              <h3 className="font-bold text-lg text-warm-gray-800 mb-4">通知方式</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-duolingo-green-subtle rounded-lg">
                      <Volume2 className="w-5 h-5 text-duolingo-green" />
                    </div>
                    <span className="font-semibold text-warm-gray-800">声音提醒</span>
                  </div>
                  <Switch
                    checked={localSettings.sound}
                    onCheckedChange={(checked) => handleSettingsUpdate('sound', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-duolingo-blue-subtle rounded-lg">
                      <Smartphone className="w-5 h-5 text-duolingo-blue" />
                    </div>
                    <span className="font-semibold text-warm-gray-800">推送通知</span>
                  </div>
                  <Switch
                    checked={localSettings.push}
                    onCheckedChange={(checked) => handleSettingsUpdate('push', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-duolingo-orange-subtle rounded-lg">
                      <Mail className="w-5 h-5 text-duolingo-orange" />
                    </div>
                    <span className="font-semibold text-warm-gray-800">邮件通知</span>
                  </div>
                  <Switch
                    checked={localSettings.email}
                    onCheckedChange={(checked) => handleSettingsUpdate('email', checked)}
                  />
                </div>
              </div>
            </div>

            {/* 免打扰时间 */}
            <div>
              <h3 className="font-bold text-lg text-warm-gray-800 mb-4">免打扰时间</h3>
              <div className="p-4 bg-duolingo-purple-subtle rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-warm-gray-800">启用免打扰</span>
                  <Switch
                    checked={localSettings.quietHours.enabled}
                    onCheckedChange={(checked) => handleQuietHoursUpdate('enabled', checked)}
                  />
                </div>
                
                {localSettings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-warm-gray-700 mb-2">开始时间</label>
                      <input
                        type="time"
                        value={localSettings.quietHours.start}
                        onChange={(e) => handleQuietHoursUpdate('start', e.target.value)}
                        className="w-full p-2 border-2 border-duolingo-purple/30 rounded-lg focus:border-duolingo-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-warm-gray-700 mb-2">结束时间</label>
                      <input
                        type="time"
                        value={localSettings.quietHours.end}
                        onChange={(e) => handleQuietHoursUpdate('end', e.target.value)}
                        className="w-full p-2 border-2 border-duolingo-purple/30 rounded-lg focus:border-duolingo-purple"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
