/**
 * ARB MANAGEMENT - BACKEND LOGIC
 * Security & Data Integrity Core
 */

// --- CONFIGURATION ---
const SCRIPT_PROP = PropertiesService.getScriptProperties();
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // <--- REPLACE THIS WITH YOUR SHEET ID

// --- MAIN ENTRY POINTS ---

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e || !e.postData) throw new Error("No data received");
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload;
    
    let result = {};

    switch (action) {
      // --- AUTH ---
      case 'login':
        result = handleLogin(payload);
        break;
      case 'adminLogin':
        result = handleAdminLogin(payload);
        break;
      case 'updateAdminCredentials':
        result = updateAdminCredentials(payload);
        break;

      // --- PUBLIC STORE FRONT ---
      case 'createOrder':
        result = createOrder(payload);
        break;
      case 'checkOrderStatus':
        result = checkOrderStatus(payload);
        break;
      case 'getPublicSettings':
        result = getPublicSettings();
        break;

      // --- ADMIN CORE ---
      case 'adminGenerateToken':
        verifyAdminSession(payload.adminSessionToken);
        result = generateToken(payload);
        break;
      case 'adminGetTokens':
        verifyAdminSession(payload.adminSessionToken);
        result = getAllTokens();
        break;
      case 'adminResetDevice':
        verifyAdminSession(payload.adminSessionToken);
        result = resetDeviceLock(payload.targetToken);
        break;
      
      // --- ADMIN ORDERS & SETTINGS ---
      case 'adminGetOrders':
        verifyAdminSession(payload.adminSessionToken);
        result = getOrders();
        break;
      case 'adminProcessOrder':
        verifyAdminSession(payload.adminSessionToken);
        result = processOrder(payload);
        break;
      case 'adminGetSettings':
        verifyAdminSession(payload.adminSessionToken);
        result = getSettings();
        break;
      case 'adminSaveSettings':
        verifyAdminSession(payload.adminSessionToken);
        result = saveSettings(payload);
        break;

      // --- POS OPS ---
      case 'getStoreData':
        verifyToken(payload.token, payload.deviceId);
        result = getStoreData(payload.token);
        break;
      case 'manageProduct':
        verifyToken(payload.token, payload.deviceId);
        result = manageProduct(payload);
        break;
      case 'processTransaction':
        verifyToken(payload.token, payload.deviceId);
        result = processTransaction(payload);
        break;
      case 'getStoreHistory':
        verifyToken(payload.token, payload.deviceId);
        result = getStoreHistory(payload.token);
        break;
      case 'searchCustomer':
        verifyToken(payload.token, payload.deviceId);
        result = searchCustomer(payload.query);
        break;
      case 'processDebtPayment':
        verifyToken(payload.token, payload.deviceId);
        result = processDebtPayment(payload);
        break;

      default:
        throw new Error("Unknown action: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- AUTHENTICATION & SECURITY ---

function handleLogin(payload) {
  const { token, deviceId } = payload;
  const sheet = getSheet('Tokens');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === token);
  
  if (rowIndex === -1) throw new Error("Invalid Token");
  
  const row = data[rowIndex];
  const expiryDate = new Date(row[3]);
  const isActive = row[4];
  const storedDeviceId = row[5];
  const now = new Date();
  
  if (!isActive) throw new Error("Token is inactive");
  if (now > expiryDate) throw new Error("Token has expired");
  
  if (storedDeviceId === "" || storedDeviceId === null) {
    sheet.getRange(rowIndex + 1, 6).setValue(deviceId);
  } else if (storedDeviceId !== deviceId) {
    throw new Error("Access Denied: Token is locked to another device.");
  }
  
  return { storeName: row[1], token: token, deviceId: deviceId, expiry: row[3] };
}

function verifyToken(token, deviceId) {
  const sheet = getSheet('Tokens');
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === token);
  if (!row) throw new Error("Invalid Token");
  if (row[5] !== deviceId) throw new Error("Security Alert: Device Mismatch");
  if (!row[4]) throw new Error("Token Inactive");
  return true;
}

// --- ADMIN AUTH ---

