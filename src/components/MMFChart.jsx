import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const MMFChart = () => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchScreenshot = async () => {
        try {
            setLoading(true);
            setError(null);

            // Add timestamp to bypass browser cache
            const url = `/api/mmf-screenshot?t=${new Date().getTime()}`;

            // Pre-fetch image to check for errors before displaying
            const res = await fetch(url);
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.details || 'Failed to load screenshot');
            }
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);

            setImageUrl(objectUrl);
        } catch (err) {
            console.error("Failed to fetch MMF screenshot:", err);
            setError(err.message || "Screenshot unavailable.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScreenshot();
        // Cleanup object URL on unmount
        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, []);

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                        Money Market Fund Assets (OFR Monitor)
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Source: Office of Financial Research (Live Screenshot)
                    </p>
                </div>
                <button
                    onClick={fetchScreenshot}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    title="Refresh Screenshot"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="w-full min-h-[500px] bg-slate-900/50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800/50">
                {loading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-slate-400 text-sm">Capturing latest chart from OFR...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center text-center p-6 text-slate-400">
                        <AlertCircle className="w-10 h-10 mb-3 text-amber-500" />
                        <p className="font-medium text-slate-200 mb-1">Screenshot Failed</p>
                        <p className="text-sm max-w-xs text-red-400">{error}</p>
                        <p className="text-xs mt-4 text-slate-500">
                            * This feature requires the Vercel environment.
                        </p>
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        alt="OFR Money Market Fund Chart"
                        className="w-full h-auto object-contain rounded bg-white"
                    />
                )}
            </div>
        </div>
    );
};

export default MMFChart;
