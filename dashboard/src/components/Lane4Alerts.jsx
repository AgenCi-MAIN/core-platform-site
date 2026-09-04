import React, { useState } from 'react';
import { AlertTriangle, Clock, Users, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const Lane4Alerts = ({ data }) => {
  const [expandedIncident, setExpandedIncident] = useState(null);

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'high') return '#f59e0b';
    return '#3b82f6';
  };

  const getSeverityBgColor = (severity) => {
    if (severity === 'critical') return 'rgba(239, 68, 68, 0.15)';
    if (severity === 'high') return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(59, 130, 246, 0.15)';
  };

  const getStatusColor = (status) => {
    if (status === 'resolved') return '#10b981';
    if (status === 'in-progress') return '#f59e0b';
    return '#06b6d4';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return '#ef4444';
    if (priority === 'medium') return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div className="lane">
      <div className="lane-title">
        <AlertTriangle size={24} className="text-red-500" />
        Lane 4: Alerts & Actions
      </div>

      {/* Alert Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="metric-label">Critical Incidents</div>
          <div className="metric-value text-lg text-red-500">
            {data.incidents.filter((i) => i.severity === 'critical').length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Actions</div>
          <div className="metric-value text-lg text-cyan-400">
            {data.actions.filter((a) => a.status !== 'completed').length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending Review</div>
          <div className="metric-value text-lg text-amber-500">
            {data.actions.filter((a) => a.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Incidents */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Incident Management
        </h3>
        <div className="space-y-3">
          {data.incidents.map((incident) => (
            <div
              key={incident.id}
              className="alert-item"
              style={{
                background: getSeverityBgColor(incident.severity),
                borderLeftColor: getSeverityColor(incident.severity),
                cursor: 'pointer',
              }}
              onClick={() =>
                setExpandedIncident(expandedIncident === incident.id ? null : incident.id)
              }
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <span
                    className="text-xs font-bold uppercase px-2 py-1 rounded mt-0.5 flex-shrink-0"
                    style={{
                      backgroundColor: getSeverityColor(incident.severity),
                      color: 'white',
                    }}
                  >
                    {incident.severity}
                  </span>
                  <div className="flex-1">
                    <div className="alert-title">{incident.title}</div>
                    <div className="alert-description">{incident.description}</div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4 flex flex-col items-end gap-2">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: getStatusColor(incident.status) + '20',
                      color: getStatusColor(incident.status),
                    }}
                  >
                    {incident.status}
                  </span>
                  {expandedIncident === incident.id ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </div>
              </div>

              {/* Affected Services */}
              <div className="text-xs text-slate-400 mb-2">
                <span className="font-semibold">Affected:</span> {incident.affectedServices.join(', ')}
              </div>

              {/* Expanded Timeline */}
              {expandedIncident === incident.id && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <div className="text-sm font-semibold text-slate-300 mb-3">Timeline:</div>
                  {incident.timeline && incident.timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="text-slate-400 font-mono w-20 flex-shrink-0">{entry.time}</div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1"></div>
                        {entry.event}
                      </div>
                    </div>
                  ))}
                  {incident.duration && (
                    <div className="pt-3 border-t border-slate-600 text-xs text-slate-400">
                      Duration: {incident.duration}
                    </div>
                  )}
                </div>
              )}

              {/* Assigned info */}
              {incident.assignedTo && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                  <Users size={14} />
                  Assigned to: {incident.assignedTo}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Action Items
        </h3>
        <div className="space-y-3">
          {data.actions.map((action) => (
            <div key={action.id} className="metric-card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: getPriorityColor(action.priority) }}
                  ></div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-200">{action.title}</div>
                    <div className="flex gap-3 mt-2 flex-wrap text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users size={12} />
                        {action.assignedTo}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(action.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <span
                    className="text-xs font-bold uppercase px-2 py-1 rounded"
                    style={{
                      backgroundColor: getPriorityColor(action.priority),
                      color: 'white',
                    }}
                  >
                    {action.priority}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor:
                        action.status === 'completed'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : action.status === 'in-progress'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(59, 130, 246, 0.2)',
                      color:
                        action.status === 'completed'
                          ? '#10b981'
                          : action.status === 'in-progress'
                          ? '#f59e0b'
                          : '#3b82f6',
                    }}
                  >
                    {action.status}
                  </span>
                </div>
              </div>

              {/* Progress indicator for in-progress items */}
              {action.status === 'in-progress' && (
                <div className="mt-2 progress-bar h-1">
                  <div
                    className="progress-fill"
                    style={{
                      width: '65%',
                      background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                    }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-6 text-center">
        Alerts last checked: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Lane4Alerts;