function handleAdminLogin(payload) {
  const { username, password } = payload;
  const sheet = getSheet('AdminUsers');
  if (sheet.getLastRow() <= 1) sheet.appendRow(['admin', 'admin123']);

  const data = sheet.getDataRange().getValues();
  const adminUser = data.slice(1).find(r => r[0] == username && r[1] == password);

  if (!adminUser) throw new Error("Invalid Admin Username or Password");
  return { token: 'ADMIN_SESSION_AUTHORIZED', username: adminUser[0] };
}

function verifyAdminSession(token) {
  if (token !== 'ADMIN_SESSION_AUTHORIZED') throw new Error("Unauthorized Admin Action");
  return true;
}

function updateAdminCredentials(payload) {
  verifyAdminSession(payload.adminSessionToken);
  const { newUsername, newPassword } = payload;
  if (!newUsername || !newPassword) throw new Error("Invalid credentials");

  const sheet = getSheet('AdminUsers');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  sheet.appendRow([newUsername, newPassword]);
  return { message: "Updated" };
}

// --- PUBLIC STORE & ORDERS ---

function getPublicSettings() {
  const settings = getSettingsMap();
  return { paymentInfo: settings['PAYMENT_INFO'] || 'Contact Admin' };
}

function createOrder(payload) {
  const { storeName, whatsapp, plan } = payload;
  if(!storeName || !whatsapp || !plan) throw new Error("Missing fields");

  const orderId = Utilities.getUuid().split('-')[0].toUpperCase();
  const sheet = getSheet('Orders');
  const date = new Date();
  
  // Headers: [OrderId, Date, StoreName, WhatsApp, Plan, Status, GeneratedToken]
  sheet.appendRow([orderId, date, storeName, whatsapp, plan, 'PENDING', '']);

  // WEBHOOK TRIGGER
  const settings = getSettingsMap();
  const webhookUrl = settings['WEBHOOK_URL'];
  
  if (webhookUrl) {
    try {
      const message = {
        event: "NEW_ORDER",
        orderId: orderId,
        store: storeName,
        whatsapp: whatsapp,
        plan: plan,
        time: date.toString()
      };
      
      UrlFetchApp.fetch(webhookUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(message)
      });
    } catch (e) {
      Logger.log("Webhook failed: " + e.toString());
    }
  }

  return { orderId, message: "Order placed successfully" };
}

function checkOrderStatus(payload) {
  const { query } = payload; // Order ID or WhatsApp
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  
  // Skip header
  const rows = data.slice(1);
  const order = rows.find(r => r[0] == query || r[3] == query); 

  if (!order) throw new Error("Order not found");

  return {
    orderId: order[0],
    storeName: order[2],
    status: order[5],
    token: order[6] 
  };
}

// --- ADMIN ORDER MANAGEMENT ---

function getOrders() {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  return data.slice(1).reverse().map(r => ({
    orderId: r[0],
    date: r[1],
    storeName: r[2],
    whatsapp: r[3],
    plan: r[4],
    status: r[5],
    generatedToken: r[6]
  }));
}

function processOrder(payload) {
  const { orderId, action } = payload; 
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  
  const rowIndex = data.findIndex(r => r[0] == orderId);
  if (rowIndex === -1) throw new Error("Order not found");

  const row = data[rowIndex];
  const plan = row[4];
  const storeName = row[2];

  if (action === 'REJECT') {
    sheet.getRange(rowIndex + 1, 6).setValue('REJECTED');
    return { status: 'REJECTED' };
  }

  if (action === 'APPROVE') {
    const tokenResult = generateToken({ storeName, duration: plan });
    const newToken = tokenResult.token;

    sheet.getRange(rowIndex + 1, 6).setValue('APPROVED');
    sheet.getRange(rowIndex + 1, 7).setValue(newToken);

    return { status: 'APPROVED', token: newToken };
  }
}

// --- ADMIN SETTINGS ---

function getSettings() {
  const map = getSettingsMap();
  return {
    webhookUrl: map['WEBHOOK_URL'] || '',
    paymentInfo: map['PAYMENT_INFO'] || ''
  };
}

