import React, { useState, useEffect } from 'react';
import { ParentDashboard } from './ParentDashboard';
import { pointsService } from '../services/points.service';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

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

export function ParentDashboardSection() {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user (should be a parent)
      const currentUser = authService.getCurrentUser();
      const parentId = currentUser?.id;

      // Load pending approvals and redemption history in parallel
      const [pendingResponse, historyResponse] = await Promise.all([
        pointsService.getPendingApprovals(parentId),
        pointsService.getRedemptionHistory(undefined, 50) // Get recent history for all family members
      ]);

      // Transform pending approvals to match component interface
      const transformedPending: PendingApproval[] = pendingResponse.map(approval => ({
        id: approval.id,
        childName: approval.studentName,
        rewardTitle: approval.rewardTitle,
        pointsCost: approval.pointsCost,
        requestedAt: approval.requestedAt,
        category: approval.rewardCategory
      }));

      // Transform redemption history to match component interface
      const transformedHistory: RedemptionHistory[] = historyResponse.redemptions
        .filter(redemption => redemption.status === 'approved' || redemption.status === 'fulfilled')
        .map(redemption => ({
          id: redemption.id,
          childName: redemption.rewardTitle, // TODO: Get actual child name from user data
          rewardTitle: redemption.rewardTitle,
          pointsCost: redemption.pointsCost,
          approvedAt: redemption.approvedAt || redemption.requestedAt,
          status: redemption.status as "approved" | "fulfilled"
        }));

      setPendingApprovals(transformedPending);
      setRedemptionHistory(transformedHistory);
    } catch (error: any) {
      console.error('加载家长仪表板数据失败:', error);
      
      // Provide fallback mock data if API fails
      console.warn('使用备用数据...');
      setPendingApprovals([
        {
          id: "fallback-pending-1",
          childName: "小明",
          rewardTitle: "乐高积木套装",
          pointsCost: 2500,
          requestedAt: "2025-01-06T10:30:00Z",
          category: "玩具"
        },
        {
          id: "fallback-pending-2",
          childName: "小红",
          rewardTitle: "儿童图书套装",
          pointsCost: 800,
          requestedAt: "2025-01-06T14:15:00Z",
          category: "图书"
        }
      ]);

      setRedemptionHistory([
        {
          id: "fallback-history-1",
          childName: "小明",
          rewardTitle: "美味零食大礼包",
          pointsCost: 300,
          approvedAt: "2025-01-05T16:20:00Z",
          status: "fulfilled"
        },
        {
          id: "fallback-history-2",
          childName: "小红",
          rewardTitle: "游乐园门票",
          pointsCost: 5000,
          approvedAt: "2025-01-04T09:10:00Z",
          status: "approved"
        }
      ]);
      
      toast.error('加载仪表板失败，显示示例数据');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      
      // Find the approval to get reward info
      const approval = pendingApprovals.find(a => a.id === id);
      if (!approval) return;

      // Approve the redemption
      const response = await pointsService.approveRedemption(id, '家长同意兑换申请');
      
      toast.success(
        `✅ 已批准 ${approval.childName} 兑换 ${approval.rewardTitle}！`,
        { duration: 4000 }
      );

      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(a => a.id !== id));
      
      // Add to redemption history
      setRedemptionHistory(prev => [{
        id: response.redemption.id,
        childName: approval.childName,
        rewardTitle: approval.rewardTitle,
        pointsCost: approval.pointsCost,
        approvedAt: response.redemption.approvedAt,
        status: "approved"
      }, ...prev]);

    } catch (error: any) {
      console.error('审批失败:', error);
      toast.error(error?.message || '审批失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      
      // Find the approval to get reward info
      const approval = pendingApprovals.find(a => a.id === id);
      if (!approval) return;

      // Reject the redemption
      const response = await pointsService.rejectRedemption(id, '暂时不适合兑换此奖励');
      
      toast.success(
        `❌ 已拒绝 ${approval.childName} 的兑换申请\n积分已退还: ${response.pointsRefunded}`,
        { duration: 4000 }
      );

      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(a => a.id !== id));

    } catch (error: any) {
      console.error('拒绝审批失败:', error);
      toast.error(error?.message || '拒绝失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkFulfilled = async (id: string) => {
    try {
      setProcessingId(id);
      
      // Find the item in history
      const historyItem = redemptionHistory.find(h => h.id === id);
      if (!historyItem) return;

      // Mark as fulfilled
      const response = await pointsService.markRedemptionFulfilled(id, '奖励已发放给孩子');
      
      toast.success(
        `🎁 已标记 ${historyItem.rewardTitle} 为已发放！`,
        { duration: 4000 }
      );

      // Update status in redemption history
      setRedemptionHistory(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, status: "fulfilled" as const }
            : item
        )
      );

    } catch (error: any) {
      console.error('标记已发放失败:', error);
      toast.error(error?.message || '标记失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">加载家长仪表板中...</span>
      </div>
    );
  }

  return (
    <ParentDashboard
      pendingApprovals={pendingApprovals}
      redemptionHistory={redemptionHistory}
      onApprove={handleApprove}
      onReject={handleReject}
      onMarkFulfilled={handleMarkFulfilled}
    />
  );
}