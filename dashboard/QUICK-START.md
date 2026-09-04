# Quick Start - Five-Lane Dashboard Production

## 🚀 Start the Server (30 seconds)

### Option 1: NPM Script (Recommended)
```bash
cd "c:\Users\k2547\OneDrive\Desktop\Main Office\Worker A ( M Office)\Worker D (Local)\dashboard"
npm start
```

### Option 2: Direct Node
```bash
cd dashboard
node server.js
```

### Option 3: Build & Start Together
```bash
cd dashboard
npm run prod    # Builds if needed, then starts server
```

## 📍 Access Points

| URL | Purpose |
|-----|---------|
| `http://localhost:5000` | Dashboard (default) |
| `http://localhost:5000/health` | Health check |

## 🔧 Change Port

**Windows PowerShell:**
```powershell
$env:PORT=3001; npm start
```

**Command Prompt:**
```cmd
set PORT=3001 && npm start
```

## 📋 What Gets Built

✅ **All 5 Lanes Included:**
1. Lane 1: Realtime Metrics (KPIs, Gauges, Trends)
2. Lane 2: Analysis Insights (Trends, Anomalies, Forecasts)
3. Lane 3: Progress Tracking (Milestones, Burndown)
4. Lane 4: Alerts & Actions (Incidents, Actions)
5. Lane 5: Resource Health (Infrastructure, Capacity)

## 📦 Built Bundle Size

- JavaScript: 157.42 kB (gzipped)
- CSS: 4.22 kB (gzipped)
- **Total: ~161 kB** (production optimized)

## 🛑 Stop Server

Press `Ctrl+C` in the terminal

## 📄 Key Files

```
dashboard/
├── server.js              ← Production Express server
├── build/                 ← Optimized React build (ready)
├── .env.production        ← Production config
├── Procfile               ← Cloud deployment config
├── package.json           ← Updated scripts & deps
├── README.md              ← Full documentation
├── PRODUCTION-SETUP.md    ← Deployment guide
├── BUILD-VERIFICATION.md  ← Verification report
└── QUICK-START.md         ← This file
```

## 🚢 Deploy to Cloud

Choose your platform:

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod --dir=build
```

### Docker
```bash
docker build -t dashboard .
docker run -p 5000:5000 dashboard
```

## ✅ Verify It's Working

1. **Server running**: Should see banner in terminal
2. **Health check**: `curl http://localhost:5000/health`
3. **Dashboard**: Open `http://localhost:5000` in browser
4. **See 5 lanes**: All lanes visible and interactive

## 🆘 Troubleshooting

### Port Already In Use
```powershell
$env:PORT=3001; npm start
```

### Dependencies Missing
```bash
npm install
```

### Clean Rebuild
```bash
rm -r build node_modules
npm install
npm run build
```

## 📞 Full Documentation

- **PRODUCTION-SETUP.md** - Complete setup guide
- **README.md** - Feature documentation
- **BUILD-VERIFICATION.md** - Verification details

---

**Status**: ✅ Production Ready | **Bundle Size**: 161 KB | **Lanes**: 5/5 ✓
