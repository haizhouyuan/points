import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertCircle, CheckCircle, Clock, Gift, Settings, User } from "lucide-react";
import { motion } from "motion/react";

interface PendingApproval {
  id: string;
  childName: string;
  rewardTitle: string;
  pointsCost: number;
  requestedAt: string;
  category: string;
}

interface RedemptionHistory {
  id: string;
  childName: string;
  rewardTitle: string;
  pointsCost: number;
  approvedAt: string;
  status: "approved" | "fulfilled";
}

interface ParentDashboardProps {
  pendingApprovals: PendingApproval[];
  redemptionHistory: RedemptionHistory[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkFulfilled: (id: string) => void;
}

export function ParentDashboard({
  pendingApprovals,
  redemptionHistory,
  onApprove,
  onReject,
  onMarkFulfilled
}: ParentDashboardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "玩具": "bg-pink-100 text-pink-800",
      "零食": "bg-orange-100 text-orange-800",
      "图书": "bg-blue-100 text-blue-800",
      "户外": "bg-green-100 text-green-800",
      "电子": "bg-purple-100 text-purple-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* 家长仪表板标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">家长管理中心</h1>
          <p className="text-muted-foreground">管理孩子的积分兑换和奖励审批</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          设置
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            待审批 ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            兑换记录
          </TabsTrigger>
        </TabsList>

        {/* 待审批标签页 */}
        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">暂无待审批事项</h3>
                <p className="text-muted-foreground text-center">
                  孩子提交兑换申请后会在这里显示
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((approval, index) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* 用户头像 */}
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {approval.childName.charAt(0)}
                        </div>

                        {/* 申请信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{approval.childName}</h4>
                            <span className="text-muted-foreground">申请兑换</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{approval.rewardTitle}</span>
                            <Badge 
                              variant="secondary" 
                              className={getCategoryColor(approval.category)}
                            >
                              {approval.category}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>消耗积分: {approval.pointsCost.toLocaleString()}</span>
                            <span>申请时间: {formatDate(approval.requestedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReject(approval.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          拒绝
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onApprove(approval.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          批准
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* 兑换记录标签页 */}
        <TabsContent value="history" className="space-y-4">
          {redemptionHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">暂无兑换记录</h3>
                <p className="text-muted-foreground text-center">
                  审批通过的兑换记录会在这里显示
                </p>
              </CardContent>
            </Card>
          ) : (
            redemptionHistory.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* 用户头像 */}
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {record.childName.charAt(0)}
                        </div>

                        {/* 记录信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{record.childName}</span>
                            <span className="text-muted-foreground">兑换了</span>
                            <span className="font-medium">{record.rewardTitle}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>消耗积分: {record.pointsCost.toLocaleString()}</span>
                            <span>批准时间: {formatDate(record.approvedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 状态和操作 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {record.status === "approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onMarkFulfilled(record.id)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            标记已发放
                          </Button>
                        ) : (
                          <Badge variant="default" className="bg-green-500 text-white">
                            ✓ 已发放
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}