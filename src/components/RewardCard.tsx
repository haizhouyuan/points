import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Gift, Coins } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface RewardCardProps {
  id: string;
  title: string;
  description: string;
  cost: number;
  image?: string;
  category: string;
  available: boolean;
  userPoints: number;
  onRedeem: (id: string) => void;
}

export function RewardCard({
  id,
  title,
  description,
  cost,
  image,
  category,
  available,
  userPoints,
  onRedeem
}: RewardCardProps) {
  const canAfford = userPoints >= cost;
  const isAvailable = available && canAfford;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${
        isAvailable 
          ? "shadow-lg hover:shadow-xl border-green-200" 
          : "opacity-75 grayscale"
      }`}>
        <CardContent className="p-0">
          {/* 奖励图片 */}
          <div className="relative h-32 bg-gradient-to-br from-orange-100 to-yellow-100">
            {image ? (
              <ImageWithFallback 
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="w-12 h-12 text-orange-400" />
              </div>
            )}
            
            {/* 分类标签 */}
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 bg-white/90 text-gray-700"
            >
              {category}
            </Badge>
            
            {/* 可用性标识 */}
            {!available && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                暂时缺货
              </div>
            )}
          </div>

          {/* 奖励信息 */}
          <div className="p-4">
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
            
            {/* 积分消耗 */}
            <div className="flex items-center gap-1 text-blue-600">
              <Coins className="w-4 h-4" />
              <span className="font-semibold">{cost.toLocaleString()}</span>
              <span className="text-sm">积分</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={() => onRedeem(id)}
            disabled={!isAvailable}
            className={`w-full ${
              isAvailable 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {!available ? "缺货中" : !canAfford ? "积分不足" : "立即兑换"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}