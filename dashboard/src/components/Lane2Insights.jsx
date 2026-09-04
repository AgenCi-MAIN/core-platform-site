import React, { useState } from 'react';
import { BarChart3, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatPercentage } from '../utils/formatNumbers';

const Lane2Insights = ({ data }) => {
  const [selectedTrend, setSelectedTrend] = useState(null);

  const getSeverityColor = (severity) => {
    if (severity === 'high') return '#ef4444';
    if (severity === 'medium') return '#f59e0b';
    return '#3b82f6';
  };

  const getSeverityBgColor = (severity) => {
    if (severity === 'high') return 'rgba(239, 68, 68, 0.1)';
    if (severity === 'medium') return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(59, 130, 246, 0.1)';
  };

  return (
    <div className="lane">
      <div className="lane-title">
        <BarChart3 size={24} className="text-violet-500" />
        Lane 2: Analysis Insights
      </div>

      {/* Trends Section */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Trends & Forecasts
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.trends.map((trend) => (
            <div key={trend.id} className="metric-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="metric-label">{trend.label}</div>
                  <div className="metric-value text-lg">{trend.value}</div>
                </div>
                <div className={`text-lg font-bold ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trend.direction === 'up' ? '↑' : '↓'} {formatPercentage(Math.abs(trend.change))}%
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-3 italic">{trend.prediction}</div>
              
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={trend.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={trend.direction === 'up' ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies Section */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          Detected Anomalies
        </h3>
        <div className="space-y-3">
          {data.anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="alert-item"
              style={{
                background: getSeverityBgColor(anomaly.severity),
                borderLeftColor: getSeverityColor(anomaly.severity),
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="alert-header">
                    <span
                      className="text-xs font-bold uppercase px-2 py-1 rounded"
                      style={{
                        backgroundColor: getSeverityColor(anomaly.severity),
                        color: 'white',
                      }}
                    >
                      {anomaly.severity}
                    </span>
                    <div className="alert-title">{anomaly.title}</div>
                  </div>
                  <div className="alert-description">{anomaly.description}</div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor:
                        anomaly.status === 'resolved'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                      color: anomaly.status === 'resolved' ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {anomaly.status}
                  </span>
                </div>
              </div>
              <div className="alert-time mt-2">{anomaly.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecasts Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Zap size={16} className="text-yellow-500" />
          Forecasts & Predictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.forecasts.map((forecast) => (
            <div key={forecast.id} className="metric-card">
              <div className="metric-label">{forecast.metric}</div>
              <div className="metric-value text-xl text-cyan-400">{forecast.prediction}</div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-slate-400">Confidence:</span>
                <div className="flex items-center gap-2">
                  <div className="progress-bar w-20">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${forecast.confidence}%`,
                        background:
                          forecast.confidence > 85
                            ? '#10b981'
                            : forecast.confidence > 75
                            ? '#3b82f6'
                            : '#f59e0b',
                      }}
                    ></div>
                  </div>
                  <span className="text-slate-300">{formatPercentage(forecast.confidence)}%</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-2">When: {forecast.when}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-6 text-center">
        Insights updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Lane2Insights;
