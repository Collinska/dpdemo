import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, Package, Warehouse, Receipt, Bike,
  Menu, X, Search, LogOut, Plus, ArrowRight, CheckCircle2, Clock,
  MapPin, TrendingUp, AlertTriangle, Truck, ChevronRight, FileText,
  ArrowLeftRight, ClipboardList, ScrollText, Layers, Trash2, ArrowDownToLine,
  Wallet, ShoppingCart, Minus, BookOpen, Scale, TrendingDown, FileBarChart, HandCoins,
  ShoppingBag, UserCog, Printer, Ban, Pencil, FileCheck, ClipboardCheck, Eye,
  Sparkles, Download, Mail, MessageSquare, BarChart2, Timer, Route
} from "lucide-react";

/* ============================================================
   DP Light — demo build v2
   ERP shell + rider platform + warehouse (indent → transfer → reports).
   All state in-memory. Sandbox only — nothing writes to Fusion.
   ============================================================ */

const C = {
  petrol: "#0F4C5C", petrolDeep: "#0A3A46", petrolSoft: "#15606E",
  canvas: "#F6F7F5", card: "#FFFFFF", line: "#E4E7E4",
  ink: "#1A2B2F", sub: "#5C6B6E",
  amber: "#F4A259", amberDeep: "#E08A3C",
  green: "#2A9D8F", greenDeep: "#218276",
  blue: "#3D7EA6", red: "#C15B4A",
};

const money = (n) => "KSh " + Number(n).toLocaleString("en-KE");
const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
const mins = (a, b) => (a && b) ? Math.round((new Date(b) - new Date(a)) / 60000) : null;
const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/* ---------------- seed data ---------------- */
// Full chart of accounts (mirrors Fusion AccountMaster; nature drives the reports)
const GL = [
  { code: "1010", name: "Cash-In-Hand", group: "Cash-In-Hand", nature: "asset" },
  { code: "1020", name: "M-Pesa Paybill", group: "Bank Accounts", nature: "asset" },
  { code: "1030", name: "Equity Bank", group: "Bank Accounts", nature: "asset" },
  { code: "1040", name: "Sidian Bank", group: "Bank Accounts", nature: "asset" },
  { code: "1200", name: "Sundry Debtors", group: "Current Assets", nature: "asset" },
  { code: "1300", name: "Stock-in-Hand", group: "Current Assets", nature: "asset" },
  { code: "1500", name: "Furniture & Fittings", group: "Fixed Assets", nature: "asset" },
  { code: "2000", name: "Sundry Creditors", group: "Current Liabilities", nature: "liability" },
  { code: "2100", name: "VAT Output (16%)", group: "Current Liabilities", nature: "liability" },
  { code: "2110", name: "VAT Input (16%)", group: "Current Assets", nature: "asset" },
  { code: "3000", name: "Capital Account", group: "Capital Account", nature: "equity" },
  { code: "4000", name: "Sales — Lighting", group: "Sales Accounts", nature: "income" },
  { code: "4010", name: "Sales — Fittings", group: "Sales Accounts", nature: "income" },
  { code: "5000", name: "Purchases", group: "Purchase Accounts", nature: "expense" },
  { code: "6000", name: "Rent", group: "Indirect Expenses", nature: "expense" },
  { code: "6010", name: "Salaries & Wages", group: "Indirect Expenses", nature: "expense" },
  { code: "6020", name: "Electricity", group: "Indirect Expenses", nature: "expense" },
  { code: "6030", name: "Transport & Delivery", group: "Indirect Expenses", nature: "expense" },
];
const acctNature = (code) => GL.find(a => a.code === code)?.nature;
const BANK_ACCTS = ["1010", "1020", "1030", "1040"];

const SUPPLIERS0 = [
  { id: "S-1", name: "Guangzhou Lighting Co", type: "Import", phone: "+86 20 8888 1234" },
  { id: "S-2", name: "Nairobi Electricals Wholesale", type: "Local", phone: "0720 445 662" },
];

const USERS0 = [
  { id: "U-1", name: "Diana P.", email: "diana@dplight.co.ke", role: "Owner / Manager", active: true },
  { id: "U-2", name: "Front Desk 1", email: "pos1@dplight.co.ke", role: "Cashier", active: true },
  { id: "U-3", name: "Store Keeper", email: "store@dplight.co.ke", role: "Storekeeper", active: true },
  { id: "U-4", name: "Dispatch Desk", email: "dispatch@dplight.co.ke", role: "Dispatch", active: true },
];
const ROLES = ["Owner / Manager", "Cashier", "Storekeeper", "Dispatch", "Accountant"];

// Mode of payment → GL account
const MOP = [
  { name: "Cash", acct: "1010" },
  { name: "M-Pesa", acct: "1020" },
  { name: "Equity Bank", acct: "1030" },
  { name: "Sidian Bank", acct: "1040" },
  { name: "Credit Sale", acct: "1200" },
];

const WAREHOUSES = [
  { id: "W-01", name: "Dplight", location: "Main store" },
  { id: "W-02", name: "Kentac Dplight", location: "Branch stock" },
  { id: "W-03", name: "Miriam Kk", location: "Rep-held stock" },
  { id: "W-04", name: "Martin Sd", location: "Rep-held stock" },
];

const PRODUCTS0 = [
  { id: "0021", name: "4ft LED Tube", code: "4Ft Tube", group: "Tubes", unit: "Pcs", price: 140, cost: 120, reorder: 40, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0022", name: "4ft Tube Fitting", code: "4Ft Fitting", group: "Fittings", unit: "Pcs", price: 100, cost: 84, reorder: 30, salesAcct: "4010", purchaseAcct: "5000" },
  { id: "0023", name: "4ft LED Tube — Coloured", code: "4Ft Tube Coloured", group: "Tubes", unit: "Pcs", price: 135, cost: 120, reorder: 20, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0024", name: "LED Strip 2835", code: "2835", group: "LED Strips", unit: "Roll", price: 80, cost: 62, reorder: 50, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0025", name: "LED Strip 5730 — Pink", code: "5730 Pink", group: "LED Strips", unit: "Roll", price: 85, cost: 64, reorder: 20, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0026", name: "LED Strip 5050", code: "5050", group: "LED Strips", unit: "Roll", price: 600, cost: 500, reorder: 15, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0043", name: "36W Flood Fitting", code: "Fd36", group: "Flood Lights", unit: "Pcs", price: 285, cost: 265, reorder: 15, salesAcct: "4010", purchaseAcct: "5000" },
  { id: "0044", name: "18W Flood Fitting", code: "Ff18", group: "Flood Lights", unit: "Pcs", price: 165, cost: 154, reorder: 25, salesAcct: "4010", purchaseAcct: "5000" },
  { id: "0008", name: "Zamba 40W Bulb", code: "Za40", group: "Bulbs", unit: "Pcs", price: 250, cost: 210, reorder: 20, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0009", name: "Zamba 30W Bulb", code: "Za30", group: "Bulbs", unit: "Pcs", price: 190, cost: 172, reorder: 20, salesAcct: "4000", purchaseAcct: "5000" },
  { id: "0001", name: "Downlight ST-860", code: "St-860", group: "Downlights", unit: "Pcs", price: 170, cost: 160, reorder: 30, salesAcct: "4010", purchaseAcct: "5000" },
  { id: "0004", name: "Downlight ST-885", code: "St-885", group: "Downlights", unit: "Pcs", price: 150, cost: 142, reorder: 30, salesAcct: "4010", purchaseAcct: "5000" },
];

// initial stock per product per warehouse
const STOCK0 = {
  "0021": { "W-01": 180, "W-02": 60 }, "0022": { "W-01": 140, "W-02": 46 },
  "0023": { "W-01": 74 }, "0024": { "W-01": 260, "W-02": 60 },
  "0025": { "W-01": 45 }, "0026": { "W-01": 50, "W-03": 12 },
  "0043": { "W-01": 9 }, "0044": { "W-01": 100, "W-02": 28 },
  "0008": { "W-01": 190, "W-04": 20 }, "0009": { "W-01": 14 },
  "0001": { "W-01": 96 }, "0004": { "W-01": 152 },
};

const CUSTOMERS0 = [
  { id: "C-1001", name: "Riverside Electricals", type: "Wholesale", phone: "0722 118 340", email: "", town: "Westlands", pin: "P051234567X", creditLimit: 50000, balance: 12400, controlAcct: "1200", salesAcct: "4000" },
  { id: "C-1002", name: "Gikomba Hardware", type: "Retail", phone: "0733 902 145", email: "", town: "Gikomba", pin: "", creditLimit: 0, balance: 0, controlAcct: "1200", salesAcct: "4000" },
  { id: "C-1003", name: "Kentac Contractors", type: "Wholesale", phone: "0710 556 201", email: "", town: "Industrial Area", pin: "P059876543Y", creditLimit: 150000, balance: 48250, controlAcct: "1200", salesAcct: "4010" },
  { id: "C-1004", name: "Karen Lighting Studio", type: "Retail", phone: "0745 330 887", email: "", town: "Karen", pin: "", creditLimit: 20000, balance: 3100, controlAcct: "1200", salesAcct: "4010" },
  { id: "C-1005", name: "Thika Road Fittings", type: "Wholesale", phone: "0724 447 019", email: "", town: "Thika Road", pin: "P054455667Z", creditLimit: 80000, balance: 21600, controlAcct: "1200", salesAcct: "4000" },
];

const SALES0 = [
  { id: "INV-8841", customer: "Riverside Electricals", items: 6, total: 18450, mode: "M-Pesa", time: "09:12" },
  { id: "INV-8842", customer: "Gikomba Hardware", items: 3, total: 4720, mode: "Cash", time: "09:48" },
  { id: "INV-8843", customer: "Kentac Contractors", items: 22, total: 96300, mode: "Credit Sale", time: "10:31" },
  { id: "INV-8844", customer: "Karen Lighting Studio", items: 4, total: 6180, mode: "Equity", time: "11:05" },
  { id: "INV-8845", customer: "Thika Road Fittings", items: 15, total: 52700, mode: "Sidian Bank", time: "11:52" },
];

const RIDERS = [
  { id: "r1", name: "James Kariuki", phone: "0712 000 001" },
  { id: "r2", name: "Aisha Noor", phone: "0712 000 002" },
  { id: "r3", name: "Peter Otieno", phone: "0712 000 003" },
];

const ORDERS0 = [
  { id: "DEL-1042", customer: "Riverside Electricals", area: "Westlands", items: "20x 4ft LED Tube, 20x Tube Fitting", status: "unassigned", riderId: null, assignedAt: null, pickedAt: null, deliveredAt: null },
  { id: "DEL-1043", customer: "Karen Lighting Studio", area: "Karen", items: "6x 36W Flood Fitting, 4x LED Strip 5050", status: "picked", riderId: "r2", assignedAt: new Date(Date.now() - 32 * 60000).toISOString(), pickedAt: new Date(Date.now() - 18 * 60000).toISOString(), deliveredAt: null },
  { id: "DEL-1044", customer: "Lang'ata Power & Light", area: "Lang'ata", items: "10x Zamba 40W Bulb, 5x Downlight ST-885", status: "delivered", riderId: "r1", assignedAt: new Date(Date.now() - 96 * 60000).toISOString(), pickedAt: new Date(Date.now() - 74 * 60000).toISOString(), deliveredAt: new Date(Date.now() - 41 * 60000).toISOString() },
];

// opening-balance ledger entries so stock ledger isn't empty
const LEDGER0 = Object.entries(STOCK0).flatMap(([pid, byWh]) =>
  Object.entries(byWh).map(([wh, qty]) => ({
    id: uid("LG"), date: new Date(Date.now() - 5 * 864e5).toISOString(),
    productId: pid, warehouseId: wh, type: "Opening", ref: "OPENING",
    qtyIn: qty, qtyOut: 0,
  }))
);

// ---- Seed journal (double-entry). Every entry balances → all reports tie out. ----
const dISO = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();
const splitVAT = (t) => { const net = Math.round(t / 1.16); return { net, vat: t - net }; };
let _jn = 0; const jref = (p) => `${p}-${String(++_jn).padStart(4, "0")}`;

const JOURNAL0 = [
  // Opening balances (last month)
  {
    id: uid("J"), date: dISO(35), type: "Opening", ref: "OB-0001", narration: "Opening balances",
    lines: [
      { acct: "1010", dr: 50000, cr: 0 }, { acct: "1020", dr: 120000, cr: 0 },
      { acct: "1030", dr: 300000, cr: 0 }, { acct: "1040", dr: 40000, cr: 0 },
      { acct: "1200", dr: 12400, cr: 0, customerId: "C-1001" },
      { acct: "1200", dr: 48250, cr: 0, customerId: "C-1003" },
      { acct: "1200", dr: 3100, cr: 0, customerId: "C-1004" },
      { acct: "1200", dr: 21600, cr: 0, customerId: "C-1005" },
      { acct: "1300", dr: 1840000, cr: 0 }, { acct: "1500", dr: 200000, cr: 0 },
      { acct: "2000", dr: 0, cr: 120000, supplierId: "S-1" },
      { acct: "2000", dr: 0, cr: 60000, supplierId: "S-2" },
      { acct: "3000", dr: 0, cr: 2455350 },
    ],
  },
  // Month-to-date sales (aggregate)
  {
    id: uid("J"), date: dISO(12), type: "Sale", ref: "MTD-SALES", narration: "Month-to-date counter sales",
    lines: [
      { acct: "1020", dr: 800000, cr: 0 }, { acct: "1010", dr: 300000, cr: 0 },
      { acct: "1200", dr: 400000, cr: 0, customerId: "C-1003" },
      { acct: "4000", dr: 0, cr: 900000 }, { acct: "4010", dr: 0, cr: 393103 },
      { acct: "2100", dr: 0, cr: 206897 },
    ],
  },
  // Stock purchase on credit
  { id: uid("J"), date: dISO(20), type: "Journal", ref: "JV-0001", narration: "Stock purchase on credit — Guangzhou", lines: [{ acct: "5000", dr: 780000, cr: 0 }, { acct: "2000", dr: 0, cr: 780000, supplierId: "S-1" }] },
  // Operating expenses
  { id: uid("J"), date: dISO(14), type: "Payment", ref: "PMT-0001", narration: "Monthly rent", lines: [{ acct: "6000", dr: 45000, cr: 0 }, { acct: "1030", dr: 0, cr: 45000 }] },
  { id: uid("J"), date: dISO(14), type: "Payment", ref: "PMT-0002", narration: "Salaries & wages", lines: [{ acct: "6010", dr: 80000, cr: 0 }, { acct: "1030", dr: 0, cr: 80000 }] },
  { id: uid("J"), date: dISO(9), type: "Payment", ref: "PMT-0003", narration: "KPLC electricity", lines: [{ acct: "6020", dr: 12000, cr: 0 }, { acct: "1010", dr: 0, cr: 12000 }] },
  { id: uid("J"), date: dISO(6), type: "Payment", ref: "PMT-0004", narration: "Rider fuel & transport", lines: [{ acct: "6030", dr: 8000, cr: 0 }, { acct: "1010", dr: 0, cr: 8000 }] },
];

// ---- Export utilities (CSV → Excel download, PDF via print) ----
const exportCSV = (filename, cols, rows) => {
  const hdr = cols.join(",");
  const body = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([hdr + "\n" + body], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
};
const exportPDF = (title) => {
  // Open a print dialog scoped to the current view — browser "Save as PDF" gives a clean output
  const style = document.createElement("style");
  style.textContent = `@media print { nav, aside, header, .no-print { display: none !important; } main { padding: 0 !important; } }`;
  document.head.appendChild(style);
  document.title = title;
  setTimeout(() => { window.print(); document.head.removeChild(style); document.title = "DP Light — Demo"; }, 100);
};

// ---- Notification simulation (demo shows toast; live build sends real SMS/email) ----
let _toasts = [];
const notify = (msg, type = "info") => {
  // In the demo we just set state; the App renders toasts
  _toasts.push({ id: Date.now(), msg, type });
  if (typeof window.__setToasts === "function") window.__setToasts([..._toasts]);
  setTimeout(() => { _toasts = _toasts.filter(t => t.id !== _toasts[0]?.id); if (typeof window.__setToasts === "function") window.__setToasts([..._toasts]); }, 4000);
};
const notifyAssigned = (rider, customer, area) => {
  notify(`📧 Email sent to ${customer} — rider ${rider} assigned for delivery to ${area}`, "email");
  notify(`📱 SMS sent to director — ${rider} dispatched to ${area}`, "sms");
};
const notifyDelivered = (rider, customer, area) => {
  notify(`📧 Email sent to ${customer} — delivery to ${area} completed by ${rider}`, "email");
  notify(`📱 SMS sent to director — ${area} delivery complete`, "sms");
};

// ---- Export bar component ----
function ExportBar({ title, cols, rows }) {
  return (
    <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 10 }}>
      <button onClick={() => exportCSV(title, cols, rows)} style={{ ...ghostBtn, fontSize: 12, padding: "6px 12px" }}><Download size={14} /> Excel (CSV)</button>
      <button onClick={() => exportPDF(title)} style={{ ...ghostBtn, fontSize: 12, padding: "6px 12px" }}><Download size={14} /> PDF</button>
    </div>
  );
}

const STATUS = {
  unassigned: { label: "Unassigned", color: C.sub, bg: "#EEF0EE" },
  assigned: { label: "Assigned", color: C.amberDeep, bg: "#FCEBD6" },
  picked: { label: "Out for delivery", color: C.blue, bg: "#DCEAF3" },
  delivered: { label: "Delivered", color: C.greenDeep, bg: "#D7EFEA" },
};

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Owner / Manager", "Dispatch"] },
  { key: "customers", label: "Customers", icon: Users, roles: ["Owner / Manager"] },
  { key: "products", label: "Products", icon: Package, roles: ["Owner / Manager"] },
  { key: "purchases", label: "Purchases", icon: ShoppingBag, roles: ["Owner / Manager"] },
  { key: "warehouse", label: "Warehouse", icon: Warehouse, roles: ["Owner / Manager"] },
  { key: "sales", label: "Sales", icon: Receipt, roles: ["Owner / Manager", "Dispatch"] },
  { key: "finance", label: "Finance", icon: Wallet, roles: ["Owner / Manager"] },
  { key: "riders", label: "Rider Delivery", icon: Bike, roles: ["Owner / Manager", "Dispatch"] },
  { key: "ai", label: "AI Advisor", icon: Sparkles, roles: ["Owner / Manager", "Dispatch"] },
  { key: "users", label: "User Master", icon: UserCog, roles: ["Owner / Manager"] },
  { key: "mydeliveries", label: "My Deliveries", icon: Bike, roles: ["Rider"] },
];

