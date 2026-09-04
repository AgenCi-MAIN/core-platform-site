# Dashboard Metrics - Formatting Examples

## Lane 1: Realtime Metrics

### Key Performance Indicators (KPIs)

| Metric | Original | Formatted | Format Rule |
|---|---|---|---|
| System Uptime | 99.87 | 99.9% | 1 decimal place |
| Avg Latency | 125 | 125 ms | whole number |
| Requests/sec | 4532 | 4532 req/s | whole number |
| Error Rate | 0.23 | 0.2% | 1 decimal place |
| Uptime Change | 0.12 | 0.1% | 1 decimal place |
| Latency Change | -15 | -15 ms | whole number |
| Throughput Change | 287 | 287 req/s | whole number |
| Error Rate Change | -0.08 | -0.1% | 1 decimal place |

### Resource Gauges

| Gauge | Original | Formatted | Format Rule |
|---|---|---|---|
| CPU Usage | 62 | 62% | whole number (gauge) |
| Memory Usage | 71 | 71% | whole number (gauge) |
| Disk Usage | 45 | 45% | whole number (gauge) |

## Lane 2: Analysis Insights

### Trends & Forecasts

| Metric | Original | Formatted | Format Rule |
|---|---|---|---|
| Revenue Trend | $2.4M | $2.4M | currency with M suffix |
| Change % | 12.5 | 12.5% | 1 decimal place |
| User Engagement | 68% | 68.0% | 1 decimal place |
| Change % | -3.2 | -3.2% | 1 decimal place |

### Forecast Predictions

| Forecast | Original | Formatted | Format Rule |
|---|---|---|---|
| Peak Load Confidence | 92 | 92.0% | 1 decimal place |
| Storage Capacity Confidence | 88 | 88.0% | 1 decimal place |

## Lane 3: Progress Tracking

### Sprint Metrics

| Metric | Original | Formatted | Format Rule |
|---|---|---|---|
| Sprint Velocity | 45 | 45 | whole number (KPI) |
| Completed Stories | 18/28 | 18/28 | whole number ratio |
| Completion % | 64.28... | 64.3% | 1 decimal place |
| Milestone Progress | 100 | 100.0% | 1 decimal place |
| Phase 2 Progress | 65 | 65.0% | 1 decimal place |
| Phase 3 Progress | 20 | 20.0% | 1 decimal place |

## Lane 5: Resource Health & Capacity

### Capacity Utilization

| Resource | Original | Formatted | Format Rule |
|---|---|---|---|
| Compute Utilization | 63 | 63.0% | 1 decimal place |
| Storage Utilization | 65 | 65.0% | 1 decimal place |
| Network Utilization | 57 | 57.0% | 1 decimal place |

### Infrastructure Resource Metrics

| Metric | Original | Formatted | Format Rule |
|---|---|---|---|
| API Server 01 CPU | 45 | 45% | whole number (gauge) |
| API Server 01 Memory | 58 | 58% | whole number (gauge) |
| API Server 01 Disk | 32 | 32% | whole number (gauge) |
| Primary DB CPU | 68 | 68% | whole number (gauge) |
| Primary DB Memory | 82 | 82% | whole number (gauge) |
| Primary DB Disk | 67 | 67% | whole number (gauge) |
| Redis Cache CPU | 75 | 75% | whole number (gauge) |
| Redis Cache Memory | 88 | 88% | whole number (gauge) |

## Formatting Rules Applied

### 1. Percentages (1 decimal place)
Used for: Uptime, error rates, trends, progress, confidence, utilization rates
- Example: 99.87% → 99.9%
- Example: 12.5% → 12.5%
- Example: 65% → 65.0%

### 2. Latency (whole numbers)
Used for: Millisecond measurements
- Example: 125 ms → 125 ms
- Example: -15 ms → -15 ms

### 3. Throughput (whole numbers)
Used for: Requests per second
- Example: 4532 req/s → 4532 req/s
- Example: 287 req/s → 287 req/s

### 4. Gauges (whole numbers)
Used for: Percentage displays in gauge/circular progress
- Example: 62% → 62%
- Example: 71% → 71%

### 5. KPI Values (2 decimal places)
Used for: Large numbers and general metrics
- Example: 4532.12 → 4532.12
- Fallback for untyped metrics

### 6. Currency (2 decimals with $ prefix)
Used for: Financial metrics
- Example: $2.4M → $2.40M
- Example: $1250 → $1250.00

## Implementation Details

All formatting functions:
- ✅ Type-checked for number validity
- ✅ Return original value if not a number
- ✅ Use `toFixed()` or `Math.round()` appropriately
- ✅ Parse results with `parseFloat()` to remove trailing zeros
- ✅ Import from centralized utility: `../utils/formatNumbers.js`

## Code Examples

### Formatting KPI Values
```javascript
const getFormattedValue = () => {
  if (kpi.unit === '%') return formatPercentage(kpi.value);
  if (kpi.unit === 'ms') return formatLatency(kpi.value);
  if (kpi.unit === 'req/s') return formatThroughput(kpi.value);
  return formatKPI(kpi.value);
};
```

### Formatting Gauges
```javascript
<text>
  {formatGauge(value)}%
</text>
```

### Formatting Percentages
```javascript
{formatPercentage(Math.abs(trend.change))}%
{formatPercentage(forecast.confidence)}%
```
