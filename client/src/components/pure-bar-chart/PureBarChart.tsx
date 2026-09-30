import React from 'react';
import './PureBarChart.css';

interface PureBarChartProps {
  counts: number[];
  color?: string;
  activeColor?: string;
  height?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PureBarChart: React.FC<PureBarChartProps> = ({
  counts,
  color = 'var(--primary)',
  activeColor = 'var(--accent)',
  height = 200,
}) => {
  const currentMonthIdx = new Date().getMonth();
  const maxVal = Math.max(1, ...counts);
  const svgWidth = 580;
  const paddingX = 24;
  const bottomLabelSpace = 32;
  const topSpace = 24;
  const chartHeight = height - bottomLabelSpace - topSpace;
  const barSlotWidth = (svgWidth - paddingX * 2) / 12;
  const barWidth = Math.max(12, barSlotWidth - 14);

  return (
    <div className="chart-container">
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
        preserveAspectRatio="none"
      >
        {/* Baseline */}
        <line
          x1={paddingX}
          y1={height - bottomLabelSpace}
          x2={svgWidth - paddingX}
          y2={height - bottomLabelSpace}
          stroke="var(--border)"
          strokeWidth="1"
        />

        {counts.map((count, idx) => {
          const barH = count > 0 ? Math.round((chartHeight * count) / maxVal) : 4;
          const x = paddingX + idx * barSlotWidth + (barSlotWidth - barWidth) / 2;
          const y = height - bottomLabelSpace - barH;
          const isCurrent = idx === currentMonthIdx;
          const fill = isCurrent ? activeColor : color;
          const opacity = count > 0 ? (isCurrent ? 1 : 0.85) : 0.15;

          return (
            <g key={idx} className="chart-bar-group">
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={fill}
                opacity={opacity}
              >
                <title>{`${MONTHS[idx]}: ${count} awards`}</title>
              </rect>

              {/* Value label on top of bar */}
              {count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--t2)"
                >
                  {count}
                </text>
              )}

              {/* Month label */}
              <text
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isCurrent ? '700' : '500'}
                fill={isCurrent ? 'var(--accent)' : 'var(--t3)'}
              >
                {MONTHS[idx]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default PureBarChart;