const whName = (id) => WAREHOUSES.find(w => w.id === id)?.name ?? id;
const glName = (code) => { const a = GL.find(g => g.code === code); return a ? `${a.code} · ${a.name}` : "—"; };

/* ============================================================ */
export default function DemoApp() {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [drawer, setDrawer] = useState(false);

  // role-filtered nav
  const visibleNav = useMemo(() => user ? NAV.filter(n => n.roles.includes(user.role)) : [], [user]);

  // reset to first visible tab on login
  const doLogin = (u) => {
    setUser(u);
    const first = NAV.find(n => n.roles.includes(u.role));
    setActive(first?.key || "dashboard");
  };

  // lifted state
  const [customers, setCustomers] = useState(CUSTOMERS0);
  const [products, setProducts] = useState(PRODUCTS0);
  const [stock, setStock] = useState(STOCK0);
  const [ledger, setLedger] = useState(LEDGER0);
  const [indents, setIndents] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [orders, setOrders] = useState(ORDERS0);
  const [journal, setJournal] = useState(JOURNAL0);
  const [suppliers] = useState(SUPPLIERS0);
  const [sales, setSales] = useState(SALES0.map(s => ({ ...s, date: new Date().toISOString(), lines: [], voided: false })));
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [users, setUsers] = useState(USERS0);

  useEffect(() => { setDrawer(false); }, [active, isMobile]);

  const totalStock = (pid) => Object.values(stock[pid] || {}).reduce((a, b) => a + b, 0);

  // ---- accounting derivations (single source of truth = journal) ----
  const acctBalance = (code) => journal.reduce((s, e) => s + e.lines.filter(l => l.acct === code).reduce((a, l) => a + (l.dr || 0) - (l.cr || 0), 0), 0);
  const customerBalance = (id) => journal.reduce((s, e) => s + e.lines.filter(l => l.customerId === id).reduce((a, l) => a + (l.dr || 0) - (l.cr || 0), 0), 0);
  const supplierBalance = (id) => journal.reduce((s, e) => s + e.lines.filter(l => l.supplierId === id).reduce((a, l) => a + (l.cr || 0) - (l.dr || 0), 0), 0);
  const postJournal = (entry) => setJournal(prev => [...prev, { id: uid("J"), ...entry }]);

  // edit handlers
  const upsertProduct = (p) => setProducts(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [{ ...p }, ...prev]);
  const upsertCustomer = (c) => setCustomers(prev => prev.some(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [{ ...c }, ...prev]);
  const upsertUser = (u) => setUsers(prev => prev.some(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [{ ...u }, ...prev]);

  const adjustStock = (pid, wh, delta, type, ref) => {
    setStock(prev => { const n = JSON.parse(JSON.stringify(prev)); n[pid] = n[pid] || {}; n[pid][wh] = (n[pid][wh] || 0) + delta; return n; });
    setLedger(prev => [...prev, { id: uid("LG"), date: new Date().toISOString(), productId: pid, warehouseId: wh, type, ref, qtyIn: delta > 0 ? delta : 0, qtyOut: delta < 0 ? -delta : 0 }]);
  };

  // POS sale
  const postSale = ({ customerId, customerName, cart, mopName, mopAcct }) => {
    const total = cart.reduce((a, c) => a + c.qty * c.price, 0);
    const { net, vat } = splitVAT(total);
    const ref = jref("INV");
    const byAcct = {};
    cart.forEach(c => { const a = c.salesAcct || "4000"; byAcct[a] = (byAcct[a] || 0) + c.qty * c.price; });
    const netFactor = net / total;
    const incomeLines = Object.entries(byAcct).map(([acct, gross]) => ({ acct, dr: 0, cr: Math.round(gross * netFactor) }));
    const incSum = incomeLines.reduce((a, l) => a + l.cr, 0);
    const vatAdj = total - incSum - vat;
    const lines = [
      { acct: mopAcct, dr: total, cr: 0, ...(mopAcct === "1200" ? { customerId } : {}) },
      ...incomeLines,
      { acct: "2100", dr: 0, cr: vat + vatAdj },
    ];
    postJournal({ date: new Date().toISOString(), type: "Sale", ref, narration: `${mopName} sale — ${customerName}`, lines });
    cart.forEach(c => adjustStock(c.id, "W-01", -c.qty, "Sale Out", ref));
    setSales(prev => [{ id: ref, customer: customerName, customerId, items: cart.reduce((a, c) => a + c.qty, 0), total, mode: mopName, mopAcct, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), date: new Date().toISOString(), lines: cart, voided: false }, ...prev]);
    return ref;
  };

  // Void a sale: reverse journal, restore stock
  const voidSale = (saleId) => {
    setSales(prev => {
      const sale = prev.find(s => s.id === saleId);
      if (!sale || sale.voided) return prev;
      // reverse journal by ref
      setJournal(jprev => {
        const orig = jprev.filter(e => e.ref === saleId && e.type === "Sale");
        const rev = orig.map(e => ({ id: uid("J"), date: new Date().toISOString(), type: "Void", ref: `VOID-${saleId}`, narration: `Void ${saleId}`, lines: e.lines.map(l => ({ acct: l.acct, dr: l.cr || 0, cr: l.dr || 0, ...(l.customerId ? { customerId: l.customerId } : {}) })) }));
        return [...jprev, ...rev];
      });
      (sale.lines || []).forEach(c => adjustStock(c.id, "W-01", c.qty, "Void In", `VOID-${saleId}`));
      return prev.map(s => s.id === saleId ? { ...s, voided: true } : s);
    });
  };

  // Purchase invoice / GRN: increase stock, post Dr Purchases + Dr VAT Input, Cr Creditor
  const postPurchase = ({ supplierId, supplierName, lines: plines, poId, warehouse = "W-01" }) => {
    const total = plines.reduce((a, l) => a + l.qty * l.cost, 0);
    const { net, vat } = splitVAT(total);
    const ref = jref("PINV");
    postJournal({
      date: new Date().toISOString(), type: "Purchase", ref, narration: `Purchase invoice — ${supplierName}`,
      lines: [{ acct: "5000", dr: net, cr: 0 }, { acct: "2110", dr: vat, cr: 0 }, { acct: "2000", dr: 0, cr: total, supplierId }],
    });
    plines.forEach(l => adjustStock(l.productId, warehouse, l.qty, "Purchase In", ref));
    setPurchaseInvoices(prev => [{ id: ref, date: new Date().toISOString(), supplierId, supplierName, poId: poId || null, lines: plines, total, vat }, ...prev]);
    if (poId) setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: "Received", invoiceId: ref } : po));
    return ref;
  };

  // Delete a purchase invoice: reverse journal + stock
  const deletePurchase = (piId) => {
    setPurchaseInvoices(prev => {
      const pi = prev.find(x => x.id === piId);
      if (!pi) return prev;
      setJournal(jp => {
        const orig = jp.filter(e => e.ref === piId && e.type === "Purchase");
        return [...jp, ...orig.map(e => ({ id: uid("J"), date: new Date().toISOString(), type: "Delete", ref: `DEL-${piId}`, narration: `Delete ${piId}`, lines: e.lines.map(l => ({ ...l, dr: l.cr || 0, cr: l.dr || 0 })) }))];
      });
      (pi.lines || []).forEach(l => adjustStock(l.productId, "W-01", -l.qty, "Delete Out", `DEL-${piId}`));
      if (pi.poId) setPurchaseOrders(pop => pop.map(po => po.id === pi.poId ? { ...po, status: "Open", invoiceId: null } : po));
      return prev.filter(x => x.id !== piId);
    });
  };

  // Void a financial transaction (receipt/payment/journal)
  const voidFinTxn = (ref) => {
    setJournal(prev => {
      const orig = prev.filter(e => e.ref === ref && e.type !== "Void" && e.type !== "Delete");
      if (!orig.length) return prev;
      return [...prev, ...orig.map(e => ({ id: uid("J"), date: new Date().toISOString(), type: "Void", ref: `VOID-${ref}`, narration: `Void ${ref}`, lines: e.lines.map(l => ({ ...l, dr: l.cr || 0, cr: l.dr || 0 })) }))];
    });
  };

  // Execute a transfer: move stock, write ledger, mark indent fulfilled
  const executeTransfer = (fromWh, toWh, lines, indentId) => {
    const tId = uid("TR");
    setStock(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      lines.forEach(l => {
        next[l.productId] = next[l.productId] || {};
        next[l.productId][fromWh] = (next[l.productId][fromWh] || 0) - l.qty;
        next[l.productId][toWh] = (next[l.productId][toWh] || 0) + l.qty;
      });
      return next;
    });
    setLedger(prev => [
      ...prev,
      ...lines.flatMap(l => ([
        { id: uid("LG"), date: new Date().toISOString(), productId: l.productId, warehouseId: fromWh, type: "Transfer Out", ref: tId, qtyIn: 0, qtyOut: l.qty },
        { id: uid("LG"), date: new Date().toISOString(), productId: l.productId, warehouseId: toWh, type: "Transfer In", ref: tId, qtyIn: l.qty, qtyOut: 0 },
      ])),
    ]);
    setTransfers(prev => [{ id: tId, date: new Date().toISOString(), indentId: indentId || null, fromWh, toWh, lines }, ...prev]);
    if (indentId) setIndents(prev => prev.map(i => i.id === indentId ? { ...i, status: "Fulfilled", transferId: tId } : i));
  };

  // toast notifications
  const [toasts, setToasts] = useState([]);
  useEffect(() => { window.__setToasts = setToasts; return () => { window.__setToasts = null; }; }, []);

  if (!user) return <Login onLogin={doLogin} />;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: C.canvas, minHeight: "100vh", color: C.ink, display: "flex" }}>
      {/* Toasts */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 80, display: "grid", gap: 8, maxWidth: 380 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ background: t.type === "email" ? "#1d4ed8" : t.type === "sms" ? "#15803d" : C.petrol, color: "white", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
              {t.type === "email" ? <Mail size={16} /> : t.type === "sms" ? <MessageSquare size={16} /> : <Sparkles size={16} />}
              {t.msg}
            </div>
          ))}
        </div>
      )}
      {!isMobile && <Sidebar active={active} setActive={setActive} user={user} onLogout={() => setUser(null)} navItems={visibleNav} />}
      {isMobile && drawer && (
        <>
          <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,30,35,0.5)", zIndex: 40 }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, width: 260 }}>
            <Sidebar active={active} setActive={setActive} user={user} onLogout={() => setUser(null)} onClose={() => setDrawer(false)} mobile navItems={visibleNav} />
          </div>
        </>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: isMobile ? "12px 16px" : "14px 28px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 30 }}>
          {isMobile && <button onClick={() => setDrawer(true)} style={iconBtn}><Menu size={22} /></button>}
          <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, letterSpacing: -0.3 }}>{visibleNav.find(n => n.key === active)?.label || active}</div>
          <div style={{ flex: 1 }} />
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.canvas, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 12px", width: 240 }}>
              <Search size={16} color={C.sub} />
              <input placeholder="Search…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, width: "100%", color: C.ink }} />
            </div>
          )}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.petrol, color: "white", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>{user.initials}</div>
        </header>

        <main style={{ padding: isMobile ? 16 : 28, flex: 1 }}>
          {active === "dashboard" && <Dashboard isMobile={isMobile} orders={orders} products={products} totalStock={totalStock} setActive={setActive} sales={sales} acctBalance={acctBalance} customers={customers} customerBalance={customerBalance} />}
          {active === "customers" && <Customers isMobile={isMobile} customers={customers} upsertCustomer={upsertCustomer} customerBalance={customerBalance} journal={journal} />}
          {active === "products" && <Products isMobile={isMobile} products={products} upsertProduct={upsertProduct} setStock={setStock} setLedger={setLedger} totalStock={totalStock} stock={stock} />}
          {active === "purchases" && <Purchases isMobile={isMobile} products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} purchaseInvoices={purchaseInvoices} postPurchase={postPurchase} deletePurchase={deletePurchase} />}
          {active === "warehouse" && <WarehouseModule isMobile={isMobile} products={products} stock={stock} ledger={ledger} indents={indents} setIndents={setIndents} transfers={transfers} executeTransfer={executeTransfer} totalStock={totalStock} />}
          {active === "sales" && <Sales isMobile={isMobile} products={products} customers={customers} sales={sales} postSale={postSale} voidSale={voidSale} totalStock={totalStock} quotations={quotations} setQuotations={setQuotations} />}
          {active === "finance" && <Finance isMobile={isMobile} journal={journal} postJournal={postJournal} customers={customers} suppliers={suppliers} customerBalance={customerBalance} supplierBalance={supplierBalance} acctBalance={acctBalance} voidFinTxn={voidFinTxn} />}
          {active === "riders" && <Riders isMobile={isMobile} orders={orders} setOrders={setOrders} />}
          {active === "ai" && <AIAdvisor isMobile={isMobile} sales={sales} products={products} totalStock={totalStock} customers={customers} customerBalance={customerBalance} />}
          {active === "users" && <UserMaster isMobile={isMobile} users={users} upsertUser={upsertUser} />}
          {active === "mydeliveries" && <MyDeliveries isMobile={isMobile} orders={orders} setOrders={setOrders} riderId={user.riderId} riderName={user.name} />}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Login ---------------- */
