import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, Package, Warehouse, Receipt, Bike,
  Menu, X, Search, LogOut, Plus, ArrowRight, CheckCircle2, Clock,
  MapPin, TrendingUp, AlertTriangle, Truck, ChevronRight
} from "lucide-react";

/* ============================================================
   DP Light — demo build
   Odoo-style ERP shell (desktop-first) + mobile-first rider app.
   All data in-memory. Sandbox only — nothing writes to Fusion.
   ============================================================ */

const C = {
  petrol: "#0F4C5C",
  petrolDeep: "#0A3A46",
  petrolSoft: "#15606E",
  canvas: "#F6F7F5",
  card: "#FFFFFF",
  line: "#E4E7E4",
  ink: "#1A2B2F",
  sub: "#5C6B6E",
  amber: "#F4A259",
  amberDeep: "#E08A3C",
  green: "#2A9D8F",
  greenDeep: "#218276",
  blue: "#3D7EA6",
  red: "#C15B4A",
};

const money = (n) => "KSh " + n.toLocaleString("en-KE");
const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const mins = (a, b) => (a && b) ? Math.round((new Date(b) - new Date(a)) / 60000) : null;

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/* ---------- seed data (authentic structure, invented names) ---------- */
const seedCustomers = [
  { id: "C-1001", name: "Mama Njeri Groceries", type: "Wholesale", phone: "0722 118 340", town: "Westlands", balance: 12400 },
  { id: "C-1002", name: "Kilimani Fresh Mart", type: "Retail", phone: "0733 902 145", town: "Kilimani", balance: 0 },
  { id: "C-1003", name: "Eastleigh Cash & Carry", type: "Wholesale", phone: "0710 556 201", town: "Eastleigh", balance: 48250 },
  { id: "C-1004", name: "Karen Provision Store", type: "Retail", phone: "0745 330 887", town: "Karen", balance: 3100 },
  { id: "C-1005", name: "Rongai Supermart", type: "Wholesale", phone: "0724 447 019", town: "Ongata Rongai", balance: 21600 },
  { id: "C-1006", name: "CBD Corner Duka", type: "Retail", phone: "0701 220 664", town: "Nairobi CBD", balance: 0 },
  { id: "C-1007", name: "Lang'ata Mini Market", type: "Retail", phone: "0728 771 452", town: "Lang'ata", balance: 8900 },
];

const seedProducts = [
  { id: "P-2001", name: "Pishori Rice 25kg", group: "Cereals", brand: "Daawat", unit: "Bag", hsn: "1006", price: 4200, stock: 84 },
  { id: "P-2002", name: "Cooking Oil 5L", group: "Edible Oils", brand: "Rina", unit: "Jerrycan", hsn: "1511", price: 1450, stock: 132 },
  { id: "P-2003", name: "Wheat Flour 2kg", group: "Flour", brand: "Exe", unit: "Pkt", hsn: "1101", price: 185, stock: 640 },
  { id: "P-2004", name: "Sugar 2kg", group: "Sweeteners", brand: "Mumias", unit: "Pkt", hsn: "1701", price: 280, stock: 8 },
  { id: "P-2005", name: "Long Life Milk 500ml", group: "Dairy", brand: "Brookside", unit: "Pcs", hsn: "0401", price: 65, stock: 410 },
  { id: "P-2006", name: "Bar Soap 800g", group: "Detergents", brand: "Menengai", unit: "Pcs", hsn: "3401", price: 210, stock: 96 },
  { id: "P-2007", name: "Maize Meal 2kg", group: "Flour", brand: "Jogoo", unit: "Pkt", hsn: "1102", price: 175, stock: 12 },
  { id: "P-2008", name: "Tea Leaves 500g", group: "Beverages", brand: "Ketepa", unit: "Pkt", hsn: "0902", price: 340, stock: 220 },
];

const seedWarehouses = [
  { id: "W-01", name: "Main Store", location: "Industrial Area", items: 206, value: 2840000 },
  { id: "W-02", name: "Shop Floor", location: "Westlands Branch", items: 188, value: 640000 },
  { id: "W-03", name: "Cold Room", location: "Westlands Branch", items: 24, value: 180000 },
  { id: "W-04", name: "Overflow Godown", location: "Ruaraka", items: 142, value: 1120000 },
  { id: "W-05", name: "Returns Bay", location: "Westlands Branch", items: 17, value: 42000 },
];

