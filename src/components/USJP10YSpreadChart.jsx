import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const USJP10YSpreadChart = ({ data }) => {
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

        return data.filter(item => new Date(item.date) >= startDate && item.usJpSpread !== null && item.usJpSpread !== undefined);
    };

    const chartData = getFilteredData();
    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].usJpSpread : 0;

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-6 bg-cyan-500 rounded-full"></span>
                        US-JP 10Y Yield Spread
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        US 10Y Treasury Yield - Japan 10Y Govt Bond Yield
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold text-slate-100">
                        {latestValue?.toFixed(2)}%
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
                            tickFormatter={(val) => `${val.toFixed(1)}%`}
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
                            formatter={(value) => [`${value.toFixed(2)}%`, 'Spread']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="usJpSpread"
                            name="Yield Spread"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default USJP10YSpreadChart;