function saveSettings(payload) {
  const { webhookUrl, paymentInfo } = payload;
  const sheet = getSheet('Settings');
  if(sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
  sheet.appendRow(['WEBHOOK_URL', webhookUrl]);
  sheet.appendRow(['PAYMENT_INFO', paymentInfo]);
  return { message: "Saved" };
}

function getSettingsMap() {
  const sheet = getSheet('Settings');
  const data = sheet.getDataRange().getValues();
  const map = {};
  data.slice(1).forEach(r => {
    if(r[0]) map[r[0]] = r[1];
  });
  return map;
}

// --- TOKEN LOGIC ---

function generateToken(payload) {
  const { storeName, duration } = payload;
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tokenPart = '';
  for(let i=0; i<8; i++) tokenPart += chars.charAt(Math.floor(Math.random() * chars.length));
  const token = `ARB-${tokenPart.substring(0,4)}-${tokenPart.substring(4)}`;
  
  const now = new Date();
  let expiry = new Date();
  
  if (duration === '1m') expiry.setMonth(now.getMonth() + 1);
  else if (duration === '6m') expiry.setMonth(now.getMonth() + 6);
  else if (duration === '1y') expiry.setFullYear(now.getFullYear() + 1);
  else expiry.setMonth(now.getMonth() + 1); 
  
  const sheet = getSheet('Tokens');
  sheet.appendRow([token, storeName, duration, expiry, true, ""]);
  
  return { token, expiry };
}

function getAllTokens() {
  const sheet = getSheet('Tokens');
  const data = sheet.getDataRange().getValues();
  return data.slice(1).map(r => ({
    token: r[0],
    storeName: r[1],
    expiry: r[3],
    isActive: r[4],
    deviceId: r[5]
  }));
}

function resetDeviceLock(targetToken) {
  const sheet = getSheet('Tokens');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] === targetToken);
  
  if (rowIndex === -1) throw new Error("Token not found");
  
  sheet.getRange(rowIndex + 1, 6).setValue("");
  return "Device lock reset successfully";
}

// --- POS & TX LOGIC ---

function getStoreData(token) {
  const pSheet = getSheet('Products');
  const pData = pSheet.getDataRange().getValues();
  
  // Filter products by Token? 
  // No, current architecture assumes 1 Sheet = 1 Store OR shared DB.
  // To support multiple stores in one sheet, we should add 'OwnerToken' column to products.
  // For mass production simplicity in v1, we assume the sheet belongs to the store owner or they share common products.
  // *UPDATE*: To make it "Mass Production" ready within one sheet, let's filter by a new 'Owner' column if needed.
  // However, based on the README, each user copies the script. So the sheet is private to them. 
  // We will assume 1 Deployment = 1 Store.
  
  const products = pData.slice(1).map(r => ({
    id: r[0],
    name: r[1],
    price: r[2],
    stock: r[3],
    category: r[4]
  }));
  
  return { products };
}

function manageProduct(payload) {
  const { type, product } = payload; // type: 'ADD', 'UPDATE', 'DELETE'
  const sheet = getSheet('Products');
  const data = sheet.getDataRange().getValues();
  
  if (type === 'ADD') {
    const newId = Utilities.getUuid();
    sheet.appendRow([newId, product.name, product.price, product.stock, product.category]);
    return { message: "Product Added", id: newId };
  } 
  
  const rowIndex = data.findIndex(r => r[0] === product.id);
  if (rowIndex === -1) throw new Error("Product not found");
  
  if (type === 'DELETE') {
    sheet.deleteRow(rowIndex + 1);
    return { message: "Product Deleted" };
  }
  
  if (type === 'UPDATE') {
    // ID, Name, Price, Stock, Category
    const range = sheet.getRange(rowIndex + 1, 1, 1, 5);
    range.setValues([[product.id, product.name, product.price, product.stock, product.category]]);
    return { message: "Product Updated" };
  }
}

