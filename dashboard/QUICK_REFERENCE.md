# Dashboard Formatting - Quick Reference Card

## 📍 Import Path
```javascript
import { formatKPI, formatPercentage, formatGauge, formatLatency, formatThroughput, formatCurrency } from '../utils/formatNumbers';
```

## 📊 Formatting Functions

### 1. formatKPI() - Large Numbers (2 decimals)
```javascript
formatKPI(99.87)      → 99.87
formatKPI(4532.123)   → 4532.12
formatKPI(1.5)        → 1.5
```
**Use for**: General KPIs, large numbers, counts

### 2. formatPercentage() - Percentages (1 decimal)
```javascript
formatPercentage(99.87)   → 99.9
formatPercentage(12.5)    → 12.5
formatPercentage(65)      → 65.0
```
**Use for**: Percentages, progress, trends, confidence

### 3. formatGauge() - Whole Numbers (0 decimals)
```javascript
formatGauge(62.7)     → 63
formatGauge(71)       → 71
formatGauge(45.2)     → 45
```
**Use for**: Gauge displays, percentage gauges, circular progress

### 4. formatLatency() - Milliseconds (whole numbers)
```javascript
formatLatency(125.3)   → 125
formatLatency(98.7)    → 99
formatLatency(-15.2)   → -15
```
**Use for**: Latency (ms), timing measurements

### 5. formatThroughput() - Requests/sec (whole numbers)
```javascript
formatThroughput(4532.8)   → 4533
formatThroughput(287.1)    → 287
formatThroughput(3200)     → 3200
```
**Use for**: Requests per second, throughput

### 6. formatCurrency() - Money (2 decimals + $)
```javascript
formatCurrency(2.4, 'M')    → $2.40M
formatCurrency(1250)        → $1250.00
formatCurrency(99.5, 'K')   → $99.50K
```
**Use for**: Revenue, costs, financial metrics

---

## 🎯 Quick Usage Examples

### Lane 1: Metrics
```javascript
<div className="metric-value">
  {formatPercentage(kpi.value)}%
</div>

<text>
  {formatGauge(gauge.value)}%
</text>
```

### Lane 2: Insights
```javascript
{formatPercentage(Math.abs(trend.change))}%
{formatPercentage(forecast.confidence)}%
```

### Lane 3: Progress
```javascript
{formatPercentage(milestone.progress)}%
{formatPercentage(completionPercentage)}%
```

### Lane 5: Resources
```javascript
{formatPercentage(capacity.utilization)}%
{formatGauge(resource.cpuUsage)}%
```

---

## 🔄 Common Patterns

### When to use which formatter:

| Scenario | Function | Example |
|---|---|---|
| Display percentage | `formatPercentage()` | 95.8% |
| Display gauge/circular | `formatGauge()` | 62% |
| Display ms latency | `formatLatency()` | 125 ms |
| Display req/sec | `formatThroughput()` | 4532 req/s |
| Display currency | `formatCurrency()` | $2.40M |
| Display large KPI | `formatKPI()` | 4532.12 |

---

## ✅ Error Handling

All functions safely handle non-numeric values:
```javascript
formatPercentage("invalid")  → "invalid"
formatGauge(null)            → null
formatKPI(undefined)         → undefined
```

---

## 📋 Implementation Checklist

When adding new metrics:
- [ ] Identify metric type (KPI, percentage, gauge, etc.)
- [ ] Import appropriate formatter(s)
- [ ] Apply formatter at render time
- [ ] Test in browser to verify formatting
- [ ] Document metric in METRIC_EXAMPLES.md if complex

---

## 🚀 Common Edits

### Add formatting to existing metric
```javascript
// Before
<div>{metric.value}%</div>

// After
<div>{formatPercentage(metric.value)}%</div>
```

### Format metric based on unit
```javascript
const formatted = metric.unit === '%' 
  ? formatPercentage(metric.value)
  : formatKPI(metric.value);

<div>{formatted}</div>
```

### Format in calculations
```javascript
const completionPercent = (completed / total) * 100;
<div>{formatPercentage(completionPercent)}%</div>
```

---

## 🔗 Related Files

- **Utility**: `src/utils/formatNumbers.js` - Source code
- **Reference**: `METRIC_EXAMPLES.md` - All metric examples
- **Guide**: `FORMATTING_CHANGES.md` - Detailed changes
- **Details**: `../IMPLEMENTATION_SUMMARY.md` - Full documentation

---

## ❓ FAQ

**Q: Why does formatPercentage(65) return 65.0?**
A: To maintain consistency. All percentages show 1 decimal place.

**Q: Can I format negative numbers?**
A: Yes! All formatters work with negative values too.
Example: `formatLatency(-15.2)` → `-15`

**Q: What if I want 3 decimal places?**
A: Create a new formatter in `formatNumbers.js`:
```javascript
export const formatCustom = (value) => {
  if (typeof value !== 'number') return value;
  return parseFloat(value.toFixed(3));
};
```

**Q: Performance - will this be slow?**
A: No. Formatting happens at render time with minimal overhead.
The functions use native JavaScript (toFixed, Math.round, parseFloat).

---

## 📞 Support

For questions:
1. Check `METRIC_EXAMPLES.md` for your metric type
2. Review source in `src/utils/formatNumbers.js`
3. See implementation examples in updated Lane components

---

**Dashboard Formatting v1.0** | September 2026
