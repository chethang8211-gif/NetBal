# NetBal — Smart Personal Finance & Receivables Engine

A modern, offline-first personal finance web application built for freelancers and multi-account holders.

Designed to track liquid bank accounts (**Slice**, **SBI**, **Kotak**) alongside **pending freelance receivables** and **personal loans** with real-time net worth calculation, natural-language quick entry, automated 1-click settlement, investment tracking, monthly expense budgeting, and multi-device cloud synchronization.

---

## 🌟 Key Features & Requirements Matrix

### 1. 3-Tier Balance Architecture
- **Total Net Balance (NetBal)**:
  $$\text{NetBal} = \text{Current Cash Available} + \text{Pending Receivables}$$
- **Current Cash Available**: Exact real-time liquid balance ready to use across your bank accounts (Slice, SBI, Kotak).
- **Need to Receive**: Pending receivables from freelance clients and personal loans awaiting settlement.
- **Account Balance Formula**:
  $$\text{Account Balance} = \text{Starting Balance} + \text{Received} - \text{Spent} - \text{Invested} + \text{Transfers In} - \text{Transfers Out}$$

### 2. Transaction Types
- **Spent**: Decreases the selected account and overall cash balance.
- **Received**: Increases the selected account and overall cash balance.
- **Work / Client Due**: Tracks pending freelance project payments. **No money is deducted from bank accounts** upfront. Adds to "Need to Receive" and "NetBal". Clicking **"Collect"** automatically deposits the money into your chosen bank.
- **People Owe Me (Lent)**: Deducts money from the paying account today and tracks repayment. Clicking **"Settle"** deposits repayment back into your account.
- **Invested**: Decreases available account balance and records the contribution separately in your investment portfolio.
- **Transfer**: Moves funds between accounts (`From Account` $\rightarrow$ `To Account`). Transferring to the same account is prevented.

### 3. Natural-Language Quick Entry
Type natural sentences in the **Quick Entry** box:
- `spent 250 slice food lunch`
- `received 20000 sbi salary`
- `transfer 5000 sbi to slice`
- `invested 1000 slice mutual fund monthly sip`
- `spent 1500 kotak shopping new shoes`

*Parsed transactions always open in a confirmation card for verification before saving.*

### 4. Interactive Dashboard & Analytics
- **Total Available Balance** prominently displayed in Indian currency format (`₹en-IN`).
- Individual account cards showing live available balances and starting balances.
- **Today's Overview** & **This Month's Overview** (Spent, Received, Invested, Transfers).
- **Monthly Budget** progress bar with threshold alert colors (Green $\rightarrow$ Yellow $\rightarrow$ Red).
- **Clean Interactive Charts**:
  - Monthly spending by category (Donut chart)
  - Balance distribution across accounts (Donut chart)
  - Monthly Received / Spent / Invested cashflow trends (Bar chart)
- Recent activity list with one-click Edit and Delete.

### 5. Transaction History & Filtering
- Search across notes, categories, accounts, and transaction types.
- Filters:
  - Account (`All`, `Slice`, `SBI`, `Kotak`, etc.)
  - Type (`All`, `Spent`, `Received`, `Invested`, `Transfer`)
  - Category (`All`, or specific category)
  - Date Presets: `Today`, `Yesterday`, `This Week`, `This Month`, `Last Month`, `Custom Date Range`
- Full editing and deletion with confirmation dialog.

### 6. Investment Tracking
- Total invested all-time vs. this month's contributions.
- Category breakdown: Mutual Fund, Stocks, SIP, Fixed Deposit, Gold, etc.
- Manual portfolio valuation tracking with calculated Profit/Loss (₹ and %).

### 7. Periodic Reports
- Daily, Weekly, Monthly, and Yearly reports.
- Period navigator (navigate previous/next intervals or jump to present).
- Category breakdown tables with percentage share, transaction count, and visual progress bars.
- Net savings & savings rate calculation.

### 8. Data Persistence, Backup & Cloud Sync
- **Firebase Firestore & Authentication**: Real-time cross-device sync between your phone and laptop.
- **Local Mode Fallback**: Works immediately out of the box with `localStorage` even before configuring Firebase keys.
- **Export & Import**:
  - Export CSV spreadsheet
  - Export complete JSON backup
  - Restore backup from JSON with validation

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone or navigate to the tracker directory
cd tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit the app in your browser at `http://localhost:5173`.

---

## ☁️ Firebase Cloud Sync Setup (Optional & Recommended)

To synchronize your transactions across phones, tablets, and computers:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Authentication**, enable **Email/Password** sign-in.
3. In **Firestore Database**, create a database (production mode).
4. Deploy the included Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   *(Or copy the contents of `firestore.rules` into your Firebase Console Firestore Rules tab).*
5. In your Firebase project settings, click **Add Web App** and copy the configuration object.
6. Open the app, click the **Cloud icon** in the top navigation bar, and paste your config JSON.
7. Click **Save & Connect Firebase**. Create your account and all data will sync in real time!

---

## 📱 Mobile & Responsive Usage

- **Android & iOS**: Open the web app on Chrome or Safari. Use **Add to Home Screen** for a full-screen app experience.
- Large tap targets (min 44px) and bottom navigation bar on mobile devices.

---

## 🔒 Security

- Sensitive financial data is never exposed publicly.
- When connected to Firebase, Firestore rules enforce that each user can only read and write documents inside their own `users/{userId}/*` path.
