import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, Trash2 } from "lucide-react";
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

interface TaskCalendarProps {
  scheduledTasks: ScheduledTask[];
  draggedTask: TaskTemplate | null;
  onTaskScheduled: (task: TaskTemplate, date: string, startTime: string) => void;
  onTaskRemoved: (taskId: string) => void;
  onTaskCompleted: (taskId: string) => void;
}

export function TaskCalendar({ 
  scheduledTasks, 
  draggedTask, 
  onTaskScheduled, 
  onTaskRemoved,
  onTaskCompleted
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

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

  const days = getDaysInMonth(currentDate);
  const timeSlots = getTimeSlots();
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
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

  return (
    <div className="space-y-4">
      {/* 月份导航 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              任务日历
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold px-4">
                {currentDate.toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            {days.map((day, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: day ? 1.05 : 1 }}
                className={`aspect-square p-1 rounded-lg border cursor-pointer transition-all ${
                  !day 
                    ? 'bg-gray-50' 
                    : isSelected(day)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : isToday(day)
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => day && setSelectedDate(formatDate(day))}
              >
                {day && (
                  <div className="w-full h-full flex flex-col">
                    <span className="text-sm font-medium">
                      {day.getDate()}
                    </span>
                    <div className="flex-1 flex flex-col gap-1 mt-1">
                      {getTasksForDate(formatDate(day)).slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className="text-xs bg-blue-100 text-blue-800 px-1 rounded truncate"
                        >
                          {task.title}
                        </div>
                      ))}
                      {getTasksForDate(formatDate(day)).length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{getTasksForDate(formatDate(day)).length - 2}个
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 选定日期的详细时间轴 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })} - 时间轴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {timeSlots.map(time => {
              const tasksAtTime = getTasksForTimeSlot(selectedDate, time);
              return (
                <div
                  key={time}
                  className="flex items-start gap-3 p-2 rounded-lg border border-dashed border-gray-200 min-h-16 hover:border-blue-300 transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(selectedDate, time);
                  }}
                  onDragOver={handleDragOver}
                >
                  {/* 时间标签 */}
                  <div className="w-16 text-sm font-medium text-muted-foreground flex-shrink-0 pt-1">
                    {time}
                  </div>
                  
                  {/* 任务区域 */}
                  <div className="flex-1 space-y-2">
                    {tasksAtTime.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2">
                        {draggedTask ? "拖拽任务到这里安排时间" : "无安排"}
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
                                  onClick={() => onTaskCompleted(task.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  完成
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onTaskCompleted(task.id)}
                                >
                                  取消完成
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onTaskRemoved(task.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}