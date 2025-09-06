import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { BookOpen, Dumbbell, Home, Users, Gamepad2, Plus, GripVertical, Clock, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number; // 预估完成时间(分钟)
  points: number;
  difficulty: "easy" | "medium" | "hard";
  isCustom?: boolean;
}

interface TaskLibraryProps {
  tasks: TaskTemplate[];
  onAddTask: (task: Omit<TaskTemplate, "id">) => void;
  onDragStart: (task: TaskTemplate) => void;
}

export function TaskLibrary({ tasks, onAddTask, onDragStart }: TaskLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    estimatedTime: 30,
    points: 50,
    difficulty: "medium" as const
  });

  const categories = [
    { value: "all", label: "全部", icon: "⭐" },
    { value: "学习", label: "学习", icon: "📚" },
    { value: "运动", label: "运动", icon: "🏃" },
    { value: "家务", label: "家务", icon: "🧹" },
    { value: "社交", label: "社交", icon: "👥" },
    { value: "娱乐", label: "娱乐", icon: "🎮" },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "学习": return <BookOpen className="w-4 h-4" />;
      case "运动": return <Dumbbell className="w-4 h-4" />;
      case "家务": return <Home className="w-4 h-4" />;
      case "社交": return <Users className="w-4 h-4" />;
      case "娱乐": return <Gamepad2 className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "简单";
      case "medium": return "中等";
      case "hard": return "困难";
      default: return "中等";
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddTask = () => {
    if (!newTask.title.trim() || !newTask.category) return;
    
    onAddTask({
      ...newTask,
      isCustom: true
    });
    
    setNewTask({
      title: "",
      description: "",
      category: "",
      estimatedTime: 30,
      points: 50,
      difficulty: "medium"
    });
    
    setIsAddingTask(false);
  };

  const handleDragStart = (task: TaskTemplate) => {
    onDragStart(task);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            任务库
          </CardTitle>
          <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新增任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新增任务模板</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">任务标题</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="输入任务标题"
                  />
                </div>
                <div>
                  <Label htmlFor="description">任务描述</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="描述任务详情"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">任务分类</Label>
                    <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty">难度等级</Label>
                    <Select value={newTask.difficulty} onValueChange={(value) => setNewTask({ ...newTask, difficulty: value as any })}>
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
                    <Label htmlFor="time">预估时间(分钟)</Label>
                    <Input
                      id="time"
                      type="number"
                      value={newTask.estimatedTime}
                      onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 30 })}
                      min="5"
                      max="240"
                    />
                  </div>
                  <div>
                    <Label htmlFor="points">奖励积分</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newTask.points}
                      onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 50 })}
                      min="10"
                      max="500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingTask(false)} className="flex-1">
                    取消
                  </Button>
                  <Button onClick={handleAddTask} className="flex-1">
                    添加任务
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索和筛选 */}
        <div className="space-y-3">
          <Input
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="flex items-center gap-1"
              >
                <span>{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 任务列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>没有找到匹配的任务</p>
              <p className="text-sm">试试其他搜索条件或新增任务</p>
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                draggable
                onDragStart={() => handleDragStart(task)}
                className="group p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-move"
              >
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(task.category)}
                        <h4 className="font-medium truncate">{task.title}</h4>
                        {task.isCustom && (
                          <Badge variant="secondary" className="text-xs">
                            自定义
                          </Badge>
                        )}
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className={getDifficultyColor(task.difficulty)}
                      >
                        {getDifficultyLabel(task.difficulty)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
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
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}