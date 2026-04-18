import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface StatChartCardProps {
  title: string;
  iqd: number;
  usd: number;
  icon?: React.ReactNode;
}

const COLORS = ["#0088FE", "#00C49F"]; // IQD = blue, USD = green

const StatChartCard: React.FC<StatChartCardProps> = ({ title, iqd, usd, icon }) => {
  const data = [
    { name: "IQD", value: iqd },
    { name: "USD", value: usd },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-3xl">{icon || "📊"}</div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={60}
            paddingAngle={5}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString("en-IQ")} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-around mt-2 text-sm text-gray-600">
        <span>IQD: {iqd.toLocaleString("en-IQ")}</span>
        <span>USD: {usd.toLocaleString("en-IQ")}</span>
      </div>
    </div>
  );
};

export default StatChartCard;
