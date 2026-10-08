# Setup Instructions

## ⚠️ NPM Permission Issue

There's a permission issue with your npm cache. You need to fix this first before installing dependencies.

### Fix NPM Cache Permissions

Run this command in your terminal (you'll need to enter your system password):

```bash
sudo chown -R 501:20 "/Users/johnilizy/.npm"
```

### Alternative: Use a Different Package Manager

If you prefer not to use sudo, you can use **pnpm** or **yarn** instead:

#### Using pnpm (Recommended)
```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Navigate to project
cd /Users/johnilizy/Documents/web/EMCOOP/emcoop-financial-control

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

#### Using yarn
```bash
# Install yarn globally (if not installed)
npm install -g yarn

# Navigate to project
cd /Users/johnilizy/Documents/web/EMCOOP/emcoop-financial-control

# Install dependencies
yarn install

# Run development server
yarn dev
```

## 📦 Installation Steps (After Fixing Permissions)

1. **Fix npm permissions** (see above)

2. **Navigate to project directory**
   ```bash
   cd /Users/johnilizy/Documents/web/EMCOOP/emcoop-financial-control
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:5173`

## 🎉 You're Ready!

The application should now be running. You'll see the Financial Control Center dashboard with:
- KPI cards showing financial statistics
- Money flow charts
- Recent transactions table
- Pending approvals interface

## 🔗 Next Steps

1. **Connect to Backend API**
   - Update `VITE_API_BASE_URL` in `.env` file
   - Implement backend endpoints matching the API specification in `src/api/index.ts`

2. **Customize**
   - Update branding colors in `tailwind.config.js`
   - Modify user roles and permissions
   - Add organization-specific features

3. **Deploy**
   - Build for production: `npm run build`
   - Deploy `dist` folder to your hosting service

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port.

### Module Not Found Errors
Make sure all dependencies are installed:
```bash
npm install
```

### TypeScript Errors
The project is fully typed. If you see TypeScript errors, check:
1. All imports are correct
2. API response types match backend
3. `tsconfig.json` is properly configured

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Recharts Documentation](https://recharts.org)
- [React Router Documentation](https://reactrouter.com)

---

Need help? Check the main README.md for complete documentation.
