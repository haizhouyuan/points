import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { Heart, MessageCircle, ThumbsUp, Gift, Star, Send, Users, Zap, Crown, Medal, Sparkles, Trophy, Camera, Mic } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  status: 'online' | 'offline' | 'busy';
  role: 'parent' | 'child';
  achievements: string[];
  currentStreak: number;
}

interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  type: 'achievement' | 'streak' | 'task_complete' | 'level_up' | 'general';
  timestamp: string;
  likes: string[]; // user IDs who liked
  comments: SocialComment[];
  attachments?: {
    type: 'achievement' | 'photo' | 'badge';
    data: any;
  }[];
  isHighlighted?: boolean;
}

interface SocialComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: string[];
}

interface Encouragement {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  type: 'cheer' | 'gift' | 'high_five' | 'star' | 'crown';
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface SocialInteractionProps {
  currentUserId: string;
  familyMembers: FamilyMember[];
  socialPosts: SocialPost[];
  encouragements: Encouragement[];
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, content: string) => void;
  onSendEncouragement: (toId: string, type: string, message: string) => void;
  onCreatePost: (content: string, type: string) => void;
}

export function SocialInteraction({ 
  currentUserId, 
  familyMembers, 
  socialPosts, 
  encouragements,
  onLikePost,
  onCommentPost,
  onSendEncouragement,
  onCreatePost
}: SocialInteractionProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showEncourageDialog, setShowEncourageDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [encourageMessage, setEncourageMessage] = useState('');
  const [selectedEncourageType, setSelectedEncourageType] = useState('cheer');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // 鼓励类型配置
  const encourageTypes = {
    cheer: {
      emoji: '📣',
      label: '加油鼓励',
      color: 'duolingo-green',
      bgColor: 'bg-duolingo-green-subtle',
      message: '加油！你做得很棒！'
    },
    gift: {
      emoji: '🎁',
      label: '送小礼物',
      color: 'duolingo-orange',
      bgColor: 'bg-duolingo-orange-subtle',
      message: '送你一个小礼物，继续努力哦！'
    },
    high_five: {
      emoji: '🙌',
      label: '击掌庆祝',
      color: 'duolingo-blue',
      bgColor: 'bg-duolingo-blue-subtle',
      message: '太棒了！击掌庆祝！'
    },
    star: {
      emoji: '⭐',
      label: '超级点赞',
      color: 'duolingo-yellow',
      bgColor: 'bg-duolingo-yellow-subtle',
      message: '你真是太厉害了！'
    },
    crown: {
      emoji: '👑',
      label: '王者称赞',
      color: 'duolingo-purple',
      bgColor: 'bg-duolingo-purple-subtle',
      message: '你就是今天的王者！'
    }
  };

  // 获取帖子类型配置
  const getPostTypeConfig = (type: string) => {
    switch (type) {
      case 'achievement':
        return { icon: Trophy, color: 'duolingo-yellow', label: '成就解锁' };
      case 'streak':
        return { icon: Zap, color: 'duolingo-orange', label: '连击达成' };
      case 'task_complete':
        return { icon: Star, color: 'duolingo-green', label: '任务完成' };
      case 'level_up':
        return { icon: Crown, color: 'duolingo-purple', label: '等级提升' };
      default:
        return { icon: MessageCircle, color: 'duolingo-blue', label: '动态分享' };
    }
  };

  // 处理点赞
  const handleLike = (postId: string) => {
    onLikePost(postId);
    
    // 添加点赞动画效果
    toast.success('👍 点赞成功！', {
      duration: 2000,
    });
  };

  // 处理评论
  const handleComment = (postId: string) => {
    if (!newCommentContent.trim()) return;
    
    onCommentPost(postId, newCommentContent);
    setNewCommentContent('');
    
    toast.success('💬 评论发送成功！', {
      duration: 2000,
    });
  };

  // 处理鼓励发送
  const handleSendEncouragement = () => {
    if (!selectedMember || !encourageMessage.trim()) return;
    
    onSendEncouragement(selectedMember.id, selectedEncourageType, encourageMessage);
    setShowEncourageDialog(false);
    setEncourageMessage('');
    
    toast.success(`${encourageTypes[selectedEncourageType as keyof typeof encourageTypes].emoji} 鼓励已发送！`, {
      description: `已向 ${selectedMember.name} 发送鼓励`,
      duration: 3000,
    });
  };

  // 处理新帖子发布
  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    onCreatePost(newPostContent, 'general');
    setNewPostContent('');
    
    toast.success('📝 动态发布成功！', {
      duration: 2000,
    });
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return date.toLocaleDateString();
  };

  const currentUser = familyMembers.find(m => m.id === currentUserId);
  const unreadEncouragements = encouragements.filter(e => e.toId === currentUserId && !e.isRead);

  return (
    <div className="space-y-6">
      {/* 🎉 社交中心标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-duolingo-pink-subtle via-white to-duolingo-purple-subtle border-4 border-duolingo-pink/40 shadow-2xl shadow-duolingo-pink/30 rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-pink via-duolingo-purple to-duolingo-pink"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-duolingo-purple/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-duolingo-pink/15 rounded-full translate-y-10 -translate-x-10"></div>
          
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
                👨‍👩‍👧‍👦
              </motion.div>
              <div>
                <span className="bg-gradient-to-r from-duolingo-pink to-duolingo-purple bg-clip-text text-transparent">
                  家庭社交中心
                </span>
                <div className="text-sm font-medium text-warm-gray-600 mt-1">
                  分享成就，相互鼓励，一起成长！
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10">
            {/* 未读鼓励提醒 */}
            {unreadEncouragements.length > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-duolingo-yellow-subtle border-2 border-duolingo-yellow/40 rounded-xl p-3 mb-4"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-duolingo-pink" />
                  <span className="font-semibold text-warm-gray-800">
                    你有 {unreadEncouragements.length} 条新的鼓励消息！
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-xl rounded-[2rem] p-3 border-4 border-duolingo-pink-subtle backdrop-blur-sm">
          <TabsTrigger value="timeline" className="rounded-[1rem] font-bold py-3">
            <MessageCircle className="w-4 h-4 mr-2" />
            动态时间线
          </TabsTrigger>
          <TabsTrigger value="family" className="rounded-[1rem] font-bold py-3">
            <Users className="w-4 h-4 mr-2" />
            家庭成员
          </TabsTrigger>
          <TabsTrigger value="encouragements" className="rounded-[1rem] font-bold py-3">
            <Heart className="w-4 h-4 mr-2" />
            鼓励消息
            {unreadEncouragements.length > 0 && (
              <Badge className="ml-2 bg-duolingo-pink text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {unreadEncouragements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-[1rem] font-bold py-3">
            <Sparkles className="w-4 h-4 mr-2" />
            发布动态
          </TabsTrigger>
        </TabsList>

        {/* 📝 动态时间线 */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-4">
            {socialPosts.map((post, index) => {
              const typeConfig = getPostTypeConfig(post.type);
              const IconComponent = typeConfig.icon;
              const isLiked = post.likes.includes(currentUserId);
              const isExpanded = expandedPost === post.id;
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`rounded-[1.5rem] border-2 ${post.isHighlighted ? 'border-duolingo-yellow bg-duolingo-yellow-subtle' : 'border-warm-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-duolingo-blue to-duolingo-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {post.authorName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-duolingo-green rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <div className="font-bold text-warm-gray-800">{post.authorName}</div>
                            <div className="text-sm text-warm-gray-500">{formatTime(post.timestamp)}</div>
                          </div>
                        </div>
                        
                        <Badge className={`bg-${typeConfig.color}-subtle text-${typeConfig.color} border-0 px-3 py-1 rounded-full flex items-center gap-1`}>
                          <IconComponent className="w-3 h-3" />
                          {typeConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* 帖子内容 */}
                      <p className="text-warm-gray-700 leading-relaxed">{post.content}</p>

                      {/* 附件展示 */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-2">
                          {post.attachments.map((attachment, attachIndex) => (
                            <div key={attachIndex} className="bg-warm-gray-50 rounded-lg p-3 border-2 border-warm-gray-200">
                              {attachment.type === 'achievement' && (
                                <div className="flex items-center gap-3">
                                  <div className="text-3xl">{attachment.data.icon}</div>
                                  <div>
                                    <div className="font-bold text-warm-gray-800">{attachment.data.title}</div>
                                    <div className="text-sm text-warm-gray-600">{attachment.data.description}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 互动按钮 */}
                      <div className="flex items-center justify-between pt-3 border-t border-warm-gray-200">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              isLiked 
                                ? 'bg-duolingo-pink text-white' 
                                : 'bg-warm-gray-100 text-warm-gray-600 hover:bg-duolingo-pink-subtle hover:text-duolingo-pink'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm font-semibold">{post.likes.length}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warm-gray-100 text-warm-gray-600 hover:bg-duolingo-blue-subtle hover:text-duolingo-blue transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-semibold">{post.comments.length}</span>
                          </motion.button>
                        </div>

                        <div className="text-xs text-warm-gray-500">
                          {post.likes.length} 个赞 · {post.comments.length} 条评论
                        </div>
                      </div>

                      {/* 评论区 */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-3 border-t border-warm-gray-200"
                          >
                            {/* 评论列表 */}
                            {post.comments.map((comment, commentIndex) => (
                              <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: commentIndex * 0.05 }}
                                className="flex items-start gap-3 p-3 bg-warm-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-duolingo-green to-duolingo-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {comment.authorName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-warm-gray-800">{comment.authorName}</span>
                                    <span className="text-xs text-warm-gray-500">{formatTime(comment.timestamp)}</span>
                                  </div>
                                  <p className="text-sm text-warm-gray-700">{comment.content}</p>
                                </div>
                              </motion.div>
                            ))}

                            {/* 新评论输入 */}
                            <div className="flex items-center gap-3">
                              <Input
                                placeholder="写下你的评论..."
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                className="flex-1 rounded-lg border-2 border-warm-gray-200"
                                onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                              />
                              <Button
                                onClick={() => handleComment(post.id)}
                                disabled={!newCommentContent.trim()}
                                className="bg-duolingo-blue text-white font-bold rounded-lg hover:scale-105 transition-transform"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* 👥 家庭成员 */}
        <TabsContent value="family">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyMembers.filter(member => member.id !== currentUserId).map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-[1.5rem] border-4 border-warm-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <CardHeader className="text-center pb-3">
                    <div className="relative mx-auto w-20 h-20 mb-3">
                      <div className="w-20 h-20 bg-gradient-to-br from-duolingo-green to-duolingo-blue rounded-full flex items-center justify-center text-white font-black text-2xl">
                        {member.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                        member.status === 'online' ? 'bg-duolingo-green' : 
                        member.status === 'busy' ? 'bg-duolingo-orange' : 'bg-warm-gray-400'
                      }`}></div>
                    </div>
                    <CardTitle className="text-lg font-bold text-warm-gray-800">{member.name}</CardTitle>
                    <Badge className={`mx-auto px-3 py-1 rounded-full ${
                      member.role === 'parent' ? 'bg-duolingo-purple text-white' : 'bg-duolingo-green text-white'
                    }`}>
                      {member.role === 'parent' ? '👨‍👩‍👧‍👦 家长' : '🎓 孩子'}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 成员信息 */}
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-duolingo-blue-subtle rounded-lg p-2">
                        <div className="font-bold text-duolingo-blue">Lv.{member.level}</div>
                        <div className="text-xs text-warm-gray-600">等级</div>
                      </div>
                      <div className="bg-duolingo-green-subtle rounded-lg p-2">
                        <div className="font-bold text-duolingo-green">{member.points}</div>
                        <div className="text-xs text-warm-gray-600">积分</div>
                      </div>
                    </div>

                    <div className="bg-duolingo-orange-subtle rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-duolingo-orange" />
                        <span className="font-bold text-duolingo-orange">{member.currentStreak}天连击</span>
                      </div>
                    </div>

                    {/* 鼓励按钮 */}
                    <Button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowEncourageDialog(true);
                      }}
                      className="w-full bg-gradient-to-r from-duolingo-pink to-duolingo-purple text-white font-bold rounded-lg hover:scale-105 transition-transform"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      送出鼓励
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 💝 鼓励消息 */}
        <TabsContent value="encouragements">
          <div className="space-y-4">
            {encouragements.map((encouragement, index) => (
              <motion.div
                key={encouragement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`rounded-[1.5rem] border-2 shadow-lg transition-all duration-300 ${
                  !encouragement.isRead 
                    ? 'border-duolingo-pink bg-duolingo-pink-subtle shadow-duolingo-pink/20' 
                    : 'border-warm-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {encourageTypes[encouragement.type as keyof typeof encourageTypes].emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-warm-gray-800">{encouragement.fromName}</span>
                          <span className="text-sm text-warm-gray-500">{formatTime(encouragement.timestamp)}</span>
                          {!encouragement.isRead && (
                            <Badge className="bg-duolingo-pink text-white px-2 py-1 rounded-full text-xs">
                              新消息
                            </Badge>
                          )}
                        </div>
                        <p className="text-warm-gray-700">{encouragement.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ✨ 发布动态 */}
        <TabsContent value="create">
          <Card className="rounded-[1.5rem] border-4 border-duolingo-blue/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-duolingo-blue" />
                发布新动态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="分享你的学习成果或心情..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-32 rounded-lg border-2 border-warm-gray-200"
              />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-lg">
                    <Camera className="w-4 h-4 mr-2" />
                    添加图片
                  </Button>
                  <Button variant="outline" className="rounded-lg">
                    <Trophy className="w-4 h-4 mr-2" />
                    分享成就
                  </Button>
                </div>
                
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="bg-gradient-to-r from-duolingo-blue to-duolingo-purple text-white font-bold rounded-lg hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4 mr-2" />
                  发布动态
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 鼓励发送对话框 */}
      <Dialog open={showEncourageDialog} onOpenChange={setShowEncourageDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-4 border-duolingo-pink/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-duolingo-pink" />
              给 {selectedMember?.name} 送出鼓励
            </DialogTitle>
            <DialogDescription>
              选择鼓励类型，并写下你想说的话
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 鼓励类型选择 */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(encourageTypes).map(([type, config]) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedEncourageType(type);
                    setEncourageMessage(config.message);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedEncourageType === type
                      ? `border-${config.color} ${config.bgColor}`
                      : 'border-warm-gray-200 hover:border-warm-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{config.emoji}</div>
                  <div className="text-sm font-semibold">{config.label}</div>
                </motion.button>
              ))}
            </div>

            {/* 鼓励消息输入 */}
            <Textarea
              placeholder="写下你的鼓励话语..."
              value={encourageMessage}
              onChange={(e) => setEncourageMessage(e.target.value)}
              className="min-h-24 rounded-lg border-2 border-warm-gray-200"
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEncourageDialog(false)}
                className="rounded-lg"
              >
                取消
              </Button>
              <Button
                onClick={handleSendEncouragement}
                disabled={!encourageMessage.trim()}
                className="bg-gradient-to-r from-duolingo-pink to-duolingo-purple text-white font-bold rounded-lg hover:scale-105 transition-transform"
              >
                <Heart className="w-4 h-4 mr-2" />
                发送鼓励
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}