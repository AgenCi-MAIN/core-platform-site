import React, { useState } from 'react';
import { CreditCard, ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle, TrendingUp, Cpu, BarChart3 } from 'lucide-react';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { formatPercentage, formatGauge, formatNumber } from '../utils/formatNumbers';

const Lane5Resources = ({ data }) => {
  const [expandedSection, setExpandedSection] = useState('usage-summary');
  const [showInputForm, setShowInputForm] = useState(false);
  const [customUsageData, setCustomUsageData] = useState({
    tokens: null,
    tokenLimit: null,
    apiCalls: null,
    apiLimit: null,
    concurrent: null,
    concurrentLimit: null,
    fiveHourUsage: null,
    weeklyAllUsage: null,
    weeklyFableUsage: null,
    sevenDayUsage: null,
    sessionCost: null,
    cacheHitRate: null,
  });

  const cursorProData = data.cursorProUsage || {};
  const subscription = cursorProData.subscription || {};
  const tokenUsage = cursorProData.tokenUsage || {};
  const apiCalls = cursorProData.apiCalls || {};
  const concurrentRequests = cursorProData.concurrentRequests || {};
  const usageAlerts = cursorProData.usageAlerts || [];
  const usageTrends = cursorProData.usageTrends || [];
  const apiUsageSummary = cursorProData.apiUsageSummary || {};
  const sessionBreakdown = cursorProData.sessionBreakdown || {};
  const modelBreakdown = cursorProData.modelBreakdown || {};
  const costBreakdown = cursorProData.costBreakdown || {};
  const topContributors = cursorProData.topContributors || [];

  const getStatusColor = (utilization) => {
    if (utilization < 60) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Healthy' };
    if (utilization < 80) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Warning' };
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'At Limit' };
  };

  const handleCustomDataSubmit = (e) => {
    e.preventDefault();
    // Update with custom data if provided
    if (customUsageData.tokens !== null) {
      tokenUsage.used = customUsageData.tokens;
      tokenUsage.limit = customUsageData.tokenLimit || tokenUsage.limit;
      tokenUsage.utilization = (customUsageData.tokens / (customUsageData.tokenLimit || tokenUsage.limit)) * 100;
    }
    if (customUsageData.apiCalls !== null) {
      apiCalls.used = customUsageData.apiCalls;
      apiCalls.limit = customUsageData.apiLimit || apiCalls.limit;
      apiCalls.utilization = (customUsageData.apiCalls / (customUsageData.apiLimit || apiCalls.limit)) * 100;
    }
    if (customUsageData.concurrent !== null) {
      concurrentRequests.used = customUsageData.concurrent;
      concurrentRequests.available = customUsageData.concurrentLimit || concurrentRequests.available;
      concurrentRequests.utilization = (customUsageData.concurrent / (customUsageData.concurrentLimit || concurrentRequests.available)) * 100;
    }
    if (customUsageData.fiveHourUsage !== null) {
      apiUsageSummary.fiveHourLimit = apiUsageSummary.fiveHourLimit || {};
      apiUsageSummary.fiveHourLimit.utilization = customUsageData.fiveHourUsage;
    }
    if (customUsageData.weeklyAllUsage !== null) {
      apiUsageSummary.weeklyAllModels = apiUsageSummary.weeklyAllModels || {};
      apiUsageSummary.weeklyAllModels.utilization = customUsageData.weeklyAllUsage;
    }
    if (customUsageData.weeklyFableUsage !== null) {
      apiUsageSummary.weeklyFable = apiUsageSummary.weeklyFable || {};
      apiUsageSummary.weeklyFable.utilization = customUsageData.weeklyFableUsage;
    }
    if (customUsageData.sevenDayUsage !== null) {
      apiUsageSummary.sevenDayLimit = apiUsageSummary.sevenDayLimit || {};
      apiUsageSummary.sevenDayLimit.utilization = customUsageData.sevenDayUsage;
    }
    if (customUsageData.sessionCost !== null) {
      sessionBreakdown.cost = customUsageData.sessionCost;
    }
    if (customUsageData.cacheHitRate !== null) {
      sessionBreakdown.cacheHitRate = customUsageData.cacheHitRate;
    }
    setShowInputForm(false);
  };

  return (
    <div className="lane">
      <div className="lane-title">
        <CreditCard size={24} className="text-green-500" />
        Lane 5: Cursor Pro Usage & Capacity
      </div>

      {/* Consolidated API/Model Usage Summary */}
      <div className="mb-6">
        <div
          className="metric-card cursor-pointer bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900"
          onClick={() => setExpandedSection(expandedSection === 'usage-summary' ? null : 'usage-summary')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-300">Usage Summary - All Models</h3>
            </div>
            <div className="ml-4">
              {expandedSection === 'usage-summary' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">5-Hour Limit</div>
              <div className="text-sm font-bold text-cyan-400">{apiUsageSummary.fiveHourLimit?.utilization || 0}%</div>
              <div className="text-xs text-slate-500 mt-1">Resets in {apiUsageSummary.fiveHourLimit?.resetsIn || 'N/A'}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Weekly (All)</div>
              <div className="text-sm font-bold text-cyan-400">{apiUsageSummary.weeklyAllModels?.utilization || 0}%</div>
              <div className="text-xs text-slate-500 mt-1">{apiUsageSummary.weeklyAllModels?.resetsOn || 'N/A'}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Weekly (Fable)</div>
              <div className="text-sm font-bold text-amber-400">{apiUsageSummary.weeklyFable?.utilization || 0}%</div>
              <div className="text-xs text-slate-500 mt-1">{apiUsageSummary.weeklyFable?.resetsOn || 'N/A'}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">7-Day Limit</div>
              <div className="text-sm font-bold text-amber-400">{apiUsageSummary.sevenDayLimit?.utilization || 0}%</div>
              <div className="text-xs text-slate-500 mt-1">{apiUsageSummary.sevenDayLimit?.resetsOn || 'N/A'}</div>
            </div>
          </div>

          {expandedSection === 'usage-summary' && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              {/* Session Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase">Session Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-xs text-slate-400">Session Cost</div>
                    <div className="text-sm font-bold text-green-400">${sessionBreakdown.cost || 0}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-xs text-slate-400">API Response</div>
                    <div className="text-sm font-bold text-cyan-400">{sessionBreakdown.apiResponseTime || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-xs text-slate-400">Cache Hit Rate</div>
                    <div className="text-sm font-bold text-blue-400">{sessionBreakdown.cacheHitRate || 0}%</div>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-2 rounded border border-slate-700 text-xs">
                  <div className="text-slate-400 mb-1">Context Window</div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">{formatNumber(sessionBreakdown.contextWindowUsed || 0)} / {formatNumber(sessionBreakdown.contextWindowTotal || 0)}</span>
                    <span className="text-cyan-400 font-semibold">{(sessionBreakdown.contextWindowPercentage || 0).toFixed(1)}% used</span>
                  </div>
                  <div className="progress-bar h-2 mt-2 rounded-full bg-slate-800">
                    <div
                      className="progress-fill rounded-full bg-cyan-500"
                      style={{
                        width: `${Math.min(sessionBreakdown.contextWindowPercentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Model Comparison */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase">Model Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {modelBreakdown.haiku45 && (
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                      <div className="text-xs font-semibold text-slate-300 mb-2">{modelBreakdown.haiku45.name}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Input Tokens:</span>
                          <span className="text-slate-300 font-semibold">{formatNumber(modelBreakdown.haiku45.inputTokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Output Tokens:</span>
                          <span className="text-slate-300 font-semibold">{formatNumber(modelBreakdown.haiku45.outputTokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cache Tokens:</span>
                          <span className="text-slate-300 font-semibold">{formatNumber(modelBreakdown.haiku45.cacheTokens)}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-600">
                          <span className="text-slate-400">Usage:</span>
                          <span className="text-cyan-400 font-semibold">{modelBreakdown.haiku45.usage}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {modelBreakdown.opus5 && (
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                      <div className="text-xs font-semibold text-slate-300 mb-2">{modelBreakdown.opus5.name}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Input Tokens:</span>
                          <span className="text-slate-300 font-semibold">{formatNumber(modelBreakdown.opus5.inputTokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Output Tokens:</span>
                          <span className="text-slate-300 font-semibold">{formatNumber(modelBreakdown.opus5.outputTokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cache Tokens:</span>
                          <span className="text-slate-300 font-semibold">{formatNumber(modelBreakdown.opus5.cacheTokens)}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-600">
                          <span className="text-slate-400">Usage:</span>
                          <span className="text-cyan-400 font-semibold">{modelBreakdown.opus5.usage}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              {costBreakdown.totalCost !== undefined && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Cost Breakdown</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Input Cost</div>
                      <div className="text-sm font-bold text-green-400">${costBreakdown.inputCost}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Output Cost</div>
                      <div className="text-sm font-bold text-green-400">${costBreakdown.outputCost}</div>
                    </div>
                    <div className="border-l border-slate-600 pl-2">
                      <div className="text-slate-400">Total Cost</div>
                      <div className="text-sm font-bold text-cyan-400">${costBreakdown.totalCost}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Contributors */}
              {topContributors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Top Contributors</h4>
                  <div className="space-y-2">
                    {topContributors.map((contributor) => (
                      <div key={contributor.id} className="bg-slate-900/50 p-2 rounded border border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs text-slate-300 font-semibold">{contributor.name}</span>
                          <span className="text-xs font-bold text-cyan-400">{contributor.percentage}%</span>
                        </div>
                        <div className="progress-bar h-1.5 rounded-full bg-slate-800">
                          <div
                            className="progress-fill rounded-full bg-cyan-500"
                            style={{
                              width: `${contributor.percentage}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Cost: ${contributor.cost}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Status */}
      <div className="mb-6">
        <div
          className="metric-card cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'subscription' ? null : 'subscription')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Subscription Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Plan Tier</div>
                  <div className="text-lg font-bold text-cyan-400">{subscription.planTier || 'Pro'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Status</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="inline-flex items-center px-2.5 py-1.5 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: subscription.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: subscription.status === 'active' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {subscription.status === 'active' ? (
                        <CheckCircle size={12} className="mr-1" />
                      ) : (
                        <AlertCircle size={12} className="mr-1" />
                      )}
                      {subscription.status || 'Active'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Billing Cycle End</div>
                  <div className="text-sm font-bold text-slate-300">{subscription.billingCycleEnd || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Days Remaining</div>
                  <div className="text-lg font-bold text-amber-400">{subscription.daysRemaining || '30'}</div>
                </div>
              </div>
            </div>
            <div className="ml-4">
              {expandedSection === 'subscription' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* Token Usage */}
      <div className="mb-6">
        <div
          className="metric-card cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'tokens' ? null : 'tokens')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Token Usage</h3>
            <div className="ml-4">
              {expandedSection === 'tokens' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">
              {formatNumber(tokenUsage.used || 0)} / {formatNumber(tokenUsage.limit || 5000000)} tokens
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: getStatusColor(tokenUsage.utilization || 0).color }}
            >
              {formatPercentage(tokenUsage.utilization || 0)}%
            </span>
          </div>

          <div className="progress-bar h-3 mb-3">
            <div
              className="progress-fill rounded-full"
              style={{
                width: `${Math.min(tokenUsage.utilization || 0, 100)}%`,
                background:
                  (tokenUsage.utilization || 0) < 60
                    ? '#10b981'
                    : (tokenUsage.utilization || 0) < 80
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            ></div>
          </div>

          {expandedSection === 'tokens' && (
            <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Average:</span>
                <span className="text-slate-300 font-semibold">{formatNumber(tokenUsage.dailyAverage || 0)} tokens/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projected Usage:</span>
                <span className="text-slate-300 font-semibold">{formatNumber(tokenUsage.projectedUsage || 0)} tokens/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trend:</span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <TrendingUp size={12} />
                  {tokenUsage.trend || 'stable'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Calls Usage */}
      <div className="mb-6">
        <div
          className="metric-card cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'api' ? null : 'api')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Monthly API Calls</h3>
            <div className="ml-4">
              {expandedSection === 'api' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">
              {apiCalls.used || 0} / {apiCalls.limit || 10000} calls
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: getStatusColor(apiCalls.utilization || 0).color }}
            >
              {formatPercentage(apiCalls.utilization || 0)}%
            </span>
          </div>

          <div className="progress-bar h-3 mb-3">
            <div
              className="progress-fill rounded-full"
              style={{
                width: `${Math.min(apiCalls.utilization || 0, 100)}%`,
                background:
                  (apiCalls.utilization || 0) < 60
                    ? '#06b6d4'
                    : (apiCalls.utilization || 0) < 80
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            ></div>
          </div>

          {expandedSection === 'api' && (
            <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-slate-300 font-semibold">{apiCalls.remaining || 0} calls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Average:</span>
                <span className="text-slate-300 font-semibold">{apiCalls.dailyAverage || 0} calls/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className="font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: getStatusColor(apiCalls.utilization || 0).bg,
                    color: getStatusColor(apiCalls.utilization || 0).color,
                  }}
                >
                  {getStatusColor(apiCalls.utilization || 0).label}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Concurrent Requests */}
      <div className="mb-6">
        <div
          className="metric-card cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'concurrent' ? null : 'concurrent')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Concurrent Requests</h3>
            <div className="ml-4">
              {expandedSection === 'concurrent' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">
              {concurrentRequests.used || 0} / {concurrentRequests.available || 50} concurrent
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: getStatusColor(concurrentRequests.utilization || 0).color }}
            >
              {formatPercentage(concurrentRequests.utilization || 0)}%
            </span>
          </div>

          <div className="progress-bar h-3 mb-3">
            <div
              className="progress-fill rounded-full"
              style={{
                width: `${Math.min(concurrentRequests.utilization || 0, 100)}%`,
                background:
                  (concurrentRequests.utilization || 0) < 60
                    ? '#8b5cf6'
                    : (concurrentRequests.utilization || 0) < 80
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            ></div>
          </div>

          {expandedSection === 'concurrent' && (
            <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Usage:</span>
                <span className="text-slate-300 font-semibold">{concurrentRequests.used || 0} requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Peak Usage:</span>
                <span className="text-slate-300 font-semibold">{concurrentRequests.peakUsage || 0} requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trend:</span>
                <span className="text-slate-300 font-semibold">{concurrentRequests.trend || 'stable'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Alerts */}
      {usageAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Usage Alerts</h3>
          <div className="space-y-2">
            {usageAlerts.map((alert) => (
              <div
                key={alert.id}
                className="metric-card"
                style={{
                  backgroundColor:
                    alert.severity === 'warning'
                      ? 'rgba(245, 158, 11, 0.05)'
                      : alert.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'rgba(6, 182, 212, 0.05)',
                  borderLeft: `3px solid ${
                    alert.severity === 'warning'
                      ? '#f59e0b'
                      : alert.severity === 'critical'
                        ? '#ef4444'
                        : '#06b6d4'
                  }`,
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    style={{
                      color:
                        alert.severity === 'warning'
                          ? '#f59e0b'
                          : alert.severity === 'critical'
                            ? '#ef4444'
                            : '#06b6d4',
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-300">{alert.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{alert.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Trends Chart */}
      {usageTrends.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Usage Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={usageTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="tokens"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 3 }}
                yAxisId="left"
                name="Tokens"
              />
              <Line
                type="monotone"
                dataKey="apiCalls"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                yAxisId="right"
                name="API Calls"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Custom Data Input Form */}
      <div className="mb-6">
        <button
          onClick={() => setShowInputForm(!showInputForm)}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
        >
          {showInputForm ? 'Hide Custom Data' : 'Input Custom Usage Data'}
        </button>

        {showInputForm && (
          <form onSubmit={handleCustomDataSubmit} className="mt-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase">API Limits (from Cursor Status Panel)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">5-Hour Limit %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customUsageData.fiveHourUsage || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, fiveHourUsage: parseInt(e.target.value) || null })}
                    placeholder={apiUsageSummary.fiveHourLimit?.utilization || 0}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Weekly (All) %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customUsageData.weeklyAllUsage || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, weeklyAllUsage: parseInt(e.target.value) || null })}
                    placeholder={apiUsageSummary.weeklyAllModels?.utilization || 0}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Weekly (Fable) %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customUsageData.weeklyFableUsage || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, weeklyFableUsage: parseInt(e.target.value) || null })}
                    placeholder={apiUsageSummary.weeklyFable?.utilization || 0}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">7-Day Limit %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customUsageData.sevenDayUsage || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, sevenDayUsage: parseInt(e.target.value) || null })}
                    placeholder={apiUsageSummary.sevenDayLimit?.utilization || 0}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase">Session Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Session Cost (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customUsageData.sessionCost || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, sessionCost: parseFloat(e.target.value) || null })}
                    placeholder={sessionBreakdown.cost || 0}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Cache Hit Rate %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customUsageData.cacheHitRate || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, cacheHitRate: parseInt(e.target.value) || null })}
                    placeholder={sessionBreakdown.cacheHitRate || 0}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase">Token Usage</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Tokens Used</label>
                  <input
                    type="number"
                    value={customUsageData.tokens || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, tokens: parseInt(e.target.value) || null })}
                    placeholder={tokenUsage.used}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Token Limit</label>
                  <input
                    type="number"
                    value={customUsageData.tokenLimit || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, tokenLimit: parseInt(e.target.value) || null })}
                    placeholder={tokenUsage.limit}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">API Calls Used</label>
                  <input
                    type="number"
                    value={customUsageData.apiCalls || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, apiCalls: parseInt(e.target.value) || null })}
                    placeholder={apiCalls.used}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">API Calls Limit</label>
                  <input
                    type="number"
                    value={customUsageData.apiLimit || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, apiLimit: parseInt(e.target.value) || null })}
                    placeholder={apiCalls.limit}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Concurrent Requests</label>
                  <input
                    type="number"
                    value={customUsageData.concurrent || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, concurrent: parseInt(e.target.value) || null })}
                    placeholder={concurrentRequests.used}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Concurrent Limit</label>
                  <input
                    type="number"
                    value={customUsageData.concurrentLimit || ''}
                    onChange={(e) => setCustomUsageData({ ...customUsageData, concurrentLimit: parseInt(e.target.value) || null })}
                    placeholder={concurrentRequests.available}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm border border-slate-600 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm font-semibold transition-colors"
              >
                Update Usage Data
              </button>
              <button
                type="button"
                onClick={() => setShowInputForm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="text-xs text-slate-400 mt-4 text-center">
        Cursor Pro usage metrics updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Lane5Resources;
