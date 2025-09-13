import Joi from 'joi';

// 创建任务模板验证
export const createTaskTemplateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.min': 'Task name cannot be empty',
      'string.max': 'Task name cannot exceed 100 characters'
    }),
  
  description: Joi.string().max(500).required()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  category: Joi.string()
    .valid('exercise', 'reading', 'chores', 'learning', 'creativity', 'other')
    .required()
    .messages({
      'any.only': 'Category must be one of: exercise, reading, chores, learning, creativity, other'
    }),
  
  difficulty: Joi.number().integer().min(1).max(5).required()
    .messages({
      'number.min': 'Difficulty must be between 1 and 5',
      'number.max': 'Difficulty must be between 1 and 5'
    }),
  
  pointsReward: Joi.number().min(0).optional(),
  xpReward: Joi.number().min(0).optional(),
  
  estimatedMinutes: Joi.number().integer().min(1).required()
    .messages({
      'number.min': 'Estimated time must be at least 1 minute'
    }),
  
  requiresEvidence: Joi.boolean().default(false),
  
  evidenceTypes: Joi.array()
    .items(Joi.string().valid('photo', 'video', 'text', 'file'))
    .default([]),
  
  skillCategories: Joi.array().items(Joi.string().max(50)).default([]),
  tags: Joi.array().items(Joi.string().max(20)).default([]),
  
  recurrence: Joi.object({
    type: Joi.string().valid('once', 'daily', 'weekly', 'custom').default('once'),
    daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)),
    endDate: Joi.date().greater('now')
  }).optional()
});

// 快速创建并排期验证
export const quickCreateAndScheduleSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(500).required(),
  category: Joi.string()
    .valid('exercise', 'reading', 'chores', 'learning', 'creativity', 'other')
    .required(),
  difficulty: Joi.number().integer().min(1).max(5).required(),
  estimatedMinutes: Joi.number().integer().min(1).required(),
  
  // 排期相关字段
  scheduledAt: Joi.date().default(() => new Date()),
  requiresApproval: Joi.boolean().default(false),
  requiresEvidence: Joi.boolean().default(false),
  evidenceTypes: Joi.array()
    .items(Joi.string().valid('photo', 'video', 'text', 'file'))
    .default([]),
  
  // 可选的自定义奖励
  pointsReward: Joi.number().min(0).optional(),
  xpReward: Joi.number().min(0).optional(),
  skillCategories: Joi.array().items(Joi.string().max(50)).default([]),
  tags: Joi.array().items(Joi.string().max(20)).default([])
});

// 任务查询过滤验证
export const taskFilterQuerySchema = Joi.object({
  status: Joi.string()
    .valid('planned', 'in_progress', 'completed', 'skipped', 'expired')
    .optional(),
  
  category: Joi.string()
    .valid('exercise', 'reading', 'chores', 'learning', 'creativity', 'other')
    .optional(),
  
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  
  isActive: Joi.boolean().optional()
}).with('dateTo', 'dateFrom'); // dateTo requires dateFrom

// 更新任务状态验证
export const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('planned', 'in_progress', 'completed', 'skipped')
    .required(),
  
  notes: Joi.string().max(500).optional()
});

// 完成任务验证
export const completeTaskSchema = Joi.object({
  evidence: Joi.object({
    type: Joi.string().valid('photo', 'video', 'text', 'file').required(),
    fileIds: Joi.array().items(Joi.string()).default([]),
    notes: Joi.string().max(1000).default('')
  }).optional(),
  
  notes: Joi.string().max(500).optional()
});

// 任务审批验证
export const approveTaskSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  reviewNotes: Joi.string().max(500).optional()
});

// 排期任务验证
export const scheduleTaskSchema = Joi.object({
  templateId: Joi.string().required(),
  userId: Joi.string().required(),
  scheduledAt: Joi.date().required(),
  requiresApproval: Joi.boolean().default(false),
  notes: Joi.string().max(500).optional()
});