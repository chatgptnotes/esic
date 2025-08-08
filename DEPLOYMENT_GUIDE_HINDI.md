# Deployment Guide - हिंदी में

## समस्या का समाधान

आपका build successful है लेकिन deployment में blank page आ रहा है। यह मुख्यतः environment variables की वजह से होता है।

## तुरंत समाधान (Quick Fix)

### 1. Local Testing के लिए:
```bash
# Dependencies install करें
npm install

# Build करें  
npm run build

# Local preview करें
npm run preview
```

### 2. Production Deployment के लिए:

#### Vercel पर Deploy करने के लिए:
1. Vercel.com पर जाएं
2. GitHub repository connect करें
3. Environment Variables में जाएं और add करें:
   - `VITE_SUPABASE_URL` = `https://xvkxccqaopbnkvwgyfjv.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU`

#### Netlify पर Deploy करने के लिए:
1. Netlify.com पर जाएं
2. Site settings → Environment variables में same values add करें

#### Manual Deployment के लिए:
1. `dist` folder को किसी भी static hosting पर upload करें
2. Code में fallback values already हैं, so यह काम करना चाहिए

## Debug करने के लिए:

1. Browser console खोलें (F12)
2. Network tab check करें
3. Console में errors देखें
4. "Supabase URL" और "Supabase Key exists" logs देखें

## अगर अभी भी problem है:

### Option 1: Simple Static Build
```bash
npm run build
# dist folder को directly host करें
```

### Option 2: Environment Variables Check
Browser console में check करें:
- क्या Supabase connection successful है?
- कोई network errors तो नहीं?
- JavaScript errors तो नहीं?

## Common Issues और Solutions:

1. **Blank Page**: Environment variables missing
2. **Network Error**: Supabase credentials wrong
3. **Build Error**: Dependencies issue
4. **Loading Error**: Chunk loading problem (already fixed)

## Test URLs:
- Local: http://localhost:4173 (after `npm run preview`)
- Production: आपका deployment URL

आपका application अब properly deploy होना चाहिए!