function Login({ onLogin }) {
  const [role, setRole] = useState("Owner / Manager");
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", background: `linear-gradient(140deg, ${C.petrolDeep}, ${C.petrol})`, display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 18, padding: 34, width: "100%", maxWidth: 380, boxShadow: "0 24px 60px rgba(10,40,50,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.petrol, display: "grid", placeItems: "center" }}><Truck size={22} color="white" /></div>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>DP Light</div>
        </div>
        <div style={{ color: C.sub, fontSize: 13, marginBottom: 22 }}>Retail management · demo sandbox</div>
        <label style={lbl}>Sign in as</label>
        <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {["Owner / Manager", "Dispatch", "Rider"].map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ textAlign: "left", padding: "11px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, border: `1.5px solid ${role === r ? C.petrol : C.line}`, background: role === r ? "#EAF2F3" : C.card, color: role === r ? C.petrol : C.ink }}>{r}</button>
          ))}
        </div>
        <input placeholder="demo@dplight.co.ke" defaultValue="demo@dplight.co.ke" style={inp} />
        <input placeholder="Password" type="password" defaultValue="demo1234" style={{ ...inp, marginTop: 10 }} />
        <button onClick={() => onLogin({
            role,
            initials: role === "Rider" ? "RD" : role === "Dispatch" ? "DP" : "OM",
            name: role === "Rider" ? "James Kariuki" : role === "Dispatch" ? "Dispatch Desk" : "Diana P.",
            riderId: role === "Rider" ? "r1" : null,
          })}
          style={{ marginTop: 18, width: "100%", padding: "13px", borderRadius: 10, border: "none", background: C.petrol, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Enter demo</button>
        <div style={{ marginTop: 14, fontSize: 12, color: C.sub, textAlign: "center", lineHeight: 1.5 }}>Sandbox only — nothing here touches live shop data. Play freely.</div>
      </div>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ active, setActive, user, onLogout, onClose, mobile, navItems }) {
  return (
    <aside style={{ width: 260, background: C.petrolDeep, color: "#DCE8EA", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: C.amber, display: "grid", placeItems: "center" }}><Truck size={20} color={C.petrolDeep} /></div>
        <div style={{ fontWeight: 800, fontSize: 18, color: "white", letterSpacing: -0.4 }}>DP Light</div>
        {mobile && <button onClick={onClose} style={{ ...iconBtn, marginLeft: "auto", color: "#DCE8EA" }}><X size={20} /></button>}
      </div>
      <div style={{ padding: "0 12px", flex: 1 }}>
        {navItems.map(n => {
          const on = active === n.key; const Icon = n.icon;
          return (
            <button key={n.key} onClick={() => setActive(n.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", marginBottom: 3, borderRadius: 10, cursor: "pointer", fontSize: 14.5, fontWeight: on ? 700 : 500, border: "none", textAlign: "left", background: on ? C.petrolSoft : "transparent", color: on ? "white" : "#B4C7CA" }}>
              <Icon size={19} /> {n.label}
              {n.key === "riders" && <span style={{ marginLeft: "auto", fontSize: 11, background: C.amber, color: C.petrolDeep, fontWeight: 800, padding: "1px 7px", borderRadius: 20 }}>live</span>}
              {n.key === "mydeliveries" && <span style={{ marginLeft: "auto", fontSize: 11, background: C.green, color: "white", fontWeight: 800, padding: "1px 7px", borderRadius: 20 }}>you</span>}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.petrolSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.petrolSoft, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "white" }}>{user.initials}</div>
          <div style={{ fontSize: 13 }}>
            <div style={{ color: "white", fontWeight: 600 }}>{user.name || user.role}</div>
            <div style={{ color: "#8FA9AD", fontSize: 11 }}>{user.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", color: "#B4C7CA", fontSize: 13, cursor: "pointer", fontWeight: 600 }}><LogOut size={16} /> Sign out</button>
      </div>
    </aside>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ isMobile, orders, products, totalStock, setActive, sales, customers, customerBalance }) {
  const activeDel = orders.filter(o => o.status === "assigned" || o.status === "picked").length;
  const low = products.filter(p => totalStock(p.id) <= p.reorder).length;
  const outstanding = customers.reduce((a, c) => a + Math.max(0, customerBalance(c.id)), 0);
  const owing = customers.filter(c => customerBalance(c.id) > 0).length;
  const salesTotal = sales.reduce((a, s) => a + s.total, 0);
  const kpis = [
    { label: "Sales (register)", value: money(salesTotal), icon: TrendingUp, tint: C.green, note: `${sales.length} invoices` },
    { label: "Deliveries active", value: activeDel, icon: Bike, tint: C.amber, note: `${orders.length} total today` },
    { label: "Low stock items", value: low, icon: AlertTriangle, tint: C.red, note: "at/below reorder" },
    { label: "Outstanding debtors", value: money(outstanding), icon: Receipt, tint: C.blue, note: `${owing} customers` },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 22 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...card, padding: isMobile ? 14 : 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: k.tint + "22", display: "grid", placeItems: "center" }}><k.icon size={18} color={k.tint} /></div>
            <div style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, marginTop: 12, letterSpacing: -0.5 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 6, opacity: 0.8 }}>{k.note}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Recent sales" action="View all" onAction={() => setActive("sales")} />
          {sales.slice(0, 5).map(s => (
            <Row key={s.id}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{s.customer}</div><div style={{ fontSize: 12, color: C.sub }}>{s.id} · {s.items} items · {s.mode}</div></div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{money(s.total)}</div>
            </Row>
          ))}
        </div>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Deliveries in progress" action="Open" onAction={() => setActive("riders")} />
          {orders.filter(o => o.status !== "delivered").map(o => (
            <Row key={o.id}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{o.customer}</div><div style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {o.area}</div></div>
              <Pill s={STATUS[o.status]} />
            </Row>
          ))}
          {orders.filter(o => o.status !== "delivered").length === 0 && <Empty text="No active deliveries." />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Customers (+ creation card w/ GL) ---------------- */
function Customers({ isMobile, customers, upsertCustomer, customerBalance, journal }) {
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const save = (c) => { upsertCustomer(c.id ? c : { ...c, id: uid("C") }); setForm(false); setEditing(null); };
  const bal = (c) => customerBalance(c.id);
  return (
    <div>
      {(form || editing) && <CustomerForm isMobile={isMobile} initial={editing} onSave={save} onCancel={() => { setForm(false); setEditing(null); }} />}
      {detail && <CustomerDetail isMobile={isMobile} customer={detail} journal={journal} balance={bal(detail)} onClose={() => setDetail(null)} onEdit={() => { setEditing(detail); setDetail(null); }} />}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${customers.length} customers`} action={(form || editing) ? null : "New customer"} onAction={() => setForm(true)} accent icon={<Plus size={15} />} />
        {isMobile ? (
          customers.map(c => { const b = bal(c); return (
            <div key={c.id} onClick={() => setDetail(c)} style={{ cursor: "pointer" }}><Row>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div><div style={{ fontSize: 12, color: C.sub }}>{c.phone} · {c.town}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: C.sub }}>{c.type}</div><div style={{ fontWeight: 700, fontSize: 13, color: b > 0 ? C.red : C.green }}>{b > 0 ? money(b) : "Clear"}</div></div>
              <ChevronRight size={16} color={C.sub} />
            </Row></div>
          ); })
        ) : (
          <Table cols={["Code", "Customer", "Type", "Phone", "Town", "Control A/C", "Balance"]} widths={["0.7fr", "1.6fr", "0.8fr", "1fr", "0.9fr", "1.2fr", "0.9fr"]}
            onRowClick={(i) => setDetail(customers[i])}
            rows={customers.map(c => { const b = bal(c); return [c.id, <b>{c.name}</b>, c.type, c.phone, c.town, <span style={{ fontSize: 12 }}>{glName(c.controlAcct)}</span>, <span style={{ color: b > 0 ? C.red : C.green, fontWeight: 700 }}>{b > 0 ? money(b) : "Clear"}</span>]; })} />
        )}
      </div>
      <Hint>Tap a customer to open their statement, then Edit to change their details.</Hint>
      <ExportBar title="Customers" cols={["Code", "Name", "Type", "Phone", "Town", "Balance"]} rows={customers.map(c => [c.id, c.name, c.type, c.phone, c.town, bal(c)])} />
    </div>
  );
}

function CustomerDetail({ isMobile, customer, journal, balance, onClose, onEdit }) {
  const lines = [];
  journal.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e => {
    e.lines.filter(l => l.customerId === customer.id).forEach(l => lines.push({ date: e.date, ref: e.ref, narration: e.narration, dr: l.dr || 0, cr: l.cr || 0 }));
  });
  let run = 0; const rows = lines.map(l => { run += l.dr - l.cr; return { ...l, run }; });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,30,35,0.5)" }} />
      <div style={{ position: "relative", background: C.canvas, width: isMobile ? "100%" : 560, maxWidth: "100%", height: "100%", overflowY: "auto", boxShadow: "-10px 0 40px rgba(0,0,0,0.2)" }}>
        <div style={{ background: C.petrolDeep, color: "white", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, zIndex: 2 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{customer.name}</div>
            <div style={{ fontSize: 12.5, color: "#B4C7CA", marginTop: 3 }}>{customer.type} · {customer.phone} · {customer.town}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onEdit} style={{ ...iconBtn, color: "white", border: "1px solid #ffffff33", borderRadius: 8, padding: "6px 10px", display: "flex", gap: 5, fontSize: 13, fontWeight: 600 }}><Pencil size={15} /> Edit</button>
            <button onClick={onClose} style={{ ...iconBtn, color: "white" }}><X size={22} /></button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div style={{ ...card, padding: 14 }}><div style={{ fontSize: 12, color: C.sub }}>Balance owing</div><div style={{ fontSize: 22, fontWeight: 800, color: balance > 0 ? C.red : C.green }}>{balance > 0 ? money(balance) : "Clear"}</div></div>
            <div style={{ ...card, padding: 14 }}><div style={{ fontSize: 12, color: C.sub }}>Credit limit</div><div style={{ fontSize: 22, fontWeight: 800 }}>{money(customer.creditLimit || 0)}</div></div>
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <SectionHead title="Statement" />
            {rows.length === 0 ? <Empty text="No ledger movements." /> : (
              <Table cols={["Date", "Ref", "Details", "Debit", "Credit", "Balance"]} widths={["0.8fr", "1fr", "1.6fr", "0.8fr", "0.8fr", "0.9fr"]}
                rows={rows.map(r => [fmtDate(r.date), <span style={{ fontSize: 12, color: C.sub }}>{r.ref}</span>, <span style={{ fontSize: 12.5 }}>{r.narration}</span>, <span style={{ color: C.red }}>{r.dr ? money(r.dr) : ""}</span>, <span style={{ color: C.green }}>{r.cr ? money(r.cr) : ""}</span>, <b>{money(r.run)}</b>])} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerForm({ isMobile, initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { name: "", type: "Retail", phone: "", email: "", town: "", pin: "", creditLimit: 0, controlAcct: "1200", salesAcct: "4000" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const g2 = isMobile ? "1fr" : "1fr 1fr";
  return (
    <FormCard title={initial ? `Edit ${initial.name}` : "New customer"} onCancel={onCancel} onSave={() => f.name && onSave(f)} saveLabel={initial ? "Save changes" : "Create customer"}>
      <FieldGroup label="Essential details">
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 10 }}>
          <Field label="Customer name *"><input style={inp} value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Riverside Electricals" /></Field>
          <Field label="Type"><select style={inp} value={f.type} onChange={e => set("type", e.target.value)}><option>Retail</option><option>Wholesale</option></select></Field>
          <Field label="Phone"><input style={inp} value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="07XX XXX XXX" /></Field>
          <Field label="Email"><input style={inp} value={f.email} onChange={e => set("email", e.target.value)} placeholder="optional" /></Field>
          <Field label="Town / area"><input style={inp} value={f.town} onChange={e => set("town", e.target.value)} /></Field>
          <Field label="KRA PIN"><input style={inp} value={f.pin} onChange={e => set("pin", e.target.value)} placeholder="optional" /></Field>
          <Field label="Credit limit (KSh)"><input style={inp} type="number" value={f.creditLimit} onChange={e => set("creditLimit", Number(e.target.value))} /></Field>
        </div>
      </FieldGroup>
      <FieldGroup label="Accounting (GL)">
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 10 }}>
          <Field label="Control account"><GLSelect value={f.controlAcct} onChange={v => set("controlAcct", v)} filter={["Current Assets"]} /></Field>
          <Field label="Default sales account"><GLSelect value={f.salesAcct} onChange={v => set("salesAcct", v)} filter={["Sales Accounts"]} /></Field>
        </div>
        <Hint>The customer posts to its control account (Sundry Debtors) — this is the ledger the customer's balance lives under in Fusion.</Hint>
      </FieldGroup>
    </FormCard>
  );
}

/* ---------------- Products (+ creation card w/ GL + opening stock) ---------------- */
function Products({ isMobile, products, upsertProduct, setStock, setLedger, totalStock, stock }) {
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const save = (p, openingQty, openingWh) => {
    if (p.id) { upsertProduct(p); }
    else {
      const id = uid("P"); upsertProduct({ ...p, id });
      if (openingQty > 0) {
        setStock(prev => ({ ...prev, [id]: { [openingWh]: openingQty } }));
        setLedger(prev => [...prev, { id: uid("LG"), date: new Date().toISOString(), productId: id, warehouseId: openingWh, type: "Opening", ref: "OPENING", qtyIn: openingQty, qtyOut: 0 }]);
      }
    }
    setForm(false); setEditing(null);
  };
  return (
    <div>
      {(form || editing) && <ProductForm isMobile={isMobile} initial={editing} onSave={save} onCancel={() => { setForm(false); setEditing(null); }} />}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${products.length} products`} action={(form || editing) ? null : "New product"} onAction={() => setForm(true)} accent icon={<Plus size={15} />} />
        {isMobile ? (
          products.map(p => {
            const st = totalStock(p.id); const low = st <= p.reorder;
            return (
              <div key={p.id} onClick={() => setEditing(p)} style={{ cursor: "pointer" }}><Row>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 12, color: C.sub }}>{p.code} · {p.group}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 13 }}>{money(p.price)}</div><div style={{ fontSize: 12, fontWeight: 600, color: low ? C.red : C.sub }}>{st} {p.unit}{low ? " ⚠" : ""}</div></div>
                <ChevronRight size={16} color={C.sub} />
              </Row></div>
            );
          })
        ) : (
          <Table cols={["Code", "Product", "Group", "Unit", "Sale", "Cost", "Stock"]} widths={["0.9fr", "1.7fr", "1fr", "0.6fr", "0.8fr", "0.8fr", "0.8fr"]}
            onRowClick={(i) => setEditing(products[i])}
            rows={products.map(p => { const st = totalStock(p.id); return [p.code, <b>{p.name}</b>, p.group, p.unit, money(p.price), money(p.cost), <span style={{ fontWeight: 700, color: st <= p.reorder ? C.red : C.ink }}>{st}{st <= p.reorder ? " ⚠" : ""}</span>]; })} />
        )}
      </div>
      <Hint>Tap a product to view and edit it. The POS reads this list live, so new/edited products appear there immediately.</Hint>
      <ExportBar title="Products" cols={["Code", "Name", "Group", "Unit", "Sale", "Cost", "Stock"]} rows={products.map(p => [p.code, p.name, p.group, p.unit, p.price, p.cost, totalStock(p.id)])} />
    </div>
  );
}

function ProductForm({ isMobile, initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { code: "", name: "", group: "Tubes", unit: "Pcs", price: 0, cost: 0, reorder: 20, salesAcct: "4000", purchaseAcct: "5000", stockAcct: "1300" });
  const [openingQty, setOpeningQty] = useState(0);
  const [openingWh, setOpeningWh] = useState("W-01");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const g2 = isMobile ? "1fr" : "1fr 1fr";
  return (
    <FormCard title={initial ? `Edit ${initial.name}` : "New product"} onCancel={onCancel} onSave={() => f.name && onSave(f, Number(openingQty), openingWh)} saveLabel={initial ? "Save changes" : "Create product"}>
      <FieldGroup label="Essential details">
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 10 }}>
          <Field label="Product name *"><input style={inp} value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. 4ft LED Tube" /></Field>
          <Field label="Code / SKU"><input style={inp} value={f.code} onChange={e => set("code", e.target.value)} placeholder="e.g. 4Ft Tube" /></Field>
          <Field label="Group"><select style={inp} value={f.group} onChange={e => set("group", e.target.value)}>{["Tubes", "Fittings", "LED Strips", "Flood Lights", "Bulbs", "Downlights"].map(g => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Unit"><select style={inp} value={f.unit} onChange={e => set("unit", e.target.value)}>{["Pcs", "Roll", "Box", "Set"].map(u => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Sale price"><input style={inp} type="number" value={f.price} onChange={e => set("price", Number(e.target.value))} /></Field>
          <Field label="Cost price"><input style={inp} type="number" value={f.cost} onChange={e => set("cost", Number(e.target.value))} /></Field>
          <Field label="Reorder level"><input style={inp} type="number" value={f.reorder} onChange={e => set("reorder", Number(e.target.value))} /></Field>
        </div>
      </FieldGroup>
      <FieldGroup label="Opening stock">
        {initial ? <Hint>Opening stock is set at creation. Adjust quantities via Purchases (GRN) or Warehouse transfers.</Hint> : (
          <div style={{ display: "grid", gridTemplateColumns: g2, gap: 10 }}>
            <Field label="Opening quantity"><input style={inp} type="number" value={openingQty} onChange={e => setOpeningQty(e.target.value)} /></Field>
            <Field label="Into warehouse"><select style={inp} value={openingWh} onChange={e => setOpeningWh(e.target.value)}>{WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
          </div>
        )}
      </FieldGroup>
      <FieldGroup label="Accounting (GL)">
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 10 }}>
          <Field label="Sales account"><GLSelect value={f.salesAcct} onChange={v => set("salesAcct", v)} filter={["Sales Accounts"]} /></Field>
          <Field label="Purchase account"><GLSelect value={f.purchaseAcct} onChange={v => set("purchaseAcct", v)} filter={["Purchase Accounts"]} /></Field>
          <Field label="Stock account"><GLSelect value={f.stockAcct} onChange={v => set("stockAcct", v)} filter={["Current Assets"]} /></Field>
        </div>
      </FieldGroup>
    </FormCard>
  );
}

