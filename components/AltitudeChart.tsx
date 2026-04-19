"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const defaultData = [
  { name: "成都", distance: "0km", altitude: 500 },
  { name: "雅安", distance: "140km", altitude: 600 },
  { name: "康定", distance: "285km", altitude: 2560 },
  { name: "折多山", distance: "320km", altitude: 4298 },
  { name: "新都桥", distance: "360km", altitude: 3300 },
  { name: "理塘", distance: "560km", altitude: 4014 },
  { name: "东达山", distance: "800km", altitude: 5130 },
  { name: "林芝", distance: "1600km", altitude: 2900 },
  { name: "拉萨", distance: "2140km", altitude: 3650 },
];

export default function AltitudeChart({
  data = defaultData,
}: {
  data?: any[];
}) {
  return (
    <div className="w-full mb-4 mt-2">
      <div className="h-[175px] w-full bg-white rounded-[16px] px-2 py-4 border border-gray-100 shadow-sm relative">
        <span className="absolute top-3 right-4 text-[11px] text-gray-400 font-medium z-10">海拔概览</span>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 15, left: 15, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorAltitude" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2C3E50" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2C3E50" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={(props: any) => {
                const { x, y, payload } = props;
                if (!data || data.length === 0) return null;
                
                // payload.index is the actual index of the data point, avoiding Recharts auto-skipping tick indices
                const isStart = payload.index === 0;
                const isEnd = payload.index === data.length - 1;
                
                if (!isStart && !isEnd) return null;
                
                return (
                  <text
                    x={x}
                    y={y}
                    dy={20}
                    textAnchor={isStart ? "start" : "end"}
                    fill="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                  >
                    {payload.value}
                  </text>
                );
              }}
              height={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={false}
              width={0}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
              labelStyle={{
                fontWeight: "bold",
                color: "#1e293b",
                marginBottom: "4px",
              }}
              itemStyle={{ color: "#2C3E50", fontSize: "14px", fontWeight: 600 }}
              formatter={(value: any) => [`${value} m`, "海拔"]}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <Area
              type="monotone"
              dataKey="altitude"
              stroke="#2C3E50"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAltitude)"
              animationDuration={1500}
              dot={{ r: 3, fill: "#2C3E50", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#F39C12", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
