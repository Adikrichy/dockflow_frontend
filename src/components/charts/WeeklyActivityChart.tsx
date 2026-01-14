import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeeklyData {
  day: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface WeeklyActivityChartProps {
  data: WeeklyData[];
}

const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="approved" fill="#10b981" name="Approved" />
          <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
          <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyActivityChart;
