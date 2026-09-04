import React from 'react';
import { Activity, Gauge, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatKPI, formatPercentage, formatGauge, formatLatency, formatThroughput } from '../utils/formatNumbers';

const Lane1Metrics = ({ data, performanceData }) => {
  const getKPITrendColor = (trend) => {
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const getGaugeColor = (status) => {
    if (status === 'healthy') return '#10b981';
    if (status === 'warning') return '#f59e0b';
    return '#ef4444';
  };

  const GaugeChart = ({ label, value, max, status }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="metric-card">
        <div className="metric-label">{label}</div>
        <div className="gauge">
          <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0%" x2="100%">
                <stop offset="0%" stopColor={getGaugeColor(status)} />
                <stop offset="100%" stopColor={getGaugeColor(status)} />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              fill="none"
              stroke="#334155"
              strokeWidth="8"
            />
            {/* Value arc */}
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              fill="none"
              stroke={`url(#gradient-${label})`}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 220} 220`}
              strokeLinecap="round"
            />
            {/* Center text */}
            <text
              x="100"
              y="105"
              textAnchor="middle"
              fontSize="28"
              fontWeight="700"
              fill="#e2e8f0"
            >
              {formatGauge(value)}%
            </text>
          </svg>
        </div>
        <div className="text-center text-sm text-slate-400">
          Max: {max}% | Status: <span style={{ color: getGaugeColor(status) }}>{status}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="lane">
      <div className="lane-title">
        <Activity size={24} className="text-cyan-500" />
        Lane 1: Realtime Metrics
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* KPIs */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            Key Performance Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis.map((kpi) => {
              // Format based on unit type
              const getFormattedValue = () => {
                if (kpi.unit === '%') return formatPercentage(kpi.value);
                if (kpi.unit === 'ms') return formatLatency(kpi.value);
                if (kpi.unit === 'req/s') return formatThroughput(kpi.value);
                return formatKPI(kpi.value);
              };
              
              const getFormattedChange = () => {
                if (kpi.unit === '%') return formatPercentage(Math.abs(kpi.change));
                if (kpi.unit === 'ms') return formatLatency(Math.abs(kpi.change));
                if (kpi.unit === 'req/s') return formatThroughput(Math.abs(kpi.change));
                return formatKPI(Math.abs(kpi.change));
              };

              return (
                <div key={kpi.id} className="metric-card">
                  <div className="metric-label">{kpi.label}</div>
                  <div className="metric-value">
                    {getFormattedValue()}
                    <span className="text-sm text-slate-400 ml-2">{kpi.unit}</span>
                  </div>
                  <div className={`metric-change ${kpi.trend === 'up' ? 'positive' : 'negative'}`}>
                    <TrendingUp
                      size={14}
                      className="inline mr-1"
                      style={{
                        transform: kpi.trend === 'down' ? 'scaleY(-1)' : 'none',
                      }}
                    />
                    {getFormattedChange()} {kpi.unit}
                  </div>
                  {kpi.value > kpi.threshold && (
                    <div className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Approaching threshold
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gauges */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Resource Gauges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.gauges.map((gauge) => (
            <GaugeChart
              key={gauge.id}
              label={gauge.label}
              value={gauge.value}
              max={gauge.max}
              status={gauge.status}
            />
          ))}
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Performance Trend (24h)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Latency (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-slate-400 mt-4 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Lane1Metrics;