/* ---------------- Warehouse module ---------------- */
function WarehouseModule({ isMobile, products, stock, ledger, indents, setIndents, transfers, executeTransfer, totalStock }) {
  const [tab, setTab] = useState("indent");
  const tabs = [
    { k: "indent", label: "Transfer Indent", icon: ClipboardList },
    { k: "transfer", label: "Stock Transfer", icon: ArrowLeftRight },
    { k: "reports", label: "Reports", icon: FileText },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${tab === t.k ? C.petrol : C.line}`, background: tab === t.k ? C.petrol : C.card, color: tab === t.k ? "white" : C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "indent" && <IndentTab isMobile={isMobile} products={products} indents={indents} setIndents={setIndents} totalStock={totalStock} stock={stock} />}
      {tab === "transfer" && <TransferTab isMobile={isMobile} products={products} indents={indents} stock={stock} executeTransfer={executeTransfer} />}
      {tab === "reports" && <WarehouseReports isMobile={isMobile} products={products} stock={stock} ledger={ledger} indents={indents} transfers={transfers} />}
    </div>
  );
}

/* Transfer Indent: create a request; list existing */
function IndentTab({ isMobile, products, indents, setIndents, stock }) {
  const [form, setForm] = useState(false);
  const [fromWh, setFromWh] = useState("W-01");
  const [toWh, setToWh] = useState("W-02");
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState([{ productId: products[0]?.id || "", qty: 1 }]);

  const addLine = () => setLines(l => [...l, { productId: products[0]?.id || "", qty: 1 }]);
  const rmLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const setLine = (i, k, v) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: v } : ln));

  const save = () => {
    const clean = lines.filter(l => l.productId && Number(l.qty) > 0).map(l => ({ productId: l.productId, qty: Number(l.qty) }));
    if (!clean.length || fromWh === toWh) return;
    setIndents(prev => [{ id: uid("IND"), date: new Date().toISOString(), fromWh, toWh, remarks, status: "Pending", lines: clean }, ...prev]);
    setForm(false); setLines([{ productId: products[0]?.id || "", qty: 1 }]); setRemarks("");
  };

  return (
    <div>
      {!form && (
        <button onClick={() => setForm(true)} style={{ ...primaryBtn, marginBottom: 14 }}><Plus size={17} /> New transfer indent</button>
      )}
      {form && (
        <FormCard title="New transfer indent (request)" onCancel={() => setForm(false)} onSave={save} saveLabel="Raise indent">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <Field label="From warehouse"><select style={inp} value={fromWh} onChange={e => setFromWh(e.target.value)}>{WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
            <Field label="To warehouse"><select style={inp} value={toWh} onChange={e => setToWh(e.target.value)}>{WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
          </div>
          {fromWh === toWh && <Hint tone="warn">Source and destination must differ.</Hint>}
          <FieldGroup label="Items requested">
            {lines.map((ln, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 70px 34px" : "1fr 110px 34px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <select style={inp} value={ln.productId} onChange={e => setLine(i, "productId", e.target.value)}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({(stock[p.id]?.[fromWh]) || 0} @ {whName(fromWh)})</option>)}
                </select>
                <input style={inp} type="number" value={ln.qty} onChange={e => setLine(i, "qty", e.target.value)} placeholder="Qty" />
                <button onClick={() => rmLine(i)} style={{ ...iconBtn, color: C.red }} disabled={lines.length === 1}><Trash2 size={17} /></button>
              </div>
            ))}
            <button onClick={addLine} style={ghostBtn}><Plus size={15} /> Add item</button>
          </FieldGroup>
          <Field label="Remarks"><input style={inp} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="optional" /></Field>
        </FormCard>
      )}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${indents.length} indents`} />
        {indents.length === 0 && <Empty text="No transfer indents yet. Raise one above." />}
        {indents.map(ind => (
          <div key={ind.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{ind.id} · <span style={{ fontWeight: 500, color: C.sub }}>{fmtDate(ind.date)}</span></div>
                <div style={{ fontSize: 13, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>{whName(ind.fromWh)} <ArrowRight size={13} /> {whName(ind.toWh)}</div>
              </div>
              <Pill s={ind.status === "Fulfilled" ? { label: "Fulfilled", color: C.greenDeep, bg: "#D7EFEA" } : { label: "Pending", color: C.amberDeep, bg: "#FCEBD6" }} />
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8 }}>{ind.lines.map(l => `${l.qty}× ${products.find(p => p.id === l.productId)?.name || l.productId}`).join(", ")}</div>
            {ind.remarks && <div style={{ fontSize: 12, color: C.sub, marginTop: 4, fontStyle: "italic" }}>“{ind.remarks}”</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Stock Transfer: pull a pending indent, then execute */
function TransferTab({ isMobile, products, indents, stock, executeTransfer }) {
  const pending = indents.filter(i => i.status === "Pending");
  const [selId, setSelId] = useState("");
  const sel = pending.find(i => i.id === selId);

  const shortLine = (l) => (stock[l.productId]?.[sel.fromWh] || 0) < l.qty;
  const anyShort = sel && sel.lines.some(shortLine);

  const doTransfer = () => {
    if (!sel || anyShort) return;
    executeTransfer(sel.fromWh, sel.toWh, sel.lines, sel.id);
    setSelId("");
  };

  return (
    <div>
      <div style={{ ...card, padding: 18, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><ArrowDownToLine size={18} color={C.petrol} /> Pull a pending indent</div>
        {pending.length === 0 ? (
          <Hint>No pending indents to fulfil. Raise one in the Transfer Indent tab first.</Hint>
        ) : (
          <select style={inp} value={selId} onChange={e => setSelId(e.target.value)}>
            <option value="">Select a pending indent…</option>
            {pending.map(i => <option key={i.id} value={i.id}>{i.id} · {whName(i.fromWh)} → {whName(i.toWh)} · {i.lines.length} item(s)</option>)}
          </select>
        )}
      </div>

      {sel && (
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontWeight: 700 }}>{sel.id}</div>
          <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: C.sub, marginBottom: 14 }}>{whName(sel.fromWh)} <ArrowRight size={13} /> {whName(sel.toWh)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.line}`, fontSize: 11.5, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <span>Item</span><span style={{ textAlign: "right" }}>Requested</span><span style={{ textAlign: "right" }}>Available</span>
          </div>
          {sel.lines.map((l, i) => {
            const avail = stock[l.productId]?.[sel.fromWh] || 0; const short = avail < l.qty;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", gap: 8, padding: "11px 0", borderBottom: `1px solid ${C.line}`, fontSize: 13.5, alignItems: "center" }}>
                <span>{products.find(p => p.id === l.productId)?.name || l.productId}</span>
                <span style={{ textAlign: "right", fontWeight: 700 }}>{l.qty}</span>
                <span style={{ textAlign: "right", fontWeight: 700, color: short ? C.red : C.green }}>{avail}{short ? " ⚠" : ""}</span>
              </div>
            );
          })}
          {anyShort && <Hint tone="warn">One or more items exceed available stock at {whName(sel.fromWh)}. Transfer blocked — reduce the indent or restock.</Hint>}
          <button onClick={doTransfer} disabled={anyShort} style={{ ...primaryBtn, marginTop: 16, opacity: anyShort ? 0.5 : 1, cursor: anyShort ? "not-allowed" : "pointer" }}>
            <ArrowLeftRight size={17} /> Execute transfer
          </button>
          <Hint>Executing moves stock out of the source and into the destination, writes both legs to the stock ledger, and marks the indent fulfilled — mirroring how Fusion posts a stock transfer.</Hint>
        </div>
      )}
    </div>
  );
}

/* Warehouse Reports: indent report, transfer report, stock ledger, stock statement */
function WarehouseReports({ isMobile, products, stock, ledger, indents, transfers }) {
  const [rep, setRep] = useState("statement");
  const [whFilter, setWhFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState(products[0]?.id || "");

  const reports = [
    { k: "statement", label: "Stock Statement", icon: Layers },
    { k: "ledger", label: "Stock Ledger", icon: ScrollText },
    { k: "indentRep", label: "Transfer Indent Report", icon: ClipboardList },
    { k: "transferRep", label: "Transfer Report", icon: ArrowLeftRight },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {reports.map(r => (
          <button key={r.k} onClick={() => setRep(r.k)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: `1px solid ${rep === r.k ? C.petrol : C.line}`, background: rep === r.k ? "#EAF2F3" : C.card, color: rep === r.k ? C.petrol : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <r.icon size={15} /> {r.label}
          </button>
        ))}
      </div>

      {/* Stock Statement */}
      {rep === "statement" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Stock statement</div>
            <select style={{ ...inp, width: "auto", padding: "8px 12px" }} value={whFilter} onChange={e => setWhFilter(e.target.value)}>
              <option value="all">All warehouses</option>
              {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <Table cols={whFilter === "all" ? ["Code", "Product", ...WAREHOUSES.map(w => w.name), "Total"] : ["Code", "Product", "Qty", "Value"]}
            widths={whFilter === "all" ? ["0.8fr", "1.6fr", ...WAREHOUSES.map(() => "0.8fr"), "0.8fr"] : ["0.9fr", "2fr", "1fr", "1fr"]}
            rows={products.map(p => {
              if (whFilter === "all") {
                const cells = WAREHOUSES.map(w => (stock[p.id]?.[w.id] || 0));
                const tot = cells.reduce((a, b) => a + b, 0);
                return [p.code, <b>{p.name}</b>, ...cells.map(c => <span style={{ color: c === 0 ? C.sub : C.ink }}>{c}</span>), <b>{tot}</b>];
              } else {
                const q = stock[p.id]?.[whFilter] || 0;
                return [p.code, <b>{p.name}</b>, <b>{q}</b>, money(q * p.cost)];
              }
            })} />
        </div>
      )}

      {/* Stock Ledger */}
      {rep === "ledger" && (() => {
        const entries = ledger
          .filter(e => e.productId === itemFilter && (whFilter === "all" || e.warehouseId === whFilter))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        let bal = 0;
        const rows = entries.map(e => { bal += e.qtyIn - e.qtyOut; return [fmtDate(e.date), e.type, whName(e.warehouseId), e.ref, e.qtyIn || "", e.qtyOut || "", bal]; });
        return (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Stock ledger (item history)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select style={{ ...inp, width: "auto", padding: "8px 12px" }} value={itemFilter} onChange={e => setItemFilter(e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <select style={{ ...inp, width: "auto", padding: "8px 12px" }} value={whFilter} onChange={e => setWhFilter(e.target.value)}><option value="all">All warehouses</option>{WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
              </div>
            </div>
            {rows.length === 0 ? <Empty text="No movements for this item/filter." /> :
              <Table cols={["Date", "Type", "Warehouse", "Ref", "In", "Out", "Balance"]} widths={["0.8fr", "1fr", "1.1fr", "1fr", "0.5fr", "0.5fr", "0.7fr"]}
                rows={rows.map(r => [r[0], r[1], r[2], <span style={{ fontSize: 12, color: C.sub }}>{r[3]}</span>, <span style={{ color: C.green, fontWeight: 600 }}>{r[4]}</span>, <span style={{ color: C.red, fontWeight: 600 }}>{r[5]}</span>, <b>{r[6]}</b>])} />}
          </div>
        );
      })()}

      {/* Transfer Indent Report */}
      {rep === "indentRep" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Transfer indent report" />
          {indents.length === 0 ? <Empty text="No indents raised yet." /> :
            <Table cols={["Indent", "Date", "From", "To", "Items", "Status"]} widths={["1fr", "0.8fr", "1fr", "1fr", "0.7fr", "0.9fr"]}
              rows={indents.map(i => [<b>{i.id}</b>, fmtDate(i.date), whName(i.fromWh), whName(i.toWh), i.lines.length, <Pill s={i.status === "Fulfilled" ? { label: "Fulfilled", color: C.greenDeep, bg: "#D7EFEA" } : { label: "Pending", color: C.amberDeep, bg: "#FCEBD6" }} />])} />}
        </div>
      )}

      {/* Transfer Report */}
      {rep === "transferRep" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Transfer report" />
          {transfers.length === 0 ? <Empty text="No stock transfers executed yet." /> :
            <Table cols={["Transfer", "Date", "From", "To", "Indent", "Items", "Units"]} widths={["1fr", "0.8fr", "1fr", "1fr", "1fr", "0.6fr", "0.6fr"]}
              rows={transfers.map(t => [<b>{t.id}</b>, fmtDate(t.date), whName(t.fromWh), whName(t.toWh), <span style={{ fontSize: 12, color: C.sub }}>{t.indentId || "—"}</span>, t.lines.length, t.lines.reduce((a, l) => a + l.qty, 0)])} />}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sales: POS + Register + Quotations + Reports ---------------- */
function Sales({ isMobile, products, customers, sales, postSale, voidSale, totalStock, quotations, setQuotations }) {
  const [tab, setTab] = useState("pos");
  const [receipt, setReceipt] = useState(null);
  const tabs = [
    { k: "pos", label: "POS", icon: ShoppingCart },
    { k: "register", label: "Sales Register", icon: Receipt },
    { k: "quote", label: "Quotations", icon: FileCheck },
    { k: "reports", label: "Reports", icon: FileBarChart },
  ];
  return (
    <div>
      {receipt && <ThermalReceipt sale={receipt} customers={customers} onClose={() => setReceipt(null)} />}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${tab === t.k ? C.petrol : C.line}`, background: tab === t.k ? C.petrol : C.card, color: tab === t.k ? "white" : C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "pos" && <POS isMobile={isMobile} products={products} customers={customers} postSale={postSale} totalStock={totalStock} sales={sales} onPrint={setReceipt} />}
      {tab === "register" && <SalesRegister isMobile={isMobile} sales={sales} voidSale={voidSale} onPrint={setReceipt} />}
      {tab === "quote" && <Quotations isMobile={isMobile} products={products} customers={customers} quotations={quotations} setQuotations={setQuotations} postSale={postSale} onPrint={setReceipt} sales={sales} />}
      {tab === "reports" && <SalesReports isMobile={isMobile} sales={sales} quotations={quotations} />}
    </div>
  );
}

function POS({ isMobile, products, customers, postSale, totalStock, sales, onPrint }) {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [mopName, setMopName] = useState("M-Pesa");
  const [done, setDone] = useState(null);
  const add = (p) => setCart(c => { const ex = c.find(x => x.id === p.id); return ex ? c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { id: p.id, name: p.name, price: p.price, salesAcct: p.salesAcct, qty: 1 }]; });
  const dec = (id) => setCart(c => c.map(x => x.id === id ? { ...x, qty: x.qty - 1 } : x).filter(x => x.qty > 0));
  const total = cart.reduce((a, c) => a + c.qty * c.price, 0);
  const { net, vat } = total ? splitVAT(total) : { net: 0, vat: 0 };
  const cust = customers.find(c => c.id === customerId);
  const mop = MOP.find(m => m.name === mopName);
  const checkout = (print) => {
    if (!cart.length) return;
    const snapshot = { customer: cust?.name || "Walk-in", mode: mopName, lines: cart, total, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), date: new Date().toISOString() };
    const ref = postSale({ customerId, customerName: cust?.name || "Walk-in", cart, mopName, mopAcct: mop.acct });
    setDone(ref); setCart([]);
    if (print) onPrint({ ...snapshot, id: ref });
    setTimeout(() => setDone(null), 3500);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 16 }}>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title="Tap to add · reads live from Products" />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 1, background: C.line }}>
          {products.map(p => (
            <button key={p.id} onClick={() => add(p)} style={{ background: C.card, border: "none", padding: "14px 12px", cursor: "pointer", textAlign: "left", minHeight: 78 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.25 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{money(p.price)}</div>
              <div style={{ fontSize: 11, color: totalStock(p.id) <= p.reorder ? C.red : C.sub, marginTop: 2 }}>{totalStock(p.id)} in stock</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><ShoppingCart size={18} color={C.petrol} /> Cart</div>
          {done && <div style={{ background: "#D7EFEA", color: C.greenDeep, padding: "10px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={16} /> Posted {done} — stock & ledgers updated</div>}
          {cart.length === 0 && !done && <Empty text="Cart is empty. Tap products to add." />}
          {cart.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 12, color: C.sub }}>{money(c.price)} × {c.qty}</div></div>
              <button onClick={() => dec(c.id)} style={{ ...iconBtn, border: `1px solid ${C.line}`, borderRadius: 7, width: 28, height: 28 }}><Minus size={14} /></button>
              <div style={{ width: 22, textAlign: "center", fontWeight: 700 }}>{c.qty}</div>
              <button onClick={() => add(c)} style={{ ...iconBtn, border: `1px solid ${C.line}`, borderRadius: 7, width: 28, height: 28 }}><Plus size={14} /></button>
              <div style={{ width: 74, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{money(c.qty * c.price)}</div>
            </div>
          ))}
          {cart.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <Line label="Subtotal (excl. VAT)" v={money(net)} />
              <Line label="VAT 16%" v={money(vat)} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, marginTop: 6, paddingTop: 8, borderTop: `1px solid ${C.line}` }}><span>Total</span><span>{money(total)}</span></div>
            </div>
          )}
        </div>
        <div style={{ ...card, padding: 16, marginTop: 12 }}>
          <Field label="Customer"><select style={inp} value={customerId} onChange={e => setCustomerId(e.target.value)}>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <div style={{ height: 10 }} />
          <Field label="Mode of payment"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {MOP.map(m => <button key={m.name} onClick={() => setMopName(m.name)} style={{ padding: "9px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${mopName === m.name ? C.petrol : C.line}`, background: mopName === m.name ? "#EAF2F3" : C.card, color: mopName === m.name ? C.petrol : C.ink }}>{m.name}</button>)}
          </div></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
            <button onClick={() => checkout(false)} disabled={!cart.length} style={{ padding: "13px", borderRadius: 10, border: `1.5px solid ${C.petrol}`, background: C.card, color: C.petrol, fontWeight: 700, fontSize: 13.5, cursor: cart.length ? "pointer" : "not-allowed", opacity: cart.length ? 1 : 0.5 }}>Complete</button>
            <button onClick={() => checkout(true)} disabled={!cart.length} style={{ padding: "13px", borderRadius: 10, border: "none", background: C.petrol, color: "white", fontWeight: 700, fontSize: 13.5, cursor: cart.length ? "pointer" : "not-allowed", opacity: cart.length ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Printer size={16} /> Pay & print</button>
          </div>
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: 15, marginTop: 10 }}>{money(total)}</div>
        </div>
      </div>
    </div>
  );
}

function ThermalReceipt({ sale, customers, onClose }) {
  const { net, vat } = splitVAT(sale.total);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(10,30,35,0.6)", display: "grid", placeItems: "center", padding: 16 }}>
      <div>
        <style>{`@media print { body * { visibility: hidden; } #rcpt, #rcpt * { visibility: visible; } #rcpt { position: absolute; left: 0; top: 0; width: 80mm; box-shadow: none !important; } .no-print { display: none !important; } }`}</style>
        <div id="rcpt" style={{ background: "white", width: 300, padding: "22px 20px", fontFamily: "'Courier New', monospace", color: "#000", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", borderRadius: 4 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>DP LIGHT</div>
            <div style={{ fontSize: 11, lineHeight: 1.5 }}>Lighting & Electricals<br />Nairobi · 0722 000 000<br />PIN: P051234567X</div>
          </div>
          <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "6px 0", fontSize: 11, display: "flex", justifyContent: "space-between" }}>
            <span>{sale.id}</span><span>{fmtDate(sale.date)} {sale.time}</span>
          </div>
          <div style={{ fontSize: 11, padding: "6px 0" }}>Customer: {sale.customer}</div>
          <div style={{ borderTop: "1px dashed #000", padding: "6px 0" }}>
            {sale.lines.map((l, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 4 }}>
                <div>{l.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{l.qty} x {l.price.toLocaleString()}</span><span>{(l.qty * l.price).toLocaleString()}</span></div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #000", padding: "6px 0", fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{net.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>VAT 16%</span><span>{vat.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 13, marginTop: 4 }}><span>TOTAL</span><span>KSh {sale.total.toLocaleString()}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span>Paid ({sale.mode})</span><span>{sale.total.toLocaleString()}</span></div>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, marginTop: 12, borderTop: "1px dashed #000", paddingTop: 8 }}>Asante sana! · Goods once sold<br />are not returnable</div>
        </div>
        <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{ ...primaryBtn, background: C.amber, color: C.petrolDeep }}><Printer size={17} /> Print</button>
          <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: "white", color: C.ink, fontWeight: 700, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SalesRegister({ isMobile, sales, voidSale, onPrint }) {
  const [confirm, setConfirm] = useState(null);
  const total = sales.filter(s => !s.voided).reduce((a, s) => a + s.total, 0);
  const doVoid = (id) => { voidSale(id); setConfirm(null); };
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>Sales register</div>
        <div style={{ fontWeight: 800 }}>{money(total)}</div>
      </div>
      {sales.map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.line}`, opacity: s.voided ? 0.5 : 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, textDecoration: s.voided ? "line-through" : "none" }}>{s.id} {s.voided && <span style={{ color: C.red, fontSize: 11, fontWeight: 700 }}> VOIDED</span>}</div>
            <div style={{ fontSize: 12, color: C.sub }}>{s.customer} · {s.time} · {s.mode}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{money(s.total)}</div>
          {!s.voided && (
            <div style={{ display: "flex", gap: 4 }}>
              {s.lines && s.lines.length > 0 && <button onClick={() => onPrint(s)} title="Print" style={{ ...iconBtn, border: `1px solid ${C.line}`, borderRadius: 7, width: 32, height: 32 }}><Printer size={15} /></button>}
              <button onClick={() => setConfirm(s.id)} title="Void" style={{ ...iconBtn, border: `1px solid ${C.line}`, borderRadius: 7, width: 32, height: 32, color: C.red }}><Ban size={15} /></button>
            </div>
          )}
        </div>
      ))}
      {sales.length === 0 && <Empty text="No sales yet." />}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(10,30,35,0.6)", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 14, padding: 24, maxWidth: 360 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Void {confirm}?</div>
            <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 18 }}>This reverses the sale's accounting entries and returns the items to stock. The voided invoice stays on record for audit.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => doVoid(confirm)} style={{ ...primaryBtn, background: C.red }}><Ban size={16} /> Void sale</button>
              <button onClick={() => setConfirm(null)} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesReports({ isMobile, sales, quotations }) {
  const [rep, setRep] = useState("register");
  const active = sales.filter(s => !s.voided);
  const voided = sales.filter(s => s.voided);
  const total = active.reduce((a, s) => a + s.total, 0);
  const byMop = {};
  active.forEach(s => { byMop[s.mode] = (byMop[s.mode] || 0) + s.total; });
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["register", "Sale Register"], ["mop", "Sales by MOP"], ["voids", "Voided Sales"], ["quotes", "Quotation Report"]].map(([k, l]) => (
          <button key={k} onClick={() => setRep(k)} style={{ padding: "8px 13px", borderRadius: 9, border: `1px solid ${rep === k ? C.petrol : C.line}`, background: rep === k ? "#EAF2F3" : C.card, color: rep === k ? C.petrol : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {rep === "register" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}><span style={{ fontWeight: 700 }}>Sale register · {active.length} invoices</span><span style={{ fontWeight: 800 }}>{money(total)}</span></div>
          <Table cols={["Invoice", "Customer", "Items", "MOP", "Time", "Total"]} widths={["1fr", "1.6fr", "0.5fr", "0.9fr", "0.7fr", "1fr"]}
            rows={active.map(s => [s.id, <b>{s.customer}</b>, s.items, s.mode, s.time, <span style={{ fontWeight: 700 }}>{money(s.total)}</span>])} />
        </div>
      )}
      {rep === "mop" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <SectionHead title="Sales by mode of payment" />
            {Object.entries(byMop).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
              <div key={m} style={{ padding: "12px 18px", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{m}</span><span style={{ fontWeight: 700 }}>{money(v)}</span></div>
                <div style={{ height: 6, background: C.canvas, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${total ? (v / total * 100) : 0}%`, height: "100%", background: C.petrol }} /></div>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Summary</div>
            <Line label="Invoices" v={active.length} />
            <Line label="Gross sales" v={money(total)} />
            <Line label="Avg. invoice" v={money(active.length ? Math.round(total / active.length) : 0)} />
            <Line label="Net (excl. VAT)" v={money(splitVAT(total).net)} />
            <Line label="VAT collected" v={money(splitVAT(total).vat)} />
          </div>
        </div>
      )}
      {rep === "voids" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title={`Voided sales · ${voided.length}`} />
          {voided.length === 0 ? <Empty text="No voided sales." /> :
            <Table cols={["Invoice", "Customer", "MOP", "Total"]} widths={["1fr", "1.6fr", "1fr", "1fr"]}
              rows={voided.map(s => [<span style={{ textDecoration: "line-through" }}>{s.id}</span>, s.customer, s.mode, <span style={{ color: C.red }}>{money(s.total)}</span>])} />}
        </div>
      )}
      {rep === "quotes" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title={`Quotation report · ${quotations.length}`} />
          {quotations.length === 0 ? <Empty text="No quotations yet." /> :
            <Table cols={["Quote", "Date", "Customer", "Items", "Total", "Status"]} widths={["0.9fr", "0.8fr", "1.4fr", "0.5fr", "1fr", "0.9fr"]}
              rows={quotations.map(q => [<b>{q.id}</b>, fmtDate(q.date), q.customer, q.lines.length, <span style={{ fontWeight: 700 }}>{money(q.total)}</span>,
                <Pill s={q.converted ? { label: "Converted", color: C.greenDeep, bg: "#D7EFEA" } : { label: "Open", color: C.amberDeep, bg: "#FCEBD6" }} />])} />}
        </div>
      )}
    </div>
  );
}

/* Quotations */
function Quotations({ isMobile, products, customers, quotations, setQuotations, postSale, onPrint, sales }) {
  const [form, setForm] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [lines, setLines] = useState([{ productId: products[0]?.id || "", qty: 1 }]);
  const addLine = () => setLines(l => [...l, { productId: products[0]?.id || "", qty: 1 }]);
  const setLine = (i, k, v) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: v } : ln));
  const rmLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const cust = customers.find(c => c.id === customerId);

  const save = () => {
    const clean = lines.filter(l => l.productId && Number(l.qty) > 0).map(l => {
      const p = products.find(x => x.id === l.productId);
      return { productId: l.productId, name: p?.name || "", qty: Number(l.qty), price: p?.price || 0, salesAcct: p?.salesAcct || "4000" };
    });
    if (!clean.length) return;
    const total = clean.reduce((a, l) => a + l.qty * l.price, 0);
    setQuotations(prev => [{ id: uid("QT"), date: new Date().toISOString(), customerId, customer: cust?.name || "", lines: clean, total, converted: false }, ...prev]);
    setForm(false); setLines([{ productId: products[0]?.id || "", qty: 1 }]);
  };

  const convert = (q) => {
    const ref = postSale({ customerId: q.customerId, customerName: q.customer, cart: q.lines.map(l => ({ id: l.productId, name: l.name, price: l.price, salesAcct: l.salesAcct, qty: l.qty })), mopName: "Credit Sale", mopAcct: "1200" });
    setQuotations(prev => prev.map(x => x.id === q.id ? { ...x, converted: true, invoiceId: ref } : x));
  };

  return (
    <div>
      {!form && <button onClick={() => setForm(true)} style={{ ...primaryBtn, marginBottom: 14 }}><Plus size={17} /> New quotation</button>}
      {form && (
        <FormCard title="New quotation" onCancel={() => setForm(false)} onSave={save} saveLabel="Save quotation">
          <Field label="Customer"><select style={inp} value={customerId} onChange={e => setCustomerId(e.target.value)}>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <FieldGroup label="Items">
            {lines.map((ln, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 70px 30px" : "1fr 100px 34px", gap: 8, marginBottom: 8 }}>
                <select style={inp} value={ln.productId} onChange={e => setLine(i, "productId", e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select>
                <input style={inp} type="number" value={ln.qty} onChange={e => setLine(i, "qty", e.target.value)} placeholder="Qty" />
                <button onClick={() => rmLine(i)} style={{ ...iconBtn, color: C.red }} disabled={lines.length <= 1}><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={addLine} style={ghostBtn}><Plus size={15} /> Add item</button>
          </FieldGroup>
        </FormCard>
      )}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${quotations.length} quotations`} />
        {quotations.length === 0 && <Empty text="No quotations yet." />}
        {quotations.map(q => (
          <div key={q.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{q.id} · <span style={{ fontWeight: 500, color: C.sub }}>{fmtDate(q.date)}</span></div>
              <div style={{ fontSize: 13 }}>{q.customer} · {q.lines.length} item(s)</div>
            </div>
            <div style={{ fontWeight: 700 }}>{money(q.total)}</div>
            <Pill s={q.converted ? { label: "Converted", color: C.greenDeep, bg: "#D7EFEA" } : { label: "Open", color: C.amberDeep, bg: "#FCEBD6" }} />
            {!q.converted && <button onClick={() => convert(q)} style={{ ...primaryBtn, fontSize: 12, padding: "8px 12px" }}><ArrowRight size={14} /> Convert to sale</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Riders (with notifications + expanded reports) ---------------- */
function Riders({ isMobile, orders, setOrders }) {
  const [tab, setTab] = useState("board");
  const [assigning, setAssigning] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const rn = (id) => RIDERS.find(r => r.id === id)?.name ?? "—";
  const assign = (oid, rid) => {
    const o = orders.find(x => x.id === oid);
    setOrders(prev => prev.map(x => x.id === oid ? { ...x, status: "assigned", riderId: rid, assignedAt: new Date().toISOString() } : x));
    setAssigning(null);
    if (o) notifyAssigned(rn(rid), o.customer, o.area);
  };
  const advance = (oid) => setOrders(prev => prev.map(x => {
    if (x.id !== oid) return x;
    if (x.status === "assigned") return { ...x, status: "picked", pickedAt: new Date().toISOString() };
    if (x.status === "picked") {
      notifyDelivered(rn(x.riderId), x.customer, x.area);
      return { ...x, status: "delivered", deliveredAt: new Date().toISOString() };
    }
    return x;
  }));
  const addOrder = (data) => { setOrders(o => [{ id: uid("DEL"), ...data, status: "unassigned", riderId: null, assignedAt: null, pickedAt: null, deliveredAt: null }, ...o]); setShowNew(false); };
  const delivered = useMemo(() => orders.filter(o => o.status === "delivered"), [orders]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["board", "Delivery board"], ["reports", "Reports"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${tab === k ? C.petrol : C.line}`, background: tab === k ? C.petrol : C.card, color: tab === k ? "white" : C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowNew(true)} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: C.amber, color: C.petrolDeep, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={17} /> New delivery</button>
      </div>
      {showNew && <NewDelivery isMobile={isMobile} onSave={addOrder} onCancel={() => setShowNew(false)} />}

      {tab === "board" && (
        <div style={{ display: "grid", gap: 12 }}>
          {orders.map(o => {
            const s = STATUS[o.status];
            return (
              <div key={o.id} style={{ ...card, padding: isMobile ? 16 : 18 }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 12, justifyContent: "space-between" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontWeight: 800, fontSize: 15 }}>{o.id}</span><Pill s={s} /></div>
                    <div style={{ fontSize: 14, marginTop: 6, fontWeight: 600 }}>{o.customer}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}><MapPin size={13} /> {o.area} · {o.items}</div>
                    {o.riderId && <div style={{ fontSize: 13, marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: C.petrol, fontWeight: 600 }}><Bike size={15} /> {rn(o.riderId)}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row" }}>
                    {o.status === "unassigned" && (assigning === o.id ? (
                      <div style={{ display: "grid", gap: 6, minWidth: isMobile ? "100%" : 180 }}>
                        {RIDERS.map(r => <button key={r.id} onClick={() => assign(o.id, r.id)} style={{ background: C.canvas, border: `1px solid ${C.line}`, borderRadius: 9, padding: "10px 12px", cursor: "pointer", fontSize: 13, textAlign: "left", fontWeight: 600 }}>{r.name}</button>)}
                      </div>
                    ) : <BigBtn color={C.amber} text={C.petrolDeep} onClick={() => setAssigning(o.id)} full={isMobile} icon={<Bike size={18} />}>Assign rider</BigBtn>)}
                    {o.status === "assigned" && <BigBtn color={C.blue} onClick={() => advance(o.id)} full={isMobile} icon={<ArrowRight size={18} />}>Left with package</BigBtn>}
                    {o.status === "picked" && <BigBtn color={C.green} onClick={() => advance(o.id)} full={isMobile} icon={<CheckCircle2 size={18} />}>Mark delivered</BigBtn>}
                    {o.status === "delivered" && <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.greenDeep, fontWeight: 700, fontSize: 14, justifyContent: "center", padding: isMobile ? "10px" : 0 }}><CheckCircle2 size={18} /> Delivered</div>}
                  </div>
                </div>
                {o.assignedAt && (
                  <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.sub, flexWrap: "wrap" }}>
                    <Stamp label="Assigned" t={o.assignedAt} /><Stamp label="Left" t={o.pickedAt} /><Stamp label="Delivered" t={o.deliveredAt} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "reports" && <RiderReports isMobile={isMobile} orders={orders} delivered={delivered} rn={rn} />}
    </div>
  );
}

function RiderReports({ isMobile, orders, delivered, rn }) {
  const [rep, setRep] = useState("summary");
  const reps = [
    { k: "summary", label: "Summary", icon: BarChart2 },
    { k: "log", label: "Delivery Log", icon: ScrollText },
    { k: "rider", label: "Rider Performance", icon: Bike },
    { k: "area", label: "By Area", icon: MapPin },
    { k: "time", label: "Delivery Times", icon: Timer },
  ];

  // rider performance
  const byRider = {};
  delivered.forEach(o => {
    const r = rn(o.riderId);
    byRider[r] = byRider[r] || { count: 0, totalMins: 0 };
    byRider[r].count++;
    const m = mins(o.pickedAt, o.deliveredAt);
    if (m != null) byRider[r].totalMins += m;
  });

  // by area
  const byArea = {};
  orders.forEach(o => { byArea[o.area] = byArea[o.area] || { total: 0, delivered: 0 }; byArea[o.area].total++; if (o.status === "delivered") byArea[o.area].delivered++; });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {reps.map(r => (
          <button key={r.k} onClick={() => setRep(r.k)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: `1px solid ${rep === r.k ? C.petrol : C.line}`, background: rep === r.k ? "#EAF2F3" : C.card, color: rep === r.k ? C.petrol : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <r.icon size={15} /> {r.label}
          </button>
        ))}
      </div>

      {rep === "summary" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
            {[["Total deliveries", orders.length], ["Delivered", delivered.length], ["In progress", orders.filter(o => o.status === "assigned" || o.status === "picked").length], ["Unassigned", orders.filter(o => o.status === "unassigned").length]].map(([l, v]) => (
              <div key={l} style={{ ...card, padding: 16 }}><div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 12, color: C.sub }}>{l}</div></div>
            ))}
          </div>
          <ExportBar title="Delivery_Summary" cols={["ID", "Customer", "Area", "Rider", "Status", "Assigned", "Delivered"]} rows={orders.map(o => [o.id, o.customer, o.area, rn(o.riderId), o.status, fmt(o.assignedAt), fmt(o.deliveredAt)])} />
        </div>
      )}

      {rep === "log" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Delivery log" />
          {delivered.length === 0 && <Empty text="No completed deliveries yet." />}
          {delivered.map(o => (
            <Row key={o.id}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{o.id} · <span style={{ fontWeight: 500 }}>{o.customer}</span></div><div style={{ fontSize: 12, color: C.sub }}>{rn(o.riderId)} · {o.area} · {o.items}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(o.deliveredAt)}</div><div style={{ fontSize: 11, color: C.sub }}>{mins(o.pickedAt, o.deliveredAt) != null ? `${mins(o.pickedAt, o.deliveredAt)} min trip` : "—"}</div></div>
            </Row>
          ))}
          <ExportBar title="Delivery_Log" cols={["ID", "Customer", "Area", "Rider", "Items", "Delivered At", "Trip Mins"]} rows={delivered.map(o => [o.id, o.customer, o.area, rn(o.riderId), o.items, fmt(o.deliveredAt), mins(o.pickedAt, o.deliveredAt)])} />
        </div>
      )}

      {rep === "rider" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Rider performance" />
          {Object.keys(byRider).length === 0 ? <Empty text="No completed deliveries to measure." /> :
            <Table cols={["Rider", "Deliveries", "Total time", "Avg. time"]} widths={["1.4fr", "0.8fr", "0.9fr", "0.9fr"]}
              rows={Object.entries(byRider).map(([r, d]) => [<b>{r}</b>, d.count, `${d.totalMins} min`, `${d.count ? Math.round(d.totalMins / d.count) : 0} min`])} />}
        </div>
      )}

      {rep === "area" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Deliveries by area" />
          <Table cols={["Area", "Total", "Delivered", "Completion"]} widths={["1.4fr", "0.7fr", "0.7fr", "1fr"]}
            rows={Object.entries(byArea).map(([a, d]) => [<b>{a}</b>, d.total, d.delivered, <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, height: 6, background: C.canvas, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${d.total ? (d.delivered / d.total * 100) : 0}%`, height: "100%", background: C.green }} /></div><span style={{ fontSize: 12, fontWeight: 600 }}>{d.total ? Math.round(d.delivered / d.total * 100) : 0}%</span></div>])} />
        </div>
      )}

      {rep === "time" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Delivery time analysis" />
          {delivered.length === 0 ? <Empty text="No completed deliveries." /> :
            <Table cols={["Delivery", "Customer", "Area", "Rider", "Assign→Left", "Left→Delivered", "Total"]} widths={["0.9fr", "1.2fr", "0.9fr", "1fr", "0.8fr", "0.9fr", "0.7fr"]}
              rows={delivered.map(o => {
                const a2p = mins(o.assignedAt, o.pickedAt), p2d = mins(o.pickedAt, o.deliveredAt), tot = mins(o.assignedAt, o.deliveredAt);
                return [o.id, o.customer, o.area, rn(o.riderId), a2p != null ? `${a2p} min` : "—", p2d != null ? `${p2d} min` : "—", tot != null ? `${tot} min` : "—"];
              })} />}
          <ExportBar title="Delivery_Times" cols={["ID", "Customer", "Area", "Rider", "Assign→Left", "Left→Delivered", "Total"]} rows={delivered.map(o => [o.id, o.customer, o.area, rn(o.riderId), mins(o.assignedAt, o.pickedAt), mins(o.pickedAt, o.deliveredAt), mins(o.assignedAt, o.deliveredAt)])} />
        </div>
      )}
    </div>
  );
}

function NewDelivery({ isMobile, onSave, onCancel }) {
  const [customer, setCustomer] = useState(""); const [area, setArea] = useState(""); const [items, setItems] = useState("");
  return (
    <div style={{ ...card, padding: isMobile ? 16 : 20, marginBottom: 14, border: `1.5px solid ${C.amber}` }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>New delivery</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 10 }}>
        <input placeholder="Customer name" value={customer} onChange={e => setCustomer(e.target.value)} style={inp} />
        <input placeholder="Area / destination" value={area} onChange={e => setArea(e.target.value)} style={inp} />
      </div>
      <input placeholder="Items (e.g. 20x 4ft LED Tube, 6x Flood Fitting)" value={items} onChange={e => setItems(e.target.value)} style={{ ...inp, marginTop: 10 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => customer && onSave({ customer, area: area || "—", items: items || "—" })} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: C.petrol, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Create delivery</button>
        <button onClick={onCancel} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
      </div>
      <Hint>Dispatch can create and assign deliveries here even if the shop loses power — this runs in the cloud, independent of Fusion.</Hint>
    </div>
  );
}

/* ---------------- Purchases: PO + Invoice/GRN + Reports ---------------- */
function Purchases({ isMobile, products, suppliers, purchaseOrders, setPurchaseOrders, purchaseInvoices, postPurchase, deletePurchase }) {
  const [tab, setTab] = useState("po");
  const tabs = [
    { k: "po", label: "Purchase Order", icon: ClipboardCheck },
    { k: "invoice", label: "Purchase Invoice / GRN", icon: ArrowDownToLine },
    { k: "reports", label: "Reports", icon: FileBarChart },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${tab === t.k ? C.petrol : C.line}`, background: tab === t.k ? C.petrol : C.card, color: tab === t.k ? "white" : C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "po" && <PurchaseOrderTab isMobile={isMobile} products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} />}
      {tab === "invoice" && <PurchaseInvoiceTab isMobile={isMobile} products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} purchaseInvoices={purchaseInvoices} postPurchase={postPurchase} deletePurchase={deletePurchase} />}
      {tab === "reports" && <PurchaseReports isMobile={isMobile} purchaseOrders={purchaseOrders} purchaseInvoices={purchaseInvoices} />}
    </div>
  );
}