const seedSales = [
  { id: "INV-8841", customer: "Kilimani Fresh Mart", items: 6, total: 18450, mode: "M-Pesa", time: "09:12" },
  { id: "INV-8842", customer: "CBD Corner Duka", items: 3, total: 4720, mode: "Cash", time: "09:48" },
  { id: "INV-8843", customer: "Eastleigh Cash & Carry", items: 22, total: 96300, mode: "Credit", time: "10:31" },
  { id: "INV-8844", customer: "Karen Provision Store", items: 4, total: 6180, mode: "M-Pesa", time: "11:05" },
  { id: "INV-8845", customer: "Rongai Supermart", items: 15, total: 52700, mode: "Credit", time: "11:52" },
];

const seedRiders = [
  { id: "r1", name: "James Kariuki", phone: "0712 000 001" },
  { id: "r2", name: "Aisha Noor", phone: "0712 000 002" },
  { id: "r3", name: "Peter Otieno", phone: "0712 000 003" },
];

const seedOrders = [
  { id: "DEL-1042", customer: "Mama Njeri Groceries", area: "Westlands", items: "2x Pishori Rice 25kg, 1x Cooking Oil 5L", status: "unassigned", riderId: null, assignedAt: null, pickedAt: null, deliveredAt: null },
  { id: "DEL-1043", customer: "Karen Provision Store", area: "Karen", items: "1x Maize Meal 2kg x10, 3x Sugar 2kg", status: "picked", riderId: "r2", assignedAt: new Date(Date.now() - 32 * 60000).toISOString(), pickedAt: new Date(Date.now() - 18 * 60000).toISOString(), deliveredAt: null },
  { id: "DEL-1044", customer: "Lang'ata Mini Market", area: "Lang'ata", items: "5x Bar Soap, 2x Tea Leaves 500g", status: "delivered", riderId: "r1", assignedAt: new Date(Date.now() - 96 * 60000).toISOString(), pickedAt: new Date(Date.now() - 74 * 60000).toISOString(), deliveredAt: new Date(Date.now() - 41 * 60000).toISOString() },
];

const STATUS = {
  unassigned: { label: "Unassigned", color: C.sub, bg: "#EEF0EE" },
  assigned: { label: "Assigned", color: C.amberDeep, bg: "#FCEBD6" },
  picked: { label: "Out for delivery", color: C.blue, bg: "#DCEAF3" },
  delivered: { label: "Delivered", color: C.greenDeep, bg: "#D7EFEA" },
};

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "customers", label: "Customers", icon: Users },
  { key: "products", label: "Products", icon: Package },
  { key: "warehouse", label: "Warehouse", icon: Warehouse },
  { key: "sales", label: "Sales", icon: Receipt },
  { key: "riders", label: "Rider Delivery", icon: Bike },
];

