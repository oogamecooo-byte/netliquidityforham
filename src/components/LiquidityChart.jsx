import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const LiquidityChart = ({ data }) => {
    const [timeRange, setTimeRange] = useState('ALL'); // 1Y, 5Y, ALL

    const filteredData = useMemo(() => {
        if (timeRange === 'ALL') return data;

        const now = new Date();
        const cutoff = new Date();

        if (timeRange === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
        if (timeRange === '5Y') cutoff.setFullYear(now.getFullYear() - 5);

        return data.filter(d => new Date(d.date) >= cutoff);
    }, [data, timeRange]);

    return (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                    Net Liquidity (Trillions $)
                </h2>
                <div className="flex bg-slate-800/50 rounded-lg p-1">
                    {['1Y', '5Y', 'ALL'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#64748b"
                            unit="T"
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                            itemStyle={{ color: '#cbd5e1' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            formatter={(value) => [`$${value.toFixed(2)}T`, '']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        <Line
                            type="monotone"
                            dataKey="netLiquidity"
                            name="Net Liquidity"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LiquidityChart;