function PurchaseOrderTab({ isMobile, products, suppliers, purchaseOrders, setPurchaseOrders }) {
  const [form, setForm] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [lines, setLines] = useState([{ productId: products[0]?.id || "", qty: 1 }]);
  const addLine = () => setLines(l => [...l, { productId: products[0]?.id || "", qty: 1 }]);
  const setLine = (i, k, v) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: v } : ln));
  const rmLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const sup = suppliers.find(s => s.id === supplierId);

  const save = () => {
    const clean = lines.filter(l => l.productId && Number(l.qty) > 0).map(l => {
      const p = products.find(x => x.id === l.productId);
      return { productId: l.productId, name: p?.name || "", qty: Number(l.qty), cost: p?.cost || 0 };
    });
    if (!clean.length) return;
    const total = clean.reduce((a, l) => a + l.qty * l.cost, 0);
    setPurchaseOrders(prev => [{ id: uid("PO"), date: new Date().toISOString(), supplierId, supplierName: sup?.name || "", lines: clean, total, status: "Open" }, ...prev]);
    setForm(false); setLines([{ productId: products[0]?.id || "", qty: 1 }]);
  };

  return (
    <div>
      {!form && <button onClick={() => setForm(true)} style={{ ...primaryBtn, marginBottom: 14 }}><Plus size={17} /> New purchase order</button>}
      {form && (
        <FormCard title="New purchase order" onCancel={() => setForm(false)} onSave={save} saveLabel="Raise PO">
          <Field label="Supplier"><select style={inp} value={supplierId} onChange={e => setSupplierId(e.target.value)}>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <FieldGroup label="Items ordered">
            {lines.map((ln, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 70px 30px" : "1fr 100px 34px", gap: 8, marginBottom: 8 }}>
                <select style={inp} value={ln.productId} onChange={e => setLine(i, "productId", e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.name} — cost {money(p.cost)}</option>)}</select>
                <input style={inp} type="number" value={ln.qty} onChange={e => setLine(i, "qty", e.target.value)} placeholder="Qty" />
                <button onClick={() => rmLine(i)} style={{ ...iconBtn, color: C.red }} disabled={lines.length <= 1}><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={addLine} style={ghostBtn}><Plus size={15} /> Add item</button>
          </FieldGroup>
        </FormCard>
      )}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${purchaseOrders.length} purchase orders`} />
        {purchaseOrders.length === 0 && <Empty text="No purchase orders yet." />}
        {purchaseOrders.map(po => (
          <div key={po.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{po.id} · <span style={{ fontWeight: 500, color: C.sub }}>{fmtDate(po.date)}</span></div>
              <div style={{ fontSize: 13 }}>{po.supplierName} · {po.lines.length} item(s)</div>
            </div>
            <div style={{ fontWeight: 700 }}>{money(po.total)}</div>
            <Pill s={po.status === "Received" ? { label: "Received", color: C.greenDeep, bg: "#D7EFEA" } : { label: "Open", color: C.amberDeep, bg: "#FCEBD6" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchaseInvoiceTab({ isMobile, products, suppliers, purchaseOrders, purchaseInvoices, postPurchase, deletePurchase }) {
  const [mode, setMode] = useState("po"); // po = from PO, direct = standalone
  const [selPO, setSelPO] = useState("");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [warehouse, setWarehouse] = useState("W-01");
  const [lines, setLines] = useState([{ productId: products[0]?.id || "", qty: 1 }]);
  const [done, setDone] = useState(null);
  const openPOs = purchaseOrders.filter(po => po.status === "Open");
  const po = openPOs.find(p => p.id === selPO);

  const addLine = () => setLines(l => [...l, { productId: products[0]?.id || "", qty: 1 }]);
  const setLine = (i, k, v) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: v } : ln));
  const rmLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));

  const doPost = () => {
    if (mode === "po" && po) {
      const ref = postPurchase({ supplierId: po.supplierId, supplierName: po.supplierName, lines: po.lines, poId: po.id, warehouse });
      setDone(ref); setSelPO("");
    } else {
      const sup = suppliers.find(s => s.id === supplierId);
      const clean = lines.filter(l => l.productId && Number(l.qty) > 0).map(l => {
        const p = products.find(x => x.id === l.productId);
        return { productId: l.productId, name: p?.name || "", qty: Number(l.qty), cost: p?.cost || 0 };
      });
      if (!clean.length) return;
      const ref = postPurchase({ supplierId, supplierName: sup?.name || "", lines: clean, warehouse });
      setDone(ref); setLines([{ productId: products[0]?.id || "", qty: 1 }]);
    }
  };

  return (
    <div>
      <div style={{ ...card, padding: 18, marginBottom: 16 }}>
        {done && <div style={{ background: "#D7EFEA", color: C.greenDeep, padding: "10px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={16} /> Posted {done} — stock increased, creditor updated</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          {[["po", "From purchase order"], ["direct", "Direct / standalone"]].map(([k, l]) => <button key={k} onClick={() => { setMode(k); setDone(null); }} style={{ padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${mode === k ? C.petrol : C.line}`, background: mode === k ? "#EAF2F3" : C.card, color: mode === k ? C.petrol : C.ink }}>{l}</button>)}
        </div>
        {mode === "po" && (
          <>
            {openPOs.length === 0 ? <Hint>No open purchase orders. Raise one first, or switch to Direct.</Hint> : (
              <Field label="Select open PO"><select style={inp} value={selPO} onChange={e => setSelPO(e.target.value)}>
                <option value="">Pick a PO…</option>
                {openPOs.map(p => <option key={p.id} value={p.id}>{p.id} · {p.supplierName} · {p.lines.length} items · {money(p.total)}</option>)}
              </select></Field>
            )}
            {po && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 8 }}>{po.lines.map(l => `${l.qty}× ${l.name}`).join(", ")}</div>
                <Field label="Receive into warehouse"><select style={inp} value={warehouse} onChange={e => setWarehouse(e.target.value)}>{WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
              </div>
            )}
          </>
        )}
        {mode === "direct" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <Field label="Supplier"><select style={inp} value={supplierId} onChange={e => setSupplierId(e.target.value)}>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Receive into warehouse"><select style={inp} value={warehouse} onChange={e => setWarehouse(e.target.value)}>{WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
            </div>
            <FieldGroup label="Items received">
              {lines.map((ln, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 70px 30px" : "1fr 100px 34px", gap: 8, marginBottom: 8 }}>
                  <select style={inp} value={ln.productId} onChange={e => setLine(i, "productId", e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.name} — cost {money(p.cost)}</option>)}</select>
                  <input style={inp} type="number" value={ln.qty} onChange={e => setLine(i, "qty", e.target.value)} placeholder="Qty" />
                  <button onClick={() => rmLine(i)} style={{ ...iconBtn, color: C.red }} disabled={lines.length <= 1}><Trash2 size={16} /></button>
                </div>
              ))}
              <button onClick={addLine} style={ghostBtn}><Plus size={15} /> Add item</button>
            </FieldGroup>
          </>
        )}
        <button onClick={doPost} disabled={mode === "po" ? !po : lines.every(l => !l.productId)} style={{ ...primaryBtn, marginTop: 14 }}><ArrowDownToLine size={17} /> Post GRN & invoice</button>
        <Hint>Posting a purchase invoice increases stock in the selected warehouse, debits Purchases + VAT Input, and credits the supplier (Sundry Creditors). This is both GRN and invoice in one step — matching Fusion's behaviour.</Hint>
      </div>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${purchaseInvoices.length} purchase invoices`} />
        {purchaseInvoices.length === 0 && <Empty text="No purchase invoices yet. Post one above." />}
        {purchaseInvoices.map(pi => (
          <div key={pi.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{pi.id} · <span style={{ fontWeight: 500, color: C.sub }}>{fmtDate(pi.date)}</span></div><div style={{ fontSize: 13 }}>{pi.supplierName}{pi.poId ? ` · from ${pi.poId}` : ""}</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{money(pi.total)}</div>
                <button onClick={() => deletePurchase(pi.id)} title="Delete" style={{ ...iconBtn, border: `1px solid ${C.line}`, borderRadius: 7, width: 32, height: 32, color: C.red }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{pi.lines.map(l => `${l.qty}× ${l.name}`).join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchaseReports({ isMobile, purchaseOrders, purchaseInvoices }) {
  const [rep, setRep] = useState("poReg");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["poReg", "PO Register"], ["piReg", "Purchase Register"]].map(([k, l]) => (
          <button key={k} onClick={() => setRep(k)} style={{ padding: "8px 13px", borderRadius: 9, border: `1px solid ${rep === k ? C.petrol : C.line}`, background: rep === k ? "#EAF2F3" : C.card, color: rep === k ? C.petrol : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {rep === "poReg" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title={`Purchase order register · ${purchaseOrders.length}`} />
          {purchaseOrders.length === 0 ? <Empty text="No purchase orders." /> :
            <Table cols={["PO", "Date", "Supplier", "Items", "Total", "Status"]} widths={["0.9fr", "0.8fr", "1.4fr", "0.5fr", "1fr", "0.9fr"]}
              rows={purchaseOrders.map(po => [<b>{po.id}</b>, fmtDate(po.date), po.supplierName, po.lines.length, <span style={{ fontWeight: 700 }}>{money(po.total)}</span>,
                <Pill s={po.status === "Received" ? { label: "Received", color: C.greenDeep, bg: "#D7EFEA" } : { label: "Open", color: C.amberDeep, bg: "#FCEBD6" }} />])} />}
        </div>
      )}
      {rep === "piReg" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title={`Purchase register · ${purchaseInvoices.length}`} />
          {purchaseInvoices.length === 0 ? <Empty text="No purchase invoices." /> :
            <Table cols={["Invoice", "Date", "Supplier", "From PO", "Total", "VAT"]} widths={["1fr", "0.8fr", "1.4fr", "0.9fr", "1fr", "0.8fr"]}
              rows={purchaseInvoices.map(pi => [<b>{pi.id}</b>, fmtDate(pi.date), pi.supplierName, pi.poId || "—", <span style={{ fontWeight: 700 }}>{money(pi.total)}</span>, money(pi.vat)])} />}
        </div>
      )}
    </div>
  );
}

/* ---------------- Transaction Log (void receipts/payments/journals) --------- */
function TransactionLog({ isMobile, journal, voidFinTxn }) {
  const [confirm, setConfirm] = useState(null);
  const txns = journal.filter(e => ["Receipt", "Payment", "Journal", "Void", "Delete"].includes(e.type)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const isVoided = (ref) => journal.some(e => e.ref === `VOID-${ref}`);
  const doVoid = (ref) => { voidFinTxn(ref); setConfirm(null); };
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <SectionHead title={`${txns.length} financial transactions`} />
      {txns.length === 0 && <Empty text="No receipts, payments, or journals posted yet." />}
      {txns.map(e => {
        const voided = isVoided(e.ref) || e.type === "Void" || e.type === "Delete";
        const tint = e.type === "Receipt" ? C.green : e.type === "Payment" ? C.red : e.type === "Void" || e.type === "Delete" ? C.sub : C.blue;
        return (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.line}`, opacity: voided ? 0.5 : 1 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: tint, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, textDecoration: voided ? "line-through" : "none" }}>{e.ref} · {e.type}{voided && e.type !== "Void" && e.type !== "Delete" ? " (voided)" : ""}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{fmtDate(e.date)} · {e.narration}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{money(e.lines.reduce((a, l) => a + (l.dr || 0), 0))}</div>
            {!voided && e.type !== "Opening" && (
              <button onClick={() => setConfirm(e.ref)} title="Void" style={{ ...iconBtn, border: `1px solid ${C.line}`, borderRadius: 7, width: 32, height: 32, color: C.red }}><Ban size={15} /></button>
            )}
          </div>
        );
      })}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(10,30,35,0.6)", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 14, padding: 24, maxWidth: 360 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Void {confirm}?</div>
            <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 18 }}>This reverses the transaction's accounting entries. The voided entry stays on record for audit.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => doVoid(confirm)} style={{ ...primaryBtn, background: C.red }}><Ban size={16} /> Void</button>
              <button onClick={() => setConfirm(null)} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ExportBar title="Financial_Transactions" cols={["Ref", "Date", "Type", "Narration", "Amount"]} rows={txns.map(e => [e.ref, fmtDate(e.date), e.type, e.narration, e.lines.reduce((a, l) => a + (l.dr || 0), 0)])} />
    </div>
  );
}

