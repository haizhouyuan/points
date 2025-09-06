import { useState } from "react";
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
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, Trash2, Plus, GripVertical } from "lucide-react";

interface ScheduledTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  date: string;
  startTime: string;
  endTime: string;
  completed?: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

interface TaskPlanningProps {
  onTaskCompleted: (task: ScheduledTask) => void;
}

export function TaskPlanning({ onTaskCompleted }: TaskPlanningProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    category: '学习',
    estimatedTime: 30,
    points: 50,
    difficulty: 'medium' as const,
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

  // 已安排的任务
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    {
      id: "scheduled_1",
      taskId: "1",
      title: "完成数学作业",
      description: "完成今天布置的数学习题和练习",
      category: "学习",
      estimatedTime: 60,
      points: 100,
      difficulty: "medium",
      date: "2025-01-06",
      startTime: "19:00",
      endTime: "20:00",
      completed: false
    },
    {
      id: "scheduled_2",
      taskId: "2",
      title: "阅读30分钟",
      description: "阅读课外书籍或文章",
      category: "学习",
      estimatedTime: 30,
      points: 60,
      difficulty: "easy",
      date: "2025-01-06",
      startTime: "20:30",
      endTime: "21:00",
      completed: true
    },
    {
      id: "scheduled_3",
      taskId: "4",
      title: "户外运动",
      description: "进行跑步、骑车或其他户外运动",
      category: "运动",
      estimatedTime: 60,
      points: 120,
      difficulty: "medium",
      date: "2025-01-07",
      startTime: "16:00",
      endTime: "17:00",
      completed: false
    }
  ]);

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
      category: '学习',
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

  const openEditDialog = (task: ScheduledTask) => {
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

  const handleFormSubmit = () => {
    if (!taskFormData.title.trim()) return;

    const taskData = {
      ...taskFormData,
      endTime: calculateEndTime(taskFormData.startTime, taskFormData.estimatedTime)
    };

    if (editingTask) {
      // 编辑现有任务
      setScheduledTasks(prev =>
        prev.map(task =>
          task.id === editingTask.id
            ? { ...task, ...taskData }
            : task
        )
      );
      toast.success(`任务"${taskData.title}"已更新！`);
    } else {
      // 创建新任务
      const newTask: ScheduledTask = {
        id: `task_${Date.now()}`,
        taskId: `template_${Date.now()}`,
        ...taskData,
        completed: false
      };
      setScheduledTasks(prev => [...prev, newTask]);
      toast.success(`任务"${taskData.title}"已创建！`);
    }

    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleTaskCompleted = (taskId: string) => {
    setScheduledTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, completed: !task.completed };
          
          if (updatedTask.completed && !task.completed) {
            onTaskCompleted(updatedTask);
            toast.success(`任务完成！🎉`, {
              description: `"${task.title}"已完成，获得${task.points}积分奖励！`,
            });
          } else if (!updatedTask.completed && task.completed) {
            toast.info(`任务"${task.title}"已取消完成状态`);
          }
          
          return updatedTask;
        }
        return task;
      })
    );
  };

  const handleTaskRemoved = (taskId: string) => {
    const task = scheduledTasks.find(t => t.id === taskId);
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
    toast.info(`任务"${task?.title}"已从日历中移除`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "学习": "bg-blue-100 text-blue-800 border-blue-200",
      "运动": "bg-green-100 text-green-800 border-green-200",
      "家务": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "社交": "bg-purple-100 text-purple-800 border-purple-200",
      "娱乐": "bg-pink-100 text-pink-800 border-pink-200",
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
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </CardContent>
      </Card>

      {/* 任务创建/编辑对话框 */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? '编辑任务' : '创建新任务'}</DialogTitle>
            <DialogDescription>
              为 {taskFormData.date} {taskFormData.startTime} 
              {editingTask ? '编辑任务信息' : '创建一个新的任务'}
            </DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}