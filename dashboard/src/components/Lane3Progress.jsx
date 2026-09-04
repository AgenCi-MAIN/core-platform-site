import React, { useState } from 'react';
import { Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatPercentage } from '../utils/formatNumbers';

const Lane3Progress = ({ data }) => {
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  const getStatusColor = (status) => {
    if (status === 'completed') return '#10b981';
    if (status === 'in-progress') return '#06b6d4';
    return '#94a3b8';
  };

  const getTaskStatusColor = (status) => {
    if (status === 'done') return '#10b981';
    if (status === 'in-progress') return '#f59e0b';
    return '#64748b';
  };

  const getTaskStatusIcon = (status) => {
    if (status === 'done') return '✓';
    if (status === 'in-progress') return '⏳';
    return '○';
  };

  return (
    <div className="lane">
      <div className="lane-title">
        <Zap size={24} className="text-amber-500" />
        Lane 3: Progress Tracking
      </div>

      {/* Sprint Health Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">Sprint Velocity</div>
          <div className="metric-value text-lg">{data.sprintMetrics.velocity}</div>
          <div className="text-xs text-slate-400 mt-1">story points/sprint</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completed Stories</div>
          <div className="metric-value text-lg text-green-500">
            {data.sprintMetrics.completedStories}/{data.sprintMetrics.totalStories}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {formatPercentage(Math.round((data.sprintMetrics.completedStories / data.sprintMetrics.totalStories) * 100))}% done
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sprint Health</div>
          <div className="text-lg font-bold text-green-500">{data.sprintMetrics.sprintHealth}</div>
          <div className="text-xs text-slate-400 mt-1">Status</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Burndown</div>
          <div className="metric-value text-lg text-cyan-400">
            {data.burndown[data.burndown.length - 1]?.remaining}
          </div>
          <div className="text-xs text-slate-400 mt-1">tasks remaining</div>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="metric-card mb-6">
        <div className="metric-label mb-4">Sprint Burndown Chart</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.burndown}>
            <defs>
              <linearGradient id="colorBurndown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Area
              type="monotone"
              dataKey="remaining"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorBurndown)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestones */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Milestones
        </h3>
        <div className="space-y-3">
          {data.milestones.map((milestone) => (
            <div key={milestone.id} className="metric-card">
              <div
                className="cursor-pointer"
                onClick={() =>
                  setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {milestone.status === 'completed' ? (
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    ) : milestone.status === 'in-progress' ? (
                      <Clock size={18} className="text-cyan-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="text-slate-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-slate-200">{milestone.title}</div>
                      <div className="text-xs text-slate-400">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-cyan-400">{formatPercentage(milestone.progress)}%</div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded ml-2"
                      style={{
                        backgroundColor: getStatusColor(milestone.status) + '20',
                        color: getStatusColor(milestone.status),
                      }}
                    >
                      {milestone.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${milestone.progress}%`,
                      background:
                        milestone.progress === 100
                          ? '#10b981'
                          : milestone.status === 'in-progress'
                          ? '#06b6d4'
                          : '#64748b',
                    }}
                  ></div>
                </div>
              </div>

              {/* Expanded task list */}
              {expandedMilestone === milestone.id && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                  {milestone.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                      <span
                        className="text-sm font-bold w-5 text-center"
                        style={{ color: getTaskStatusColor(task.status) }}
                      >
                        {getTaskStatusIcon(task.status)}
                      </span>
                      <span className="text-sm text-slate-300">{task.name}</span>
                      <span
                        className="text-xs ml-auto px-2 py-1 rounded"
                        style={{
                          backgroundColor: getTaskStatusColor(task.status) + '20',
                          color: getTaskStatusColor(task.status),
                        }}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-4 text-center">
        Progress data updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Lane3Progress;
