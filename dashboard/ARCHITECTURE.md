# Five-Lane Dashboard Architecture

## System Overview

The Five-Lane Dashboard is a React-based single-page application (SPA) designed to provide comprehensive operational intelligence through five distinct information lanes. Each lane independently manages its domain while sharing a common data infrastructure.

## Architecture Layers

### 1. Presentation Layer (Components)

```
DashboardLayout (Main Container)
├── Header (Navigation & Controls)
├── Sidebar (Lane Toggle & Quick Stats)
└── Main Content Area
    ├── Lane1Metrics
    │   ├── KPI Cards
    │   ├── Gauge Charts
    │   └── Performance Trend Chart
    ├── Lane2Insights
    │   ├── Trend Charts
    │   ├── Anomaly Alerts
    │   └── Forecast Cards
    ├── Lane3Progress
    │   ├── Sprint Metrics
    │   ├── Milestone Cards
    │   └── Burndown Chart
    ├── Lane4Alerts
    │   ├── Incident List
    │   └── Action Items
    └── Lane5Resources
        ├── Capacity Charts
        ├── Infrastructure Health
        └── Resource Details
```

### 2. State Management

Current implementation uses React hooks for local state:

```javascript
// App.jsx
const [data, setData] = useState(initialData);
const [performanceData, setPerformanceData] = useState(chartData);

// Real-time updates every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    setData(updatedData);
  }, 5000);
}, []);
```

**Future Enhancement**: Consider Redux or Zustand for complex state:

```javascript
// Redux slice example (future)
const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    updateMetrics: (state, action) => {
      state.kpis = action.payload;
    },
  },
});
```

### 3. Data Layer

#### Mock Data Structure
```
mockData.js
├── realtimeMetrics
│   ├── kpis: Array<KPI>
│   └── gauges: Array<Gauge>
├── analysisInsights
│   ├── trends: Array<Trend>
│   ├── anomalies: Array<Anomaly>
│   └── forecasts: Array<Forecast>
├── progressTracking
│   ├── milestones: Array<Milestone>
│   ├── burndown: Array<Point>
│   └── sprintMetrics: Object
├── alertsAndActions
│   ├── incidents: Array<Incident>
│   └── actions: Array<Action>
└── resourceHealth
    ├── infrastructure: Array<Resource>
    └── capacity: Object
```

#### Data Flow Diagram

```
mockData.js (Mock/API)
    ↓
App.jsx (State Management)
    ↓
DashboardLayout.jsx (Container)
    ↓
┌─────────────────────────────────────┐
│  Individual Lane Components         │
├─────────────────────────────────────┤
│ Lane1 → Recharts                   │
│ Lane2 → Recharts + Alerts          │
│ Lane3 → Recharts + Progress        │
│ Lane4 → Incident Timeline          │
│ Lane5 → Recharts + Health          │
└─────────────────────────────────────┘
    ↓
Presentation (DOM)
```

## Component Hierarchy

### Root Component: App.jsx

**Responsibilities**:
- Initialize mock data
- Manage global application state
- Simulate real-time updates
- Pass data to layout

**Key Props**:
```typescript
interface AppProps {
  data: {
    realtimeMetrics: RealtimeMetrics;
    analysisInsights: AnalysisInsights;
    progressTracking: ProgressTracking;
    alertsAndActions: AlertsAndActions;
    resourceHealth: ResourceHealth;
  };
  performanceData: {
    performance: Array<PerformancePoint>;
  };
}
```

### Container: DashboardLayout.jsx

**Responsibilities**:
- Render header with controls
- Render sidebar with lane toggles
- Manage lane visibility state
- Handle refresh functionality
- Render footer

**State Management**:
```javascript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [visibleLanes, setVisibleLanes] = useState([1, 2, 3, 4, 5]);
const [isRefreshing, setIsRefreshing] = useState(false);
const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
```

### Lane Components

#### Lane1Metrics
**Renders**:
- 4 KPI cards with trend indicators
- 3 SVG-based gauge charts
- 1 Recharts LineChart for performance trends
- Alert indicators for threshold violations

**Data Structure**:
```typescript
interface Lane1Data {
  kpis: Array<{
    id: string;
    label: string;
    value: number;
    unit: string;
    change: number;
    trend: 'up' | 'down';
    threshold: number;
  }>;
  gauges: Array<{
    id: string;
    label: string;
    value: number;
    max: number;
    status: 'healthy' | 'warning' | 'critical';
  }>;
}
```

