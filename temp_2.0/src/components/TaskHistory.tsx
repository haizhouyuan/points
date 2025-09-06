import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, Clock, Star, Flame } from "lucide-react";
import { motion } from "motion/react";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  completedAt: string;
  category: string;
  streak?: number;
}

interface TaskHistoryProps {
  tasks: Task[];
}

export function TaskHistory({ tasks }: TaskHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "今天";
    if (diffInDays === 1) return "昨天";
    if (diffInDays < 7) return `${diffInDays}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "学习": "bg-blue-100 text-blue-800",
      "家务": "bg-green-100 text-green-800",
      "运动": "bg-orange-100 text-orange-800",
      "阅读": "bg-purple-100 text-purple-800",
      "社交": "bg-pink-100 text-pink-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          任务完成记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>还没有完成任务记录</p>
              <p className="text-sm">完成任务来获得积分吧！</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-100"
              >
                {/* 完成图标 */}
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>

                {/* 任务信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    {task.streak && task.streak >= 3 && (
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-semibold">{task.streak}连击</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={getCategoryColor(task.category)}
                    >
                      {task.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.completedAt)}
                    </span>
                  </div>
                </div>

                {/* 积分奖励 */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-blue-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">+{task.points}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">积分</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}