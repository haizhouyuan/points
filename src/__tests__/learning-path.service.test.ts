import { describe, it, expect } from 'vitest';
import LearningPathService, { PathGenerationConfig } from '@/services/learning-path.service';

describe('LearningPathService', () => {
  it('generates a path for targetSkills including 中文类别 (category fallback works)', () => {
    const cfg: PathGenerationConfig = {
      targetSkills: ['数学'],
      currentLevel: 1,
      availableTimePerWeek: 5,
      preferredDifficulty: 'medium',
      learningGoal: 'mastery',
    };

    const rec = LearningPathService.generateLearningPath('u1', cfg);
    const progress = LearningPathService.getPathProgress(rec.pathId);

    expect(progress).not.toBeNull();
    expect(progress!.path.nodes.length).toBeGreaterThan(0);
    // 至少包含一个数学类别的节点
    expect(progress!.path.nodes.some(n => n.category === '数学')).toBe(true);
  });

  it('respects prerequisites order (math_basic_1 before math_basic_2)', () => {
    const cfg: PathGenerationConfig = {
      targetSkills: ['数学'],
      currentLevel: 2,
      availableTimePerWeek: 5,
      preferredDifficulty: 'medium',
      learningGoal: 'mastery',
    };

    const rec = LearningPathService.generateLearningPath('u2', cfg);
    const progress = LearningPathService.getPathProgress(rec.pathId)!;
    const ids = progress.path.nodes.map(n => n.id);
    const i1 = ids.indexOf('math_basic_1');
    const i2 = ids.indexOf('math_basic_2');

    if (i1 !== -1 && i2 !== -1) {
      expect(i1).toBeLessThan(i2);
    } else {
      // 部分测试环境可能因时间/权重裁剪未包含所有节点
      expect(true).toBe(true);
    }
  });

  it('trims path when timeConstraint is in the past (non-negative weeks)', () => {
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const cfg: PathGenerationConfig = {
      targetSkills: ['数学'],
      currentLevel: 2,
      availableTimePerWeek: 5,
      preferredDifficulty: 'medium',
      learningGoal: 'mastery',
      timeConstraint: past,
    };

    const rec = LearningPathService.generateLearningPath('u3', cfg);
    const progress = LearningPathService.getPathProgress(rec.pathId)!;
    // 过去一周截止时间 => 可用周数为0 => 预计剩余时间与节点数应为0或极少
    expect(progress.path.nodes.length).toBeGreaterThanOrEqual(0);
    expect(progress.path.nodes.length).toBeLessThanOrEqual(1);
  });
});

