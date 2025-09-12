import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner@2.0.3";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, Trash2, Plus, GripVertical, Loader2, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TaskLibrary } from "./TaskLibrary";
import { taskService } from '../services';
import type { ScheduledTask as ApiScheduledTask, TaskCategory, TaskDifficulty, TaskTemplate } from '../services/types';

// Use API types but extend for local UI needs
interface ScheduledTaskUI extends Omit<ApiScheduledTask, 'scheduledDate' | 'status' | 'estimatedMinutes'> {
  date: string;
  startTime: string;
  endTime: string;
  estimatedTime: number;
  completed: boolean;
  category: TaskCategory;
  difficulty: TaskDifficulty;
}

const mapApiTaskToUI = (apiTask: ApiScheduledTask): ScheduledTaskUI => {
  const scheduledDate = new Date(apiTask.scheduledDate);
  return {
    ...apiTask,
    _id: apiTask._id,
    id: apiTask._id,
    taskId: apiTask.templateId,
    date: apiTask.scheduledDate.split('T')[0],
    startTime: apiTask.startTime || '09:00',
    endTime: apiTask.endTime || '10:00',
    estimatedTime: (apiTask as any).template?.estimatedMinutes || 30,
    completed: apiTask.status === 'completed',
    category: ((apiTask as any).template?.category || 'other') as TaskCategory,
    difficulty: ((apiTask as any).template?.difficulty || 'medium') as TaskDifficulty,
    title: (apiTask as any).template?.title || apiTask.title || 'Untitled Task',
    description: (apiTask as any).template?.description || apiTask.description || '',
    points: apiTask.pointsAwarded || (apiTask as any).template?.basePoints || 0
  };
};

type ViewMode = 'day' | 'week' | 'month';

interface TaskPlanningProps {
  onTaskCompleted: (task: ScheduledTaskUI) => void;
}

