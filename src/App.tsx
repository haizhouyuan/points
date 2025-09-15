import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { PointsHeader } from "./components/PointsHeader";
import { RewardCard } from "./components/RewardCard";
import { TaskHistory } from "./components/TaskHistory";
import { FamilyLeaderboard } from "./components/FamilyLeaderboard";
import { ParentDashboard } from "./components/ParentDashboard";
import { HabitTracker } from "./components/HabitTracker";
import { TaskPlanning } from "./components/TaskPlanning";
import { StreakSystem } from "./components/StreakSystem";
import { ExperienceSystem } from "./components/ExperienceSystem";
import { LifeSystem } from "./components/LifeSystem";
import { CelebrationEffect } from "./components/CelebrationEffect";
import { SkillTree } from "./components/SkillTree";
import { SmartRecommendations } from "./components/SmartRecommendations";
import { AchievementSystem } from "./components/AchievementSystem";
import { SocialInteraction } from "./components/SocialInteraction";
import { PersonalizedAvatar } from "./components/PersonalizedAvatar";
import { FamilyCollaboration } from "./components/FamilyCollaboration";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { NotificationCenter } from "./components/NotificationCenter";

// 🎯 Phase 1 业务逻辑集成
import { RewardsSection } from "./components/RewardsSection";
import { TaskHistorySection } from "./components/TaskHistorySection";
import { HabitTrackerSection } from "./components/HabitTrackerSection";
import { BusinessLogicService, ActivityTracker, CoreFlowValidator } from "./services/business-logic.service";
import { navigationService, useNavigation, NAVIGATION_MAP, NavigationRecommendation } from "./services/navigation.service";

