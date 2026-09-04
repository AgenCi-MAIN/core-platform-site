import React, { useState, useEffect } from 'react';
import { Menu, X, Settings, RefreshCw } from 'lucide-react';
import Lane1Metrics from './Lane1Metrics';
import Lane2Insights from './Lane2Insights';
import Lane3Progress from './Lane3Progress';
import Lane4Alerts from './Lane4Alerts';
import Lane5Resources from './Lane5Resources';

const DashboardLayout = ({ data, performanceData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visibleLanes, setVisibleLanes] = useState([1, 2, 3, 4, 5]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLastUpdateTime(new Date());
    setIsRefreshing(false);
  };

  const toggleLane = (laneNumber) => {
    setVisibleLanes((prev) =>
      prev.includes(laneNumber) ? prev.filter((l) => l !== laneNumber) : [...prev, laneNumber].sort()
    );
  };

  const laneConfig = [
    { number: 1, title: 'Realtime Metrics', color: 'cyan' },
    { number: 2, title: 'Analysis Insights', color: 'violet' },
    { number: 3, title: 'Progress Tracking', color: 'amber' },
    { number: 4, title: 'Alerts & Actions', color: 'red' },
    { number: 5, title: 'Resource Health', color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
        <div className="max-w-full px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">5L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Five-Lane Dashboard</h1>
                <p className="text-xs text-slate-400">Operational Intelligence Platform</p>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw
                  size={18}
                  className={isRefreshing ? 'animate-spin text-cyan-500' : 'text-slate-400'}
                />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Lane visibility"
              >
                <Settings size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-slate-800"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-cyan-500' : 'text-slate-400'} />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Update time */}
          <div className="text-xs text-slate-500 mt-2">
            Last refreshed: {lastUpdateTime.toLocaleTimeString()}
          </div>

          {/* Mobile Lane Toggle Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 p-4 bg-slate-800 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-slate-300 mb-3">Toggle Lanes:</p>
              {laneConfig.map((lane) => (
                <label key={lane.number} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleLanes.includes(lane.number)}
                    onChange={() => toggleLane(lane.number)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-slate-300">{lane.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-24 lg:w-60 lg:flex lg:flex-col lg:gap-4 lg:p-5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3 tracking-wide">Lane Visibility</p>
          <div className="space-y-3">
            {laneConfig.map((lane) => (
              <label
                key={lane.number}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 p-2.5 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleLanes.includes(lane.number)}
                  onChange={() => toggleLane(lane.number)}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm text-slate-300">{lane.title}</span>
                  <span className="text-xs text-slate-500 ml-2">#{lane.number}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3 tracking-wide">Quick Stats</p>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">System Uptime:</span>
              <span className="text-cyan-400 font-semibold">99.87%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Alerts:</span>
              <span className="text-red-400 font-semibold">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Resources:</span>
              <span className="text-green-400 font-semibold">5/5 Healthy</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 px-4 py-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Lane 1: Realtime Metrics */}
          {visibleLanes.includes(1) && (
            <Lane1Metrics data={data.realtimeMetrics} performanceData={performanceData.performance} />
          )}

          {/* Lane 2: Analysis Insights */}
          {visibleLanes.includes(2) && <Lane2Insights data={data.analysisInsights} />}

          {/* Lane 3: Progress Tracking */}
          {visibleLanes.includes(3) && <Lane3Progress data={data.progressTracking} />}

          {/* Lane 4: Alerts & Actions */}
          {visibleLanes.includes(4) && <Lane4Alerts data={data.alertsAndActions} />}

          {/* Lane 5: Resource Health */}
          {visibleLanes.includes(5) && <Lane5Resources data={data.resourceHealth} />}
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-slate-700 text-center text-xs text-slate-500">
          <p>Five-Lane Operational Dashboard • Built with React & Recharts</p>
          <p className="mt-1">© 2026 • All Rights Reserved</p>
        </footer>
      </main>

      {/* Floating mobile footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 px-4 py-2 text-center text-xs text-slate-500">
        Showing {visibleLanes.length} of 5 lanes
      </div>
    </div>
  );
};

export default DashboardLayout;
