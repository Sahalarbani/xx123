# ARB MANAGEMENT POS System 🛡️

**ARB Management** is a secure, cloud-based Point of Sale (POS) system designed for retail management. It features device locking security, debt management, subscription handling, and a Telegram webhook integration for order notifications.

Built with **React (Frontend)** and **Google Apps Script + Google Sheets (Backend)**.

---

## 🚀 Key Features

*   **🔒 Device Locking:** Tokens are locked to a specific browser/device ID upon first login. Stolen tokens cannot be used elsewhere.
*   **☁️ Serverless Database:** Uses Google Sheets as a free, real-time database.
*   **🛒 Point of Sale:** Fast transaction processing, stock management, and cart handling.
*   **📦 Inventory Control:** Add, edit, and delete products directly from the app.
*   **📜 Transaction History:** View past sales records and reprint receipts.
*   **📝 Debt (Hutang) Manager:** Track customer debts and process partial payments.
*   **🔑 Subscription System:** Users can request activation keys via the UI.
*   **🤖 Automation:** Webhook support to send order notifications to Telegram/Discord.

---

## 🛠️ Installation & Deployment Guide

### Part 1: Backend Setup (Google Sheets)

1.  **Create a Google Sheet:**
    *   Go to [sheets.new](https://sheets.new) and create a new spreadsheet.
    *   Name it `ARB Database` (or anything you like).
    *   **Copy the Spreadsheet ID** from the URL. (It is the long string between `/d/` and `/edit`).

2.  **Setup Google Apps Script:**
    *   In the Google Sheet, go to **Extensions** > **Apps Script**.
    *   Rename the project to `ARB Backend`.
    *   Clear the default code and paste the content of **`backend/Code.js`** from this project.

3.  **Configure Script:**
    *   In the script editor, find line 8: `const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';`
    *   Replace `'YOUR_GOOGLE_SHEET_ID_HERE'` with the ID you copied in Step 1.

4.  **Deploy as Web App:**
    *   Click the blue **Deploy** button (top right) > **New deployment**.
    *   **Select type:** Web app.
    *   **Description:** `v1`.
    *   **Execute as:** `Me (your_email@gmail.com)`.
    *   **Who has access:** `Anyone`. (**Crucial:** Must be "Anyone" for the app to work).
    *   Click **Deploy**.
    *   **Copy the Web App URL** (ends in `/exec`).

---

### Part 2: Database Setup (Automatic)

You do **not** need to create the tables manually. The system is smart!

1.  **First Run:** Simply log in to the app (Admin or User) or try to place an order.
2.  **Auto-Creation:** The script checks if the sheets exist. If they don't, it automatically creates the Tabs and Header Rows for you.

#### Manual Reference (Optional)
If you prefer to create them manually, create these Tabs with Row 1 as headers:

| Tab Name | Column A | Column B | Column C | Column D | Column E | Column F | Column G |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tokens** | Token | StoreName | Duration | Expiry | IsActive | DeviceID | |
| **Products** | ID | Name | Price | Stock | Category | | |
| **Customers** | ID | Name | DebtBalance | Phone | | | |
| **Transactions** | ID | Date | Type | Total | Customer | | |
| **DebtLogs** | Date | CustID | Name | Type | Amount | Ref | |
| **AdminUsers** | Username | Password | | | | | |
| **Orders** | OrderId | Date | StoreName | WhatsApp | Plan | Status | GeneratedToken |
| **Settings** | Key | Value | | | | | |

---

### Part 3: Frontend Setup

1.  **Configure API Connection:**
    *   Open the file `services/api.ts` in your source code.
    *   Find the line: `const API_URL = '...';`
    *   Replace the URL with the **Web App URL** you obtained in Part 1.

2.  **Hosting the Website:**
    *   You can host the frontend files (`index.html`, `index.tsx`, etc.) on any static hosting provider.
    *   **Recommended:** GitHub Pages, Vercel, Netlify, or Firebase Hosting.
    *   Since this app uses ES Modules and CDNs (no build step required), you can technically just open `index.html` locally, but for production, use a host.

---

## 📖 User Guide

### 👨‍💼 Admin Panel (Owner)

1.  **Login:**
    *   On the login screen, toggle to **"Admin Login"**.
    *   **Default Username:** `admin`
    *   **Default Password:** `admin123`
    *   *Note: Change these immediately in the "Settings" tab after logging in.*

2.  **Generating Tokens:**
    *   Go to the **Tokens** tab.
    *   Enter a Store Name and Duration.
    *   Click **Generate**. Give this token to your client.

3.  **Managing Orders:**
    *   Go to the **Orders** tab.
    *   You will see requests from users who used the "Buy Token" feature.
    *   Click **Verify (✓)** to automatically generate a token and approve the order.

4.  **Webhook Setup (Telegram):**
    *   Go to the **Settings** tab.
    *   Paste your Webhook URL (e.g., from Make.com or a Telegram Bot API).
    *   Event sent: `NEW_ORDER`.

### 🏪 Store Owner (Client)

1.  **Buying a Token:**
    *   Click "Buy Token / Subscribe" on the login screen.
    *   Select a plan and fill in details.
    *   Transfer payment to the bank account shown.

2.  **Checking Status:**
    *   Click "Check Order Status".
    *   Enter your Order ID or WhatsApp.
    *   If approved by Admin, your **Activation Token** will appear there.

3.  **Login & Setup:**
    *   Enter the Token to log in. The device will be locked to this token.
    *   **Inventory:** Go to the "Inventory" tab to add your products, set prices, and manage stock.

4.  **Selling:**
    *   Use the "Cashier" tab to select products.
    *   Checkout via **Cash** or **Debt**.
    *   Receipts can be printed immediately.

5.  **History & Debt:**
    *   **History:** View past transactions and reprint receipts.
    *   **Debt Manager:** Search for customers and record debt payments.

---

## ❓ Troubleshooting

**Q: The screen is white / preview not loading.**
A: Ensure your internet is active (it loads React from CDN). If hosting, ensure your server supports `.tsx` or pre-compile it. *Note: The current `index.html` is set up for browser-native ES module compilation via `esm.sh`.*

**Q: "ScriptError: Authorization is required"**
A: You (the owner) must run the script once manually in the editor or redeploy. Ensure "Who has access" is set to "Anyone".

**Q: Login fails with "Device Mismatch".**
A: The token is locked to another browser. Log in as Admin, find the token, and click **Reset**.

---

**© 2025 ARB Security Systems**