export default function DemoApp() {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [orders, setOrders] = useState(seedOrders);

  useEffect(() => { setDrawer(false); }, [active, isMobile]);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: C.canvas, minHeight: "100vh", color: C.ink, display: "flex" }}>
      {/* Sidebar (desktop) */}
      {!isMobile && (
        <Sidebar active={active} setActive={setActive} user={user} onLogout={() => setUser(null)} />
      )}

      {/* Mobile drawer */}
      {isMobile && drawer && (
        <>
          <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,30,35,0.5)", zIndex: 40 }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, width: 260 }}>
            <Sidebar active={active} setActive={setActive} user={user} onLogout={() => setUser(null)} onClose={() => setDrawer(false)} mobile />
          </div>
        </>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <header style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: isMobile ? "12px 16px" : "14px 28px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 30 }}>
          {isMobile && (
            <button onClick={() => setDrawer(true)} style={iconBtn}><Menu size={22} /></button>
          )}
          <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, letterSpacing: -0.3 }}>
            {NAV.find(n => n.key === active)?.label}
          </div>
          <div style={{ flex: 1 }} />
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.canvas, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 12px", width: 240 }}>
              <Search size={16} color={C.sub} />
              <input placeholder="Search…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, width: "100%", color: C.ink }} />
            </div>
          )}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.petrol, color: "white", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>
            {user.initials}
          </div>
        </header>

        <main style={{ padding: isMobile ? 16 : 28, flex: 1 }}>
          {active === "dashboard" && <Dashboard isMobile={isMobile} orders={orders} setActive={setActive} />}
          {active === "customers" && <Customers isMobile={isMobile} />}
          {active === "products" && <Products isMobile={isMobile} />}
          {active === "warehouse" && <WarehouseView isMobile={isMobile} />}
          {active === "sales" && <Sales isMobile={isMobile} />}
          {active === "riders" && <Riders isMobile={isMobile} orders={orders} setOrders={setOrders} />}
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
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.petrol, display: "grid", placeItems: "center" }}>
            <Truck size={22} color="white" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>DP Light</div>
        </div>
        <div style={{ color: C.sub, fontSize: 13, marginBottom: 22 }}>Retail management · demo sandbox</div>

        <label style={lbl}>Sign in as</label>
        <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {["Owner / Manager", "Dispatch", "Rider"].map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ textAlign: "left", padding: "11px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
                border: `1.5px solid ${role === r ? C.petrol : C.line}`, background: role === r ? "#EAF2F3" : C.card, color: role === r ? C.petrol : C.ink }}>
              {r}
            </button>
          ))}
        </div>

        <input placeholder="demo@dplight.co.ke" defaultValue="demo@dplight.co.ke" style={inp} />
        <input placeholder="Password" type="password" defaultValue="demo1234" style={{ ...inp, marginTop: 10 }} />

        <button onClick={() => onLogin({ role, initials: role === "Rider" ? "RD" : role === "Dispatch" ? "DP" : "OM" })}
          style={{ marginTop: 18, width: "100%", padding: "13px", borderRadius: 10, border: "none", background: C.petrol, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Enter demo
        </button>
        <div style={{ marginTop: 14, fontSize: 12, color: C.sub, textAlign: "center", lineHeight: 1.5 }}>
          Sandbox only — nothing here touches live shop data. Play freely.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ active, setActive, user, onLogout, onClose, mobile }) {
  return (
    <aside style={{ width: 260, background: C.petrolDeep, color: "#DCE8EA", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: C.amber, display: "grid", placeItems: "center" }}>
          <Truck size={20} color={C.petrolDeep} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: "white", letterSpacing: -0.4 }}>DP Light</div>
        {mobile && <button onClick={onClose} style={{ ...iconBtn, marginLeft: "auto", color: "#DCE8EA" }}><X size={20} /></button>}
      </div>
      <div style={{ padding: "0 12px", flex: 1 }}>
        {NAV.map(n => {
          const on = active === n.key;
          const Icon = n.icon;
          return (
            <button key={n.key} onClick={() => setActive(n.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", marginBottom: 3, borderRadius: 10, cursor: "pointer", fontSize: 14.5, fontWeight: on ? 700 : 500,
                border: "none", textAlign: "left", background: on ? C.petrolSoft : "transparent", color: on ? "white" : "#B4C7CA" }}>
              <Icon size={19} /> {n.label}
              {n.key === "riders" && <span style={{ marginLeft: "auto", fontSize: 11, background: C.amber, color: C.petrolDeep, fontWeight: 800, padding: "1px 7px", borderRadius: 20 }}>live</span>}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.petrolSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.petrolSoft, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "white" }}>{user.initials}</div>
          <div style={{ fontSize: 13 }}>
            <div style={{ color: "white", fontWeight: 600 }}>{user.role}</div>
            <div style={{ color: "#8FA9AD", fontSize: 11 }}>demo@dplight.co.ke</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", color: "#B4C7CA", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ isMobile, orders, setActive }) {
  const active = orders.filter(o => o.status === "assigned" || o.status === "picked").length;
  const kpis = [
    { label: "Sales today", value: money(178350), icon: TrendingUp, tint: C.green, note: "23 invoices" },
    { label: "Deliveries active", value: active, icon: Bike, tint: C.amber, note: `${orders.length} total today` },
    { label: "Low stock items", value: 2, icon: AlertTriangle, tint: C.red, note: "need reorder" },
    { label: "Outstanding balance", value: money(94250), icon: Receipt, tint: C.blue, note: "5 customers" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 22 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...card, padding: isMobile ? 14 : 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: k.tint + "22", display: "grid", placeItems: "center" }}>
                <k.icon size={18} color={k.tint} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, marginTop: 12, letterSpacing: -0.5 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 6, opacity: 0.8 }}>{k.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Recent sales" action="View all" onAction={() => setActive("sales")} />
          {seedSales.slice(0, 5).map(s => (
            <Row key={s.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.customer}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{s.id} · {s.items} items · {s.mode}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{money(s.total)}</div>
            </Row>
          ))}
        </div>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <SectionHead title="Deliveries in progress" action="Open" onAction={() => setActive("riders")} />
          {orders.filter(o => o.status !== "delivered").map(o => (
            <Row key={o.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customer}</div>
                <div style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {o.area}</div>
              </div>
              <Pill s={STATUS[o.status]} />
            </Row>
          ))}
          {orders.filter(o => o.status !== "delivered").length === 0 && <Empty text="No active deliveries." />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Customers ---------------- */
function Customers({ isMobile }) {
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <SectionHead title={`${seedCustomers.length} customers`} action="New customer" onAction={() => {}} accent />
      {isMobile ? (
        <div>
          {seedCustomers.map(c => (
            <Row key={c.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{c.phone} · {c.town}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.sub }}>{c.type}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: c.balance > 0 ? C.red : C.green }}>{c.balance > 0 ? money(c.balance) : "Clear"}</div>
              </div>
            </Row>
          ))}
        </div>
      ) : (
        <Table
          cols={["Code", "Customer", "Type", "Phone", "Town", "Balance"]}
          widths={["0.7fr", "1.8fr", "0.9fr", "1.1fr", "1fr", "1fr"]}
          rows={seedCustomers.map(c => [
            c.id, <b>{c.name}</b>, c.type, c.phone, c.town,
            <span style={{ color: c.balance > 0 ? C.red : C.green, fontWeight: 700 }}>{c.balance > 0 ? money(c.balance) : "Clear"}</span>
          ])}
        />
      )}
    </div>
  );
}