#### Lane2Insights
**Renders**:
- 2 trend analysis cards with LineCharts
- 2 anomaly detection alerts
- 2 forecast cards with confidence bars
- Expandable incident details

**Data Structure**:
```typescript
interface Lane2Data {
  trends: Array<{
    id: string;
    label: string;
    value: string;
    change: number;
    direction: 'up' | 'down';
    prediction: string;
    data: Array<{ date: string; value: number }>;
  }>;
  anomalies: Array<{
    id: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timestamp: string;
    status: 'resolved' | 'investigating';
  }>;
  forecasts: Array<{
    id: string;
    metric: string;
    prediction: string;
    confidence: number;
    when: string;
  }>;
}
```

#### Lane3Progress
**Renders**:
- Sprint metrics cards
- Milestone cards with expandable task lists
- Sprint burndown AreaChart
- Task status indicators

**Data Structure**:
```typescript
interface Lane3Data {
  milestones: Array<{
    id: string;
    title: string;
    progress: number;
    status: 'completed' | 'in-progress' | 'pending';
    dueDate: string;
    tasks: Array<{
      name: string;
      status: 'done' | 'in-progress' | 'pending';
    }>;
  }>;
  burndown: Array<{
    day: string;
    remaining: number;
  }>;
  sprintMetrics: {
    completedStories: number;
    totalStories: number;
    velocity: number;
    sprintHealth: 'on-track' | 'at-risk' | 'off-track';
  };
}
```

#### Lane4Alerts
**Renders**:
- Alert summary cards
- Incident list with expandable timelines
- Action items with priority and assignment
- Status badges and icons

**Data Structure**:
```typescript
interface Lane4Data {
  incidents: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    affectedServices: string[];
    timeline: Array<{
      time: string;
      event: string;
    }>;
    status: 'resolved' | 'in-progress' | 'pending-action';
    duration?: string;
    assignedTo?: string;
  }>;
  actions: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    assignedTo: string;
    dueDate: string;
    status: 'completed' | 'in-progress' | 'pending';
  }>;
}
```

#### Lane5Resources
**Renders**:
- Capacity utilization bars
- Capacity BarChart
- Infrastructure health list with expandable details
- Resource summary cards

**Data Structure**:
```typescript
interface Lane5Data {
  infrastructure: Array<{
    id: string;
    name: string;
    type: string;
    status: 'healthy' | 'warning' | 'critical';
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    network: string;
    uptime: string;
  }>;
  capacity: {
    compute: CapacityMetric;
    storage: CapacityMetric;
    network: CapacityMetric;
  };
}

interface CapacityMetric {
  allocated: number;
  used: number;
  available: number;
  unit: string;
  utilization: number;
}
```

## Styling Architecture

### CSS Strategy: Hybrid Approach

1. **Tailwind CSS** (Utility-first):
   - Layout and spacing
   - Responsive grid system
   - Interactive states

2. **CSS Modules** (Component-scoped):
   - Lane-specific styling
   - Custom gauge SVGs
   - Animation effects

3. **Inline Styles** (Dynamic):
   - Color-coded status indicators
   - Progress bar widths
   - Theme-based colors

### Color System

```css
/* Theme Colors */
--color-slate-900: #0f172a  /* Background */
--color-slate-800: #1e293b  /* Cards */
--color-slate-700: #334155  /* Borders */
--color-slate-400: #94a3b8  /* Text secondary */
--color-slate-200: #e2e8f0  /* Text primary */

/* Accent Colors */
--color-cyan-500: #06b6d4   /* Metrics */
--color-violet-500: #a855f7 /* Insights */
--color-amber-500: #f59e0b  /* Progress */
--color-red-500: #ef4444    /* Alerts */
--color-green-500: #10b981  /* Health */

/* Status Colors */
--color-status-healthy: #10b981
--color-status-warning: #f59e0b
--color-status-critical: #ef4444
```

## Data Visualization

### Chart Libraries

**Recharts** - Used for:
- Line charts (performance trends, forecasts)
- Area charts (sprint burndown)
- Bar charts (capacity utilization)
- Pie charts (resource utilization)

**Custom SVG** - Used for:
- Circular gauges (CPU, Memory, Disk)
- Progress indicators
- Timeline visualizations

### Responsive Chart Configuration

```javascript
<ResponsiveContainer width="100%" height={200}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
    <XAxis dataKey="time" stroke="#94a3b8" />
    <YAxis stroke="#94a3b8" />
    <Tooltip contentStyle={{ background: '#1e293b' }} />
    <Line type="monotone" dataKey="value" stroke="#06b6d4" />
  </LineChart>
</ResponsiveContainer>
```

