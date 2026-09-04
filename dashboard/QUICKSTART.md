# Five-Lane Dashboard - Quick Start Guide

## 🚀 Get Up and Running in 3 Minutes

### Step 1: Install Dependencies
```bash
# Navigate to dashboard directory
cd dashboard

# Install all dependencies
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

The dashboard will automatically open in your browser at `http://localhost:3000`

### Step 3: Explore the Dashboard

**Navigation:**
- **Header**: Refresh button, settings menu, last update time
- **Sidebar** (desktop): Toggle lane visibility, quick stats
- **Mobile Menu** (mobile/tablet): Tap the menu icon to toggle lanes
- **Footer**: Shows which lanes are currently visible

---

## 📱 What You'll See

### Lane 1: Realtime Metrics
- 4 live KPI cards with trend indicators
- 3 resource gauge charts
- 24-hour performance trend line
- Real-time updates every 5 seconds

### Lane 2: Analysis Insights
- Revenue and user engagement trends
- Anomaly detection alerts
- Forecasts with confidence scores
- Click to expand for more details

### Lane 3: Progress Tracking
- Sprint velocity and metrics
- 3 project milestones
- Click milestones to see task lists
- 7-day sprint burndown chart

### Lane 4: Alerts & Actions
- 3 incidents with severity levels
- Click to expand incident timelines
- 3 action items with assignments
- Priority-based sorting

### Lane 5: Resource Health
- Resource capacity utilization
- 5 infrastructure components
- Click to expand for detailed metrics
- Health status indicators

---

## 🎮 Interactive Features

### Toggle Lanes
- **Desktop**: Use sidebar checkboxes
- **Tablet/Mobile**: Tap the menu icon, then toggle lanes

### Expand Details
- Click milestone cards to see task lists
- Click incident cards to see timelines
- Click infrastructure items to see detailed metrics

### Refresh Data
- Click the refresh button (circular icon) in the header
- Data updates automatically every 5 seconds

### Monitor Real-Time Updates
- Watch metrics change automatically
- Check the "last updated" timestamp in header and footer
- Gauges and KPIs update continuously

---

## 🎨 Customization

### Change Colors
Edit `src/index.css` to modify theme colors:
```css
/* Dark theme colors */
--color-slate-900: #0f172a  /* Background */

/* Accent colors */
--color-cyan-500: #06b6d4   /* Change this for Lane 1 color */
--color-violet-500: #a855f7 /* Change for Lane 2 */
--color-amber-500: #f59e0b  /* Change for Lane 3 */
--color-red-500: #ef4444    /* Change for Lane 4 */
--color-green-500: #10b981  /* Change for Lane 5 */
```

### Replace Mock Data
Edit `src/data/mockData.js` to use your own data:

```javascript
// Example: Replace KPIs
export const realtimeMetrics = {
  kpis: [
    {
      id: 'my-metric',
      label: 'My Custom Metric',
      value: 123,
      unit: '%',
      change: 5,
      trend: 'up',
      threshold: 100,
    },
    // ... more metrics
  ],
};
```

### Add API Integration
Replace the mock data fetch with real API calls:

```javascript
// In src/App.jsx
useEffect(() => {
  fetch('/api/metrics')
    .then(res => res.json())
    .then(data => setData(data))
    .catch(err => console.error('API Error:', err));
}, []);
```

---

## 📦 File Structure Overview

```
dashboard/                          # Main dashboard folder
├── src/                           # Source code
│   ├── components/
│   │   ├── Lane1Metrics.jsx      # KPIs and gauges
│   │   ├── Lane2Insights.jsx     # Trends and forecasts
│   │   ├── Lane3Progress.jsx     # Milestones and burndown
│   │   ├── Lane4Alerts.jsx       # Incidents and actions
│   │   ├── Lane5Resources.jsx    # Infrastructure and capacity
│   │   └── DashboardLayout.jsx   # Main layout container
│   ├── data/
│   │   └── mockData.js           # All sample data
│   ├── App.jsx                   # Main app component
│   ├── index.js                  # React entry point
│   └── index.css                 # Global styles
├── public/
│   └── index.html                # HTML template
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind setup
└── README.md                     # Full documentation
```

---

## 🔄 Real-Time Updates

The dashboard simulates real-time updates automatically:

**Every 5 seconds:**
- KPI values change slightly
- Gauge readings fluctuate
- Metrics update with new trends

To modify update frequency, edit `src/App.jsx`:
```javascript
// Change interval from 5000ms to your preferred value
const interval = setInterval(() => {
  // Update logic
}, 5000); // ← Change this number
```

---

