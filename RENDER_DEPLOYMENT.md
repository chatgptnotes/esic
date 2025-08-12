# Render Deployment Guide

## Render पर Deploy करने के लिए:

### 1. Render Dashboard में:
1. "New" → "Static Site" select करें
2. GitHub repository connect करें: `https://github.com/chatgptnotes/esic.git`

### 2. Build Settings:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `18.17.0`

### 3. Environment Variables:
Render dashboard में Environment section में add करें:
- `VITE_SUPABASE_URL` = `https://xvkxccqaopbnkvwgyfjv.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU`

### 4. Advanced Settings:
- **Auto-Deploy**: Yes
- **Branch**: master

## Alternative: Manual Upload
अगर GitHub connection में problem है:
1. Local में `npm run build` करें
2. `dist` folder को zip करें
3. Render में manual upload करें

## Troubleshooting:
- Build logs में specific error देखें
- Node version 18+ use करें
- Dependencies properly install हों

## Files Added:
- `render.yaml` - Render configuration
- `.nvmrc` - Node version specification
- Updated `package.json` with engines
- Optimized `vite.config.ts`