/* ---------------- AI Advisor ---------------- */
function AIAdvisor({ isMobile, sales, products, totalStock, customers, customerBalance }) {
  const lowStock = products.filter(p => totalStock(p.id) <= p.reorder);
  const topDebtors = customers.filter(c => customerBalance(c.id) > 0).sort((a, b) => customerBalance(b.id) - customerBalance(a.id));
  const totalSales = sales.filter(s => !s.voided).reduce((a, s) => a + s.total, 0);
  const topProducts = {};
  sales.filter(s => !s.voided && s.lines).forEach(s => s.lines.forEach(l => { topProducts[l.name] = (topProducts[l.name] || 0) + l.qty; }));
  const sorted = Object.entries(topProducts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const insights = [
    lowStock.length > 0 && { icon: AlertTriangle, tint: C.red, title: `${lowStock.length} product(s) at or below reorder level`, detail: lowStock.map(p => `${p.name}: ${totalStock(p.id)} remaining (reorder at ${p.reorder})`).join(". "), action: "Consider raising a purchase order for these items to avoid stockouts." },
    topDebtors.length > 0 && { icon: Users, tint: C.amber, title: `${topDebtors.length} customer(s) with outstanding balances`, detail: topDebtors.slice(0, 3).map(c => `${c.name}: ${money(customerBalance(c.id))}`).join(". "), action: "Follow up on overdue accounts, especially those approaching their credit limit." },
    sorted.length > 0 && { icon: TrendingUp, tint: C.green, title: "Top-selling products (this session)", detail: sorted.map(([n, q]) => `${n}: ${q} units`).join(", "), action: "These are your fast movers — ensure stock levels match demand velocity." },
    totalSales > 0 && { icon: Receipt, tint: C.blue, title: `Session revenue: ${money(totalSales)}`, detail: `Across ${sales.filter(s => !s.voided).length} invoices.`, action: "Review your Sales by MOP report to understand payment channel mix." },
  ].filter(Boolean);

  return (
    <div>
      <div style={{ ...card, padding: 20, marginBottom: 16, border: `1.5px solid #c084fc`, background: "linear-gradient(135deg, #faf5ff, #f3e8ff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#7c3aed", display: "grid", placeItems: "center" }}><Sparkles size={22} color="white" /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#4c1d95" }}>AI Business Advisor</div>
            <div style={{ fontSize: 12.5, color: "#6b21a8" }}>Insights based on your current data</div>
          </div>
        </div>
        <div style={{ background: "#ede9fe", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#5b21b6", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b>Disclaimer:</b> These insights are generated from the data currently in this demo session. In the live system, the AI advisor will integrate with your full Fusion database, historical trends, seasonality patterns, and supplier lead times to provide actionable, data-driven recommendations. More data = better advice.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {insights.length === 0 && (
          <div style={{ ...card, padding: 24, textAlign: "center" }}>
            <Sparkles size={28} color="#7c3aed" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No insights yet</div>
            <div style={{ fontSize: 13, color: C.sub }}>Make some sales, create products, and post purchases — the advisor generates insights as your data grows.</div>
          </div>
        )}
        {insights.map((ins, i) => (
          <div key={i} style={{ ...card, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: ins.tint + "22", display: "grid", placeItems: "center", flexShrink: 0 }}><ins.icon size={18} color={ins.tint} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{ins.title}</div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 8 }}>{ins.detail}</div>
                <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={14} /> {ins.action}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- User Master ---------------- */
function UserMaster({ isMobile, users, upsertUser }) {
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", email: "", role: ROLES[0], active: true });
  const openForm = (u) => { if (u) { setF(u); setEditing(u); } else { setF({ name: "", email: "", role: ROLES[0], active: true }); setEditing(null); } setForm(true); };
  const save = () => {
    if (!f.name) return;
    upsertUser(editing ? f : { ...f, id: uid("U") });
    setForm(false); setEditing(null);
  };
  return (
    <div>
      {form && (
        <FormCard title={editing ? `Edit ${editing.name}` : "New user"} onCancel={() => { setForm(false); setEditing(null); }} onSave={save} saveLabel={editing ? "Save changes" : "Create user"}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <Field label="Full name *"><input style={inp} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
            <Field label="Email"><input style={inp} value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="Role"><select style={inp} value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Status"><select style={inp} value={String(f.active)} onChange={e => setF(p => ({ ...p, active: e.target.value === "true" }))}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
          </div>
          <Hint>Roles control access — Owner sees everything; Cashier sees POS + Sales; Storekeeper sees Warehouse + Products; Dispatch sees Rider Delivery. In the live build, role permissions enforce via the API.</Hint>
        </FormCard>
      )}
      {!form && <button onClick={() => openForm(null)} style={{ ...primaryBtn, marginBottom: 14 }}><Plus size={17} /> New user</button>}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <SectionHead title={`${users.length} users`} />
        {users.map(u => (
          <div key={u.id} onClick={() => openForm(u)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.line}`, opacity: u.active ? 1 : 0.5 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.active ? C.petrol : C.sub, display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 14 }}>{u.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name} {!u.active && <span style={{ fontSize: 11, color: C.red }}>(inactive)</span>}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{u.email}</div>
            </div>
            <Pill s={{ label: u.role, color: C.petrol, bg: "#EAF2F3" }} />
            <Pencil size={15} color={C.sub} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Finance module ---------------- */
function Finance({ isMobile, journal, postJournal, customers, suppliers, customerBalance, supplierBalance, acctBalance, voidFinTxn }) {
  const [tab, setTab] = useState("reports");
  const tabs = [
    { k: "coa", label: "Chart of Accounts", icon: BookOpen },
    { k: "receipt", label: "Receipt", icon: HandCoins },
    { k: "payment", label: "Payment", icon: Wallet },
    { k: "journal", label: "Journal", icon: FileText },
    { k: "txnlog", label: "Transactions", icon: ScrollText },
    { k: "reports", label: "Reports", icon: FileBarChart },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: `1.5px solid ${tab === t.k ? C.petrol : C.line}`, background: tab === t.k ? C.petrol : C.card, color: tab === t.k ? "white" : C.ink, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "coa" && <ChartOfAccounts acctBalance={acctBalance} />}
      {tab === "receipt" && <ReceiptForm isMobile={isMobile} customers={customers} customerBalance={customerBalance} postJournal={postJournal} />}
      {tab === "payment" && <PaymentForm isMobile={isMobile} suppliers={suppliers} supplierBalance={supplierBalance} postJournal={postJournal} />}
      {tab === "journal" && <JournalEntry isMobile={isMobile} postJournal={postJournal} journal={journal} />}
      {tab === "txnlog" && <TransactionLog isMobile={isMobile} journal={journal} voidFinTxn={voidFinTxn} />}
      {tab === "reports" && <FinanceReports isMobile={isMobile} journal={journal} customers={customers} suppliers={suppliers} customerBalance={customerBalance} supplierBalance={supplierBalance} acctBalance={acctBalance} />}
    </div>
  );
}

function ChartOfAccounts({ acctBalance }) {
  const groups = [...new Set(GL.map(a => a.group))];
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <SectionHead title={`Chart of accounts · ${GL.length} accounts`} />
      {groups.map(g => (
        <div key={g}>
          <div style={{ padding: "8px 18px", background: C.canvas, fontSize: 12, fontWeight: 700, color: C.petrol, textTransform: "uppercase", letterSpacing: 0.4 }}>{g}</div>
          {GL.filter(a => a.group === g).map(a => { const b = acctBalance(a.code); return (
            <div key={a.code} style={{ display: "flex", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 13.5 }}>
              <span><span style={{ color: C.sub, fontFamily: "monospace" }}>{a.code}</span> &nbsp;{a.name}</span>
              <span style={{ fontWeight: 700, color: b < 0 ? C.green : C.ink }}>{money(Math.abs(b))} {b < 0 ? "Cr" : b > 0 ? "Dr" : ""}</span>
            </div>
          ); })}
        </div>
      ))}
    </div>
  );
}

function ReceiptForm({ isMobile, customers, customerBalance, postJournal, }) {
  const owing = customers.filter(c => customerBalance(c.id) > 0);
  const [customerId, setCustomerId] = useState(owing[0]?.id || customers[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [bankAcct, setBankAcct] = useState("1020");
  const [done, setDone] = useState(null);
  const cust = customers.find(c => c.id === customerId);
  const bal = customerBalance(customerId);
  const save = () => {
    const amt = Number(amount); if (!amt || amt <= 0) return;
    const ref = jref("RCP");
    postJournal({ date: new Date().toISOString(), type: "Receipt", ref, narration: `Receipt from ${cust?.name}`, lines: [{ acct: bankAcct, dr: amt, cr: 0 }, { acct: "1200", dr: 0, cr: amt, customerId }] });
    setDone(ref); setAmount("");
  };
  return (
    <FinForm title="Customer receipt" subtitle="Money received from a debtor" icon={<HandCoins size={20} color={C.green} />} done={done} onSave={save} saveLabel="Post receipt">
      <Field label="Customer"><select style={inp} value={customerId} onChange={e => { setCustomerId(e.target.value); setDone(null); }}>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{customerBalance(c.id) > 0 ? ` — owes ${money(customerBalance(c.id))}` : ""}</option>)}</select></Field>
      {bal > 0 && <Hint>Current balance owing: <b style={{ color: C.red }}>{money(bal)}</b></Hint>}
      <div style={{ height: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <Field label="Amount received"><input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></Field>
        <Field label="Received into"><select style={inp} value={bankAcct} onChange={e => setBankAcct(e.target.value)}>{BANK_ACCTS.map(a => <option key={a} value={a}>{glName(a)}</option>)}</select></Field>
      </div>
      <PostingPreview lines={[{ acct: bankAcct, dr: Number(amount) || 0, cr: 0 }, { acct: "1200", dr: 0, cr: Number(amount) || 0 }]} />
    </FinForm>
  );
}

function PaymentForm({ isMobile, suppliers, supplierBalance, postJournal }) {
  const [mode, setMode] = useState("supplier"); // supplier | expense
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [expenseAcct, setExpenseAcct] = useState("6000");
  const [amount, setAmount] = useState("");
  const [bankAcct, setBankAcct] = useState("1030");
  const [done, setDone] = useState(null);
  const expenseAccts = GL.filter(a => a.nature === "expense");
  const sup = suppliers.find(s => s.id === supplierId);
  const save = () => {
    const amt = Number(amount); if (!amt || amt <= 0) return;
    const ref = jref("PMT");
    const debit = mode === "supplier" ? { acct: "2000", dr: amt, cr: 0, supplierId } : { acct: expenseAcct, dr: amt, cr: 0 };
    const narr = mode === "supplier" ? `Payment to ${sup?.name}` : `${GL.find(a => a.code === expenseAcct)?.name} paid`;
    postJournal({ date: new Date().toISOString(), type: "Payment", ref, narration: narr, lines: [debit, { acct: bankAcct, dr: 0, cr: amt }] });
    setDone(ref); setAmount("");
  };
  return (
    <FinForm title="Payment" subtitle="Money paid out — to a supplier or for an expense" icon={<Wallet size={20} color={C.red} />} done={done} onSave={save} saveLabel="Post payment">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        {[["supplier", "Pay supplier"], ["expense", "Pay expense"]].map(([k, l]) => <button key={k} onClick={() => { setMode(k); setDone(null); }} style={{ padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${mode === k ? C.petrol : C.line}`, background: mode === k ? "#EAF2F3" : C.card, color: mode === k ? C.petrol : C.ink }}>{l}</button>)}
      </div>
      {mode === "supplier"
        ? <><Field label="Supplier"><select style={inp} value={supplierId} onChange={e => setSupplierId(e.target.value)}>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name} — owed {money(supplierBalance(s.id))}</option>)}</select></Field><Hint>Owed to supplier: <b style={{ color: C.red }}>{money(supplierBalance(supplierId))}</b></Hint></>
        : <Field label="Expense account"><select style={inp} value={expenseAcct} onChange={e => setExpenseAcct(e.target.value)}>{expenseAccts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}</select></Field>}
      <div style={{ height: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <Field label="Amount"><input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></Field>
        <Field label="Paid from"><select style={inp} value={bankAcct} onChange={e => setBankAcct(e.target.value)}>{BANK_ACCTS.map(a => <option key={a} value={a}>{glName(a)}</option>)}</select></Field>
      </div>
      <PostingPreview lines={[mode === "supplier" ? { acct: "2000", dr: Number(amount) || 0, cr: 0 } : { acct: expenseAcct, dr: Number(amount) || 0, cr: 0 }, { acct: bankAcct, dr: 0, cr: Number(amount) || 0 }]} />
    </FinForm>
  );
}

function JournalEntry({ isMobile, postJournal, journal }) {
  const [lines, setLines] = useState([{ acct: "1010", dr: "", cr: "" }, { acct: "4000", dr: "", cr: "" }]);
  const [narration, setNarration] = useState("");
  const [done, setDone] = useState(null);
  const setLine = (i, k, v) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [k]: v } : ln));
  const addLine = () => setLines(l => [...l, { acct: "1010", dr: "", cr: "" }]);
  const rmLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const totDr = lines.reduce((a, l) => a + (Number(l.dr) || 0), 0);
  const totCr = lines.reduce((a, l) => a + (Number(l.cr) || 0), 0);
  const balanced = totDr === totCr && totDr > 0;
  const save = () => {
    if (!balanced) return;
    const ref = jref("JV");
    postJournal({ date: new Date().toISOString(), type: "Journal", ref, narration: narration || "Journal entry", lines: lines.map(l => ({ acct: l.acct, dr: Number(l.dr) || 0, cr: Number(l.cr) || 0 })) });
    setDone(ref); setLines([{ acct: "1010", dr: "", cr: "" }, { acct: "4000", dr: "", cr: "" }]); setNarration("");
  };
  return (
    <div>
      <div style={{ ...card, padding: 0, marginBottom: 16, border: `1.5px solid ${C.petrol}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, fontWeight: 700, fontSize: 15, background: "#EAF2F3", color: C.petrol }}>Journal voucher</div>
        <div style={{ padding: 18 }}>
          {done && <div style={{ background: "#D7EFEA", color: C.greenDeep, padding: "10px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Posted {done}</div>}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px 80px 30px" : "1fr 130px 130px 34px", gap: 8, fontSize: 11.5, fontWeight: 700, color: C.sub, textTransform: "uppercase", marginBottom: 6, padding: "0 2px" }}>
            <span>Account</span><span style={{ textAlign: "right" }}>Debit</span><span style={{ textAlign: "right" }}>Credit</span><span />
          </div>
          {lines.map((ln, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px 80px 30px" : "1fr 130px 130px 34px", gap: 8, marginBottom: 7, alignItems: "center" }}>
              <select style={inp} value={ln.acct} onChange={e => setLine(i, "acct", e.target.value)}>{GL.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}</select>
              <input style={{ ...inp, textAlign: "right" }} type="number" value={ln.dr} onChange={e => setLine(i, "dr", e.target.value)} placeholder="0" />
              <input style={{ ...inp, textAlign: "right" }} type="number" value={ln.cr} onChange={e => setLine(i, "cr", e.target.value)} placeholder="0" />
              <button onClick={() => rmLine(i)} style={{ ...iconBtn, color: C.red }} disabled={lines.length <= 2}><Trash2 size={16} /></button>
            </div>
          ))}
          <button onClick={addLine} style={{ ...ghostBtn, marginTop: 4 }}><Plus size={15} /> Add line</button>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
            <span>Dr: <b>{money(totDr)}</b></span><span>Cr: <b>{money(totCr)}</b></span>
            <span style={{ color: balanced ? C.green : C.red, fontWeight: 700 }}>{balanced ? "Balanced ✓" : `Diff ${money(Math.abs(totDr - totCr))}`}</span>
          </div>
          <div style={{ marginTop: 12 }}><Field label="Narration"><input style={inp} value={narration} onChange={e => setNarration(e.target.value)} placeholder="Description" /></Field></div>
          <button onClick={save} disabled={!balanced} style={{ ...primaryBtn, marginTop: 14, opacity: balanced ? 1 : 0.5, cursor: balanced ? "pointer" : "not-allowed" }}>Post journal</button>
          {!balanced && <Hint tone="warn">Debits must equal credits before posting — that's the double-entry rule the reports depend on.</Hint>}
        </div>
      </div>
    </div>
  );
}

function FinanceReports({ isMobile, journal, customers, suppliers, customerBalance, supplierBalance, acctBalance }) {
  const [rep, setRep] = useState("tb");
  const [glAcct, setGlAcct] = useState("1200");
  const reports = [
    { k: "tb", label: "Trial Balance", icon: Scale },
    { k: "pnl", label: "Profit & Loss", icon: TrendingUp },
    { k: "bs", label: "Balance Sheet", icon: FileBarChart },
    { k: "debtors", label: "Outstanding Debtors", icon: Users },
    { k: "creditors", label: "Suppliers / Creditors", icon: Truck },
    { k: "gl", label: "GL Ledger", icon: ScrollText },
  ];
  // derive
  const bal = {}; GL.forEach(a => bal[a.code] = acctBalance(a.code));
  const sumNature = (nat, sign) => GL.filter(a => a.nature === nat).reduce((s, a) => s + sign * bal[a.code], 0);
  const revenue = sumNature("income", -1), expenses = sumNature("expense", 1), netProfit = revenue - expenses;
  const assets = sumNature("asset", 1), liabilities = sumNature("liability", -1), equity = sumNature("equity", -1);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {reports.map(r => (
          <button key={r.k} onClick={() => setRep(r.k)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: `1px solid ${rep === r.k ? C.petrol : C.line}`, background: rep === r.k ? "#EAF2F3" : C.card, color: rep === r.k ? C.petrol : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <r.icon size={15} /> {r.label}
          </button>
        ))}
      </div>

      {rep === "tb" && (() => {
        let dr = 0, cr = 0;
        const rows = GL.map(a => { const b = bal[a.code]; if (b > 0) dr += b; else cr += -b; return [a.code, a.name, b > 0 ? money(b) : "", b < 0 ? money(-b) : ""]; }).filter(r => r[2] || r[3]);
        return (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <SectionHead title="Trial balance" />
            <Table cols={["Code", "Account", "Debit", "Credit"]} widths={["0.7fr", "2fr", "1fr", "1fr"]} rows={rows.map(r => [<span style={{ fontFamily: "monospace", color: C.sub }}>{r[0]}</span>, r[1], <span style={{ textAlign: "right", display: "block", fontWeight: 600 }}>{r[2]}</span>, <span style={{ textAlign: "right", display: "block", fontWeight: 600 }}>{r[3]}</span>])} />
            <div style={{ display: "grid", gridTemplateColumns: "0.7fr 2fr 1fr 1fr", gap: 10, padding: "13px 18px", background: C.canvas, fontWeight: 800, fontSize: 14 }}>
              <span /><span style={{ textAlign: "right" }}>Totals</span><span style={{ textAlign: "right" }}>{money(dr)}</span><span style={{ textAlign: "right" }}>{money(cr)}</span>
            </div>
            <div style={{ padding: "10px 18px", fontSize: 12.5, color: dr === cr ? C.green : C.red, fontWeight: 600 }}>{dr === cr ? "✓ In balance" : "Out of balance"}</div>
            <ExportBar title="Trial_Balance" cols={["Code", "Account", "Debit", "Credit"]} rows={rows} />
          </div>
        );
      })()}

      {rep === "pnl" && (
        <div style={{ ...card, padding: 0, overflow: "hidden", maxWidth: 620 }}>
          <SectionHead title="Profit & loss" />
          <PLGroup title="Income" accounts={GL.filter(a => a.nature === "income")} bal={bal} sign={-1} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 18px", fontWeight: 700, background: "#F0F6F5" }}><span>Total income</span><span>{money(revenue)}</span></div>
          <PLGroup title="Expenses" accounts={GL.filter(a => a.nature === "expense")} bal={bal} sign={1} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 18px", fontWeight: 700, background: "#F0F6F5" }}><span>Total expenses</span><span>{money(expenses)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 18px", fontWeight: 800, fontSize: 17, background: netProfit >= 0 ? "#D7EFEA" : "#FBEAE7", color: netProfit >= 0 ? C.greenDeep : C.red }}>
            <span>{netProfit >= 0 ? "Net profit" : "Net loss"}</span><span>{money(Math.abs(netProfit))}</span>
          </div>
        </div>
      )}

      {rep === "bs" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <SectionHead title="Assets" />
            {GL.filter(a => a.nature === "asset" && bal[a.code] !== 0).map(a => <BSRow key={a.code} name={a.name} v={bal[a.code]} />)}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", fontWeight: 800, background: "#F0F6F5" }}><span>Total assets</span><span>{money(assets)}</span></div>
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <SectionHead title="Liabilities & Equity" />
            {GL.filter(a => a.nature === "liability" && bal[a.code] !== 0).map(a => <BSRow key={a.code} name={a.name} v={-bal[a.code]} />)}
            {GL.filter(a => a.nature === "equity" && bal[a.code] !== 0).map(a => <BSRow key={a.code} name={a.name} v={-bal[a.code]} />)}
            <BSRow name="Current period profit" v={netProfit} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", fontWeight: 800, background: "#F0F6F5" }}><span>Total liab. + equity</span><span>{money(liabilities + equity + netProfit)}</span></div>
            <div style={{ padding: "10px 18px", fontSize: 12.5, color: Math.round(assets) === Math.round(liabilities + equity + netProfit) ? C.green : C.red, fontWeight: 600 }}>{Math.round(assets) === Math.round(liabilities + equity + netProfit) ? "✓ Balanced" : "Out of balance"}</div>
          </div>
        </div>
      )}

      {rep === "debtors" && (() => {
        const rows = customers.map(c => [c.name, customerBalance(c.id)]).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]);
        const tot = rows.reduce((a, r) => a + r[1], 0);
        return (
          <div style={{ ...card, padding: 0, overflow: "hidden", maxWidth: 620 }}>
            <SectionHead title={`Outstanding debtors · ${money(tot)}`} />
            {rows.length === 0 ? <Empty text="No outstanding debtors." /> : rows.map(([n, v]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 14 }}><span style={{ fontWeight: 600 }}>{n}</span><span style={{ fontWeight: 700, color: C.red }}>{money(v)}</span></div>
            ))}
          </div>
        );
      })()}

      {rep === "creditors" && (() => {
        const rows = suppliers.map(s => [s.name, s.type, supplierBalance(s.id)]).sort((a, b) => b[2] - a[2]);
        const tot = rows.reduce((a, r) => a + r[2], 0);
        return (
          <div style={{ ...card, padding: 0, overflow: "hidden", maxWidth: 620 }}>
            <SectionHead title={`Suppliers / creditors · ${money(tot)}`} />
            {rows.map(([n, t, v]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 14 }}><span><b>{n}</b> <span style={{ color: C.sub, fontSize: 12 }}>· {t}</span></span><span style={{ fontWeight: 700, color: v > 0 ? C.red : C.green }}>{v > 0 ? money(v) : "Clear"}</span></div>
            ))}
          </div>
        );
      })()}

      {rep === "gl" && (() => {
        const entries = [];
        journal.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e => e.lines.filter(l => l.acct === glAcct).forEach(l => entries.push({ date: e.date, ref: e.ref, narration: e.narration, dr: l.dr || 0, cr: l.cr || 0 })));
        let run = 0; const rows = entries.map(e => { run += e.dr - e.cr; return [fmtDate(e.date), e.ref, e.narration, e.dr ? money(e.dr) : "", e.cr ? money(e.cr) : "", money(run)]; });
        return (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>GL ledger (account history)</div>
              <select style={{ ...inp, width: "auto", padding: "8px 12px" }} value={glAcct} onChange={e => setGlAcct(e.target.value)}>{GL.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}</select>
            </div>
            {rows.length === 0 ? <Empty text="No postings to this account." /> :
              <Table cols={["Date", "Ref", "Narration", "Debit", "Credit", "Balance"]} widths={["0.8fr", "1fr", "1.8fr", "0.9fr", "0.9fr", "1fr"]}
                rows={rows.map(r => [r[0], <span style={{ fontSize: 12, color: C.sub }}>{r[1]}</span>, <span style={{ fontSize: 12.5 }}>{r[2]}</span>, <span style={{ color: C.red }}>{r[3]}</span>, <span style={{ color: C.green }}>{r[4]}</span>, <b>{r[5]}</b>])} />}
          </div>
        );
      })()}
    </div>
  );
}

function PLGroup({ title, accounts, bal, sign }) {
  return (
    <div>
      <div style={{ padding: "9px 18px", background: C.canvas, fontSize: 12, fontWeight: 700, color: C.petrol, textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
      {accounts.filter(a => bal[a.code] !== 0).map(a => (
        <div key={a.code} style={{ display: "flex", justifyContent: "space-between", padding: "10px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 13.5 }}><span>{a.name}</span><span style={{ fontWeight: 600 }}>{money(sign * bal[a.code])}</span></div>
      ))}
    </div>
  );
}
function BSRow({ name, v }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 13.5 }}><span>{name}</span><span style={{ fontWeight: 600 }}>{money(v)}</span></div>;
}
function FinForm({ title, subtitle, icon, children, done, onSave, saveLabel }) {
  return (
    <div style={{ ...card, padding: 0, maxWidth: 620, border: `1.5px solid ${C.petrol}`, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.line}`, background: "#EAF2F3", display: "flex", alignItems: "center", gap: 12 }}>
        {icon}<div><div style={{ fontWeight: 700, fontSize: 15, color: C.petrol }}>{title}</div><div style={{ fontSize: 12.5, color: C.sub }}>{subtitle}</div></div>
      </div>
      <div style={{ padding: 18 }}>
        {done && <div style={{ background: "#D7EFEA", color: C.greenDeep, padding: "10px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={16} /> Posted {done} — reports updated</div>}
        {children}
        <button onClick={onSave} style={{ ...primaryBtn, marginTop: 16 }}>{saveLabel}</button>
      </div>
    </div>
  );
}
function PostingPreview({ lines }) {
  const show = lines.filter(l => (l.dr || l.cr));
  if (!show.length) return null;
  return (
    <div style={{ marginTop: 14, background: C.canvas, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Will post</div>
      {show.map((l, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
          <span>{l.dr ? "Dr" : "  Cr"} &nbsp;{glName(l.acct)}</span>
          <span style={{ fontWeight: 600 }}>{money(l.dr || l.cr)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Rider's own view: My Deliveries ---------------- */
function MyDeliveries({ isMobile, orders, setOrders, riderId, riderName }) {
  const mine = orders.filter(o => o.riderId === riderId);
  const active = mine.filter(o => o.status === "assigned" || o.status === "picked");
  const done = mine.filter(o => o.status === "delivered");

  const advance = (oid) => setOrders(prev => prev.map(x => {
    if (x.id !== oid) return x;
    if (x.status === "assigned") return { ...x, status: "picked", pickedAt: new Date().toISOString() };
    if (x.status === "picked") {
      notifyDelivered(riderName, x.customer, x.area);
      return { ...x, status: "delivered", deliveredAt: new Date().toISOString() };
    }
    return x;
  }));

  return (
    <div>
      <div style={{ ...card, padding: 18, marginBottom: 14, background: `linear-gradient(135deg, ${C.petrolDeep}, ${C.petrolSoft})`, color: "white", borderColor: C.petrolSoft }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bike size={24} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Hi, {riderName}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{active.length} active · {done.length} delivered today</div>
          </div>
        </div>
      </div>

      {active.length === 0 && mine.length === 0 && (
        <div style={{ ...card, padding: 32, textAlign: "center" }}>
          <Bike size={36} color={C.sub} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No deliveries assigned</div>
          <div style={{ fontSize: 13.5, color: C.sub }}>Dispatch will assign deliveries to you. They'll appear here automatically.</div>
        </div>
      )}

      {active.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4, color: C.sub }}>Active deliveries</div>
          <div style={{ display: "grid", gap: 12 }}>
            {active.map(o => {
              const s = STATUS[o.status];
              return (
                <div key={o.id} style={{ ...card, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{o.id}</span>
                    <Pill s={s} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{o.customer}</div>
                  <div style={{ fontSize: 14, color: C.sub, display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <MapPin size={15} /> {o.area}
                  </div>
                  <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>{o.items}</div>
                  {o.status === "assigned" && (
                    <BigBtn color={C.blue} onClick={() => advance(o.id)} full icon={<ArrowRight size={20} />}>I have the package — leaving now</BigBtn>
                  )}
                  {o.status === "picked" && (
                    <BigBtn color={C.green} onClick={() => advance(o.id)} full icon={<CheckCircle2 size={20} />}>Delivered to customer</BigBtn>
                  )}
                  {o.assignedAt && (
                    <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.sub, flexWrap: "wrap" }}>
                      <Stamp label="Assigned" t={o.assignedAt} />
                      <Stamp label="Left" t={o.pickedAt} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4, color: C.sub }}>Completed today</div>
          {done.map(o => (
            <div key={o.id} style={{ ...card, padding: 14, marginBottom: 8, opacity: 0.75 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.customer}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{o.area} · {o.items}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.greenDeep, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> {fmt(o.deliveredAt)}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{mins(o.pickedAt, o.deliveredAt) != null ? `${mins(o.pickedAt, o.deliveredAt)} min` : ""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- shared bits ---------------- */
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14 };
const iconBtn = { background: "transparent", border: "none", cursor: "pointer", color: C.ink, display: "grid", placeItems: "center", padding: 4 };
const lbl = { fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 };
const inp = { width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14, outline: "none", boxSizing: "border-box", color: C.ink, fontFamily: "inherit", background: "white" };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10, border: "none", background: C.petrol, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: `1.5px dashed ${C.line}`, background: "transparent", color: C.petrol, fontWeight: 600, fontSize: 13, cursor: "pointer" };

function SectionHead({ title, action, onAction, accent, icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
      {action && <button onClick={onAction} style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: accent ? C.amberDeep : C.petrol, display: "flex", alignItems: "center", gap: 4 }}>{icon}{action}</button>}
    </div>
  );
}
function Row({ children }) { return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: `1px solid ${C.line}` }}>{children}</div>; }
function Pill({ s }) { return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{s.label}</span>; }
function Empty({ text }) { return <div style={{ padding: 28, textAlign: "center", color: C.sub, fontSize: 13 }}>{text}</div>; }
function Stamp({ label, t }) { return <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {label} {fmt(t)}</span>; }
function BigBtn({ children, color, text = "white", onClick, full, icon }) {
  return <button onClick={onClick} style={{ background: color, color: text, border: "none", borderRadius: 11, padding: "13px 18px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: full ? "100%" : "auto", minHeight: 46 }}>{icon} {children}</button>;
}
function Table({ cols, widths, rows, onRowClick }) {
  const grid = widths.join(" ");
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: cols.length > 5 ? 640 : "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "11px 18px", background: C.canvas, fontSize: 11.5, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {cols.map((c, i) => <span key={i}>{c}</span>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} onClick={onRowClick ? () => onRowClick(i) : undefined} style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "12px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 13.5, alignItems: "center", cursor: onRowClick ? "pointer" : "default" }}>
            {r.map((cell, j) => <span key={j} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
function Line({ label, v }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13.5 }}><span style={{ color: C.sub }}>{label}</span><span style={{ fontWeight: 600 }}>{v}</span></div>;
}
/* form helpers */
function FormCard({ title, children, onCancel, onSave, saveLabel }) {
  return (
    <div style={{ ...card, padding: 0, marginBottom: 16, border: `1.5px solid ${C.petrol}`, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, fontWeight: 700, fontSize: 15, background: "#EAF2F3", color: C.petrol }}>{title}</div>
      <div style={{ padding: 18 }}>{children}</div>
      <div style={{ display: "flex", gap: 10, padding: "14px 18px", borderTop: `1px solid ${C.line}`, background: C.canvas }}>
        <button onClick={onSave} style={primaryBtn}>{saveLabel}</button>
        <button onClick={onCancel} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  );
}
function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.petrol, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.line}` }}>{label}</div>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return <label style={{ display: "block" }}><span style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: "block", marginBottom: 5 }}>{label}</span>{children}</label>;
}
function GLSelect({ value, onChange, filter }) {
  const opts = GL.filter(g => !filter || filter.includes(g.group));
  return <select style={inp} value={value} onChange={e => onChange(e.target.value)}>{opts.map(g => <option key={g.code} value={g.code}>{g.code} · {g.name}</option>)}</select>;
}
function Hint({ children, tone }) {
  const warn = tone === "warn";
  return <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, fontSize: 12, color: warn ? C.red : C.sub, background: warn ? "#FBEAE7" : "transparent", padding: warn ? "8px 10px" : 0, borderRadius: 8 }}>
    {warn && <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}<span>{children}</span>
  </div>;
}