/* ---------------- Products ---------------- */
function Products({ isMobile }) {
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <SectionHead title={`${seedProducts.length} products`} action="New product" onAction={() => {}} accent />
      {isMobile ? (
        <div>
          {seedProducts.map(p => {
            const low = p.stock <= 15;
            return (
              <Row key={p.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{p.group} · {p.brand}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{money(p.price)}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: low ? C.red : C.sub }}>{p.stock} {p.unit}{low ? " ⚠" : ""}</div>
                </div>
              </Row>
            );
          })}
        </div>
      ) : (
        <Table
          cols={["Code", "Product", "Group", "Brand", "Unit", "Price", "Stock"]}
          widths={["0.7fr", "1.8fr", "1fr", "0.9fr", "0.7fr", "0.9fr", "0.8fr"]}
          rows={seedProducts.map(p => [
            p.id, <b>{p.name}</b>, p.group, p.brand, p.unit, money(p.price),
            <span style={{ fontWeight: 700, color: p.stock <= 15 ? C.red : C.ink }}>{p.stock}{p.stock <= 15 ? " ⚠" : ""}</span>
          ])}
        />
      )}
    </div>
  );
}

/* ---------------- Warehouse ---------------- */
function WarehouseView({ isMobile }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
        {seedWarehouses.map(w => (
          <div key={w.id} style={{ ...card, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: C.petrol + "18", display: "grid", placeItems: "center" }}>
                <Warehouse size={19} color={C.petrol} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{w.location}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <div><div style={{ fontSize: 18, fontWeight: 800 }}>{w.items}</div><div style={{ fontSize: 11, color: C.sub }}>SKUs</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 800 }}>{money(w.value)}</div><div style={{ fontSize: 11, color: C.sub }}>stock value</div></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...card, padding: 16, marginTop: 16, fontSize: 13, color: C.sub, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertTriangle size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Stock transfers, GRN and adjustments post through Fusion in the live build. In this sandbox the warehouse view is read-only.</span>
      </div>
    </div>
  );
}

