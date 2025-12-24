import React from 'react';
import { LineChart, Activity, ArrowRightLeft } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-400" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            Net Liquidity Dashboard
                        </h1>
                    </div>
                    <nav className="flex gap-4 text-sm font-medium text-slate-400">
                        <a href="#" className="hover:text-indigo-400 transition-colors">Dashboard</a>
                        <a href="https://fred.stlouisfed.org/" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Data Source</a>
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {children}
            </main>
            <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
                <p>Data provided by Federal Reserve Economic Data (FRED)</p>
            </footer>
        </div>
    );
};

export default Layout;
