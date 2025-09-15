import React from 'react';
import { motion } from 'motion/react';

// 简化的图表组件，不依赖外部图表库
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LearningAnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'heatmap';
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  height?: number;
  showValues?: boolean;
  animate?: boolean;
}

// 颜色主题
const CHART_COLORS = [
  '#58CC02', // duolingo-green
  '#1CB0F6', // duolingo-blue  
  '#FF9600', // duolingo-orange
  '#CE82FF', // duolingo-purple
  '#FF9CE5', // duolingo-pink
  '#FFC800', // duolingo-yellow
  '#FF4B4B', // duolingo-red
  '#00E5A3'  // duolingo-teal
];

export const LearningAnalyticsChart: React.FC<LearningAnalyticsChartProps> = ({
  type,
  data,
  title,
  subtitle,
  height = 300,
  showValues = true,
  animate = true
}) => {
  const [containerWidth, setContainerWidth] = React.useState(600);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 48); // 减去padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  // 线图组件
  const LineChart: React.FC = () => {
    const chartHeight = height - 80;
    const padding = 60;
    
    const xStep = (containerWidth - 2 * padding) / Math.max(data.length - 1, 1);
    const yScale = (chartHeight - 2 * padding) / (maxValue - minValue || 1);
    
    const points = data.map((point, index) => {
      const x = padding + index * xStep;
      const y = chartHeight - padding - (point.value - minValue) * yScale;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="relative">
        <svg
          width={containerWidth}
          height={height}
          className="overflow-visible"
          role="img"
          aria-label={`${title} 折线图`}
        >
          <title>{title}</title>
          {/* 网格线 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y轴标签 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - padding - ratio * (chartHeight - 2 * padding);
            const value = Math.round(minValue + ratio * (maxValue - minValue));
            return (
              <g key={index}>
                <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#6b7280" strokeWidth="1"/>
                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* X轴标签 */}
          {data.map((point, index) => {
            const x = padding + index * xStep;
            return (
              <g key={index}>
                <line x1={x} y1={chartHeight - padding} x2={x} y2={chartHeight - padding + 5} stroke="#6b7280" strokeWidth="1"/>
                <text x={x} y={chartHeight - padding + 20} textAnchor="middle" className="text-xs fill-gray-600">
                  {point.label}
                </text>
              </g>
            );
          })}
          
          {/* 线条 */}
          <motion.polyline
            points={points}
            fill="none"
            stroke={CHART_COLORS[0]}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : {}}
            animate={animate ? { pathLength: 1 } : {}}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          
          {/* 数据点 */}
          {data.map((point, index) => {
            const x = padding + index * xStep;
            const y = chartHeight - padding - (point.value - minValue) * yScale;
            return (
              <motion.g key={index}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={CHART_COLORS[0]}
                  stroke="white"
                  strokeWidth="2"
                  initial={animate ? { scale: 0, opacity: 0 } : {}}
                  animate={animate ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.2 }}
                />
                {showValues && (
                  <motion.text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-gray-700"
                    initial={animate ? { opacity: 0, y: y - 5 } : {}}
                    animate={animate ? { opacity: 1, y: y - 15 } : {}}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  >
                    {point.value}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    );
  };
  
  // 柱状图组件
  const BarChart: React.FC = () => {
    const chartHeight = height - 80;
    const padding = 60;
    
    const barWidth = (containerWidth - 2 * padding) / data.length * 0.7;
    const barSpacing = (containerWidth - 2 * padding) / data.length * 0.3;
    const yScale = (chartHeight - 2 * padding) / maxValue;
    
    return (
      <div className="relative">
        <svg
          width={containerWidth}
          height={height}
          className="overflow-visible"
          role="img"
          aria-label={`${title} 柱状图`}
        >
          <title>{title}</title>
          {/* Y轴标签 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - padding - ratio * (chartHeight - 2 * padding);
            const value = Math.round(ratio * maxValue);
            return (
              <g key={index}>
                <line x1={padding - 5} y1={y} x2={containerWidth - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* 柱状图 */}
          {data.map((point, index) => {
            const x = padding + index * (barWidth + barSpacing);
            const barHeight = point.value * yScale;
            const y = chartHeight - padding - barHeight;
            const color = point.color || CHART_COLORS[index % CHART_COLORS.length];
            
            return (
              <motion.g key={index}>
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx="4"
                  ry="4"
                  initial={animate ? { scaleY: 0, y: chartHeight - padding } : {}}
                  animate={animate ? { scaleY: 1, y } : {}}
                  transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
                  whileHover={{ scale: 1.05, brightness: 1.1 }}
                />
                
                {/* 标签 */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.label}
                </text>
                
                {/* 数值 */}
                {showValues && (
                  <motion.text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-sm font-semibold fill-gray-700"
                    initial={animate ? { opacity: 0 } : {}}
                    animate={animate ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.6, duration: 0.3 }}
                  >
                    {point.value}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    );
  };
  
  // 饼图组件
  const PieChart: React.FC = () => {
    const size = Math.min(height, 400);
    const radius = (size - 60) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90; // 从顶部开始
    
    return (
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="overflow-visible"
          role="img"
          aria-label={`${title} 饼图`}
        >
          <title>{title}</title>
          {data.map((point, index) => {
            const percentage = (point.value / total) * 100;
            const angle = (point.value / total) * 360;
            const color = point.color || CHART_COLORS[index % CHART_COLORS.length];
            
            // 计算弧形路径
            const startAngle = (currentAngle * Math.PI) / 180;
            const endAngle = ((currentAngle + angle) * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            // 标签位置
            const labelAngle = currentAngle + angle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
            const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
            
            currentAngle += angle;
            
            return (
              <motion.g key={index}>
                <motion.path
                  d={pathData}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  initial={animate ? { scale: 0, opacity: 0 } : {}}
                  animate={animate ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                />
                
                {percentage > 5 && ( // 只显示占比大于5%的标签
                  <motion.text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-semibold fill-white"
                    initial={animate ? { opacity: 0 } : {}}
                    animate={animate ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.6, duration: 0.3 }}
                  >
                    {showValues ? `${Math.round(percentage)}%` : point.label}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
        
        {/* 图例 */}
        <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 ml-6">
          {data.map((point, index) => {
            const color = point.color || CHART_COLORS[index % CHART_COLORS.length];
            const percentage = Math.round((point.value / total) * 100);
            
            return (
              <motion.div
                key={index}
                className="flex items-center mb-2"
                initial={animate ? { opacity: 0, x: -10 } : {}}
                animate={animate ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 + 0.8, duration: 0.3 }}
              >
                <div 
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700">
                  {point.label} ({percentage}%)
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 雷达图组件
  const RadarChart: React.FC = () => {
    const size = 300;
    const radius = (size - 60) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const levels = 5;
    
    const angleStep = (2 * Math.PI) / data.length;
    
    return (
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="overflow-visible"
          role="img"
          aria-label={`${title} 雷达图`}
        >
          <title>{title}</title>
          {/* 网格线 */}
          {Array.from({ length: levels }, (_, level) => {
            const levelRadius = radius * (level + 1) / levels;
            const points = data.map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const x = centerX + levelRadius * Math.cos(angle);
              const y = centerY + levelRadius * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ');
            
            return (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity={0.3}
              />
            );
          })}
          
          {/* 轴线 */}
          {data.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity={0.5}
              />
            );
          })}
          
          {/* 数据多边形 */}
          <motion.polygon
            points={data.map((point, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const distance = (point.value / maxValue) * radius;
              const x = centerX + distance * Math.cos(angle);
              const y = centerY + distance * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill={CHART_COLORS[0]}
            fillOpacity="0.3"
            stroke={CHART_COLORS[0]}
            strokeWidth="2"
            initial={animate ? { scale: 0, opacity: 0 } : {}}
            animate={animate ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1, type: "spring" }}
          />
          
          {/* 数据点 */}
          {data.map((point, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = (point.value / maxValue) * radius;
            const x = centerX + distance * Math.cos(angle);
            const y = centerY + distance * Math.sin(angle);
            
            // 标签位置
            const labelDistance = radius + 20;
            const labelX = centerX + labelDistance * Math.cos(angle);
            const labelY = centerY + labelDistance * Math.sin(angle);
            
            return (
              <motion.g key={index}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={CHART_COLORS[0]}
                  stroke="white"
                  strokeWidth="2"
                  initial={animate ? { scale: 0 } : {}}
                  animate={animate ? { scale: 1 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                />
                
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-gray-700"
                >
                  {point.label}
                </text>
                
                {showValues && (
                  <motion.text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-gray-800"
                    initial={animate ? { opacity: 0 } : {}}
                    animate={animate ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  >
                    {point.value}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    );
  };
  
  // 热力图组件
  const HeatmapChart: React.FC = () => {
    const cellSize = 40;
    const cols = Math.ceil(Math.sqrt(data.length));
    const rows = Math.ceil(data.length / cols);
    const width = cols * cellSize;
    const height = rows * cellSize;
    
    return (
      <div className="relative">
        <svg
          width={width}
          height={height + 40}
          className="overflow-visible"
          role="img"
          aria-label={`${title} 热力图`}
        >
          <title>{title}</title>
          {data.map((point, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = col * cellSize;
            const y = row * cellSize;
            
            // 根据值计算颜色强度
            const intensity = point.value / maxValue;
            const color = point.color || CHART_COLORS[0];
            
            return (
              <motion.g key={index}>
                <motion.rect
                  x={x}
                  y={y}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  fill={color}
                  fillOpacity={intensity}
                  stroke="white"
                  strokeWidth="1"
                  rx="4"
                  initial={animate ? { scale: 0, opacity: 0 } : {}}
                  animate={animate ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                />
                
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2 - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-gray-700"
                >
                  {point.label}
                </text>
                
                {showValues && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-semibold fill-gray-800"
                  >
                    {point.value}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    );
  };
  
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <LineChart />;
      case 'bar':
        return <BarChart />;
      case 'pie':
        return <PieChart />;
      case 'radar':
        return <RadarChart />;
      case 'heatmap':
        return <HeatmapChart />;
      default:
        return <BarChart />;
    }
  };
  
  return (
    <motion.div 
      ref={containerRef}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      initial={animate ? { opacity: 0, y: 20 } : {}}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      
      {/* 图表 */}
      <div className="flex justify-center">
        {renderChart()}
      </div>
    </motion.div>
  );
};

export default LearningAnalyticsChart;