// 🚀 Phase 2 高级功能集成
import { AchievementService, DynamicAchievement, UserBehaviorProfile } from "./services/achievement.service";
import AchievementCard from "./components/AchievementCard";
import AchievementNotification from "./components/AchievementNotification";
import LearningAnalyticsDashboard from "./components/LearningAnalyticsDashboard";
import LearningPathPlanner from "./components/LearningPathPlanner";
import LearningPathExecutor from "./components/LearningPathExecutor";
import { ErrorBoundary, SectionErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  // 🧭 智能导航系统 (Phase 1 集成)
  const navigation = useNavigation();
  const [currentTab, setCurrentTab] = useState('overview');
  const [navigationRecommendation, setNavigationRecommendation] = useState<NavigationRecommendation | null>(null);
  
  // 专注学生体验 (移除角色切换)
  const [currentUser] = useState<"student">("student");
  
  // 学生数据
  const [studentData, setStudentData] = useState({
    name: "小明",
    currentPoints: 2580,
    level: 6,
    levelProgress: 65,
    nextLevelPoints: 3000
  });

  // 🎮 游戏化系统数据
  // 经验值系统
  const [experienceData, setExperienceData] = useState({
    currentXP: 15800,
    level: 6,
    dailyGoal: 200,
    dailyProgress: 180,
    weeklyXP: 1420
  });

  // 连击系统
  const [streakData, setStreakData] = useState([
    {
      current: 12,
      max: 15,
      lastActiveDate: "2025-01-06",
      category: "学习",
      milestones: [7, 14, 21, 50, 100],
      canRestore: true,
      brokenYesterday: false
    },
    {
      current: 0,
      max: 8,
      lastActiveDate: "2025-01-04",
      category: "运动",
      milestones: [7, 14, 21, 50, 100],
      canRestore: true,
      brokenYesterday: true
    },
    {
      current: 21,
      max: 21,
      lastActiveDate: "2025-01-06",
      category: "阅读",
      milestones: [7, 14, 21, 50, 100],
      canRestore: false,
      brokenYesterday: false
    }
  ]);

  // 生命值系统
  const [lifeData, setLifeData] = useState({
    currentHearts: 3,
    maxHearts: 5,
    heartRegenTime: 30, // 30分钟恢复一颗心
    lastRegenTime: "2025-01-06T10:00:00Z"
  });

  // 🎉 庆祝动画状态
  const [celebration, setCelebration] = useState({
    show: false,
    type: 'milestone' as 'levelUp' | 'milestone' | 'streak' | 'reward' | 'daily',
    message: '',
    subMessage: ''
  });

  // 🌟 技能树数据
  const [skillTreeData] = useState([
    {
      id: 'math_basics',
      name: '数学基础',
      description: '掌握基本的数学运算和概念',
      category: '学习',
      level: 3,
      maxLevel: 5,
      xp: 240,
      maxXP: 300,
      isUnlocked: true,
      prerequisites: [],
      rewards: { points: 300, xp: 150, badge: '🔢' },
      tasks: [
        {
          id: 'math_1',
          title: '四则运算练习',
          description: '完成20道加减乘除题目',
          difficulty: 'easy' as const,
          xp: 30,
          points: 50,
          completed: true
        },
        {
          id: 'math_2',
          title: '分数计算',
          description: '学习分数的加减运算',
          difficulty: 'medium' as const,
          xp: 50,
          points: 80,
          completed: false
        }
      ]
    },
    {
      id: 'english_words',
      name: '英语词汇',
      description: '积累英语词汇量，提升语言能力',
      category: '学习',
      level: 2,
      maxLevel: 5,
      xp: 120,
      maxXP: 200,
      isUnlocked: true,
      prerequisites: [],
      rewards: { points: 250, xp: 120 },
      tasks: [
        {
          id: 'eng_1',
          title: '背诵新单词',
          description: '学习10个新的英语单词',
          difficulty: 'easy' as const,
          xp: 25,
          points: 40,
          completed: false
        }
      ]
    },
    {
      id: 'fitness_basic',
      name: '基础体能',
      description: '建立良好的运动习惯，提升身体素质',
      category: '运动',
      level: 1,
      maxLevel: 5,
      xp: 80,
      maxXP: 150,
      isUnlocked: true,
      prerequisites: [],
      rewards: { points: 200, xp: 100 },
      tasks: [
        {
          id: 'fit_1',
          title: '晨跑锻炼',
          description: '进行30分钟的晨跑运动',
          difficulty: 'medium' as const,
          xp: 40,
          points: 70,
          completed: false
        }
      ]
    },
    {
      id: 'home_care',
      name: '家务小助手',
      description: '学会照顾家庭环境，培养责任感',
      category: '家务',
      level: 2,
      maxLevel: 4,
      xp: 90,
      maxXP: 160,
      isUnlocked: true,
      prerequisites: [],
      rewards: { points: 180, xp: 90 },
      tasks: [
        {
          id: 'home_1',
          title: '整理房间',
          description: '把自己的房间收拾整齐',
          difficulty: 'easy' as const,
          xp: 20,
          points: 40,
          completed: true
        }
      ]
    },
    {
      id: 'advanced_math',
      name: '进阶数学',
      description: '学习更高级的数学知识',
      category: '学习',
      level: 0,
      maxLevel: 5,
      xp: 0,
      maxXP: 200,
      isUnlocked: false,
      prerequisites: ['math_basics'],
      rewards: { points: 500, xp: 250 },
      tasks: [
        {
          id: 'adv_math_1',
          title: '代数入门',
          description: '学习基本的代数概念',
          difficulty: 'hard' as const,
          xp: 80,
          points: 150,
          completed: false
        }
      ]
    }
  ]);

  // 🤖 用户分析数据
  const [userAnalytics] = useState({
    preferredCategories: ['学习', '阅读'],
    preferredDifficulty: 'medium',
    averageCompletionTime: 25,
    mostActiveHours: [9, 10, 16, 17, 19, 20],
    streakCategories: ['学习', '阅读'],
    weakCategories: ['运动']
  });

  // ⏰ 用户当前可用时间
  const [availableTime, setAvailableTime] = useState(45); // 分钟

  // 🏆 成就系统数据
  const [achievementsData] = useState([
    {
      id: 'first_task',
      title: '初出茅庐',
      description: '完成你的第一个任务',
      category: 'milestone' as const,
      type: 'bronze' as const,
      icon: '🌟',
      progress: 1,
      maxProgress: 1,
      isUnlocked: true,
      isCompleted: true,
      dateCompleted: '2025-01-05',
      requirements: ['完成任意一个任务'],
      rewards: { points: 100, xp: 50 },
      rarity: 'common' as const
    },
    {
      id: 'streak_master',
      title: '连击大师',
      description: '达成7天连击',
      category: 'streak' as const,
      type: 'silver' as const,
      icon: '🔥',
      progress: 5,
      maxProgress: 7,
      isUnlocked: true,
      isCompleted: false,
      requirements: ['在任意类别中达成7天连击'],
      rewards: { points: 300, xp: 150, title: '连击大师' },
      rarity: 'rare' as const
    },
    {
      id: 'social_butterfly',
      title: '社交达人',
      description: '与家庭成员互动100次',
      category: 'social' as const,
      type: 'gold' as const,
      icon: '🦋',
      progress: 45,
      maxProgress: 100,
      isUnlocked: true,
      isCompleted: false,
      requirements: ['点赞、评论、鼓励家庭成员达到100次'],
      rewards: { points: 500, xp: 250, badge: '社交徽章' },
      rarity: 'epic' as const
    },
    {
      id: 'legend_learner',
      title: '传说学者',
      description: '达到20级并完成所有基础技能',
      category: 'mastery' as const,
      type: 'legendary' as const,
      icon: '👑',
      progress: 6,
      maxProgress: 20,
      isUnlocked: true,
      isCompleted: false,
      requirements: ['达到20级', '完成所有基础技能树'],
      rewards: { points: 2000, xp: 1000, title: '传说学者', badge: '传说徽章' },
      rarity: 'legendary' as const
    },
    {
      id: 'hidden_gem',
      title: '隐藏宝石',
      description: '发现隐藏的特殊任务',
      category: 'special' as const,
      type: 'diamond' as const,
      icon: '💎',
      progress: 0,
      maxProgress: 1,
      isUnlocked: false,
      isCompleted: false,
      requirements: ['完成特定条件解锁'],
      rewards: { points: 1000, xp: 500, title: '探索者' },
      rarity: 'mythic' as const
    }
  ]);

  // 👥 社交数据
  const [socialData, setSocialData] = useState({
    posts: [
      {
        id: 'post_1',
        authorId: '2',
        authorName: '小红',
        authorAvatar: '👧',
        content: '今天完成了数学作业，感觉自己越来越厉害了！💪',
        type: 'task_complete' as const,
        timestamp: '2025-01-06T15:30:00Z',
        likes: ['1', '3'],
        comments: [
          {
            id: 'comment_1',
            authorId: '1',
            authorName: '小明',
            authorAvatar: '👦',
            content: '太棒了！我也要加油！',
            timestamp: '2025-01-06T15:35:00Z',
            likes: ['2']
          }
        ],
        isHighlighted: true
      },
      {
        id: 'post_2',
        authorId: '1',
        authorName: '小明',
        authorAvatar: '👦',
        content: '刚刚达成了阅读21天连击！感谢大家的鼓励！',
        type: 'streak' as const,
        timestamp: '2025-01-06T14:20:00Z',
        likes: ['2', '3'],
        comments: [],
        attachments: [
          {
            type: 'achievement' as const,
            data: {
              icon: '📚',
              title: '阅读连击王',
              description: '21天阅读连击达成'
            }
          }
        ]
      }
    ],
    encouragements: [
      {
        id: 'enc_1',
        fromId: '2',
        fromName: '小红',
        fromAvatar: '👧',
        toId: '1',
        toName: '小明',
        type: 'cheer',
        message: '哥哥加油！你是最棒的！',
        timestamp: '2025-01-06T16:00:00Z',
        isRead: false
      },
      {
        id: 'enc_2',
        fromId: 'parent_1',
        fromName: '爸爸',
        fromAvatar: '👨',
        toId: '1',
        toName: '小明',
        type: 'crown',
        message: '今天的表现让爸爸很骄傲！',
        timestamp: '2025-01-06T18:30:00Z',
        isRead: false
      }
    ]
  });

  // 🎨 头像定制数据
  const [avatarData, setAvatarData] = useState({
    current: {
      skin: '😊',
      hair: '🦱',
      eyes: '👀',
      mouth: '😄',
      outfit: '👕',
      accessory: '🎓',
      background: '🌈',
      level: experienceData.level
    },
    items: [
      // 肌肤
      { id: 'skin_1', name: '开心', emoji: '😊', category: 'skin' as const, cost: 0, isUnlocked: true, description: '基础开心表情', rarity: 'common' as const },
      { id: 'skin_2', name: '酷炫', emoji: '😎', category: 'skin' as const, cost: 100, isUnlocked: false, description: '酷炫表情', rarity: 'rare' as const },
      { id: 'skin_3', name: '淘气', emoji: '😜', category: 'skin' as const, cost: 200, isUnlocked: false, requiredLevel: 5, description: '淘气表情', rarity: 'epic' as const },
      
      // 发型
      { id: 'hair_1', name: '卷发', emoji: '🦱', category: 'hair' as const, cost: 0, isUnlocked: true, description: '基础卷发', rarity: 'common' as const },
      { id: 'hair_2', name: '直发', emoji: '👱', category: 'hair' as const, cost: 150, isUnlocked: false, description: '时尚直发', rarity: 'rare' as const },
      { id: 'hair_3', name: '彩虹发', emoji: '🌈', category: 'hair' as const, cost: 500, isUnlocked: false, requiredLevel: 10, description: '神奇彩虹发色', rarity: 'legendary' as const },
      
      // 眼睛
      { id: 'eyes_1', name: '普通', emoji: '👀', category: 'eyes' as const, cost: 0, isUnlocked: true, description: '基础眼睛', rarity: 'common' as const },
      { id: 'eyes_2', name: '星星眼', emoji: '⭐', category: 'eyes' as const, cost: 200, isUnlocked: false, description: '闪亮星星眼', rarity: 'rare' as const },
      
      // 嘴巴  
      { id: 'mouth_1', name: '微笑', emoji: '😄', category: 'mouth' as const, cost: 0, isUnlocked: true, description: '基础微笑', rarity: 'common' as const },
      { id: 'mouth_2', name: '大笑', emoji: '😆', category: 'mouth' as const, cost: 100, isUnlocked: false, description: '开心大笑', rarity: 'rare' as const },
      
      // 服装
      { id: 'outfit_1', name: 'T恤', emoji: '👕', category: 'outfit' as const, cost: 0, isUnlocked: true, description: '基础T恤', rarity: 'common' as const },
      { id: 'outfit_2', name: '超级英雄', emoji: '🦸', category: 'outfit' as const, cost: 300, isUnlocked: false, description: '超级英雄服装', rarity: 'epic' as const },
      { id: 'outfit_3', name: '学者袍', emoji: '🧙', category: 'outfit' as const, cost: 800, isUnlocked: false, requiredLevel: 15, description: '智慧学者长袍', rarity: 'legendary' as const },
      
      // 配饰
      { id: 'accessory_1', name: '学士帽', emoji: '🎓', category: 'accessory' as const, cost: 0, isUnlocked: true, description: '基础学士帽', rarity: 'common' as const },
      { id: 'accessory_2', name: '皇冠', emoji: '👑', category: 'accessory' as const, cost: 500, isUnlocked: false, requiredLevel: 8, description: '荣耀皇冠', rarity: 'epic' as const },
      { id: 'accessory_3', name: '光环', emoji: '😇', category: 'accessory' as const, cost: 1000, isUnlocked: false, requiredLevel: 20, description: '神圣光环', rarity: 'legendary' as const },
      
      // 背景
      { id: 'bg_1', name: '彩虹', emoji: '🌈', category: 'background' as const, cost: 0, isUnlocked: true, description: '基础彩虹背景', rarity: 'common' as const },
      { id: 'bg_2', name: '星空', emoji: '⭐', category: 'background' as const, cost: 300, isUnlocked: false, description: '神秘星空', rarity: 'rare' as const },
      { id: 'bg_3', name: '魔法', emoji: '✨', category: 'background' as const, cost: 600, isUnlocked: false, requiredLevel: 12, description: '魔法光芒', rarity: 'epic' as const }
    ]
  });

  // 任务历史数据
  const [taskHistory] = useState([
    {
      id: "1",
      title: "完成数学作业",
      description: "按时完成今天的数学练习题",
      points: 100,
      completedAt: "2025-01-06T10:30:00Z",
      category: "学习",
      streak: 5
    },
    {
      id: "2", 
      title: "整理房间",
      description: "把房间收拾干净整齐",
      points: 80,
      completedAt: "2025-01-05T16:00:00Z",
      category: "家务"
    },
    {
      id: "3",
      title: "阅读30分钟",
      description: "阅读课外书籍30分钟",
      points: 60,
      completedAt: "2025-01-05T19:00:00Z",
      category: "阅读",
      streak: 3
    },
    {
      id: "4",
      title: "户外运动1小时",
      description: "在小区公园跑步和锻炼",
      points: 120,
      completedAt: "2025-01-04T17:30:00Z",
      category: "运动"
    }
  ]);

  // 奖励数据
  const [rewards] = useState([
    {
      id: "1",
      title: "乐高积木套装",
      description: "经典城市系列，包含警察局和消防站",
      cost: 2500,
      category: "玩具",
      available: true,
      image: "https://images.unsplash.com/photo-1613825787641-2dbbd4f96a1c?w=300"
    },
    {
      id: "2",
      title: "儿童图书套装",
      description: "包含5本精选儿童文学作品",
      cost: 800,
      category: "图书",
      available: true
    },
    {
      id: "3",
      title: "游乐园门票",
      description: "迪士尼乐园一日游门票",
      cost: 5000,
      category: "户外",
      available: true
    },
    {
      id: "4",
      title: "平板电脑",
      description: "iPad Air 适合学习和娱乐",
      cost: 8000,
      category: "电子",
      available: false
    },
    {
      id: "5",
      title: "美味零食大礼包",
      description: "包含各种健康美味的儿童零食",
      cost: 300,
      category: "零食",
      available: true
    },
    {
      id: "6",
      title: "新款运动鞋",
      description: "Nike儿童运动鞋，舒适透气",
      cost: 1500,
      category: "服装",
      available: true
    }
  ]);

  // 家庭成员数据
  const [familyMembers] = useState([
    {
      id: "1",
      name: "小明",
      points: 2580,
      isCurrentUser: true,
      weeklyGrowth: 350
    },
    {
      id: "2", 
      name: "小红",
      points: 3200,
      weeklyGrowth: 180
    },
    {
      id: "3",
      name: "小强",
      points: 1950,
      weeklyGrowth: -50
    }
  ]);

  // 家长端数据
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: "1",
      childName: "小明",
      rewardTitle: "乐高积木套装",
      pointsCost: 2500,
      requestedAt: "2025-01-06T14:30:00Z",
      category: "玩具"
    },
    {
      id: "2",
      childName: "小红",
      rewardTitle: "儿童图书套装",
      pointsCost: 800,
      requestedAt: "2025-01-06T12:15:00Z",
      category: "图书"
    }
  ]);

  const [redemptionHistory, setRedemptionHistory] = useState([
    {
      id: "1",
      childName: "小强",
      rewardTitle: "美味零食大礼包",
      pointsCost: 300,
      approvedAt: "2025-01-05T10:00:00Z",
      status: "fulfilled" as const
    },
    {
      id: "2",
      childName: "小明",
      rewardTitle: "新款运动鞋",
      pointsCost: 1500,
      approvedAt: "2025-01-04T16:20:00Z",
      status: "approved" as const
    }
  ]);

  // 打卡习惯数据
  const [habitStreaks] = useState([
    {
      id: "1",
      category: "学习",
      currentStreak: 5,
      maxStreak: 8,
      lastCompletedDate: "2025-01-06",
      icon: "📚",
      color: "blue"
    },
    {
      id: "2",
      category: "运动",
      currentStreak: 12,
      maxStreak: 15,
      lastCompletedDate: "2025-01-05",
      icon: "🏃",
      color: "green"
    },
    {
      id: "3",
      category: "阅读",
      currentStreak: 21,
      maxStreak: 21,
      lastCompletedDate: "2025-01-06",
      icon: "📖",
      color: "purple"
    }
  ]);

  // 🚀 第五阶段：家庭协作与数据洞察系统数据
  
  // 家庭协作任务数据
  const [collaborativeTasks, setCollaborativeTasks] = useState([
    {
      id: 'collab_1',
      title: '家庭大扫除挑战',
      description: '全家一起进行大扫除，每个人负责不同的区域',
      category: 'household',
      type: 'collaborative' as const,
      difficulty: 'medium' as const,
      totalPoints: 500,
      participants: [
        {
          memberId: '1',
          role: 'leader' as const,
          progress: 60,
          contribution: 25,
          status: 'active' as const
        },
        {
          memberId: '2',
          role: 'participant' as const,
          progress: 80,
          contribution: 35,
          status: 'active' as const
        }
      ],
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: '1',
      status: 'active' as const,
      requirements: ['客厅整理', '厨房清洁', '卧室整理'],
      rewards: {
        individual: 150,
        bonus: 100,
        badges: ['🏠', '✨'],
        title: '整理小能手'
      },
      progress: 70,
      milestones: [
        {
          id: 'milestone_1',
          title: '25%完成',
          description: '任务进度达到25%',
          targetProgress: 25,
          reward: 50,
          completed: true,
          completedBy: '2',
          completedAt: '2025-01-05T14:00:00Z'
        },
        {
          id: 'milestone_2',
          title: '50%完成',
          description: '任务进度达到50%',
          targetProgress: 50,
          reward: 75,
          completed: true,
          completedBy: '1',
          completedAt: '2025-01-05T16:30:00Z'
        },
        {
          id: 'milestone_3',
          title: '75%完成',
          description: '任务进度达到75%',
          targetProgress: 75,
          reward: 100,
          completed: false
        }
      ]
    }
  ]);

  // 家庭挑战数据
  const [familyChallenges, setFamilyChallenges] = useState([
    {
      id: 'challenge_1',
      title: '新年学习冲刺',
      description: '1月份学习任务完成挑战，看看谁能获得最多积分',
      theme: 'learning',
      duration: 31,
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-31T23:59:59Z',
      participants: ['1', '2', '3'],
      leaderboard: [
        {
          memberId: '2',
          score: 1580,
          badges: ['🥇', '📚', '⭐']
        },
        {
          memberId: '1',
          score: 1420,
          badges: ['🥈', '💪']
        },
        {
          memberId: '3',
          score: 980,
          badges: ['🥉']
        }
      ],
      prizes: {
        first: { points: 1000, title: '学习冠军', badge: '👑' },
        second: { points: 500, title: '勤奋学者', badge: '🏆' },
        third: { points: 300, title: '积极参与', badge: '🌟' },
        participation: { points: 100, badge: '🎯' }
      },
      status: 'active' as const
    }
  ]);

  // 数据分析数据
  const [analyticsData] = useState({
    overview: {
      totalTasks: 47,
      completedTasks: 42,
      totalPoints: 2580,
      currentStreak: 12,
      averageScore: 89,
      weeklyGrowth: 15
    },
    timeAnalysis: {
      daily: [
        { date: '01-01', tasks: 3, points: 240, xp: 180, streak: 8 },
        { date: '01-02', tasks: 5, points: 320, xp: 240, streak: 9 },
        { date: '01-03', tasks: 2, points: 160, xp: 120, streak: 10 },
        { date: '01-04', tasks: 4, points: 280, xp: 210, streak: 11 },
        { date: '01-05', tasks: 6, points: 380, xp: 285, streak: 12 },
        { date: '01-06', tasks: 3, points: 220, xp: 165, streak: 12 },
        { date: '01-07', tasks: 4, points: 300, xp: 225, streak: 12 }
      ],
      weekly: [
        { week: '第1周', tasks: 18, points: 1240, averageTime: 45, efficiency: 85 },
        { week: '第2周', tasks: 22, points: 1580, averageTime: 42, efficiency: 92 },
        { week: '第3周', tasks: 19, points: 1320, averageTime: 48, efficiency: 78 },
        { week: '第4周', tasks: 25, points: 1780, averageTime: 38, efficiency: 95 }
      ],
      monthly: [
        { month: '10月', tasks: 68, points: 4200, growth: 12 },
        { month: '11月', tasks: 75, points: 4890, growth: 18 },
        { month: '12月', tasks: 82, points: 5320, growth: 22 }
      ]
    },
    categoryAnalysis: {
      performance: [
        { category: '学习', completed: 18, total: 22, averageScore: 92, timeSpent: 380, color: '#58CC02' },
        { category: '运动', completed: 8, total: 12, averageScore: 78, timeSpent: 240, color: '#1CB0F6' },
        { category: '家务', completed: 12, total: 15, averageScore: 85, timeSpent: 180, color: '#FF9600' },
        { category: '创意', completed: 6, total: 8, averageScore: 88, timeSpent: 150, color: '#CE82FF' },
        { category: '社交', completed: 4, total: 5, averageScore: 95, timeSpent: 120, color: '#FF9CE5' }
      ],
      preferences: [
        { category: '学习', value: 35, color: '#58CC02' },
        { category: '家务', value: 25, color: '#FF9600' },
        { category: '运动', value: 20, color: '#1CB0F6' },
        { category: '创意', value: 15, color: '#CE82FF' },
        { category: '社交', value: 5, color: '#FF9CE5' }
      ]
    },
    skillAnalysis: {
      strengths: ['数学计算', '阅读理解', '时间管理', '创意思维'],
      improvements: ['体育运动', '手工制作', '社交沟通'],
      radar: [
        { skill: '学术能力', current: 88, potential: 95 },
        { skill: '运动技能', current: 65, potential: 85 },
        { skill: '创造力', current: 82, potential: 90 },
        { skill: '社交能力', current: 70, potential: 88 },
        { skill: '自理能力', current: 85, potential: 92 },
        { skill: '专注力', current: 90, potential: 95 }
      ]
    },
    habitsAnalysis: {
      streaks: [
        { habit: '学习打卡', current: 12, longest: 18, consistency: 85 },
        { habit: '运动锻炼', current: 3, longest: 8, consistency: 62 },
        { habit: '阅读习惯', current: 21, longest: 21, consistency: 95 }
      ],
      patterns: [
        { time: '06:00', activity: 20 },
        { time: '08:00', activity: 85 },
        { time: '10:00', activity: 95 },
        { time: '12:00', activity: 60 },
        { time: '14:00', activity: 75 },
        { time: '16:00', activity: 90 },
        { time: '18:00', activity: 70 },
        { time: '20:00', activity: 80 },
        { time: '22:00', activity: 30 }
      ]
    },
    predictions: {
      nextWeekPoints: 450,
      levelUpDate: '2025-01-15',
      recommendedGoals: [
        { goal: '提升运动频率', probability: 85, impact: 'high' },
        { goal: '增加社交活动', probability: 70, impact: 'medium' },
        { goal: '培养新兴趣', probability: 60, impact: 'low' }
      ]
    }
  });

  // 通知数据
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      type: 'achievement' as const,
      title: '🏆 新成就解锁！',
      message: '恭喜获得"连击大师"成就，已达成7天学习连击！',
      timestamp: '2025-01-06T15:30:00Z',
      isRead: false,
      isImportant: true,
      actionLabel: '查看成就',
      metadata: {
        points: 300,
        badge: '🔥',
        achievementId: 'streak_master'
      }
    },
    {
      id: 'notif_2',
      type: 'social' as const,
      title: '💕 收到家人鼓励',
      message: '小红给你点赞并评论："哥哥真棒！继续加油！"',
      timestamp: '2025-01-06T14:15:00Z',
      isRead: false,
      isImportant: false,
      senderAvatar: '👧',
      senderName: '小红',
      actionLabel: '回复',
      metadata: {
        familyMemberId: '2'
      }
    },
    {
      id: 'notif_3',
      type: 'task' as const,
      title: '📚 任务提醒',
      message: '别忘了完成今天的数学作业哦！还有2小时截止。',
      timestamp: '2025-01-06T13:00:00Z',
      isRead: true,
      isImportant: false,
      actionLabel: '开始任务',
      metadata: {
        taskId: 'math_homework'
      }
    },
    {
      id: 'notif_4',
      type: 'family' as const,
      title: '👨‍👩‍👧‍👦 家庭协作',
      message: '爸爸邀请你参加"家庭大扫除挑战"，一起来完成吧！',
      timestamp: '2025-01-06T10:20:00Z',
      isRead: true,
      isImportant: true,
      senderAvatar: '👨',
      senderName: '爸爸',
      actionLabel: '参加挑战',
      metadata: {
        taskId: 'collab_1'
      }
    }
  ]);

  // 通知设置
  const [notificationSettings, setNotificationSettings] = useState({
    achievements: true,
    social: true,
    tasks: true,
    system: true,
    reminders: true,
    family: true,
    sound: true,
    push: true,
    email: false,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    }
  });

  // 当前分析周期
  const [currentPeriod, setCurrentPeriod] = useState<'week' | 'month' | 'year'>('week');

  // 🧭 智能导航处理函数
  const handleTabChange = (newTab: string) => {
    // 使用导航服务进行智能切换
    const navigationResult = navigation.navigate(newTab as any, `用户主动切换到${newTab}页面`);
    
    setCurrentTab(newTab);
    
    // 显示导航建议（如果有的话）
    if (navigationResult.guidance && !navigationResult.recommended) {
      toast.info(`💡 导航提示`, {
        description: navigationResult.guidance,
        duration: 3000,
      });
    }
    
    // 更新导航推荐
    const recommendation = navigation.getRecommendation();
    setNavigationRecommendation(recommendation);
  };

  const handleSmartNavigation = (context: any) => {
    const recommendation = navigation.getRecommendation(context);
    
    if (recommendation.confidence > 0.8) {
      // 高置信度推荐，显示建议
      toast.success(`🚀 建议下一步`, {
        description: `${recommendation.reason}，前往${NAVIGATION_MAP[recommendation.recommended as any]?.title}`,
        action: {
          label: "前往",
          onClick: () => handleTabChange(recommendation.recommended)
        },
        duration: 6000,
      });
    }
  };

  // 处理任务完成（从任务规划页面）- 使用业务逻辑服务
  const handleTaskCompletedFromPlanning = (task: any) => {
    // 使用业务逻辑服务计算积分
    const taskData = {
      id: task.id || `task_${Date.now()}`,
      title: task.title || '学习任务',
      description: task.description || '',
      category: 'medium' as const, // 根据实际任务类型映射
      estimatedMinutes: task.estimatedMinutes || 30,
      difficulty: task.difficulty || 'medium' as const,
      skillType: task.category || '学习'
    };
    
    const pointsResult = BusinessLogicService.calculateTaskPoints(taskData, studentData.level);
    
    // 更新积分和经验值
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + pointsResult.points
    }));
    
    setExperienceData(prev => ({
      ...prev,
      currentXP: prev.currentXP + pointsResult.xp,
      dailyProgress: prev.dailyProgress + pointsResult.xp
    }));

    // 记录用户活动 - 使用增强版追踪
    ActivityTracker.trackEnhanced({
      type: 'task_complete',
      data: {
        taskId: taskData.id,
        title: taskData.title,
        pointsEarned: pointsResult.points,
        xpEarned: pointsResult.xp,
        difficulty: taskData.difficulty,
        category: taskData.category,
        reasoning: pointsResult.reasoning,
        estimatedMinutes: taskData.estimatedMinutes,
        skillType: taskData.skillType
      }
    });

    // 显示成功提示
    toast.success(`🎉 任务完成！`, {
      description: `获得 ${pointsResult.points} 积分, ${pointsResult.xp} 经验值`,
      duration: 4000,
    });

    // 检查成就解锁
    if (pointsResult.achievements && pointsResult.achievements.length > 0) {
      pointsResult.achievements.forEach(achievement => {
        toast.success(`🏆 解锁成就：${achievement}`, {
          description: '前往成就页面查看详情',
          duration: 6000,
        });
      });
    }

    // 智能导航推荐
    handleSmartNavigation({
      tasksCompleted: 1,
      pointsEarned: pointsResult.points,
      achievementUnlocked: pointsResult.achievements && pointsResult.achievements.length > 0
    });
  };

  // 处理打卡奖励领取
  const handleClaimHabitReward = (category: string, milestone: number) => {
    const rewardPoints = milestone === 7 ? 200 : milestone === 14 ? 400 : milestone === 21 ? 800 : milestone * 20;
    
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + rewardPoints
    }));

    // 显示庆祝动画
    setCelebration({
      show: true,
      type: 'milestone',
      message: `${milestone}天里程碑！`,
      subMessage: `${category}打卡获得 ${rewardPoints} 积分！`
    });

    setTimeout(() => {
      setCelebration(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 🎮 游戏化系统处理函数
  
  // 连击系统
  const handleRestoreStreak = (category: string, cost: number) => {
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints - cost
    }));
    
    setStreakData(prev => 
      prev.map(streak => 
        streak.category === category
          ? { ...streak, current: streak.current + 1, brokenYesterday: false }
          : streak
      )
    );
  };

  const handleClaimStreakMilestone = (category: string, milestone: number) => {
    const rewardPoints = milestone === 7 ? 200 : milestone === 14 ? 500 : milestone === 21 ? 1000 : milestone * 15;
    
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + rewardPoints
    }));

    // 显示庆祝动画
    setCelebration({
      show: true,
      type: 'streak',
      message: `${milestone}天连击达成！`,
      subMessage: `${category} 获得 ${rewardPoints} 积分奖励！`
    });

    setTimeout(() => {
      setCelebration(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 经验系统
  const handleSetDailyGoal = (goal: number) => {
    setExperienceData(prev => ({
      ...prev,
      dailyGoal: goal
    }));
  };

  const handleClaimDailyReward = () => {
    const rewardPoints = Math.floor(experienceData.dailyGoal * 0.3);
    
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + rewardPoints
    }));

    setExperienceData(prev => ({
      ...prev,
      dailyProgress: 0 // 重置每日进度
    }));

    // 显示庆祝动画
    setCelebration({
      show: true,
      type: 'daily',
      message: '每日目标完成！',
      subMessage: `获得 ${rewardPoints} 积分奖励！`
    });

    setTimeout(() => {
      setCelebration(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 生命值系统
  const handleBuyHearts = (cost: number) => {
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints - cost
    }));

    setLifeData(prev => ({
      ...prev,
      currentHearts: prev.maxHearts,
      lastRegenTime: new Date().toISOString()
    }));
  };

  const handleWatchAd = () => {
    setLifeData(prev => ({
      ...prev,
      currentHearts: Math.min(prev.currentHearts + 1, prev.maxHearts),
      lastRegenTime: new Date().toISOString()
    }));
  };

  // 🌟 技能树处理函数
  const handleStartTask = (skillId: string, taskId: string) => {
    // 这里可以跳转到任务执行页面或添加到计划中
    toast.success('📋 任务已添加到计划中！', {
      description: '前往任务规划页面开始执行',
      duration: 4000,
    });
  };

  const handleUnlockSkill = (skillId: string, cost: number) => {
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints - cost
    }));
  };

  // 🤖 智能推荐处理函数
  const handleAcceptRecommendedTask = (taskId: string) => {
    // 接受推荐任务的逻辑
    console.log('接受推荐任务:', taskId);
  };

  const handleRejectRecommendedTask = (taskId: string, reason?: string) => {
    // 拒绝推荐任务的逻辑
    console.log('拒绝推荐任务:', taskId, reason);
  };

  const handleTaskFeedback = (taskId: string, helpful: boolean) => {
    toast.success(helpful ? '👍 感谢反馈！' : '👎 我们会改进推荐', {
      description: helpful ? '这将帮助我们提供更好的推荐' : '你的反馈有助于改善AI推荐',
      duration: 3000,
    });
  };

  // 🏆 成就系统处理函数
  const handleClaimAchievementReward = (achievementId: string) => {
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (!achievement) return;

    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + achievement.rewards.points
    }));

    setExperienceData(prev => ({
      ...prev,
      currentXP: prev.currentXP + achievement.rewards.xp
    }));
  };

  // 👥 社交系统处理函数
  const currentUserId = studentData.name === '小明' ? '1' : '2'; // 添加当前用户ID定义
  
  const handleLikePost = (postId: string) => {
    setSocialData(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        post.id === postId
          ? {
              ...post,
              likes: post.likes.includes(currentUserId)
                ? post.likes.filter(id => id !== currentUserId)
                : [...post.likes, currentUserId]
            }
          : post
      )
    }));
  };

  const handleCommentPost = (postId: string, content: string) => {
    const newComment = {
      id: `comment_${Date.now()}`,
      authorId: currentUserId,
      authorName: studentData.name,
      authorAvatar: '👦',
      content,
      timestamp: new Date().toISOString(),
      likes: []
    };

    setSocialData(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    }));
  };

  const handleSendEncouragement = (toId: string, type: string, message: string) => {
    const newEncouragement = {
      id: `enc_${Date.now()}`,
      fromId: currentUserId,
      fromName: studentData.name,
      fromAvatar: '👦',
      toId,
      toName: familyMembers.find(m => m.id === toId)?.name || '',
      type,
      message,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setSocialData(prev => ({
      ...prev,
      encouragements: [newEncouragement, ...prev.encouragements]
    }));
  };

  const handleCreatePost = (content: string, type: string) => {
    const newPost = {
      id: `post_${Date.now()}`,
      authorId: currentUserId,
      authorName: studentData.name,
      authorAvatar: '👦',
      content,
      type: type as any,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: []
    };

    setSocialData(prev => ({
      ...prev,
      posts: [newPost, ...prev.posts]
    }));
  };

  // 🎨 头像系统处理函数
  const handleSaveAvatar = (config: any) => {
    setAvatarData(prev => ({
      ...prev,
      current: config
    }));
  };

  const handleUnlockAvatarItem = (itemId: string, cost: number) => {
    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints - cost
    }));

    setAvatarData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, isUnlocked: true } : item
      )
    }));
  };

  // 处理奖励兑换
  const handleRedeem = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (studentData.currentPoints < reward.cost) {
      toast.error("积分不足！继续完成任务来获得更多积分吧 💪");
      return;
    }

    // 显示庆祝动画
    setCelebration({
      show: true,
      type: 'reward',
      message: '兑换申请已提交！',
      subMessage: `${reward.title} 等待家长审批中...`
    });

    setTimeout(() => {
      setCelebration(prev => ({ ...prev, show: false }));
    }, 4000);

    // 添加到待审批列表
    const newApproval = {
      id: `pending_${Date.now()}`,
      childName: studentData.name,
      rewardTitle: reward.title,
      pointsCost: reward.cost,
      requestedAt: new Date().toISOString(),
      category: reward.category
    };
    setPendingApprovals(prev => [newApproval, ...prev]);
  };

  // 家长审批功能
  const handleApprove = (approvalId: string) => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;

    // 移除待审批项
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
    
    // 添加到历史记录
    const newRecord = {
      id: `history_${Date.now()}`,
      childName: approval.childName,
      rewardTitle: approval.rewardTitle,
      pointsCost: approval.pointsCost,
      approvedAt: new Date().toISOString(),
      status: "approved" as const
    };
    setRedemptionHistory(prev => [newRecord, ...prev]);

    toast.success(`已批准 ${approval.childName} 的兑换申请！✅`);
  };

  const handleReject = (approvalId: string) => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;

    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
    toast.error(`已拒绝 ${approval?.childName} 的兑换申请`);
  };

  const handleMarkFulfilled = (recordId: string) => {
    setRedemptionHistory(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, status: "fulfilled" as const }
          : record
      )
    );
    toast.success("已标记为发放完成！🎁");
  };

  // 🚀 第五阶段处理函数
  
  // 家庭协作处理函数
  const handleCreateCollaborativeTask = (task: any) => {
    setCollaborativeTasks(prev => [task, ...prev]);
    
    // 添加通知
    const newNotification = {
      id: `notif_${Date.now()}`,
      type: 'family' as const,
      title: '🎯 新协作任务',
      message: `新任务"${task.title}"已创建，快来参与吧！`,
      timestamp: new Date().toISOString(),
      isRead: false,
      isImportant: true,
      actionLabel: '查看任务',
      metadata: {
        taskId: task.id
      }
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleJoinCollaborativeTask = (taskId: string, userId: string) => {
    setCollaborativeTasks(prev => 
      prev.map(task => 
        task.id === taskId
          ? {
              ...task,
              participants: [
                ...task.participants,
                {
                  memberId: userId,
                  role: 'participant' as const,
                  progress: 0,
                  contribution: 0,
                  status: 'active' as const
                }
              ]
            }
          : task
      )
    );

    toast.success('🎉 成功加入协作任务！');
  };

  const handleUpdateCollaborativeProgress = (taskId: string, userId: string, progress: number) => {
    setCollaborativeTasks(prev => 
      prev.map(task => 
        task.id === taskId
          ? {
              ...task,
              participants: task.participants.map(p => 
                p.memberId === userId ? { ...p, progress } : p
              ),
              progress: Math.round(task.participants.reduce((sum, p) => sum + (p.memberId === userId ? progress : p.progress), 0) / task.participants.length)
            }
          : task
      )
    );
  };

  const handleCompleteCollaborativeTask = (taskId: string, userId: string) => {
    const task = collaborativeTasks.find(t => t.id === taskId);
    if (!task) return;

    setStudentData(prev => ({
      ...prev,
      currentPoints: prev.currentPoints + task.rewards.individual
    }));

    // 显示庆祝动画
    setCelebration({
      show: true,
      type: 'reward',
      message: '协作任务完成！',
      subMessage: `获得 ${task.rewards.individual} 积分奖励！`
    });

    setTimeout(() => {
      setCelebration(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleCreateFamilyChallenge = (challenge: any) => {
    setFamilyChallenges(prev => [challenge, ...prev]);
  };

  const handleJoinFamilyChallenge = (challengeId: string, userId: string) => {
    setFamilyChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId
          ? {
              ...challenge,
              participants: [...challenge.participants, userId]
            }
          : challenge
      )
    );
  };

  // 通知处理函数
  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleUpdateNotificationSettings = (settings: any) => {
    setNotificationSettings(settings);
    toast.success('通知设置已更新！');
  };

  const handleNotificationAction = (notification: any) => {
    // 根据通知类型执行相应操作
    if (notification.actionLabel === '查看成就') {
      // 跳转到成就页面的逻辑
      toast.success('正在查看成就详情...');
    } else if (notification.actionLabel === '开始任务') {
      // 跳转到任务页面的逻辑
      toast.success('正在打开任务...');
    } else if (notification.actionLabel === '参加挑战') {
      // 参加家庭挑战的逻辑
      toast.success('正在参加挑战...');
    }
    
    // 标记为已读
    handleMarkNotificationAsRead(notification.id);
  };

  // 分析数据处理函数
  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setCurrentPeriod(period);
  };

  // 统计未读通知数量
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-duolingo-green-subtle via-duolingo-blue-subtle to-duolingo-purple-subtle">
      <Toaster position="top-center" richColors />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 🎨 Duolingo 风格角色切换器 */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
        >
          <div className="bg-white rounded-[2rem] p-2 shadow-2xl border-4 border-duolingo-green-subtle relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-duolingo-green-subtle/30 via-white to-duolingo-blue-subtle/30"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-green via-duolingo-orange to-duolingo-blue rounded-t-[2rem]"></div>
            
            <div className="relative z-10 flex">
              <Button
                variant={currentUser === "student" ? "default" : "ghost"}
                onClick={() => setCurrentUser("student")}
                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-lg transition-all duration-300 transform ${
                  currentUser === "student" 
                    ? "bg-gradient-to-r from-duolingo-green to-duolingo-green-light text-white shadow-xl shadow-duolingo-green/30 scale-105" 
                    : "text-warm-gray-600 hover:text-duolingo-green hover:bg-duolingo-green-subtle hover:scale-102"
                }`}
              >
                <motion.div
                  whileHover={{ rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <User className="w-5 h-5" />
                </motion.div>
                🎓 学生端
              </Button>
              <Button
                variant={currentUser === "parent" ? "default" : "ghost"}
                onClick={() => setCurrentUser("parent")}
                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-lg transition-all duration-300 transform ${
                  currentUser === "parent" 
                    ? "bg-gradient-to-r from-duolingo-blue to-duolingo-blue-light text-white shadow-xl shadow-duolingo-blue/30 scale-105" 
                    : "text-warm-gray-600 hover:text-duolingo-blue hover:bg-duolingo-blue-subtle hover:scale-102"
                }`}
              >
                <motion.div
                  whileHover={{ rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <UserCheck className="w-5 h-5" />
                </motion.div>
                👨‍👩‍👧‍👦 家长端
              </Button>
            </div>
          </div>
        </motion.div>

        {/* 🔔 通知中心按钮 */}
        <motion.div 
          className="flex justify-end mb-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadNotificationCount}
            settings={notificationSettings}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onDeleteNotification={handleDeleteNotification}
            onUpdateSettings={handleUpdateNotificationSettings}
            onNotificationAction={handleNotificationAction}
          />
        </motion.div>

        {currentUser === "student" ? (
          /* 学生端界面 */
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="mb-8"
              >
                <TabsList className="grid w-full grid-cols-14 bg-gradient-to-r from-white via-warm-gray-50 to-white shadow-2xl rounded-[2rem] p-3 border-4 border-duolingo-green-subtle backdrop-blur-sm relative overflow-hidden min-h-20 h-auto">
                  {/* 🎨 Duolingo 风格背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-duolingo-green-subtle/30 via-duolingo-blue-subtle/20 to-duolingo-purple-subtle/30 rounded-[2rem]"></div>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duolingo-green via-duolingo-orange via-duolingo-blue to-duolingo-purple rounded-t-[2rem]"></div>
                  {/* 装饰圆点 */}
                  <div className="absolute top-4 left-4 w-2 h-2 bg-duolingo-green rounded-full opacity-60"></div>
                  <div className="absolute top-6 right-6 w-3 h-3 bg-duolingo-orange rounded-full opacity-40"></div>
                  <div className="absolute bottom-4 left-1/2 w-2 h-2 bg-duolingo-blue rounded-full opacity-50"></div>
                  
                  {/* 🎨 Duolingo 风格标签按钮 */}
                  <TabsTrigger 
                    value="overview" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-green data-[state=active]:to-duolingo-green-light data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-green/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-green-subtle data-[state=inactive]:hover:text-duolingo-green-dark data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">✨</span>
                      <span className="text-xs font-bold">积分概览</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="rewards" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-orange data-[state=active]:to-duolingo-orange-light data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-orange/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-orange-subtle data-[state=inactive]:hover:text-duolingo-orange-dark data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🎁</span>
                      <span className="text-xs font-bold">兑换奖励</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="planning" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-blue data-[state=active]:to-duolingo-blue-light data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-blue/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-blue-subtle data-[state=inactive]:hover:text-duolingo-blue-dark data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">📅</span>
                      <span className="text-xs font-bold">任务规划</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="habits" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-purple data-[state=active]:to-duolingo-pink data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-purple/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-purple-subtle data-[state=inactive]:hover:text-duolingo-purple data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🔥</span>
                      <span className="text-xs font-bold">打卡习惯</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="history" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-green-dark data-[state=active]:to-duolingo-blue-dark data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-blue/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-blue-subtle data-[state=inactive]:hover:text-duolingo-blue-dark data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">📋</span>
                      <span className="text-xs font-bold">历史记录</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="skilltree" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-pink data-[state=active]:to-duolingo-purple data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-pink/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-pink-subtle data-[state=inactive]:hover:text-duolingo-purple data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🌟</span>
                      <span className="text-xs font-bold">技能树</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="recommendations" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-purple data-[state=active]:to-duolingo-pink data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-purple/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-purple-subtle data-[state=inactive]:hover:text-duolingo-purple data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-bold">AI推荐</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="achievements" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-yellow data-[state=active]:to-duolingo-orange data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-yellow/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-yellow-subtle data-[state=inactive]:hover:text-duolingo-orange-dark data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🏅</span>
                      <span className="text-xs font-bold">成就收集</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="social" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-pink data-[state=active]:to-duolingo-purple data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-pink/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-pink-subtle data-[state=inactive]:hover:text-duolingo-pink data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">👥</span>
                      <span className="text-xs font-bold">社交中心</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="avatar" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-purple data-[state=active]:to-duolingo-pink data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-purple/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-purple-subtle data-[state=inactive]:hover:text-duolingo-purple data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🎨</span>
                      <span className="text-xs font-bold">头像定制</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="leaderboard" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-yellow data-[state=active]:to-duolingo-orange data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-yellow/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-yellow-subtle data-[state=inactive]:hover:text-duolingo-orange-dark data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">🏆</span>
                      <span className="text-xs font-bold">家庭排行</span>
                    </motion.span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="collaboration" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-purple data-[state=active]:to-duolingo-pink data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-purple/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-purple-subtle data-[state=inactive]:hover:text-duolingo-purple data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">👨‍👩‍👧‍👦</span>
                      <span className="text-xs font-bold">家庭协作</span>
                    </motion.span>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="analytics" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-blue data-[state=active]:to-duolingo-purple data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-blue/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-blue-subtle data-[state=inactive]:hover:text-duolingo-blue data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-lg">📊</span>
                      <span className="text-xs font-bold">数据洞察</span>
                    </motion.span>
                  </TabsTrigger>

                  <TabsTrigger 
                    value="notifications" 
                    className="relative z-10 rounded-[1.25rem] font-bold py-4 px-2 transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-duolingo-green data-[state=active]:to-duolingo-blue data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-duolingo-green/40 data-[state=active]:scale-105 data-[state=inactive]:hover:bg-duolingo-green-subtle data-[state=inactive]:hover:text-duolingo-green data-[state=inactive]:text-warm-gray-600"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 text-center relative"
                    >
                      <div className="relative">
                        <span className="text-lg">🔔</span>
                        {unreadNotificationCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold">通知中心</span>
                    </motion.span>
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="overview" className="space-y-6">
                {/* 🎮 游戏化系统概览 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 经验系统 */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <ExperienceSystem
                      currentXP={experienceData.currentXP}
                      level={experienceData.level}
                      dailyGoal={experienceData.dailyGoal}
                      dailyProgress={experienceData.dailyProgress}
                      weeklyXP={experienceData.weeklyXP}
                      onSetDailyGoal={handleSetDailyGoal}
                      onClaimDailyReward={handleClaimDailyReward}
                      canClaimDaily={experienceData.dailyProgress >= experienceData.dailyGoal}
                    />
                  </motion.div>

                  {/* 生命值系统 */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <LifeSystem
                      currentHearts={lifeData.currentHearts}
                      maxHearts={lifeData.maxHearts}
                      heartRegenTime={lifeData.heartRegenTime}
                      lastRegenTime={lifeData.lastRegenTime}
                      userPoints={studentData.currentPoints}
                      onBuyHearts={handleBuyHearts}
                      onWatchAd={handleWatchAd}
                    />
                  </motion.div>
                </div>

                {/* 连击系统 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <StreakSystem
                    streaks={streakData}
                    userPoints={studentData.currentPoints}
                    onRestoreStreak={handleRestoreStreak}
                    onClaimMilestone={handleClaimStreakMilestone}
                  />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 🏆 本周成就 - Duolingo 风格 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="bg-gradient-to-br from-duolingo-yellow-subtle via-duolingo-orange-subtle to-duolingo-yellow-subtle border-4 border-duolingo-yellow/30 shadow-2xl shadow-duolingo-yellow/20 rounded-[2rem] overflow-hidden relative">
                      {/* 装饰背景 */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-duolingo-yellow/20 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-duolingo-orange/20 rounded-full translate-y-8 -translate-x-8"></div>
                      
                      <CardHeader className="relative z-10 pb-4">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          >
                            <Sparkles className="w-7 h-7 text-duolingo-yellow" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-duolingo-orange to-duolingo-yellow bg-clip-text text-transparent">
                            本周成就
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-4">
                        <motion.div 
                          className="flex justify-between items-center p-4 bg-white rounded-[1.5rem] border-2 border-duolingo-blue/20 shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-semibold text-warm-gray-700">📚 完成任务</span>
                          <span className="font-black text-duolingo-blue text-2xl">12次</span>
                        </motion.div>
                        <motion.div 
                          className="flex justify-between items-center p-4 bg-white rounded-[1.5rem] border-2 border-duolingo-green/20 shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-semibold text-warm-gray-700">💎 获得积分</span>
                          <span className="font-black text-duolingo-green text-2xl">+980</span>
                        </motion.div>
                        <motion.div 
                          className="flex justify-between items-center p-4 bg-white rounded-[1.5rem] border-2 border-duolingo-orange/20 shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-semibold text-warm-gray-700">🔥 连续打卡</span>
                          <span className="font-black text-duolingo-orange text-2xl">5天</span>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 近期任务 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <TaskHistory tasks={taskHistory.slice(0, 3)} />
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <RewardCard
                        {...reward}
                        userPoints={studentData.currentPoints}
                        onRedeem={handleRedeem}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="planning">
                <TaskPlanning onTaskCompleted={handleTaskCompletedFromPlanning} />
              </TabsContent>

              <TabsContent value="habits">
                <HabitTracker 
                  habits={habitStreaks} 
                  onClaimReward={handleClaimHabitReward}
                />
              </TabsContent>

              <TabsContent value="history">
                <TaskHistory tasks={taskHistory} />
              </TabsContent>

              <TabsContent value="skilltree">
                <SkillTree 
                  skills={skillTreeData}
                  onStartTask={handleStartTask}
                  onUnlockSkill={handleUnlockSkill}
                  userPoints={studentData.currentPoints}
                />
              </TabsContent>

              <TabsContent value="recommendations">
                <SmartRecommendations
                  userAnalytics={userAnalytics}
                  userLevel={experienceData.level}
                  currentXP={experienceData.currentXP}
                  availableTime={availableTime}
                  onAcceptTask={handleAcceptRecommendedTask}
                  onRejectTask={handleRejectRecommendedTask}
                  onFeedback={handleTaskFeedback}
                />
              </TabsContent>

              <TabsContent value="achievements">
                <AchievementSystem 
                  achievements={achievementsData}
                  userStats={{
                    totalTasks: taskHistory.length,
                    totalStreaks: streakData.reduce((sum, s) => sum + s.current, 0),
                    totalPoints: studentData.currentPoints,
                    totalXP: experienceData.currentXP,
                    maxStreak: Math.max(...streakData.map(s => s.max)),
                    familyInteractions: socialData.encouragements.length + socialData.posts.reduce((sum, p) => sum + p.likes.length + p.comments.length, 0)
                  }}
                  onClaimReward={handleClaimAchievementReward}
                />
              </TabsContent>

              <TabsContent value="social">
                <SocialInteraction
                  currentUserId={studentData.name === '小明' ? '1' : '2'}
                  familyMembers={familyMembers.map(member => ({
                    ...member,
                    avatar: member.name.charAt(0),
                    level: experienceData.level,
                    points: member.points,
                    status: 'online' as const,
                    role: member.name === '小明' || member.name === '小红' || member.name === '小强' ? 'child' as const : 'parent' as const,
                    achievements: [],
                    currentStreak: streakData[0]?.current || 0
                  }))}
                  socialPosts={socialData.posts}
                  encouragements={socialData.encouragements}
                  onLikePost={handleLikePost}
                  onCommentPost={handleCommentPost}
                  onSendEncouragement={handleSendEncouragement}
                  onCreatePost={handleCreatePost}
                />
              </TabsContent>

              <TabsContent value="avatar">
                <PersonalizedAvatar
                  currentAvatar={avatarData.current}
                  availableItems={avatarData.items}
                  userPoints={studentData.currentPoints}
                  userLevel={experienceData.level}
                  onSaveAvatar={handleSaveAvatar}
                  onUnlockItem={handleUnlockAvatarItem}
                />
              </TabsContent>

              <TabsContent value="leaderboard">
                <FamilyLeaderboard members={familyMembers} />
              </TabsContent>

              <TabsContent value="collaboration">
                <FamilyCollaboration
                  familyMembers={familyMembers.map(member => ({
                    ...member,
                    avatar: member.name.charAt(0),
                    level: experienceData.level,
                    role: member.name === '小明' || member.name === '小红' || member.name === '小强' ? 'child' as const : 'parent' as const,
                    isOnline: true
                  }))}
                  currentUserId={studentData.name === '小明' ? '1' : '2'}
                  currentUserRole={currentUser === 'student' ? 'child' : 'parent'}
                  collaborativeTasks={collaborativeTasks}
                  familyChallenges={familyChallenges}
                  onCreateTask={handleCreateCollaborativeTask}
                  onJoinTask={handleJoinCollaborativeTask}
                  onUpdateProgress={handleUpdateCollaborativeProgress}
                  onCompleteTask={handleCompleteCollaborativeTask}
                  onCreateChallenge={handleCreateFamilyChallenge}
                  onJoinChallenge={handleJoinFamilyChallenge}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard
                  analyticsData={analyticsData}
                  currentPeriod={currentPeriod}
                  onPeriodChange={handlePeriodChange}
                />
              </TabsContent>

              <TabsContent value="notifications">
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="text-6xl mb-4">🔔</div>
                    <p className="text-xl font-semibold text-warm-gray-600 mb-2">
                      通知中心
                    </p>
                    <p className="text-warm-gray-500 mb-6">
                      点击右上角的通知按钮查看所有通知和设置
                    </p>
                    
                    {/* 快速通知统计 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-4 bg-duolingo-green-subtle rounded-xl border-2 border-duolingo-green/30"
                      >
                        <div className="text-2xl font-black text-duolingo-green">{unreadNotificationCount}</div>
                        <p className="text-sm text-warm-gray-600">未读消息</p>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-4 bg-duolingo-blue-subtle rounded-xl border-2 border-duolingo-blue/30"
                      >
                        <div className="text-2xl font-black text-duolingo-blue">{notifications.length}</div>
                        <p className="text-sm text-warm-gray-600">总通知数</p>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-4 bg-duolingo-orange-subtle rounded-xl border-2 border-duolingo-orange/30"
                      >
                        <div className="text-2xl font-black text-duolingo-orange">
                          {notifications.filter(n => n.isImportant).length}
                        </div>
                        <p className="text-sm text-warm-gray-600">重要通知</p>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* 家长端界面 */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ParentDashboard
              pendingApprovals={pendingApprovals}
              redemptionHistory={redemptionHistory}
              onApprove={handleApprove}
              onReject={handleReject}
              onMarkFulfilled={handleMarkFulfilled}
            />
          </motion.div>
        )}

        {/* 🎉 庆祝动画系统 */}
        <CelebrationEffect
          show={celebration.show}
          type={celebration.type}
          message={celebration.message}
          subMessage={celebration.subMessage}
          onComplete={() => setCelebration(prev => ({ ...prev, show: false }))}
        />
      </div>
    </div>
  );
}