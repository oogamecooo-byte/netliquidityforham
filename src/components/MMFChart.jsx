import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const MMFChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [latestValue, setLatestValue] = useState(null);
    const [latestDate, setLatestDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch binary data from our Vercel proxy
                const response = await axios.get('/api/ici-data', {
                    responseType: 'arraybuffer'
                });

                const workbook = XLSX.read(response.data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Parse data starting from row 9 (index 9)
                // Column 0: Date, Column 2: Total Net Assets (Millions)
                const parsedData = [];

                // Find the starting row. Usually it's around index 9, but let's look for a date-like pattern in col 0
                // or just hardcode based on analysis if structure is stable.
                // Based on analysis: Row 9 is the first data row.
                const startRowIndex = 9;

                for (let i = startRowIndex; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || !row[0]) continue;

                    const dateStr = row[0]; // e.g. "08/13/2025 "
                    const tnaVal = row[2];  // Total Net Assets in Millions

                    if (dateStr && tnaVal) {
                        // Convert Excel date or string date
                        let dateObj;
                        if (typeof dateStr === 'number') {
                            dateObj = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
                        } else {
                            dateObj = new Date(dateStr.trim());
                        }

                        if (!isNaN(dateObj.getTime())) {
                            // Convert Millions to Trillions for consistency with other charts
                            // 7,185,830 M = 7.18 T
                            const valTrillions = parseFloat(tnaVal) / 1000000;

                            parsedData.push({
                                date: dateObj.toISOString().split('T')[0], // YYYY-MM-DD
                                value: valTrillions,
                                originalDate: dateStr
                            });
                        }
                    }
                }

                // Sort by date ascending
                parsedData.sort((a, b) => new Date(a.date) - new Date(b.date));

                if (parsedData.length > 0) {
                    setData(parsedData);
                    setLatestValue(parsedData[parsedData.length - 1].value);
                    setLatestDate(parsedData[parsedData.length - 1].date);
                } else {
                    throw new Error("No valid data found in ICI Excel file");
                }

            } catch (err) {
                console.error("Failed to fetch MMF data:", err);
                setError("Failed to load MMF data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center h-[400px] text-red-400">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                        Money Market Fund Assets (Total)
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Source: ICI (Weekly)
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-slate-100">
                        ${latestValue?.toFixed(2)}T
                    </div>
                    <div className="text-slate-400 text-sm">
                        {latestDate}
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
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
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value) => [`$${value.toFixed(3)}T`, 'Total Assets']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: '#10b981' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MMFChart;