/* ---------------- Sales ---------------- */
function Sales({ isMobile }) {
  const all = [...seedSales, { id: "INV-8846", customer: "Mama Njeri Groceries", items: 9, total: 33800, mode: "M-Pesa", time: "12:20" }];
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <SectionHead title="Today's sales" action="New sale" onAction={() => {}} accent />
      {isMobile ? (
        <div>
          {all.map(s => (
            <Row key={s.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.customer}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{s.id} · {s.time} · {s.mode}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{money(s.total)}</div>
            </Row>
          ))}
        </div>
      ) : (
        <Table
          cols={["Invoice", "Customer", "Items", "Payment", "Time", "Total"]}
          widths={["0.9fr", "1.8fr", "0.6fr", "0.9fr", "0.7fr", "1fr"]}
          rows={all.map(s => [s.id, <b>{s.customer}</b>, s.items, s.mode, s.time,
            <span style={{ fontWeight: 700 }}>{money(s.total)}</span>])}
        />
      )}
    </div>
  );
}

/* ---------------- Riders (mobile-first star) ---------------- */
function Riders({ isMobile, orders, setOrders }) {
  const [tab, setTab] = useState("board");
  const [assigning, setAssigning] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const rn = (id) => seedRiders.find(r => r.id === id)?.name ?? "—";

  const assign = (oid, rid) => {
    setOrders(o => o.map(x => x.id === oid ? { ...x, status: "assigned", riderId: rid, assignedAt: new Date().toISOString() } : x));
    setAssigning(null);
  };
  const advance = (oid) => setOrders(o => o.map(x => {
    if (x.id !== oid) return x;
    if (x.status === "assigned") return { ...x, status: "picked", pickedAt: new Date().toISOString() };
    if (x.status === "picked") return { ...x, status: "delivered", deliveredAt: new Date().toISOString() };
    return x;
  }));
  const addOrder = (data) => {
    const n = 1045 + orders.length;
    setOrders(o => [{ id: `DEL-${n}`, ...data, status: "unassigned", riderId: null, assignedAt: null, pickedAt: null, deliveredAt: null }, ...o]);
    setShowNew(false);
  };
  const delivered = useMemo(() => orders.filter(o => o.status === "delivered"), [orders]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["board", "Delivery board"], ["reports", "Reports"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${tab === k ? C.petrol : C.line}`, background: tab === k ? C.petrol : C.card, color: tab === k ? "white" : C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowNew(true)}
          style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: C.amber, color: C.petrolDeep, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={17} /> New delivery
        </button>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{o.id}</span>
                      <Pill s={s} />
                    </div>
                    <div style={{ fontSize: 14, marginTop: 6, fontWeight: 600 }}>{o.customer}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MapPin size={13} /> {o.area} · {o.items}
                    </div>
                    {o.riderId && <div style={{ fontSize: 13, marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: C.petrol, fontWeight: 600 }}><Bike size={15} /> {rn(o.riderId)}</div>}
                  </div>

                  <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row" }}>
                    {o.status === "unassigned" && (
                      assigning === o.id ? (
                        <div style={{ display: "grid", gap: 6, minWidth: isMobile ? "100%" : 180 }}>
                          {seedRiders.map(r => (
                            <button key={r.id} onClick={() => assign(o.id, r.id)}
                              style={{ background: C.canvas, border: `1px solid ${C.line}`, borderRadius: 9, padding: "10px 12px", cursor: "pointer", fontSize: 13, textAlign: "left", fontWeight: 600 }}>
                              {r.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <BigBtn color={C.amber} text={C.petrolDeep} onClick={() => setAssigning(o.id)} full={isMobile} icon={<Bike size={18} />}>Assign rider</BigBtn>
                      )
                    )}
                    {o.status === "assigned" && <BigBtn color={C.blue} onClick={() => advance(o.id)} full={isMobile} icon={<ArrowRight size={18} />}>Left with package</BigBtn>}
                    {o.status === "picked" && <BigBtn color={C.green} onClick={() => advance(o.id)} full={isMobile} icon={<CheckCircle2 size={18} />}>Mark delivered</BigBtn>}
                    {o.status === "delivered" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.greenDeep, fontWeight: 700, fontSize: 14, justifyContent: "center", padding: isMobile ? "10px" : 0 }}>
                        <CheckCircle2 size={18} /> Delivered
                      </div>
                    )}
                  </div>
                </div>

                {o.assignedAt && (
                  <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.sub, flexWrap: "wrap" }}>
                    <Stamp label="Assigned" t={o.assignedAt} />
                    <Stamp label="Left" t={o.pickedAt} />
                    <Stamp label="Delivered" t={o.deliveredAt} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "reports" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
            {[["Delivered today", delivered.length], ["In progress", orders.filter(o => o.status === "assigned" || o.status === "picked").length], ["Unassigned", orders.filter(o => o.status === "unassigned").length]].map(([l, v]) => (
              <div key={l} style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <SectionHead title="Delivery log" />
            {delivered.length === 0 && <Empty text="No completed deliveries yet — run one on the board." />}
            {delivered.map(o => (
              <Row key={o.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.id} · <span style={{ fontWeight: 500 }}>{o.customer}</span></div>
                  <div style={{ fontSize: 12, color: C.sub }}>{rn(o.riderId)} · {o.area} · {o.items}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(o.deliveredAt)}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{mins(o.pickedAt, o.deliveredAt) != null ? `${mins(o.pickedAt, o.deliveredAt)} min trip` : "—"}</div>
                </div>
              </Row>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewDelivery({ isMobile, onSave, onCancel }) {
  const [customer, setCustomer] = useState("");
  const [area, setArea] = useState("");
  const [items, setItems] = useState("");
  return (
    <div style={{ ...card, padding: isMobile ? 16 : 20, marginBottom: 14, border: `1.5px solid ${C.amber}` }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>New delivery</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 10 }}>
        <input placeholder="Customer name" value={customer} onChange={e => setCustomer(e.target.value)} style={inp} />
        <input placeholder="Area / destination" value={area} onChange={e => setArea(e.target.value)} style={inp} />
      </div>
      <input placeholder="Items (e.g. 2x Rice 25kg, 1x Oil 5L)" value={items} onChange={e => setItems(e.target.value)} style={{ ...inp, marginTop: 10 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => customer && onSave({ customer, area: area || "—", items: items || "—" })}
          style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: C.petrol, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Create delivery</button>
        <button onClick={onCancel} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginTop: 10 }}>
        Dispatch can create and assign deliveries here even if the shop loses power — this runs in the cloud, independent of Fusion.
      </div>
    </div>
  );
}

/* ---------------- small shared bits ---------------- */
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14 };
const iconBtn = { background: "transparent", border: "none", cursor: "pointer", color: C.ink, display: "grid", placeItems: "center", padding: 4 };
const lbl = { fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 };
const inp = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14, outline: "none", boxSizing: "border-box", color: C.ink, fontFamily: "inherit" };

function SectionHead({ title, action, onAction, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: accent ? C.amberDeep : C.petrol, display: "flex", alignItems: "center", gap: 4 }}>
          {action} <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: `1px solid ${C.line}` }}>{children}</div>;
}
function Pill({ s }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{s.label}</span>;
}
function Empty({ text }) {
  return <div style={{ padding: 28, textAlign: "center", color: C.sub, fontSize: 13 }}>{text}</div>;
}
function Stamp({ label, t }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {label} {fmt(t)}</span>;
}
function BigBtn({ children, color, text = "white", onClick, full, icon }) {
  return (
    <button onClick={onClick} style={{ background: color, color: text, border: "none", borderRadius: 11, padding: "13px 18px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: full ? "100%" : "auto", minHeight: 46 }}>
      {icon} {children}
    </button>
  );
}
function Table({ cols, widths, rows }) {
  const grid = widths.join(" ");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "11px 18px", background: C.canvas, fontSize: 11.5, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {cols.map((c, i) => <span key={i}>{c}</span>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: grid, gap: 10, padding: "13px 18px", borderBottom: `1px solid ${C.line}`, fontSize: 13.5, alignItems: "center" }}>
          {r.map((cell, j) => <span key={j} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cell}</span>)}
        </div>
      ))}
    </div>
  );
}
