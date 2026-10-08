# EMCOOP Central Financial Control Center

A secure central backend dashboard for monitoring and controlling money moving through EMCOOP's Community → Branch → Zone → Apex structure.

## 🎯 Purpose

The Financial Control Center serves as the central command for:
- Monitoring deposits, withdrawals and transfers across all organizational levels
- Enforcing mandatory two-signatory approval for outgoing transactions
- Account freeze and transaction restrictions
- Complete immutable audit trail
- Role-based access control with least-privilege permissions

## 🏗️ Architecture

Built with modern web technologies:
- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router v7
- **State Management**: Zustand
- **UI Framework**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## 📋 Features

### Core Modules

1. **Dashboard** - Central financial overview with KPIs and money flow monitoring
2. **Transactions** - All deposits, withdrawals and transfers with advanced filtering
3. **Approvals** - Two-signatory approval workflow management
4. **Accounts** - Account search, balances, status and restrictions
5. **Transfers** - Create and track outgoing transfers
6. **Monitoring** - Exception tracking and unusual activity alerts
7. **Reports** - Financial summaries and exports
8. **Audit Logs** - Immutable activity trail

### Security Features

- ✅ Mandatory two-signatory approval for outgoing transactions
- ✅ Maker-checker separation (initiator cannot approve own transaction)
- ✅ One person cannot provide both approvals
- ✅ Account freeze functionality
- ✅ Transaction restrictions
- ✅ Complete audit trail
- ✅ Role-based access control (RBAC)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd emcoop-financial-control
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to set your API base URL

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Build output will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── api/                    # API client and endpoints
│   ├── client.ts          # Axios instance with interceptors
│   └── index.ts           # API methods
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   └── layout/            # Layout components (Sidebar, Header)
├── pages/                 # Page components
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions (formatters, helpers)
├── App.tsx               # Main app component with routing
└── main.tsx              # Application entry point
```

## 🔐 Transaction Approval State Machine

Every outgoing withdrawal or transfer follows this workflow:

1. **DRAFT** - Transaction being prepared
2. **PENDING_APPROVAL** - Submitted, waiting for approvals
3. **APPROVED_1** - First signatory approved
4. **APPROVED_2** - Second independent signatory approved
5. **QUEUED_FOR_EXECUTION** - Both approvals received
6. **PROCESSING** - Sent to bank/payment provider
7. **COMPLETED** - Provider confirms success
8. **FAILED / REJECTED / CANCELLED** - Transaction did not complete

### Hard Controls

- ❌ One person cannot provide both approvals
- ❌ Transaction initiator cannot approve their own transaction
- ❌ Changing transaction details after approval invalidates previous approvals
- ❌ No API endpoint may execute transactions without valid two-approval authorization

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Super Admin** | Global visibility, account controls, user management (cannot bypass two-signatory) |
| **Financial Controller** | Monitor, investigate, initiate transfers, manage operational controls |
| **Signatory 1** | Approve/reject transactions within authorized limits |
| **Signatory 2** | Independent second approval within authorized limits |
| **Auditor** | Read-only access to transactions, reports and audit logs |
| **Zone Admin** | View/manage only authorized zone scope |
| **Branch Admin** | View/manage only authorized branch scope |
| **Community Admin** | View/manage only authorized community scope |

## 🎨 Design Principles

The interface is designed as a **secure financial operations center**:
- Clear visual hierarchy
- Restrained professional colors
- Strong status indicators
- Confirmation dialogs for irreversible actions
- Persistent visibility of approval trail

## 📊 Mock Data

The dashboard currently uses mock data for demonstration. Connect to your backend API by:

1. Updating `VITE_API_BASE_URL` in `.env`
2. Implementing backend endpoints matching the API client structure
3. Replacing mock data in pages with real API calls

## 🔧 API Integration

Expected backend endpoints (defined in `src/api/index.ts`):

- `GET /dashboard/stats` - Dashboard KPIs
- `GET /dashboard/money-flow` - Money flow chart data
- `GET /transactions` - Transaction list with filters
- `POST /transactions` - Create transaction
- `POST /transactions/:id/approve` - Approve transaction
- `POST /accounts/:id/freeze` - Freeze account
- `POST /transfers` - Initiate transfer
- `GET /audit-logs` - Audit trail

See `src/api/index.ts` for complete API specification.

## 🛡️ Security Recommendations

1. **Authentication**: Implement JWT or session-based auth with MFA
2. **HTTPS**: Always use HTTPS in production
3. **CSP**: Implement Content Security Policy headers
4. **Rate Limiting**: Protect API endpoints from brute force
5. **Input Validation**: Validate all inputs server-side
6. **Audit Logging**: Log all sensitive operations
7. **Secrets Management**: Use environment variables, never commit secrets

## 📝 Development Notes

### State Management

- Authentication state is persisted using Zustand with localStorage
- Page-level state uses React hooks
- Global state can be added to Zustand stores as needed

### Styling

- Tailwind CSS utility-first approach
- Custom colors defined in `tailwind.config.js`
- Responsive design with mobile-first approach

### Type Safety

- Full TypeScript coverage
- Comprehensive type definitions in `src/types/`
- API response types match backend schema

## 🚦 Roadmap

**Phase 1** (Current)
- ✅ Dashboard UI
- ✅ Transaction monitoring
- ✅ Approval workflow UI
- ✅ Account management UI

**Phase 2**
- 🔄 Backend API integration
- 🔄 Real-time data updates
- 🔄 Advanced filtering
- 🔄 Export functionality

**Phase 3**
- 📋 Account freeze/restriction implementation
- 📋 Transfer execution
- 📋 Reconciliation
- 📋 Reports generation

**Phase 4**
- 📋 Security hardening
- 📋 Performance optimization
- 📋 Mobile app support
- 📋 Production deployment

## 📄 License

Proprietary - EMCOOP Financial Control System

## 👨‍💻 Developer

Built for EMCOOP cooperative financial management system.

---

**Version**: 1.0.0  
**Last Updated**: October 6, 2026
# eretide_control