## 📊 Data Flow

1. **mockData.js** → Contains all sample data
2. **App.jsx** → Loads data and simulates updates
3. **DashboardLayout.jsx** → Routes data to lanes
4. **Lane Components** → Render and visualize data
5. **Browser** → Displays interactive dashboard

---

## 🌐 Responsive Breakpoints

The dashboard automatically adapts to screen size:

| Screen Size | Layout | Sidebar | Navigation |
|------------|--------|---------|------------|
| Mobile < 640px | 1 col, stacked | Hidden | Menu button |
| Tablet 640-1024px | 2 cols | Hidden | Menu button |
| Desktop > 1024px | Full | Visible | Top menu |
| Large > 1280px | Optimized | Visible | Top menu |

Test on your device by:
1. Resizing your browser window
2. Using DevTools device emulation (F12)
3. Testing on actual mobile/tablet devices

---

## 🐛 Troubleshooting

### Dashboard won't load
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm start
```

### Charts not displaying
- Check browser console (F12) for errors
- Ensure data structure matches mockData.js
- Verify Recharts is installed: `npm list recharts`

### Styling looks broken
```bash
# Rebuild Tailwind CSS
npm run build
```

### Real-time updates not working
- Check browser console for JavaScript errors
- Verify `useEffect` is running in App.jsx
- Ensure `setData` is being called

---

## 📚 Key Components Explained

### Lane1Metrics
**Shows**: KPIs, gauges, trends  
**Updates**: Every 5 seconds (auto-simulated)  
**Interactive**: Hover over gauges for tooltips

### Lane2Insights
**Shows**: Trends, anomalies, forecasts  
**Updates**: Trends recalculate on data change  
**Interactive**: None required (informational)

### Lane3Progress
**Shows**: Milestones, burndown, sprint health  
**Updates**: Simulated milestone progress  
**Interactive**: Click milestone to expand tasks

### Lane4Alerts
**Shows**: Incidents, actions, assignments  
**Updates**: New incidents simulated  
**Interactive**: Click incident to expand timeline

### Lane5Resources
**Shows**: Infrastructure, capacity, health  
**Updates**: Resource metrics change  
**Interactive**: Click resource to expand details

---

## 💡 Tips & Tricks

### Maximize Screen Space
- Toggle sidebar visibility on desktop
- Hide unused lanes for focus
- Use full-screen mode (F11)

### Monitor Specific Metrics
- Toggle only the lanes you care about
- Use desktop sidebar for quick stats
- Refresh manually for immediate updates

### Debug Data
- Open browser DevTools (F12)
- Check Network tab for API calls
- Use Console tab to inspect `window.__REDUX_DEVTOOLS_EXTENSION__`

### Performance Testing
- Check Chrome DevTools Performance tab
- Monitor CPU and memory usage
- Test on slower devices/connections

---

## 🎓 Learning Resources

### React
- [React Official Docs](https://react.dev)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)

### Charts
- [Recharts Documentation](https://recharts.org)
- [Chart.js Alternative](https://www.chartjs.org)

### Styling
- [Tailwind CSS Docs](https://tailwindcss.com)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

### Icons
- [Lucide Icons](https://lucide.dev)
- [Feather Icons Alternative](https://feathericons.com)

---

## 📞 Common Questions

**Q: Can I use this in production?**  
A: Yes! The code is production-ready. Just replace mock data with real API endpoints.

**Q: How do I deploy this?**  
A: Run `npm run build` and deploy the `build/` folder to any static hosting (Vercel, Netlify, GitHub Pages, etc.)

**Q: Can I customize the lanes?**  
A: Absolutely! Edit components in `src/components/` to modify any lane.

**Q: How do I add dark/light mode?**  
A: Modify the CSS variables in `src/index.css` to create theme switching logic.

**Q: Can I use this with a backend API?**  
A: Yes! Replace the mock data in `src/App.jsx` with API fetch calls.

---

## ✨ Next Steps

1. **Explore the Code**
   - Open each component file
   - Understand the data flow
   - Review the CSS styling

2. **Customize for Your Needs**
   - Replace mock data
   - Adjust colors and layout
   - Add your branding

3. **Connect Your Data**
   - Create API endpoints
   - Implement authentication
   - Update data structures

4. **Deploy**
   - Build for production: `npm run build`
   - Upload to hosting platform
   - Monitor in production

---

## 🎉 You're Ready!

The Five-Lane Dashboard is now running. Start exploring and customizing to fit your operational needs!

For detailed information, see:
- [README.md](./README.md) - Full feature documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical deep dive
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What was built

Happy monitoring! 📊