## Real-Time Data Updates

### Current Implementation (Mock)

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    setData((prevData) => ({
      ...prevData,
      realtimeMetrics: {
        ...prevData.realtimeMetrics,
        kpis: prevData.realtimeMetrics.kpis.map((kpi) => ({
          ...kpi,
          value: kpi.value + (Math.random() - 0.5) * 2,
        })),
      },
    }));
  }, 5000); // 5-second interval

  return () => clearInterval(interval);
}, []);
```

### Future Enhancement: WebSocket Integration

```javascript
useEffect(() => {
  const ws = new WebSocket('ws://api.example.com/metrics');
  
  ws.onmessage = (event) => {
    const updatedData = JSON.parse(event.data);
    setData(updatedData);
  };

  return () => ws.close();
}, []);
```

## Responsive Design Strategy

### Breakpoints

```javascript
// Tailwind breakpoints
sm: 640px   // Mobile
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large Desktop
2xl: 1536px // Ultra-wide

// CSS Media Queries (index.css)
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 640px) { /* Mobile */ }
```

### Layout Adaptation

| Breakpoint | Layout | Lanes | Sidebar |
|-----------|--------|-------|---------|
| Mobile    | 1 col  | Stack | Hidden  |
| Tablet    | 2 cols | Grid  | Hidden  |
| Desktop   | Main   | Full  | Visible |

## Performance Considerations

### Optimization Techniques

1. **Code Splitting**
   ```javascript
   const Lane1Metrics = lazy(() => import('./Lane1Metrics'));
   const Lane2Insights = lazy(() => import('./Lane2Insights'));
   ```

2. **Memoization**
   ```javascript
   const MemoizedChart = React.memo(RechartComponent);
   ```

3. **Virtual Scrolling** (for 100+ items)
   ```javascript
   import { FixedSizeList } from 'react-window';
   ```

4. **Chart Optimization**
   - Reduce data points for display
   - Use `ResponsiveContainer` with fixed height
   - Debounce resize handlers

## Security Architecture

### Frontend Security

1. **Input Validation**
   ```javascript
   const validateMetric = (value) => {
     return typeof value === 'number' && value >= 0;
   };
   ```

2. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' cdn.example.com">
   ```

3. **XSS Prevention**
   - React escapes content by default
   - Use `dangerouslySetInnerHTML` only with trusted data

### Backend Integration Security

1. **API Authentication**
   - JWT tokens in Authorization headers
   - Refresh token rotation

2. **Data Encryption**
   - HTTPS/TLS for all communications
   - Encryption at rest for sensitive data

3. **Access Control**
   - Role-based access control (RBAC)
   - Lane-level permissions

## Testing Strategy

### Unit Tests (Jest)
```javascript
describe('Lane1Metrics', () => {
  test('renders KPI cards', () => {
    render(<Lane1Metrics data={mockData} />);
    expect(screen.getByText('System Uptime')).toBeInTheDocument();
  });
});
```

### Integration Tests (React Testing Library)
```javascript
test('updates metrics on refresh', async () => {
  render(<DashboardLayout data={data} />);
  fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
  await waitFor(() => {
    expect(screen.getByText(/updated/)).toBeInTheDocument();
  });
});
```

### E2E Tests (Cypress/Playwright)
```javascript
describe('Dashboard', () => {
  it('should toggle lane visibility', () => {
    cy.visit('/');
    cy.get('[data-testid="lane-toggle-1"]').click();
    cy.get('[data-testid="lane-1"]').should('not.be.visible');
  });
});
```

## Deployment Architecture

### Development
```
npm start
→ React Dev Server (port 3000)
→ Mock data from mockData.js
```

### Production
```
npm run build
→ Optimized build in /build
→ Ready for hosting (Vercel, Netlify, AWS, etc.)
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:16-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=0 /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

## Scalability Roadmap

### Phase 1: Current
- 5 lanes, mock data
- Single-user experience
- Client-side state management

### Phase 2: API Integration
- Real data endpoints
- WebSocket for realtime
- Redux for complex state

### Phase 3: Multi-user
- User authentication
- Personalized views
- Saved preferences

### Phase 4: Enterprise
- Multi-tenant support
- Custom lane creation
- Advanced analytics
- Mobile native apps

## Conclusion

The Five-Lane Dashboard architecture provides a solid foundation for operational intelligence with clear separation of concerns, scalable data flow, and responsive design. The modular component structure allows easy enhancement and customization while maintaining performance and user experience.
