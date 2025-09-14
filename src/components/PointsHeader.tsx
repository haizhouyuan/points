import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Star, Crown, Zap } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PointsHeaderProps {
  currentPoints: number;
  level: number;
  levelProgress: number;
  nextLevelPoints: number;
  userName: string;
}

export function PointsHeader({ 
  currentPoints, 
  level, 
  levelProgress, 
  nextLevelPoints, 
  userName 
}: PointsHeaderProps) {
  const getLevelIcon = (level: number) => {
    if (level >= 10) return <Crown className="w-7 h-7 text-yellow-300" />;
    if (level >= 5) return <Zap className="w-7 h-7 text-purple-300" />;
    return <Star className="w-7 h-7 text-blue-300" />;
  };

  const getLevelTitle = (level: number) => {
    if (level >= 10) return "积分大师";
    if (level >= 5) return "积分专家";
    if (level >= 3) return "积分能手";
    return "积分新手";
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-2xl shadow-emerald-200">
      {/* 装饰性背景图案 */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1748684050778-84709dc175a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJ0b29uJTIwdHJvcGh5JTIwY2VsZWJyYXRpb24lMjBjaGlsZHJlbnxlbnwxfHx8fDE3NTcxMzEzNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Trophy celebration"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      
      {/* 额外装饰元素 */}
      <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-2 right-16 w-8 h-8 bg-pink-400 rounded-full opacity-30"></div>
      
      <div className="relative z-10">
        {/* 用户信息 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center shadow-lg">
            {getLevelIcon(level)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">你好，{userName}！</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-white/25 to-white/15 text-white border-0 font-semibold px-3 py-1">
              {getLevelTitle(level)} · 等级 {level}
            </Badge>
          </div>
        </div>

        {/* 积分显示 */}
        <div className="flex items-end gap-3 mb-6">
          <span className="text-5xl font-black bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent drop-shadow-sm">
            {currentPoints.toLocaleString()}
          </span>
          <span className="text-xl font-semibold opacity-90 mb-2">积分</span>
        </div>

        {/* 进度条 */}
        <div className="space-y-3">
          <div className="flex justify-between font-semibold opacity-95">
            <span>距离下一等级</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {nextLevelPoints - currentPoints} 积分
            </span>
          </div>
          <Progress 
            value={levelProgress} 
            className="h-4 bg-white/20 rounded-full shadow-inner"
          />
          <div className="flex justify-between text-sm opacity-80 font-medium">
            <span>等级 {level}</span>
            <span>等级 {level + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}