import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FamilyMember {
  id: string;
  name: string;
  points: number;
  avatar?: string;
  isCurrentUser?: boolean;
  weeklyGrowth: number;
}

interface FamilyLeaderboardProps {
  members: FamilyMember[];
}

export function FamilyLeaderboard({ members }: FamilyLeaderboardProps) {
  const sortedMembers = [...members].sort((a, b) => b.points - a.points);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300";
      case 3:
        return "bg-gradient-to-r from-amber-100 to-amber-200 border-amber-300";
      default:
        return "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          家庭积分排行榜
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedMembers.map((member, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  member.isCurrentUser 
                    ? "ring-2 ring-blue-500 ring-offset-2" 
                    : ""
                } ${getRankColor(rank)}`}
              >
                {member.isCurrentUser && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 bg-blue-500 text-white"
                  >
                    我
                  </Badge>
                )}

                <div className="flex items-center gap-4">
                  {/* 排名图标 */}
                  <div className="flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.avatar ? (
                      <ImageWithFallback 
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-gray-600">
                        {member.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* 成员信息 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{member.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        本周 {member.weeklyGrowth >= 0 ? '+' : ''}{member.weeklyGrowth}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        member.weeklyGrowth > 0 ? 'bg-green-500' : 
                        member.weeklyGrowth < 0 ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>

                  {/* 积分 */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg">{member.points.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">积分</div>
                  </div>
                </div>

                {/* 第一名特殊效果 */}
                {rank === 1 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-full h-full"
                    >
                      ⭐
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}