function processTransaction(payload) {
  const { cart, paymentType, customerName, total } = payload;
  const transId = Utilities.getUuid().split('-')[0].toUpperCase();
  const date = new Date();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  const pSheet = getSheet('Products');
  const pData = pSheet.getDataRange().getValues();
  
  cart.forEach(item => {
    const rowIdx = pData.findIndex(r => r[0] == item.id);
    if (rowIdx > 0) {
      const currentStock = Number(pData[rowIdx][3]);
      pSheet.getRange(rowIdx + 1, 4).setValue(currentStock - item.qty);
    }
  });
  
  const tSheet = getSheet('Transactions');
  // Columns: [ID, Date, Type, Total, Customer, ItemsJSON]
  const itemsSummary = JSON.stringify(cart.map(c => ({n: c.name, q: c.qty, p: c.price})));
  tSheet.appendRow([transId, dateStr, paymentType, total, customerName || "General", itemsSummary]);
  
  if (paymentType === 'DEBT') {
    if (!customerName) throw new Error("Customer Name is required for Debt");
    const cSheet = getSheet('Customers');
    const cData = cSheet.getDataRange().getValues();
    
    let custRowIdx = -1;
    for (let i = 1; i < cData.length; i++) {
      if (cData[i][1] && cData[i][1].toString().toLowerCase().trim() === customerName.toLowerCase().trim()) {
        custRowIdx = i;
        break;
      }
    }
    
    let customerId;
    if (custRowIdx === -1) {
      customerId = Utilities.getUuid();
      cSheet.appendRow([customerId, customerName.trim(), total, ""]);
    } else {
      customerId = cData[custRowIdx][0];
      const currentDebt = Number(cData[custRowIdx][2]) || 0;
      cSheet.getRange(custRowIdx + 1, 3).setValue(currentDebt + total);
    }
    const dSheet = getSheet('DebtLogs');
    dSheet.appendRow([dateStr, customerId, customerName, "DEBT_INCREASE", total, transId]);
  }
  return { transactionId: transId, date: dateStr };
}

function getStoreHistory(token) {
  const sheet = getSheet('Transactions');
  const data = sheet.getDataRange().getValues();
  // Return last 100 transactions
  const rows = data.slice(1).reverse().slice(0, 100);
  
  return rows.map(r => ({
    id: r[0],
    date: r[1],
    type: r[2],
    total: r[3],
    customer: r[4],
    items: r[5] ? JSON.parse(r[5]) : []
  }));
}

function searchCustomer(query) {
  const sheet = getSheet('Customers');
  const data = sheet.getDataRange().getValues();
  return data.slice(1)
    .filter(r => r[1].toLowerCase().includes(query.toLowerCase()))
    .map(r => ({ id: r[0], name: r[1], debt: r[2], phone: r[3] }));
}

function processDebtPayment(payload) {
  const { customerId, amount } = payload;
  const cSheet = getSheet('Customers');
  const cData = cSheet.getDataRange().getValues();
  
  const rowIdx = cData.findIndex(r => r[0] === customerId);
  if (rowIdx === -1) throw new Error("Customer not found");
  
  const currentDebt = Number(cData[rowIdx][2]);
  const newDebt = currentDebt - amount;
  cSheet.getRange(rowIdx + 1, 3).setValue(newDebt < 0 ? 0 : newDebt);
  
  const dSheet = getSheet('DebtLogs');
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  dSheet.appendRow([dateStr, customerId, cData[rowIdx][1], "DEBT_PAYMENT", amount, "MANUAL_PAYMENT"]);
  return { newBalance: newDebt };
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if(name === 'Tokens') sheet.appendRow(['Token', 'StoreName', 'Duration', 'Expiry', 'IsActive', 'DeviceID']);
    if(name === 'Customers') sheet.appendRow(['ID', 'Name', 'DebtBalance', 'Phone']);
    if(name === 'Products') sheet.appendRow(['ID', 'Name', 'Price', 'Stock', 'Category']);
    if(name === 'Transactions') sheet.appendRow(['ID', 'Date', 'Type', 'Total', 'Customer', 'ItemsJSON']);
    if(name === 'DebtLogs') sheet.appendRow(['Date', 'CustID', 'Name', 'Type', 'Amount', 'Ref']);
    if(name === 'AdminUsers') sheet.appendRow(['Username', 'Password']);
    if(name === 'Orders') sheet.appendRow(['OrderId', 'Date', 'StoreName', 'WhatsApp', 'Plan', 'Status', 'GeneratedToken']);
    if(name === 'Settings') sheet.appendRow(['Key', 'Value']);
  }
  return sheet;
}