export function TaskPlanning({ onTaskCompleted }: TaskPlanningProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTaskUI | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskUI[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    category: 'learning' as TaskCategory,
    estimatedTime: 30,
    points: 50,
    difficulty: 'medium' as TaskDifficulty,
    date: '',
    startTime: '',
    endTime: ''
  });

  // 计算结束时间
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + duration, 0, 0);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // Fetch tasks from API
  const fetchTasks = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const tasks = await taskService.getTasksByDateRange(startDate, endDate);
      const uiTasks = tasks.map(mapApiTaskToUI);
      setScheduledTasks(uiTasks);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch tasks');
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch task templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const response = await taskService.getTaskTemplates({ limit: 50 });
      setTaskTemplates(response.data);
    } catch (err) {
      console.error('Failed to fetch task templates:', err);
      // Provide fallback templates if API fails
      setTaskTemplates([
        {
          _id: "fallback-1",
          title: "阅读30分钟",
          description: "阅读课外书籍或学习材料30分钟",
          category: "reading",
          estimatedMinutes: 30,
          basePoints: 60,
          difficulty: "easy",
          isActive: true,
          tags: ["阅读", "学习"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "fallback-2", 
          title: "整理房间",
          description: "清理并整理个人房间",
          category: "chores",
          estimatedMinutes: 45,
          basePoints: 100,
          difficulty: "medium",
          isActive: true,
          tags: ["家务", "整理"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "fallback-3",
          title: "户外运动",
          description: "进行30分钟户外体育活动",
          category: "exercise", 
          estimatedMinutes: 30,
          basePoints: 120,
          difficulty: "medium",
          isActive: true,
          tags: ["运动", "健康"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Load templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Load tasks when component mounts or date changes
  useEffect(() => {
    const getDateRange = () => {
      if (viewMode === 'month') {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return {
          startDate: formatDate(startOfMonth),
          endDate: formatDate(endOfMonth)
        };
      } else if (viewMode === 'week') {
        const weekDays = getWeekDays(currentDate);
        return {
          startDate: formatDate(weekDays[0]),
          endDate: formatDate(weekDays[6])
        };
      } else {
        // Day view
        const dayStr = viewMode === 'day' ? selectedDate : formatDate(currentDate);
        return {
          startDate: dayStr,
          endDate: dayStr
        };
      }
    };

    const { startDate, endDate } = getDateRange();
    fetchTasks(startDate, endDate);
  }, [currentDate, viewMode, selectedDate, fetchTasks]);

  // 生成时间段 (6:00-22:00，每30分钟一段)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // 获取月份的日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // 添加上月的最后几天
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // 添加当月的所有天
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // 获取周的日期
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    }
    setCurrentDate(newDate);
    if (viewMode === 'day') {
      setSelectedDate(formatDate(newDate));
    }
  };

  const getTasksForDate = (date: string) => {
    return scheduledTasks.filter(task => task.date === date);
  };

  const getTasksForTimeSlot = (date: string, time: string) => {
    return scheduledTasks.filter(task => {
      const taskStart = task.startTime;
      const taskEnd = task.endTime;
      return task.date === date && time >= taskStart && time < taskEnd;
    });
  };

  const openTaskDialog = (date: string, startTime?: string) => {
    setTaskFormData({
      title: '',
      description: '',
      category: 'learning',
      estimatedTime: 30,
      points: 50,
      difficulty: 'medium',
      date,
      startTime: startTime || '09:00',
      endTime: calculateEndTime(startTime || '09:00', 30)
    });
    setEditingTask(null);
    setIsTaskDialogOpen(true);
  };

  // Handle template selection from TaskLibrary
  const handleTemplateSelect = (template: TaskTemplate) => {
    const categoryMapping: { [key: string]: TaskCategory } = {
      'reading': 'reading',
      'exercise': 'exercise', 
      'chores': 'chores',
      'learning': 'learning',
      'creativity': 'creativity',
      'other': 'other'
    };

    // Fill form with template data
    setTaskFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      category: categoryMapping[template.category] || 'other',
      estimatedTime: template.estimatedMinutes,
      points: template.basePoints,
      difficulty: template.difficulty,
      endTime: calculateEndTime(prev.startTime, template.estimatedMinutes)
    }));
  };

  // Handle custom task creation from TaskLibrary
  const handleAddTask = async (taskData: Omit<TaskTemplate, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Create template first
      const newTemplate = await taskService.createTaskTemplate({
        title: taskData.title,
        description: taskData.description,
        category: taskData.category as TaskCategory,
        estimatedMinutes: taskData.estimatedMinutes,
        basePoints: taskData.basePoints,
        difficulty: taskData.difficulty,
        isActive: true,
        tags: taskData.tags || []
      });
      
      // Add to templates list
      setTaskTemplates(prev => [newTemplate, ...prev]);
      
      // Select the new template
      handleTemplateSelect(newTemplate);
      
      toast.success('新任务模板已创建并选中！');
    } catch (error) {
      console.error('Failed to create task template:', error);
      toast.error('创建任务模板失败');
    }
  };

  const openEditDialog = (task: ScheduledTaskUI) => {
    setTaskFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      estimatedTime: task.estimatedTime,
      points: task.points,
      difficulty: task.difficulty,
      date: task.date,
      startTime: task.startTime,
      endTime: task.endTime
    });
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!taskFormData.title.trim()) return;

    try {
      setLoading(true);
      const taskData = {
        ...taskFormData,
        endTime: calculateEndTime(taskFormData.startTime, taskFormData.estimatedTime)
      };

      if (editingTask) {
        // Update existing task
        const updated = await taskService.updateScheduledTask(editingTask.id, {
          startTime: taskData.startTime,
          endTime: taskData.endTime,
          notes: taskData.description
        });
        
        const updatedUITask = mapApiTaskToUI(updated);
        setScheduledTasks(prev =>
          prev.map(task =>
            task.id === editingTask.id ? updatedUITask : task
          )
        );
        toast.success(`任务"${taskData.title}"已更新！`);
      } else {
        // Create new task using quick create
        const { scheduledTask } = await taskService.quickCreateAndSchedule({
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          difficulty: taskData.difficulty,
          estimatedMinutes: taskData.estimatedTime,
          scheduledDate: `${taskData.date}T${taskData.startTime}:00.000Z`,
          startTime: taskData.startTime
        });
        
        const newUITask = mapApiTaskToUI(scheduledTask);
        setScheduledTasks(prev => [...prev, newUITask]);
        toast.success(`任务"${taskData.title}"已创建！`);
      }

      setIsTaskDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error(editingTask ? '更新任务失败' : '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompleted = async (taskId: string) => {
    const task = scheduledTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (!task.completed) {
        // Complete the task
        const result = await taskService.completeTask(taskId, {
          notes: 'Completed via task planning interface'
        });
        
        const updatedTask = mapApiTaskToUI(result.task);
        setScheduledTasks(prev =>
          prev.map(t => t.id === taskId ? updatedTask : t)
        );
        
        onTaskCompleted(updatedTask);
        toast.success(`任务完成！🎉`, {
          description: `"${task.title}"已完成，获得${result.pointsAwarded}积分奖励！`,
        });
      } else {
        // Uncomplete the task
        const updated = await taskService.uncompleteTask(taskId, 'Uncompleted via task planning interface');
        const updatedTask = mapApiTaskToUI(updated);
        
        setScheduledTasks(prev =>
          prev.map(t => t.id === taskId ? updatedTask : t)
        );
        
        toast.info(`任务"${task.title}"已取消完成状态`);
      }
    } catch (error) {
      console.error('Failed to update task completion:', error);
      toast.error('更新任务状态失败');
    }
  };

  const handleTaskRemoved = async (taskId: string) => {
    const task = scheduledTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await taskService.deleteScheduledTask(taskId);
      setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
      toast.info(`任务"${task.title}"已从日历中移除`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('删除任务失败');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      // Chinese categories (legacy support)
      "学习": "bg-blue-100 text-blue-800 border-blue-200",
      "运动": "bg-green-100 text-green-800 border-green-200", 
      "家务": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "社交": "bg-purple-100 text-purple-800 border-purple-200",
      "娱乐": "bg-pink-100 text-pink-800 border-pink-200",
      // English categories (API standard)
      "learning": "bg-blue-100 text-blue-800 border-blue-200",
      "exercise": "bg-green-100 text-green-800 border-green-200",
      "chores": "bg-yellow-100 text-yellow-800 border-yellow-200", 
      "reading": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "creativity": "bg-purple-100 text-purple-800 border-purple-200",
      "other": "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // 渲染日视图
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const currentDateStr = viewMode === 'day' ? selectedDate : formatDate(currentDate);
    
    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {timeSlots.map(time => {
          const tasksAtTime = getTasksForTimeSlot(currentDateStr, time);
          return (
            <div
              key={time}
              className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-gray-200 min-h-16 hover:border-emerald-300 transition-colors cursor-pointer"
              onClick={() => openTaskDialog(currentDateStr, time)}
            >
              {/* 时间标签 */}
              <div className="w-16 text-sm font-medium text-muted-foreground flex-shrink-0 pt-1">
                {time}
              </div>
              
              {/* 任务区域 */}
              <div className="flex-1 space-y-2">
                {tasksAtTime.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 flex items-center gap-2">
                    <Plus className="w-3 h-3" />
                    点击创建新任务
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {tasksAtTime.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-lg border-l-4 ${getCategoryColor(task.category)} ${
                          task.completed ? 'opacity-60' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(task);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                                {task.title}
                              </h4>
                              {task.completed && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  ✓ 已完成
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.startTime} - {task.endTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-yellow-500" />
                                <span>{task.points}积分</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!task.completed ? (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskCompleted(task.id);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              >
                                完成
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskCompleted(task.id);
                                }}
                              >
                                取消完成
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskRemoved(task.id);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染周视图
  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const timeSlots = getTimeSlots().slice(0, 16); // 显示部分时间段
    
    return (
      <div className="flex flex-col">
        {/* 星期标题 */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="w-16"></div>
          {weekDays.map(day => (
            <div key={day.getTime()} className="text-center">
              <div className="font-medium">{day.toLocaleDateString('zh-CN', { weekday: 'short' })}</div>
              <div className={`text-sm ${isToday(day) ? 'text-emerald-600 font-bold' : 'text-gray-600'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* 时间网格 */}
        <div className="max-h-96 overflow-y-auto">
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 gap-2 min-h-12 border-b border-gray-100">
              <div className="w-16 text-sm font-medium text-gray-500 py-2">
                {time}
              </div>
              {weekDays.map(day => {
                const dateStr = formatDate(day);
                const tasksAtTime = getTasksForTimeSlot(dateStr, time);
                return (
                  <div
                    key={`${dateStr}-${time}`}
                    className="border-r border-gray-100 p-1 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openTaskDialog(dateStr, time)}
                  >
                    {tasksAtTime.map(task => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded mb-1 ${getCategoryColor(task.category)} truncate cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(task);
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染月视图
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center font-semibold text-muted-foreground p-3 border-b">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: day ? 1.02 : 1 }}
            className={`min-h-24 p-2 border border-gray-100 cursor-pointer transition-all ${
              !day 
                ? 'bg-gray-50' 
                : isToday(day)
                ? 'bg-emerald-100 border-emerald-300'
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => {
              if (day) {
                const dateStr = formatDate(day);
                setSelectedDate(dateStr);
                openTaskDialog(dateStr);
              }
            }}
          >
            {day && (
              <div className="w-full h-full flex flex-col">
                <span className="text-sm font-medium mb-1">
                  {day.getDate()}
                </span>
                <div className="flex-1 space-y-1">
                  {getTasksForDate(formatDate(day)).slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="text-xs px-2 py-1 rounded truncate bg-blue-100 text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(task);
                      }}
                    >
                      {task.startTime} {task.title}
                    </div>
                  ))}
                  {getTasksForDate(formatDate(day)).length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{getTasksForDate(formatDate(day)).length - 3}个任务
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">


      {/* 日历主体 */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              智能日历
            </CardTitle>
            
            {/* 视图切换按钮 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'day', label: '日历' },
                { key: 'week', label: '周历' },
                { key: 'month', label: '月历' }
              ].map(view => (
                <Button
                  key={view.key}
                  size="sm"
                  variant={viewMode === view.key ? "default" : "ghost"}
                  onClick={() => {
                    setViewMode(view.key as ViewMode);
                    if (view.key === 'day') {
                      setSelectedDate(formatDate(new Date()));
                      setCurrentDate(new Date());
                    }
                  }}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    viewMode === view.key 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  {view.label}
                </Button>
              ))}
            </div>
            
            {/* 日期导航 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold px-4 whitespace-nowrap">
                {viewMode === 'month' && currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                {viewMode === 'week' && `${formatDate(getWeekDays(currentDate)[0])} - ${formatDate(getWeekDays(currentDate)[6])}`}
                {viewMode === 'day' && new Date(selectedDate).toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  weekday: 'long' 
                })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="ml-2 text-gray-600">加载任务中...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <span>加载任务失败: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const currentDateStr = formatDate(currentDate);
                  fetchTasks(currentDateStr, currentDateStr);
                }}
                className="ml-2"
              >
                重试
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
            </>
          )}
        </CardContent>
      </Card>

      {/* 任务创建/编辑对话框 */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTask ? '编辑任务' : '创建新任务'}
              {!editingTask && <BookOpen className="w-5 h-5" />}
            </DialogTitle>
            <DialogDescription>
              为 {taskFormData.date} {taskFormData.startTime} 
              {editingTask ? '编辑任务信息' : '选择模板或创建新任务'}
            </DialogDescription>
          </DialogHeader>

          {editingTask ? (
            // Edit mode - show form directly
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>日期</Label>
                <Input
                  type="date"
                  value={taskFormData.date}
                  onChange={(e) => setTaskFormData({ ...taskFormData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={taskFormData.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    setTaskFormData({ 
                      ...taskFormData, 
                      startTime: newStartTime,
                      endTime: calculateEndTime(newStartTime, taskFormData.estimatedTime)
                    });
                  }}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="task-title">任务标题</Label>
              <Input
                id="task-title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="输入任务标题"
              />
            </div>
            
            <div>
              <Label htmlFor="task-description">任务描述</Label>
              <Textarea
                id="task-description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="描述任务详情"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>任务分类</Label>
                <Select value={taskFormData.category} onValueChange={(value) => setTaskFormData({ ...taskFormData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="学习">📚 学习</SelectItem>
                    <SelectItem value="运动">🏃 运动</SelectItem>
                    <SelectItem value="家务">🧹 家务</SelectItem>
                    <SelectItem value="社交">👥 社交</SelectItem>
                    <SelectItem value="娱乐">🎮 娱乐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>难度等级</Label>
                <Select value={taskFormData.difficulty} onValueChange={(value) => setTaskFormData({ ...taskFormData, difficulty: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">简单</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="hard">困难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>预估时间(分钟)</Label>
                <Input
                  type="number"
                  value={taskFormData.estimatedTime}
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value) || 30;
                    setTaskFormData({ 
                      ...taskFormData, 
                      estimatedTime: newDuration,
                      endTime: calculateEndTime(taskFormData.startTime, newDuration)
                    });
                  }}
                  min="5"
                  max="240"
                />
              </div>
              <div>
                <Label>奖励积分</Label>
                <Input
                  type="number"
                  value={taskFormData.points}
                  onChange={(e) => setTaskFormData({ ...taskFormData, points: parseInt(e.target.value) || 50 })}
                  min="10"
                  max="500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleFormSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                {editingTask ? '更新任务' : '创建任务'}
              </Button>
            </div>
          </div>
          ) : (
            // Create mode - show tabs with TaskLibrary
            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  任务模板
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  自定义任务
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="mt-4">
                <div className="max-h-96 overflow-y-auto">
                  {templatesLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2 text-gray-600">加载模板中...</span>
                    </div>
                  ) : (
                    <TaskLibrary 
                      tasks={taskTemplates.map(template => ({
                        id: template._id,
                        title: template.title,
                        description: template.description,
                        category: template.category,
                        estimatedTime: template.estimatedMinutes,
                        points: template.basePoints,
                        difficulty: template.difficulty,
                        isCustom: false
                      }))}
                      onAddTask={handleAddTask}
                      onDragStart={(task) => {
                        const template = taskTemplates.find(t => t._id === task.id);
                        if (template) {
                          handleTemplateSelect(template);
                        }
                      }}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>日期</Label>
                    <Input
                      type="date"
                      value={taskFormData.date}
                      onChange={(e) => setTaskFormData({ ...taskFormData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>开始时间</Label>
                    <Input
                      type="time"
                      value={taskFormData.startTime}
                      onChange={(e) => {
                        const newStartTime = e.target.value;
                        setTaskFormData({ 
                          ...taskFormData, 
                          startTime: newStartTime,
                          endTime: calculateEndTime(newStartTime, taskFormData.estimatedTime)
                        });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>任务标题</Label>
                  <Input
                    placeholder="输入任务名称"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>任务描述</Label>
                  <Textarea
                    placeholder="详细描述任务内容"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>任务分类</Label>
                    <Select value={taskFormData.category} onValueChange={(value: TaskCategory) => setTaskFormData({ ...taskFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learning">学习</SelectItem>
                        <SelectItem value="exercise">运动</SelectItem>
                        <SelectItem value="chores">家务</SelectItem>
                        <SelectItem value="reading">阅读</SelectItem>
                        <SelectItem value="creativity">创意</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>任务难度</Label>
                    <Select value={taskFormData.difficulty} onValueChange={(value: TaskDifficulty) => setTaskFormData({ ...taskFormData, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择难度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">简单</SelectItem>
                        <SelectItem value="medium">中等</SelectItem>
                        <SelectItem value="hard">困难</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>预计时长（分钟）</Label>
                    <Input
                      type="number"
                      min="5"
                      max="480"
                      value={taskFormData.estimatedTime}
                      onChange={(e) => {
                        const estimatedTime = parseInt(e.target.value) || 30;
                        setTaskFormData({ 
                          ...taskFormData, 
                          estimatedTime,
                          endTime: calculateEndTime(taskFormData.startTime, estimatedTime)
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>积分奖励</Label>
                    <Input
                      type="number"
                      min="10"
                      max="500"
                      value={taskFormData.points}
                      onChange={(e) => setTaskFormData({ ...taskFormData, points: parseInt(e.target.value) || 50 })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleFormSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600" disabled={!taskFormData.title.trim()}>
              {editingTask ? '更新任务' : '创建任务'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}