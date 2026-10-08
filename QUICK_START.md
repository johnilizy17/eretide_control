# 🚀 Quick Start Guide

## Step 1: Fix NPM Permissions

Run this command and enter your password when prompted:
```bash
sudo chown -R 501:20 "/Users/johnilizy/.npm"
```

## Step 2: Install Dependencies

```bash
cd /Users/johnilizy/Documents/web/EMCOOP/emcoop-financial-control
npm install
```

## Step 3: Start Development Server

```bash
npm run dev
```

## Step 4: Open in Browser

Navigate to: **http://localhost:5173**

---

## 🎉 That's It!

You should now see the EMCOOP Financial Control Center dashboard with:
- 5 KPI cards
- Money flow chart
- Transaction distribution pie chart
- Recent transactions table
- Pending approvals interface

## 📝 Using the Application

### Navigation
- Click any item in the left sidebar to navigate
- Sidebar can be collapsed using the menu button in header
- All main modules are accessible from the sidebar

### Current Features (with Mock Data)
- ✅ Dashboard with statistics and charts
- ✅ Transaction list with filters
- ✅ Approval workflow interface
- ✅ Account management interface
- ✅ Transfer initiation form
- ✅ All navigation and routing working

### Mock Data Notice
The application currently displays **mock/sample data** for demonstration. To connect real data:

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Update API URL in `.env`:
   ```
   VITE_API_BASE_URL=http://your-backend-url/api
   ```

3. Implement backend endpoints matching `src/api/index.ts`

## 🛠️ Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

## 🔧 Troubleshooting

### Port 5173 Already in Use
Vite will automatically use the next available port (5174, 5175, etc.)

### Module Not Found
Make sure you ran `npm install` successfully

### Permission Errors
Run the fix command from Step 1 above

### Still Having Issues?
See **SETUP.md** for detailed troubleshooting

## 📚 Documentation

- **README.md** - Complete documentation
- **SETUP.md** - Detailed setup instructions
- **PROJECT_OVERVIEW.md** - Architecture and features
- **QUICK_START.md** - This file

## ✨ What's Working

- ✅ Full responsive UI
- ✅ All navigation routes
- ✅ Interactive charts
- ✅ Form inputs and validation
- ✅ State management
- ✅ API client ready for backend
- ✅ TypeScript type safety
- ✅ Professional styling

## 🎯 Next Steps

1. ✅ Get the app running (you're here!)
2. 🔄 Connect to backend API
3. 🔄 Replace mock data with real data
4. 🔄 Add authentication
5. 🔄 Deploy to production

---

**Need Help?** Check the other documentation files or contact the development team.
