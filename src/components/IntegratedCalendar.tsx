import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, Trash2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface ScheduledTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  completed?: boolean;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
}

interface IntegratedCalendarProps {
  scheduledTasks: ScheduledTask[];
  draggedTask: TaskTemplate | null;
  onTaskScheduled: (task: TaskTemplate, date: string, startTime: string) => void;
  onTaskRemoved: (taskId: string) => void;
  onTaskCompleted: (taskId: string) => void;
  onQuickTaskCreated: (task: Omit<TaskTemplate, "id">, date: string, startTime: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export function IntegratedCalendar({ 
  scheduledTasks, 
  draggedTask, 
  onTaskScheduled, 
  onTaskRemoved,
  onTaskCompleted,
  onQuickTaskCreated
}: IntegratedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    date: '',
    startTime: '',
    title: '',
    description: '',
    category: '学习',
    estimatedTime: 30,
    points: 50,
    difficulty: 'medium' as const
  });

  // 生成当前月份的日期网格
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

  // 生成时间段
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // 生成周视图的日期
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

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const timeSlots = getTimeSlots();
  
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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return formatDate(date) === selectedDate;
  };

  const getTasksForDate = (date: string) => {
    return scheduledTasks.filter(task => task.date === date);
  };

  const getTasksForTimeSlot = (date: string, time: string) => {
    return scheduledTasks.filter(task => 
      task.date === date && task.startTime === time
    );
  };

  const handleDrop = (date: string, time: string) => {
    if (draggedTask) {
      onTaskScheduled(draggedTask, date, time);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleQuickCreate = (date: string, time?: string) => {
    setQuickCreateData({
      date,
      startTime: time || '09:00',
      title: '',
      description: '',
      category: '学习',
      estimatedTime: 30,
      points: 50,
      difficulty: 'medium'
    });
    setIsQuickCreateOpen(true);
  };

  const handleQuickCreateSubmit = () => {
    if (!quickCreateData.title.trim()) return;
    
    onQuickTaskCreated(
      {
        title: quickCreateData.title,
        description: quickCreateData.description,
        category: quickCreateData.category,
        estimatedTime: quickCreateData.estimatedTime,
        points: quickCreateData.points,
        difficulty: quickCreateData.difficulty
      },
      quickCreateData.date,
      quickCreateData.startTime
    );
    
    setIsQuickCreateOpen(false);
    setQuickCreateData({
      date: '',
      startTime: '',
      title: '',
      description: '',
      category: '学习',
      estimatedTime: 30,
      points: 50,
      difficulty: 'medium'
    });
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

  const renderMonthView = () => (
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
              : isSelected(day)
              ? 'bg-blue-500 text-white'
              : isToday(day)
              ? 'bg-emerald-100 border-emerald-300'
              : 'bg-white hover:bg-gray-50'
          }`}
          onClick={() => {
            if (day) {
              const dateStr = formatDate(day);
              setSelectedDate(dateStr);
              if (window.innerWidth < 768) { // Mobile
                handleQuickCreate(dateStr);
              }
            }
          }}
        >
          {day && (
            <div className="w-full h-full flex flex-col">
              <span className={`text-sm font-medium mb-1 ${isSelected(day) ? 'text-white' : ''}`}>
                {day.getDate()}
              </span>
              <div className="flex-1 space-y-1">
                {getTasksForDate(formatDate(day)).slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className={`text-xs px-2 py-1 rounded truncate ${
                      isSelected(day) 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.startTime} {task.title}
                  </div>
                ))}
                {getTasksForDate(formatDate(day)).length > 3 && (
                  <div className={`text-xs ${isSelected(day) ? 'text-white/80' : 'text-gray-500'}`}>
                    +{getTasksForDate(formatDate(day)).length - 3}个任务
                  </div>
                )}
              </div>
              {/* 手机端快速创建按钮 */}
              <div className="md:hidden mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`w-full h-6 text-xs ${
                    isSelected(day) ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickCreate(formatDate(day));
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderWeekView = () => (
    <div className="flex flex-col">
      {/* 星期标题 */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        <div className="w-16"></div> {/* 时间列占位 */}
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
        {timeSlots.slice(0, 16).map(time => (
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
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(dateStr, time);
                  }}
                  onDragOver={handleDragOver}
                  onClick={() => handleQuickCreate(dateStr, time)}
                >
                  {tasksAtTime.map(task => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded mb-1 ${getCategoryColor(task.category)} truncate`}
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

  const renderDayView = () => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {timeSlots.map(time => {
        const tasksAtTime = getTasksForTimeSlot(selectedDate, time);
        return (
          <div
            key={time}
            className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-gray-200 min-h-16 hover:border-emerald-300 transition-colors"
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(selectedDate, time);
            }}
            onDragOver={handleDragOver}
            onClick={() => handleQuickCreate(selectedDate, time)}
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
                  {draggedTask ? "拖拽任务到这里或点击创建新任务" : "点击创建新任务"}
                </div>
              ) : (
                tasksAtTime.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-3 rounded-lg border-l-4 ${getCategoryColor(task.category)} ${
                      task.completed ? 'opacity-60' : ''
                    }`}
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
                            <span>{task.estimatedTime}分钟</span>
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
                              onTaskCompleted(task.id);
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
                              onTaskCompleted(task.id);
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
                            onTaskRemoved(task.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            智能日历
          </CardTitle>
          
          {/* 视图切换按钮 - 仅移动端显示 */}
          <div className="md:hidden flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'month', label: '月' },
              { key: 'week', label: '周' },
              { key: 'day', label: '日' }
            ].map(view => (
              <Button
                key={view.key}
                size="sm"
                variant={viewMode === view.key ? "default" : "ghost"}
                onClick={() => setViewMode(view.key as ViewMode)}
                className={`px-3 py-1 rounded-md font-semibold ${
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
              {viewMode === 'week' && `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`}
              {viewMode === 'day' && currentDate.toLocaleDateString('zh-CN', { 
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
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        
        {/* 桌面端显示日视图详情 */}
        {viewMode === 'month' && (
          <div className="hidden md:block mt-6">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} - 详细时间轴
              </h3>
              {renderDayView()}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* 快速创建任务对话框 */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>快速创建任务</DialogTitle>
            <DialogDescription>
              为 {quickCreateData.date} {quickCreateData.startTime} 创建一个新的任务
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>日期</Label>
                <Input
                  type="date"
                  value={quickCreateData.date}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>时间</Label>
                <Input
                  type="time"
                  value={quickCreateData.startTime}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, startTime: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="quick-title">任务标题</Label>
              <Input
                id="quick-title"
                value={quickCreateData.title}
                onChange={(e) => setQuickCreateData({ ...quickCreateData, title: e.target.value })}
                placeholder="输入任务标题"
              />
            </div>
            
            <div>
              <Label htmlFor="quick-description">任务描述</Label>
              <Textarea
                id="quick-description"
                value={quickCreateData.description}
                onChange={(e) => setQuickCreateData({ ...quickCreateData, description: e.target.value })}
                placeholder="描述任务详情"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>任务分类</Label>
                <Select value={quickCreateData.category} onValueChange={(value) => setQuickCreateData({ ...quickCreateData, category: value })}>
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
                <Select value={quickCreateData.difficulty} onValueChange={(value) => setQuickCreateData({ ...quickCreateData, difficulty: value as any })}>
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
                  value={quickCreateData.estimatedTime}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, estimatedTime: parseInt(e.target.value) || 30 })}
                  min="5"
                  max="240"
                />
              </div>
              <div>
                <Label>奖励积分</Label>
                <Input
                  type="number"
                  value={quickCreateData.points}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, points: parseInt(e.target.value) || 50 })}
                  min="10"
                  max="500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsQuickCreateOpen(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleQuickCreateSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                创建任务
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}