import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TGAChart = ({ data }) => {
    const [timeRange, setTimeRange] = useState('Max');

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
                startDate = new Date('2000-01-01'); // User requested Since 2000
                break;
            default:
                startDate.setFullYear(now.getFullYear() - 1);
        }

        return data.filter(item => new Date(item.date) >= startDate);
    };

    const chartData = getFilteredData();
    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].tga : 0;

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                        Treasury General Account (TGA)
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        US Treasury's checking account at the Fed
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold text-slate-100">
                        {chartData.length > 0 ? `$${chartData[chartData.length - 1].tga?.toFixed(3)}T` : '$0.000T'}
                    </div>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                        {['1Y', '5Y', 'Max'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.getFullYear();
                            }}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${val.toFixed(2)}T`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                            formatter={(value) => [`$${value.toFixed(3)}T`, 'TGA']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="tga"
                            name="TGA Balance"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TGAChart;
