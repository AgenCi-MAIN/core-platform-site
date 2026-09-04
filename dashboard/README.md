# Five-Lane Operational Dashboard

A comprehensive, modern React-based dashboard designed to provide operational intelligence across five distinct lanes of information: realtime metrics, analysis insights, progress tracking, alerts & actions, and resource health.

## 🎯 Overview

The Five-Lane Dashboard is built as a responsive, single-page application that integrates multiple operational data streams into a cohesive, visually intuitive interface. Each "lane" represents a different dimension of operational awareness.

### The Five Lanes

1. **Lane 1: Realtime Metrics (KPIs & Gauges)**
   - Key performance indicators with real-time trends
   - Resource utilization gauges (CPU, Memory, Disk)
   - Performance trend charts
   - Threshold alerts and status indicators

2. **Lane 2: Analysis Insights (Trends, Anomalies, Forecasts)**
   - 7-day trend analysis with predictions
   - Automated anomaly detection results
   - Machine learning forecasts with confidence levels
   - Root cause indicators

3. **Lane 3: Progress Tracking (Milestones, Burndown)**
   - Sprint metrics and velocity tracking
   - Milestone progress with expandable task lists
   - Sprint burndown chart
   - Completion status indicators

4. **Lane 4: Alerts & Actions (Incident Management)**
   - Critical incident tracking with severity levels
   - Timeline-based incident investigation
   - Action item management with priorities
   - Assignment and due date tracking

5. **Lane 5: Resource Health & Capacity (Infrastructure)**
   - Infrastructure component health monitoring
   - Capacity utilization across compute, storage, network
   - Detailed resource metrics with drill-down
   - Status indicators (healthy, warning, critical)

## 🚀 Features

### Core Functionality
- ✅ **Realtime Data Updates**: Simulated real-time metric updates every 5 seconds
- ✅ **Responsive Design**: Mobile, tablet, and desktop layouts
- ✅ **Lane Visibility Toggle**: Show/hide any lane to customize your view
- ✅ **Data Refresh**: Manual refresh button with loading state
- ✅ **Expandable Details**: Click to expand milestones, incidents, and resources
- ✅ **Chart Visualizations**: 6+ different chart types (line, area, bar, pie)
- ✅ **Status Indicators**: Color-coded health, severity, and priority levels
- ✅ **Responsive Charts**: Charts automatically adapt to container size

### Design System
- Dark theme optimized for 24/7 monitoring
- Color-coded severity levels (critical, high, medium, low, healthy)
- Smooth animations and transitions
- Lucide React icons for consistency
- Tailwind CSS for rapid styling

### Data Integration
- Mock data structure for all 5 lanes
- Realistic data format for API integration
- Time-series data for charts
- Hierarchical data relationships

## 📁 File Structure

```
dashboard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Lane1Metrics.jsx      # Realtime metrics, KPIs, gauges
│   │   ├── Lane2Insights.jsx     # Trends, anomalies, forecasts
│   │   ├── Lane3Progress.jsx     # Milestones, burndown, sprint metrics
│   │   ├── Lane4Alerts.jsx       # Incidents, actions, assignments
│   │   ├── Lane5Resources.jsx    # Infrastructure, capacity, health
│   │   └── DashboardLayout.jsx   # Main layout, navigation, controls
│   ├── data/
│   │   └── mockData.js           # Complete mock dataset
│   ├── App.jsx                   # Main app component
│   ├── index.js                  # React entry point
│   └── index.css                 # Global styles
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation Steps

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build

# Run tests
npm test
```

The dashboard will open at `http://localhost:3000`

## 📊 Mock Data Structure

The dashboard includes comprehensive mock data covering:

### Realtime Metrics
- 4 KPIs with trend data and thresholds
- 3 resource gauges with health status
- 7-point performance trend line

### Analysis Insights
- 2 trend lines with predictions
- 2 anomaly detections with severity
- 2 forecasts with confidence scores

### Progress Tracking
- 3 milestones with task lists
- 7-point sprint burndown
- Sprint metrics (velocity, completed, health)

### Alerts & Actions
- 3 incidents with severity levels
- 3 action items with priorities
- Incident timelines and affected services

### Resource Health
- 5 infrastructure components
- 3 capacity dimensions (compute, storage, network)
- Detailed metrics per resource

## 🎨 Customization

### Colors & Theme
Edit `src/index.css` or `tailwind.config.js` to customize:
- Dark theme colors (slate palette)
- Accent colors (cyan, violet, amber, red, green)
- Spacing and sizing

### Adding Real Data
Replace mock data in `src/data/mockData.js` with real API calls:

```javascript
// Example: Fetch real metrics
useEffect(() => {
  fetch('/api/metrics')
    .then(res => res.json())
    .then(data => setMetrics(data))
    .catch(err => console.error(err));
}, []);
```

### Lane Configuration
Edit `DashboardLayout.jsx` to modify:
- Lane colors and icons
- Sidebar visibility
- Refresh intervals
- Update frequencies

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (single-lane full width)
- **Tablet**: 640px - 1024px (2-lane grid)
- **Desktop**: > 1024px (full layout with sidebar)
- **Large**: > 1280px (optimized for ultra-wide displays)

## 🔄 Data Flow

```
App.jsx
  └── DashboardLayout.jsx
      ├── Lane1Metrics.jsx
      │   └── Recharts (LineChart)
      ├── Lane2Insights.jsx
      │   └── Recharts (LineChart + Bars)
      ├── Lane3Progress.jsx
      │   └── Recharts (AreaChart + BarChart)
      ├── Lane4Alerts.jsx
      │   └── Static components
      └── Lane5Resources.jsx
          └── Recharts (BarChart)

mockData.js (State Management)
  └── Real-time updates every 5 seconds
```

## 🎯 Performance Considerations

- Chart responsiveness optimized with Recharts
- Memoization can be added for heavy components
- Lazy loading recommended for large datasets
- Virtual scrolling for 100+ items

## 🔐 Security Notes

- Mock data is entirely client-side
- For production, implement:
  - API authentication (JWT, OAuth)
  - Data encryption in transit (HTTPS)
  - Role-based access control
  - Rate limiting on API endpoints
  - Input validation and sanitization

## 📈 Future Enhancements

- [ ] Real API integration with actual metrics
- [ ] WebSocket support for true realtime updates
- [ ] Export functionality (PDF, CSV)
- [ ] Custom alert thresholds and rules
- [ ] Dashboard presets and saved views
- [ ] User preferences and dark/light mode toggle
- [ ] Drill-down analysis with detailed reports
- [ ] Historical data and trend analysis
- [ ] Custom metric creation
- [ ] Notification system

## 🧪 Testing

The dashboard includes mock data that can be used for:
- Visual regression testing
- Component interaction testing
- Performance benchmarking
- Responsive design testing

Recommended testing tools:
- Jest for unit tests
- React Testing Library for component tests
- Cypress or Playwright for E2E tests
- Lighthouse for performance testing

## 📝 Component API

### Lane1Metrics
```jsx
<Lane1Metrics 
  data={realtimeMetricsData}
  performanceData={chartData}
/>
```

### Lane2Insights
```jsx
<Lane2Insights data={analysisInsightsData} />
```

### Lane3Progress
```jsx
<Lane3Progress data={progressTrackingData} />
```

### Lane4Alerts
```jsx
<Lane4Alerts data={alertsAndActionsData} />
```

### Lane5Resources
```jsx
<Lane5Resources data={resourceHealthData} />
```

## 🚢 Deployment

### Production Build & Local Testing

After building for production, the app can be served using Node.js/Express:

```bash
# Build the app
npm run build

# Install production dependencies
npm install

# Start the production server
npm start

# Or use the combined command
npm run prod
```

The server will run on port 5000 by default (configurable via `PORT` env variable).

**Production Files:**
- `server.js` - Express server configuration
- `.env.production` - Production environment variables
- `Procfile` - Cloud deployment configuration (Heroku, etc.)
- `build/` - Optimized React build output (157 KB gzipped)

### Vercel
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=build
```

### Heroku
```bash
# Install Heroku CLI, then:
heroku login
heroku create your-app-name
git push heroku main

# Or use Procfile with Node.js buildpack
heroku config:set NODE_ENV=production
heroku open
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables

Create `.env.production` for production settings:
```
NODE_ENV=production
PORT=5000
REACT_APP_API_URL=https://your-api.example.com
REACT_APP_ENABLE_ANALYTICS=true
```

### Health Check

The production server includes a health check endpoint:
```
GET /health → { "status": "ok", "timestamp": "..." }
```

### Performance Metrics

Built production bundle:
- **JavaScript**: 157.42 kB (gzipped)
- **CSS**: 4.22 kB (gzipped)
- **Total**: ~161 kB gzipped

### Static Server Alternative

For static file serving only (without Node.js):

```bash
# Install and use the serve package
npm install -g serve
serve -s build -l 5000
```

## 📞 Support & Contributions

For issues, feature requests, or contributions:
1. Create detailed issue descriptions
2. Include screenshots or videos
3. Provide reproduction steps
4. Submit pull requests with tests

## 📄 License

MIT License - Feel free to use this dashboard in your projects.

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Recharts Guide](https://recharts.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

**Built with ❤️ for operational excellence**
