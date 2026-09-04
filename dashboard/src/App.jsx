import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import {
  realtimeMetrics,
  analysisInsights,
  progressTracking,
  alertsAndActions,
  resourceHealth,
  chartData,
} from './data/mockData';

function App() {
  const [data, setData] = useState({
    realtimeMetrics,
    analysisInsights,
    progressTracking,
    alertsAndActions,
    resourceHealth,
  });

  const [performanceData, setPerformanceData] = useState({
    performance: chartData.performance,
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update KPI values slightly
      setData((prevData) => ({
        ...prevData,
        realtimeMetrics: {
          ...prevData.realtimeMetrics,
          kpis: prevData.realtimeMetrics.kpis.map((kpi) => ({
            ...kpi,
            value: kpi.value + (Math.random() - 0.5) * 2,
            change: (Math.random() - 0.5) * 5,
          })),
          gauges: prevData.realtimeMetrics.gauges.map((gauge) => ({
            ...gauge,
            value: Math.max(0, Math.min(100, gauge.value + (Math.random() - 0.5) * 3)),
          })),
        },
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <DashboardLayout data={data} performanceData={performanceData} />
    </div>
  );
}

export default App;
