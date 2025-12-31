import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RRPChart = ({ data }) => {
    const [timeRange, setTimeRange] = useState('1Y');

    const getFilteredData = () => {
        if (!data || data.length === 0) return [];

        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case '1Y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case '5Y':
                startDate.setFullYear(now.getFullYear() - 5);
                break;
            case 'Max':
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate.setFullYear(now.getFullYear() - 1);
        }

        return data.filter(item => new Date(item.date) >= startDate);
    };

    const chartData = getFilteredData();
    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].rrp : 0;

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                        Overnight Reverse Repo (RRP)
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Cash parked at the Fed by Money Market Funds
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold text-slate-100">
                        ${latestValue?.toFixed(3)}T
                    </div>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                        {['1Y', '5Y', 'Max'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeRange === range
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${val.toFixed(2)}T`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                            itemStyle={{ color: '#a855f7' }}
                            formatter={(value) => [`$${value.toFixed(3)}T`, 'RRP']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="rrp"
                            name="RRP Balance"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: '#a855f7' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RRPChart;
