import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LiquidityChart from './components/LiquidityChart';
import WeeklyChangeChart from './components/WeeklyChangeChart';
import FlowAnimation from './components/FlowAnimation';
import { getLiquidityData } from './services/fredData';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const result = await getLiquidityData();
        setData(result);
      } catch (err) {
        setError("Failed to load data. Please check your API Key and network connection.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiKey]);

  if (!apiKey) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
          <h2 className="text-2xl font-bold text-amber-400">API Key Required</h2>
          <p className="text-slate-400 max-w-md">
            Please create a <code className="bg-slate-800 px-2 py-1 rounded text-slate-200">.env</code> file in the project root with your FRED API Key:
          </p>
          <pre className="bg-slate-900 p-4 rounded-lg text-left text-sm text-indigo-300 overflow-x-auto">
            VITE_FRED_API_KEY=your_api_key_here
          </pre>
          <p className="text-sm text-slate-500">
            You can get a key from <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" className="text-indigo-400 hover:underline">FRED API</a>.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-20">{error}</div>
      ) : (
        <div className="grid gap-8">
          <FlowAnimation data={data} />
          <LiquidityChart data={data} />
          <WeeklyChangeChart data={data} />
        </div>
      )}
    </Layout>
  );
}

export default App;
