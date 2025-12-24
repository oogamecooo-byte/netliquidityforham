import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LiquidityChart from './components/LiquidityChart';
import WeeklyChangeChart from './components/WeeklyChangeChart';
import FlowAnimation from './components/FlowAnimation';
import NetLiquidityToGDPChart from './components/NetLiquidityToGDPChart';
import ReservesToGDPChart from './components/ReservesToGDPChart';
import ArkkChart from './components/ArkkChart';
import { getLiquidityData } from './services/fredData';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getLiquidityData();
        if (result.length === 0 && !import.meta.env.VITE_FRED_API_KEY) {
          setApiKeyMissing(true);
        }
        setData(result);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (apiKeyMissing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">API Key Missing</h2>
            <p className="text-slate-300 mb-6">
              Please create a <code className="bg-slate-800 px-2 py-1 rounded text-sm">.env</code> file in the project root with your FRED API key:
            </p>
            <pre className="bg-slate-950 p-4 rounded-lg text-left text-sm text-slate-400 overflow-x-auto">
              VITE_FRED_API_KEY=your_api_key_here
            </pre>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Section: Animation */}
          <section>
            <FlowAnimation data={data} />
          </section>

          {/* Middle Section: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <LiquidityChart data={data} />
            </section>
            <section>
              <WeeklyChangeChart data={data} />
            </section>
          </div>

          {/* Bottom Section: Ratio Charts & ARKK */}
          <div className="space-y-8">
            <section>
              <NetLiquidityToGDPChart data={data} />
            </section>
            <section>
              <ReservesToGDPChart data={data} />
            </section>
          </div>

          <section>
            <ArkkChart />
          </section>
        </div>
      )}
    </Layout>
  );
}

export default App;
