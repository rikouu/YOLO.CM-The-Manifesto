import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { soundManager } from '../services/soundService';

const CustomScatterPoint = (props: any) => {
  const { cx, cy, fill, index } = props;
  const [hovered, setHovered] = useState(false);
  
  // Stagger animation based on index
  const animationDelay = `${index * 100}ms`;
  
  // Random idle pulse delay to make it look organic
  const idleDelay = useMemo(() => `${Math.random() * 3}s`, []);

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <g style={{ animation: `pointEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay} both` }}>
        {/* Hover trigger area (invisible but larger) */}
        <circle 
            r={24} 
            fill="transparent" 
            onMouseEnter={() => {
                setHovered(true);
                soundManager.playHover();
            }}
            onMouseLeave={() => setHovered(false)}
            style={{ cursor: 'pointer' }}
        />
        
        {/* Idle Beacon Ripple - subtle animation to suggest interactivity */}
        {!hovered && (
             <circle
                r={12}
                fill="none"
                stroke={fill}
                strokeWidth={1}
                className="opacity-0"
                style={{ 
                    animation: `ripple 3s infinite ${idleDelay}`,
                    pointerEvents: 'none'
                }}
            />
        )}

        {/* Visible Point */}
        <circle 
            r={hovered ? 12 : 6}
            fill={fill}
            stroke="#050505"
            strokeWidth={2}
            className="transition-all duration-300 ease-out"
            style={{ pointerEvents: 'none' }} 
        />

        {/* Hover Effect Ring */}
        <circle
            r={hovered ? 20 : 6}
            fill="none"
            stroke={fill}
            strokeWidth={1}
            className={`transition-all duration-300 ease-out ${hovered ? 'opacity-100' : 'opacity-0'}`}
            style={{ pointerEvents: 'none' }}
        />
        
        {/* Active Pulse when hovered */}
        {hovered && (
             <circle
                r={20}
                fill="none"
                stroke={fill}
                strokeWidth={1}
                className="animate-ping"
                style={{ opacity: 0.5, pointerEvents: 'none' }}
            />
        )}
      </g>
    </g>
  );
};

const RegretChart: React.FC = () => {
  const { t } = useLanguage();

  const data = [
    { x: 10, y: 90, z: 200, label: t.stats.data.tv },
    { x: 90, y: 10, z: 500, label: t.stats.data.skydiving }, 
    { x: 50, y: 50, z: 100, label: t.stats.data.asking },
    { x: 20, y: 80, z: 150, label: t.stats.data.work },
    { x: 80, y: 20, z: 400, label: t.stats.data.travel },
    { x: 30, y: 70, z: 120, label: t.stats.data.diet },
    { x: 95, y: 5, z: 600, label: t.stats.data.quit },
    { x: 5, y: 95, z: 50, label: t.stats.data.doom },
    // New data points
    { x: 70, y: 40, z: 300, label: t.stats.data.tattoo },
    { x: 85, y: 90, z: 100, label: t.stats.data.textEx },
    { x: 45, y: 15, z: 200, label: t.stats.data.karaoke },
    { x: 85, y: 25, z: 500, label: t.stats.data.startup },
    { x: 60, y: 10, z: 250, label: t.stats.data.learn },
    { x: 5, y: 60, z: 100, label: t.stats.data.sleep },
    { x: 65, y: 75, z: 300, label: t.stats.data.party },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-yolo-black border border-yolo-lime p-4 shadow-xl z-50">
          <p className="font-bold text-yolo-lime font-mono mb-2">{payload[0].payload.label}</p>
          <p className="text-xs text-white">{t.stats.riskLabel}: {payload[0].value}%</p>
          <p className="text-xs text-white">{t.stats.regretLabel}: {payload[1].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 min-h-[500px]">
      <style>
        {`
          @keyframes pointEnter {
            0% { opacity: 0; transform: scale(0); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes ripple {
            0% { transform: scale(1); opacity: 0.8; stroke-width: 2px; }
            100% { transform: scale(3); opacity: 0; stroke-width: 0px; }
          }
        `}
      </style>

      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-mono text-yolo-pink mb-2">
          {t.stats.title}
        </h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          {t.stats.subtitle}
        </p>
      </div>
      
      <div className="w-full max-w-5xl h-[50vh] min-h-[300px] md:h-[500px] bg-yolo-gray/20 border border-yolo-gray/50 rounded-lg p-4 relative overflow-hidden">
        {/* Decorative background grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Risk" 
              stroke="#666" 
              label={{ value: t.stats.riskLabel + ' →', position: 'bottom', fill: '#666', fontSize: 12 }} 
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Regret" 
              stroke="#666" 
              label={{ value: t.stats.regretLabel + ' →', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 12 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine y={50} stroke="#ccff00" strokeDasharray="3 3" opacity={0.3} />
            <ReferenceLine x={50} stroke="#ccff00" strokeDasharray="3 3" opacity={0.3} />
            <Scatter 
                name="Activities" 
                data={data} 
                shape={<CustomScatterPoint />}
                isAnimationActive={false} // Disable default animation to use our custom one
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ccff00' : '#ff00cc'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-yolo-gray font-mono text-xs text-center max-w-md">
        {t.stats.disclaimer}
      </p>
    </div>
  );
};

export default RegretChart;