# Authentication & API Integration Guide

## ✅ What's Been Added

### 1. Login Page (`/login`)
A professional sign-in page with:
- Email and password fields
- Show/hide password toggle
- Remember me checkbox
- Loading states
- Error handling
- Responsive design
- Secure authentication flow

### 2. Protected Routes
All dashboard routes now require authentication:
- Automatic redirect to `/login` if not authenticated
- Token-based session management
- Persistent auth state using Zustand

### 3. Updated Transactions Page
Now fetches real data from your API:
- Live transaction loading from backend
- Advanced filtering (type, status, location, date range)
- Search functionality
- Pagination support
- Refresh button
- Export to CSV
- Loading and error states
- Responsive table design

### 4. Logout Functionality
Added to the header:
- Hover on user avatar to see logout option
- Clears auth state and redirects to login

## 🔧 Configuration

### Set Your API Base URL

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:

```env
VITE_API_BASE_URL=http://localhost:3000/api
# Or your production URL:
# VITE_API_BASE_URL=https://api.emcoop.com/api
```

## 🔐 How Authentication Works

### Login Flow

1. User enters email and password
2. POST request to `/auth/login`
3. Backend returns `{ token, user }`
4. Token stored in localStorage
5. User data stored in Zustand state
6. Redirect to `/dashboard`

### Protected Routes

All routes (except `/login`) are wrapped in `<ProtectedRoute>`:
- Checks if user is authenticated
- If not, redirects to `/login`
- If yes, renders the requested page

### Logout Flow

1. User hovers on avatar and clicks "Sign Out"
2. Token removed from localStorage
3. Zustand state cleared
4. Redirect to `/login`

## 📡 API Endpoints Expected

Your backend should implement these endpoints:

### Authentication

```typescript
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, user: User }
```

### Transactions

```typescript
GET /api/transactions
Query Parameters:
  - searchQuery?: string
  - transactionType?: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  - status?: TransactionStatus
  - locationLevel?: 'APEX' | 'ZONE' | 'BRANCH' | 'COMMUNITY'
  - dateFrom?: string (ISO date)
  - dateTo?: string (ISO date)
  - page?: number
  - limit?: number

Response: {
  data: Transaction[],
  total: number
}
```

### Get Single Transaction

```typescript
GET /api/transactions/:id
Response: Transaction
```

## 🎯 Transaction Data Structure

```typescript
interface Transaction {
  id: string;
  reference: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  sourceAccountId?: string;
  sourceAccount?: {
    id: string;
    accountNumber: string;
    ownerName: string;
    // ... other account fields
  };
  destinationAccountId?: string;
  destinationAccount?: { /* same as sourceAccount */ };
  amount: number;
  currency: string;
  purpose: string;
  status: TransactionStatus;
  initiatedBy: string;
  initiator?: User;
  createdAt: string; // ISO date string
  updatedAt: string;
  approvals?: TransactionApproval[];
}
```

## 🚀 Testing Authentication

### Test with Mock Backend

If your backend isn't ready, you can test with a mock:

1. Create a mock API service:

```typescript
// src/api/mockAuth.ts
export const mockAuthApi = {
  login: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@emcoop.com' && password === 'password') {
      return {
        data: {
          token: 'mock-jwt-token-12345',
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@emcoop.com',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            mfaEnabled: false,
            createdAt: new Date().toISOString(),
          }
        }
      };
    }
    
    throw new Error('Invalid credentials');
  }
};
```

2. Update `src/api/index.ts` to use mock (temporarily):

```typescript
// For testing only
import { mockAuthApi } from './mockAuth';
export const authApi = mockAuthApi;
```

### Test Credentials (for mock)
- Email: `admin@emcoop.com`
- Password: `password`

## 🔒 Security Features Implemented

### Frontend Security
✅ Protected routes with authentication check
✅ Token stored in localStorage
✅ Automatic redirect on 401 errors
✅ Password visibility toggle
✅ HTTPS-ready (no hardcoded HTTP)
✅ Input validation
✅ Error handling

