# Troubleshooting White Screen Issue

## Current Issue
The development server is running but showing a white screen.

## Quick Fixes to Try

### 1. Hard Refresh the Browser
Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows/Linux) to force reload without cache.

### 2. Check Browser Console
1. Open Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Look for any errors (red text)
4. Share any error messages you see

### 3. Wait for Initial Bundling
The first time Vite starts, it needs to bundle dependencies. This can take 30-60 seconds.
Look at the terminal output - wait until you see:
```
✓ Dependencies bundled successfully
```

### 4. Clear Vite Cache and Restart
```bash
cd /Users/johnilizy/Documents/web/EMCOOP/emcoop-financial-control
rm -rf node_modules/.vite
yarn dev
```

### 5. Check if Port is Correct
Make sure you're accessing: **http://localhost:5173**

If Vite says it's running on a different port (like 5174), use that port instead.

### 6. Disable Browser Extensions
Some browser extensions (especially ad blockers or security extensions) can interfere.
Try opening in an Incognito/Private window.

### 7. Check Network Tab
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for any failed requests (red text or 404 errors)

### 8. Verify Tailwind CSS is Loading
Check if the CSS file is loading:
1. Open Developer Tools
2. Go to **Network** tab
3. Filter by "CSS"
4. Look for `index.css` - it should load successfully

## Common Error Messages and Fixes

### Error: "Module not found"
**Solution**: Install missing dependencies
```bash
yarn install
```

### Error: "EACCES: permission denied"
**Solution**: Fix permissions
```bash
sudo chown -R $(whoami) node_modules
rm -rf node_modules/.vite
```

### Error: "Failed to resolve import"
**Solution**: Clear cache and rebuild
```bash
rm -rf node_modules/.vite
yarn dev
```

### Error: Tailwind classes not working
**Solution**: Verify Tailwind config
Check that these files exist:
- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css` (should have @tailwind directives)

## Manual Testing Steps

### Step 1: Check if HTML is Loading
1. Open http://localhost:5173
2. View Page Source (Cmd/Ctrl + U)
3. You should see `<div id="root"></div>`

### Step 2: Check if JavaScript is Loading
1. Open Developer Tools Console
2. Type: `document.getElementById('root')`
3. You should see the div element

### Step 3: Check if React is Mounting
1. Open Developer Tools Console
2. Look for React DevTools icon (if installed)
3. Or check Elements tab - should see React components inside #root

## Emergency: Start from Scratch

If nothing works, try:

```bash
# Stop the server (Ctrl+C)

# Clean everything
cd /Users/johnilizy/Documents/web/EMCOOP/emcoop-financial-control
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf dist
rm yarn.lock

# Reinstall
yarn install

# Start fresh
yarn dev
```

## Check These Files

### src/main.tsx
Should contain:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### src/index.css
Should start with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/App.tsx
Should contain:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
// ... other imports
```

## Still Not Working?

### Option 1: Check Terminal Output
Look at the terminal where `yarn dev` is running.
Share any error messages or warnings.

### Option 2: Try a Simple Test Page

Temporarily replace `src/App.tsx` with:
```typescript
export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>Test Page</h1>
      <p>If you see this, React is working!</p>
    </div>
  );
}
```

Refresh the browser. If you see the test page, the problem is in the main app code.

### Option 3: Check Browser Compatibility
Make sure you're using a modern browser:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Getting Help

If you're still stuck, provide:
1. Browser console errors (screenshot or copy/paste)
2. Terminal output from `yarn dev`
3. Network tab showing failed requests
4. Which browser and version you're using

---

## Most Likely Causes

Based on the setup:
1. ✅ Server is running (confirmed)
2. ✅ Dependencies are installed (confirmed)
3. ⚠️ **Most Likely**: Vite is still bundling dependencies (wait 30-60 seconds)
4. ⚠️ **Next Likely**: Browser cache issue (hard refresh)
5. ⚠️ **Also Check**: Browser console for JavaScript errors

## Quick Win Solution

Try this in order:
1. **Wait 60 seconds** for initial bundling
2. **Hard refresh** the browser (Cmd+Shift+R)
3. **Check console** for errors (F12 → Console tab)
4. **Clear cache**: `rm -rf node_modules/.vite && yarn dev`

One of these should work! 🚀
