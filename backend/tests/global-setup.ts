export default async (): Promise<void> => {
  console.log('🧪 开始设置测试环境...');
  
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  
  console.log('✅ 测试环境设置完成');
};