### Backend Requirements
Your backend should implement:
- ✅ JWT or session-based authentication
- ✅ Password hashing (bcrypt, argon2)
- ✅ Token expiration
- ✅ Refresh token mechanism
- ✅ MFA support
- ✅ Rate limiting on login endpoint
- ✅ HTTPS in production
- ✅ CORS configuration

## 📊 Transactions Page Features

### Filters
- **Search**: Transaction ID, account number, reference
- **Location Level**: Filter by Apex/Zone/Branch/Community
- **Transaction Type**: Deposit/Withdrawal/Transfer
- **Status**: All transaction statuses
- **Date Range**: From and To dates

### Actions
- **Refresh**: Reload transactions from API
- **Export**: Download as CSV file
- **View**: Click to see transaction details
- **Pagination**: Navigate through pages

### States
- **Loading**: Shows spinner while fetching
- **Error**: Displays error message with retry option
- **Empty**: Shows helpful message when no data
- **Success**: Displays transaction table

## 🎨 UI Elements

### Login Page
- Clean, professional design
- Gradient background (dark slate to emerald)
- Error alerts with icons
- Loading spinner on submit
- Responsive for all screen sizes

### Transactions Page
- Advanced filter panel
- Responsive table layout
- Color-coded transaction types
- Status badges
- Pagination controls
- Export functionality

## 🔄 State Management

### Auth State (Zustand)
```typescript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  setAuth: (user, token) => void,
  clearAuth: () => void
}
```

### Usage in Components
```typescript
import { useAuthStore } from '../store/authStore';

// Get auth state
const { user, isAuthenticated } = useAuthStore();

// Login
const setAuth = useAuthStore(state => state.setAuth);
setAuth(user, token);

// Logout
const clearAuth = useAuthStore(state => state.clearAuth);
clearAuth();
```

## 📝 Next Steps

### 1. Connect Your Backend
Update `.env` with your API URL

### 2. Test Login
Navigate to `/login` and try signing in

### 3. Verify Transactions
Check if transactions load from your API

### 4. Add More Endpoints
Implement remaining API endpoints:
- Dashboard stats
- Approvals
- Accounts
- Transfers
- etc.

## 🐛 Troubleshooting

### Login Not Working
1. Check browser console for errors
2. Verify API URL in `.env`
3. Check network tab for API request
4. Verify backend is running
5. Check CORS configuration

### Transactions Not Loading
1. Check authentication token is present
2. Verify `/api/transactions` endpoint exists
3. Check backend response format matches expected structure
4. Look for errors in browser console

### Protected Routes Not Working
1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Try logging in again

## 📚 Files Modified/Created

### New Files
- ✅ `src/pages/Login.tsx` - Login page
- ✅ `src/components/ProtectedRoute.tsx` - Route protection
- ✅ `AUTHENTICATION.md` - This file

### Modified Files
- ✅ `src/pages/Transactions.tsx` - API integration
- ✅ `src/App.tsx` - Added login route and protected routes
- ✅ `src/components/layout/Header.tsx` - Added logout button
- ✅ `src/store/authStore.ts` - Already existed

## ✨ Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Login Page | ✅ Complete | `/login` |
| Protected Routes | ✅ Complete | All dashboard routes |
| Logout | ✅ Complete | Header dropdown |
| Transaction List | ✅ Complete | `/transactions` |
| Transaction Filters | ✅ Complete | `/transactions` |
| Transaction Search | ✅ Complete | `/transactions` |
| Pagination | ✅ Complete | `/transactions` |
| Export CSV | ✅ Complete | `/transactions` |
| API Client | ✅ Complete | `src/api/` |
| Error Handling | ✅ Complete | All pages |

---

**Version**: 1.1.0  
**Last Updated**: October 6, 2026  
**Status**: Authentication & API Integration Complete ✅
