import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Landmark, TrendingUp } from 'lucide-react';

const FlowAnimation = ({ data }) => {
    if (!data || data.length === 0) return (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm h-[600px] flex items-center justify-center">
            <p className="text-slate-400">Loading animation data...</p>
        </div>
    );

    // Get the latest week's data
    const latest = data[data.length - 1];
    const delta = latest.delta;

    // --- Logic Definition ---

    // 1. TGA <-> Market
    // Logic: TGA Change.
    // +TGA: Market -> TGA (Tax/Bond sales, Money leaves Market)
    // -TGA: TGA -> Market (Gov Spending, Money enters Market)
    const tgaVal = delta.tga;

    // 2. Fed <-> Market (Corrected Logic)
    // Logic: Change in Fed Assets + (-1 * Change in RRP).
    // Formula: delta.fedAssets - delta.rrp
    // Direction:
    // + (Positive): Fed -> Market (Liquidity Injection)
    // - (Negative): Market -> Fed (Liquidity Withdrawal)
    const walclVal = delta.fedAssets - delta.rrp;

    // Helper for formatting
    const formatVal = (val, unit = 'B') => {
        const absVal = Math.abs(val);
        if (absVal >= 1000) {
            return `${(absVal / 1000).toFixed(2)}T`;
        }
        return `${absVal.toFixed(2)}${unit}`;
    };

    const FlowPath = ({ value, label, color, positiveText, negativeText, isStock = false, vertical = false }) => {
        if (Math.abs(value) < 0.1) return null;

        // value > 0: positiveText
        // value < 0: negativeText
        const flowText = value > 0 ? positiveText : negativeText;

        return (
            <div className={`absolute inset-0 pointer-events-none flex items-center justify-center ${vertical ? 'flex-col' : ''}`}>
                <div className={`absolute px-3 py-2 rounded-lg border bg-slate-900/90 backdrop-blur z-20 flex flex-col items-center shadow-xl ${color}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
                    <span className="text-sm font-bold">{flowText}</span>
                    <span className="text-xs font-mono text-slate-300">
                        {isStock ? 'Total: ' : ''}{formatVal(value)}{isStock ? '' : '/week'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 relative overflow-hidden min-h-[600px]">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2 z-10 relative">
                <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                Liquidity Flow Animation
            </h2>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

            <div className="relative w-full h-[500px]">

                {/* --- NODES (Inverted Triangle Layout) --- */}

                {/* TOP LEFT: FED */}
                <div className="absolute top-10 left-[15%] flex flex-col items-center z-30">
                    <span className="text-slate-400 font-bold mb-2">Central Bank (FED)</span>
                    <div className="w-24 h-24 bg-slate-800 rounded-2xl border-4 border-slate-600 flex items-center justify-center shadow-2xl relative">
                        <Landmark className="w-12 h-12 text-slate-200" />
                        <div className="absolute -bottom-3 bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-600">
                            Assets: {latest.fedAssets.toFixed(2)}T
                        </div>
                    </div>
                </div>

                {/* TOP RIGHT: US GOV (TGA) */}
                <div className="absolute top-10 right-[15%] flex flex-col items-center z-30">
                    <span className="text-amber-400 font-bold mb-2">US Gov (TGA)</span>
                    <div className="w-24 h-24 bg-amber-900/20 rounded-2xl border-4 border-amber-500 flex items-center justify-center shadow-2xl relative">
                        <Building2 className="w-12 h-12 text-amber-400" />
                        <div className="absolute -bottom-3 bg-amber-900/80 px-2 py-0.5 rounded text-xs text-amber-200 border border-amber-500/50">
                            {latest.tga.toFixed(2)}T
                        </div>
                    </div>
                </div>

                {/* BOTTOM CENTER: MARKET */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
                    <span className="text-indigo-200 font-bold mb-2">Market</span>
                    <div className="w-32 h-32 bg-indigo-900/20 rounded-2xl border-4 border-indigo-500 flex flex-col items-center justify-center shadow-2xl relative backdrop-blur-sm">
                        <TrendingUp className="w-12 h-12 text-indigo-400 mb-1" />
                        <span className="text-xs text-indigo-300">Net Liquidity</span>
                        <span className="text-xl font-bold text-white mt-1">{latest.netLiquidity.toFixed(2)}T</span>
                    </div>
                    <div className={`mt-4 px-4 py-2 rounded-lg border ${delta.netLiquidity >= 0 ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'} font-bold`}>
                        Change: {delta.netLiquidity > 0 ? '+' : ''}{delta.netLiquidity.toFixed(2)}B/week
                    </div>
                </div>


                {/* --- FLOWS --- */}

                {/* 1. Fed <-> Market (Diagonal: Top Left to Bottom Center) */}
                {/* Position: roughly centered between Top Left (15%) and Bottom Center (50%) */}
                {/* Left: ~32.5%, Top: ~40% */}
                {/* No rotation on container to keep text straight */}
                <div className="absolute top-[40%] left-[25%] w-[20%] h-[20%] z-20 flex items-center justify-center">
                    <FlowPath
                        value={walclVal}
                        label="Fed Net Flow"
                        color="border-slate-500/50 text-slate-300"
                        positiveText="Fed ➔ Market"  // User Rule: + means Fed -> Market
                        negativeText="Market ➔ Fed"  // User Rule: - means Market -> Fed
                    />
                    {/* Diagonal Movement: X increases, Y increases (Down-Right) */}
                    <motion.div
                        className="absolute text-4xl drop-shadow-lg"
                        animate={{
                            // walclVal > 0 (Fed -> Market): Down-Right. (X+, Y+)
                            // walclVal < 0 (Market -> Fed): Up-Left. (X-, Y-)

                            x: walclVal > 0 ? [-40, 40] : [40, -40],
                            y: walclVal > 0 ? [-40, 40] : [40, -40],

                            opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        💵
                    </motion.div>
                </div>

                {/* 2. TGA <-> Market (Diagonal: Top Right to Bottom Center) */}
                {/* Position: roughly centered between Top Right (85%) and Bottom Center (50%) */}
                {/* Left: ~67.5%, Top: ~40% */}
                <div className="absolute top-[40%] right-[25%] w-[20%] h-[20%] z-20 flex items-center justify-center">
                    <FlowPath
                        value={tgaVal}
                        label="Gov Operations"
                        color="border-amber-500/50 text-amber-400"
                        positiveText="Market ➔ TGA" // +TGA = Draining from Market
                        negativeText="TGA ➔ Market" // -TGA = Spending into Market
                    />
                    {/* Diagonal Movement: X decreases, Y increases (Down-Left) */}
                    {/* +TGA (Market -> Gov): Up-Right (X+, Y-) */}
                    {/* -TGA (Gov -> Market): Down-Left (X-, Y+) */}
                    <motion.div
                        className="absolute text-4xl drop-shadow-lg"
                        animate={{
                            // Market is Center (50%), Gov is Right (85%). So Market -> Gov is Right (X+).
                            // Gov -> Market is Left (X-).

                            // tgaVal > 0 (Market -> Gov): X+, Y-
                            // tgaVal < 0 (Gov -> Market): X-, Y+

                            x: tgaVal > 0 ? [-40, 40] : [40, -40],
                            y: tgaVal > 0 ? [40, -40] : [-40, 40],

                            opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        💵
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

export default FlowAnimation;
