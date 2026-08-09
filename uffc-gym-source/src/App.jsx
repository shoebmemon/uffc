import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, CreditCard, DollarSign, Plus, Edit2, Trash2, X,
  MessageCircle, Search, AlertTriangle, CheckCircle2, Clock, Menu,
  Dumbbell, Phone, Mail, MapPin, Calendar, ChevronRight, Loader2
} from "lucide-react";
import { storage } from "./storage";

/* ---------------------------------------------------------------------
   THEME — "Fight Card" identity for UFFC Gym
   Deep charcoal corners, acid-lime signature accent (like ring rope tape),
   crimson for overdue, amber for due-soon, green for settled.
--------------------------------------------------------------------- */
const theme = {
  bg: "#0E1012",
  surface: "#1A1D21",
  surfaceRaised: "#22262B",
  border: "#2C3036",
  borderLight: "#383D44",
  text: "#F4F2EC",
  textMuted: "#9BA1AA",
  textFaint: "#5E646D",
  accent: "#CFFF3D",
  accentDim: "#9DBE2E",
  danger: "#FF4B5C",
  dangerDim: "#3A1E22",
  warning: "#FFB020",
  warningDim: "#3A2E14",
  success: "#38D67F",
  successDim: "#173423",
};

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
    .uffc-root { font-family: 'Inter', sans-serif; }
    .uffc-display { font-family: 'Bebas Neue', 'Inter', sans-serif; letter-spacing: 0.03em; }
    .uffc-root ::selection { background: ${theme.accent}; color: #0E1012; }
    .uffc-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
    .uffc-scroll::-webkit-scrollbar-thumb { background: ${theme.borderLight}; border-radius: 4px; }
    .uffc-input { background: ${theme.surfaceRaised}; border: 1px solid ${theme.border}; color: ${theme.text}; }
    .uffc-input:focus { outline: none; border-color: ${theme.accent}; box-shadow: 0 0 0 3px rgba(207,255,61,0.15); }
    .uffc-input::placeholder { color: ${theme.textFaint}; }
    @keyframes uffc-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .uffc-fade-in { animation: uffc-fade 0.25s ease-out; }
  `}</style>
);

/* ------------------------------- helpers ------------------------------ */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const todayStr = () => new Date().toISOString().slice(0, 10);
const addMonths = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  const targetMonth = d.getMonth() + n;
  d.setMonth(targetMonth);
  return d.toISOString().slice(0, 10);
};
const daysFromToday = (dateStr) => {
  const today = new Date(todayStr() + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
};
const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const digitsOnly = (s) => (s || "").replace(/\D/g, "");
const waNumber = (mobile) => {
  const d = digitsOnly(mobile);
  if (d.length === 10) return "91" + d;
  return d;
};

function memberStatus(member) {
  if (!member.nextDueDate) return { key: "active", label: "Active", days: null };
  const days = daysFromToday(member.nextDueDate);
  if (days < 0) return { key: "overdue", label: "Overdue", days };
  if (days <= 7) return { key: "due-soon", label: "Due Soon", days };
  return { key: "active", label: "Active", days };
}

function defaultPlans() {
  return [
    {
      id: uid(),
      name: "Rookie",
      price: 1200,
      description: "Open gym floor access plus the cardio zone. Built for people establishing the habit.",
    },
    {
      id: uid(),
      name: "Contender",
      price: 2000,
      description: "Everything in Rookie, plus group boxing & MMA conditioning classes.",
    },
    {
      id: uid(),
      name: "Champion",
      price: 3200,
      description: "Full facility access, all classes, one personal training session a week, and a nutrition plan.",
    },
  ];
}

function seedMembers(plans) {
  const p = (i) => plans[i]?.id;
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const m1Join = daysAgo(38); // overdue: due date passed ~8 days ago
  const m2Join = daysAgo(25); // due soon: due in ~5 days
  const m3Join = daysAgo(6); // active
  return [
    {
      id: uid(), name: "Rohit Sharma", age: 27, gender: "Male", mobile: "9876543210",
      email: "rohit.s@example.com", address: "12 MG Road, Indore", planId: p(1),
      joinDate: m1Join, nextDueDate: addMonths(m1Join, 1), lastPaymentDate: null,
    },
    {
      id: uid(), name: "Ananya Deshmukh", age: 24, gender: "Female", mobile: "9812345678",
      email: "ananya.d@example.com", address: "45 Palasia, Indore", planId: p(2),
      joinDate: m2Join, nextDueDate: addMonths(m2Join, 1), lastPaymentDate: null,
    },
    {
      id: uid(), name: "Karan Mehta", age: 31, gender: "Male", mobile: "9900112233",
      email: "karan.m@example.com", address: "7 Vijay Nagar, Indore", planId: p(0),
      joinDate: m3Join, nextDueDate: addMonths(m3Join, 1), lastPaymentDate: null,
    },
  ];
}

/* --------------------------- small UI atoms --------------------------- */
function StatusBadge({ status }) {
  const map = {
    overdue: { bg: theme.dangerDim, fg: theme.danger, label: "OVERDUE" },
    "due-soon": { bg: theme.warningDim, fg: theme.warning, label: "DUE SOON" },
    active: { bg: theme.successDim, fg: theme.success, label: "PAID UP" },
  };
  const s = map[status.key];
  return (
    <span
      className="uffc-display text-xs px-2.5 py-1 rounded"
      style={{ background: s.bg, color: s.fg, letterSpacing: "0.08em", transform: "skewX(-6deg)", display: "inline-block" }}
    >
      <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>{s.label}</span>
    </span>
  );
}

function IconBtn({ icon: Icon, onClick, title, color }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-colors"
      style={{ background: theme.surfaceRaised, border: `1px solid ${theme.border}`, color: color || theme.textMuted }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.borderLight)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
    >
      <Icon size={15} />
    </button>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-semibold tracking-wide" style={{ color: theme.textMuted }}>
        {label} {required && <span style={{ color: theme.danger }}>*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls = "uffc-input w-full rounded-lg px-3 py-2.5 text-sm";

/* ------------------------------- app ---------------------------------- */
export default function UFFCGymApp() {
  const [loading, setLoading] = useState(true);
  const [storageOk, setStorageOk] = useState(true);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");

  const [memberForm, setMemberForm] = useState(null); // null | {} | member
  const [planForm, setPlanForm] = useState(null);
  const [feeForMember, setFeeForMember] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // {type, id, label}

  useEffect(() => {
    (async () => {
      let p = null, m = null, pay = null;
      let ok = true;
      try {
        try {
          const r = await storage.get("gym_plans", false);
          p = r ? JSON.parse(r.value) : null;
        } catch (e) { p = null; }
        try {
          const r = await storage.get("gym_members", false);
          m = r ? JSON.parse(r.value) : null;
        } catch (e) { m = null; }
        try {
          const r = await storage.get("gym_payments", false);
          pay = r ? JSON.parse(r.value) : null;
        } catch (e) { pay = null; }

        if (!p) { p = defaultPlans(); await storage.set("gym_plans", JSON.stringify(p), false); }
        if (!m) { m = seedMembers(p); await storage.set("gym_members", JSON.stringify(m), false); }
        if (!pay) { pay = []; await storage.set("gym_payments", JSON.stringify(pay), false); }
      } catch (e) {
        ok = false;
        if (!p) p = defaultPlans();
        if (!m) m = seedMembers(p);
        if (!pay) pay = [];
      }
      setPlans(p); setMembers(m); setPayments(pay);
      setStorageOk(ok);
      setLoading(false);
    })();
  }, []);

  async function persist(key, value) {
    try { await storage.set(key, JSON.stringify(value), false); }
    catch (e) { console.error("storage save failed", key, e); }
  }
  const saveMembers = (next) => { setMembers(next); persist("gym_members", next); };
  const savePlans = (next) => { setPlans(next); persist("gym_plans", next); };
  const savePayments = (next) => { setPayments(next); persist("gym_payments", next); };

  const planById = useMemo(() => Object.fromEntries(plans.map((p) => [p.id, p])), [plans]);

  const enriched = useMemo(
    () => members.map((m) => ({ ...m, status: memberStatus(m), plan: planById[m.planId] })),
    [members, planById]
  );

  const dueSoon = enriched.filter((m) => m.status.key === "due-soon").sort((a, b) => a.status.days - b.status.days);
  const overdue = enriched.filter((m) => m.status.key === "overdue").sort((a, b) => a.status.days - b.status.days);

  const filteredMembers = enriched.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || digitsOnly(m.mobile).includes(digitsOnly(q));
  });

  /* ------------------------------ actions ------------------------------ */
  function openWhatsApp(member) {
    const plan = planById[member.planId];
    const phone = waNumber(member.mobile);
    const status = memberStatus(member);
    const line =
      status.key === "overdue"
        ? `your membership fee of ${fmtMoney(plan?.price)} was due on ${fmtDate(member.nextDueDate)} and is now overdue`
        : `your membership fee of ${fmtMoney(plan?.price)} is due on ${fmtDate(member.nextDueDate)}`;
    const msg = `Hi ${member.name}, this is a reminder from UFFC Gym that ${line}. Please make the payment at your earliest convenience so we can keep your membership active. Thank you! 💪`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function saveMember(data) {
    if (data.id) {
      saveMembers(members.map((m) => (m.id === data.id ? { ...m, ...data } : m)));
    } else {
      const joinDate = data.joinDate || todayStr();
      const newMember = {
        ...data,
        id: uid(),
        joinDate,
        nextDueDate: addMonths(joinDate, 1),
        lastPaymentDate: null,
      };
      saveMembers([newMember, ...members]);
    }
    setMemberForm(null);
  }

  function deleteMember(id) {
    saveMembers(members.filter((m) => m.id !== id));
    savePayments(payments.filter((p) => p.memberId !== id));
    setConfirmDelete(null);
  }

  function savePlan(data) {
    if (data.id) {
      savePlans(plans.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
    } else {
      savePlans([...plans, { ...data, id: uid() }]);
    }
    setPlanForm(null);
  }

  function deletePlan(id) {
    savePlans(plans.filter((p) => p.id !== id));
    setConfirmDelete(null);
  }

  function recordPayment(member, amount, date, note) {
    const payment = { id: uid(), memberId: member.id, amount: Number(amount), date, note: note || "", recordedAt: todayStr() };
    savePayments([payment, ...payments]);
    saveMembers(members.map((m) => (m.id === member.id ? { ...m, nextDueDate: addMonths(date, 1), lastPaymentDate: date } : m)));
    setFeeForMember(null);
  }

  /* -------------------------------- nav --------------------------------- */
  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "members", label: "Members", icon: Users },
    { id: "plans", label: "Plans", icon: CreditCard },
    { id: "fees", label: "Fees", icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="uffc-root flex items-center justify-center min-h-[400px]" style={{ background: theme.bg, color: theme.text }}>
        {FONTS}
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" size={28} style={{ color: theme.accent }} />
          <span className="text-sm" style={{ color: theme.textMuted }}>Loading UFFC Gym…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="uffc-root min-h-screen w-full flex" style={{ background: theme.bg, color: theme.text }}>
      {FONTS}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 border-r"
        style={{ borderColor: theme.border, background: theme.surface }}
      >
        <Logo />
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map((n) => (
            <NavItem key={n.id} n={n} active={activeTab === n.id} onClick={() => setActiveTab(n.id)} />
          ))}
        </nav>
        <div className="p-4 text-[11px]" style={{ color: theme.textFaint }}>
          {storageOk ? "Data saved in this browser" : "Storage unavailable — session only"}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
          style={{ borderColor: theme.border, background: theme.surface }}
        >
          <Logo compact />
        </div>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <Dashboard
              members={enriched}
              plans={plans}
              payments={payments}
              dueSoon={dueSoon}
              overdue={overdue}
              onWhatsApp={openWhatsApp}
              onRecordFee={(m) => setFeeForMember(m)}
              onGoMembers={() => setActiveTab("members")}
            />
          )}

          {activeTab === "members" && (
            <MembersView
              members={filteredMembers}
              search={search}
              setSearch={setSearch}
              plans={plans}
              onAdd={() => setMemberForm({})}
              onEdit={(m) => setMemberForm(m)}
              onDelete={(m) => setConfirmDelete({ type: "member", id: m.id, label: m.name })}
              onWhatsApp={openWhatsApp}
              onRecordFee={(m) => setFeeForMember(m)}
            />
          )}

          {activeTab === "plans" && (
            <PlansView
              plans={plans}
              members={members}
              onAdd={() => setPlanForm({})}
              onEdit={(p) => setPlanForm(p)}
              onDelete={(p) => setConfirmDelete({ type: "plan", id: p.id, label: p.name })}
            />
          )}

          {activeTab === "fees" && (
            <FeesView
              payments={payments}
              members={members}
              planById={planById}
              onAdd={() => setFeeForMember(members[0] || null)}
            />
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around border-t z-30"
        style={{ borderColor: theme.border, background: theme.surface }}
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = activeTab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              className="flex flex-col items-center gap-1 py-2.5 px-3 flex-1"
              style={{ color: active ? theme.accent : theme.textFaint }}
            >
              <Icon size={19} />
              <span className="text-[10px] font-semibold">{n.label}</span>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      {memberForm !== null && (
        <MemberFormModal
          initial={memberForm}
          plans={plans}
          onCancel={() => setMemberForm(null)}
          onSave={saveMember}
        />
      )}
      {planForm !== null && (
        <PlanFormModal initial={planForm} onCancel={() => setPlanForm(null)} onSave={savePlan} />
      )}
      {feeForMember !== null && (
        <FeeFormModal
          members={members}
          planById={planById}
          initialMember={feeForMember}
          onCancel={() => setFeeForMember(null)}
          onSave={recordPayment}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          label={confirmDelete.label}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() =>
            confirmDelete.type === "member" ? deleteMember(confirmDelete.id) : deletePlan(confirmDelete.id)
          }
        />
      )}
    </div>
  );
}

/* ------------------------------ layout bits ---------------------------- */
function Logo({ compact }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: theme.accent, transform: "rotate(-6deg)" }}
      >
        <Dumbbell size={18} style={{ color: theme.bg }} />
      </div>
      <div className="leading-none">
        <div className="uffc-display text-xl" style={{ letterSpacing: "0.06em" }}>UFFC GYM</div>
        {!compact && (
          <div className="text-[10px] font-semibold tracking-widest mt-0.5" style={{ color: theme.textFaint }}>
            MEMBER &amp; FEE MANAGER
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ n, active, onClick }) {
  const Icon = n.icon;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
      style={{
        background: active ? "rgba(207,255,61,0.1)" : "transparent",
        color: active ? theme.accent : theme.textMuted,
      }}
    >
      <Icon size={17} />
      {n.label}
    </button>
  );
}

/* -------------------------------- Dashboard ----------------------------- */
function Dashboard({ members, plans, payments, dueSoon, overdue, onWhatsApp, onRecordFee, onGoMembers }) {
  const totalMembers = members.length;
  const activePlans = plans.length;
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return payments.filter((p) => p.date?.startsWith(ym)).reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [payments]);

  const stats = [
    { label: "Total Members", value: totalMembers, icon: Users, color: theme.accent },
    { label: "Active Plans", value: activePlans, icon: CreditCard, color: theme.accent },
    { label: "Due This Week", value: dueSoon.length, icon: Clock, color: theme.warning },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, color: theme.danger },
  ];

  return (
    <div className="uffc-fade-in space-y-8">
      <div>
        <h1 className="uffc-display text-3xl md:text-4xl">DASHBOARD</h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
          This month's collection: <span style={{ color: theme.success, fontWeight: 700 }}>{fmtMoney(thisMonthRevenue)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <s.icon size={18} style={{ color: s.color }} />
            <div className="uffc-display text-3xl mt-2">{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <ReminderPanel
        title="OVERDUE — NOT PAID"
        icon={AlertTriangle}
        color={theme.danger}
        list={overdue}
        emptyText="Nobody is overdue right now. Clean sheet."
        onWhatsApp={onWhatsApp}
        onRecordFee={onRecordFee}
      />

      <ReminderPanel
        title="DUE WITHIN 7 DAYS"
        icon={Clock}
        color={theme.warning}
        list={dueSoon}
        emptyText="No renewals due in the next week."
        onWhatsApp={onWhatsApp}
        onRecordFee={onRecordFee}
      />

      <button
        onClick={onGoMembers}
        className="text-sm font-semibold flex items-center gap-1"
        style={{ color: theme.accent }}
      >
        View all members <ChevronRight size={15} />
      </button>
    </div>
  );
}

function ReminderPanel({ title, icon: Icon, color, list, emptyText, onWhatsApp, onRecordFee }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: theme.border }}>
        <Icon size={16} style={{ color }} />
        <span className="uffc-display text-lg" style={{ color, letterSpacing: "0.05em" }}>{title}</span>
        <span
          className="ml-auto text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          style={{ background: theme.surfaceRaised, color }}
        >
          {list.length}
        </span>
      </div>
      {list.length === 0 ? (
        <div className="px-4 py-6 text-sm text-center" style={{ color: theme.textFaint }}>{emptyText}</div>
      ) : (
        <div className="divide-y" style={{ borderColor: theme.border }}>
          {list.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderColor: theme.border }}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{m.name}</div>
                <div className="text-xs" style={{ color: theme.textMuted }}>
                  {m.plan?.name || "No plan"} · {fmtMoney(m.plan?.price)} · due {fmtDate(m.nextDueDate)}
                  {m.status.key === "overdue" ? ` (${Math.abs(m.status.days)}d late)` : ` (in ${m.status.days}d)`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onWhatsApp(m)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: theme.successDim, color: theme.success }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
                <button
                  onClick={() => onRecordFee(m)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: theme.surfaceRaised, color: theme.text, border: `1px solid ${theme.border}` }}
                >
                  Record Fee
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Members ------------------------------- */
function MembersView({ members, search, setSearch, plans, onAdd, onEdit, onDelete, onWhatsApp, onRecordFee }) {
  return (
    <div className="uffc-fade-in space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="uffc-display text-3xl md:text-4xl">MEMBERS</h1>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-lg"
          style={{ background: theme.accent, color: theme.bg }}
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textFaint }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile…"
          className={inputCls}
          style={{ paddingLeft: "2.2rem" }}
        />
      </div>

      {plans.length === 0 && (
        <div className="text-sm rounded-lg px-4 py-3" style={{ background: theme.warningDim, color: theme.warning }}>
          Create a plan first so you can assign one to new members.
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState text="No members yet. Add your first member to get started." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {members.map((m) => (
            <div key={m.id} className="rounded-xl p-4" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{m.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                    {m.age} yrs · {m.gender} · {m.plan?.name || "No plan"}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>

              <div className="mt-3 space-y-1 text-xs" style={{ color: theme.textMuted }}>
                <div className="flex items-center gap-1.5"><Phone size={12} /> {m.mobile}</div>
                <div className="flex items-center gap-1.5"><Mail size={12} /> {m.email}</div>
                <div className="flex items-center gap-1.5"><MapPin size={12} /> {m.address}</div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} /> Joined {fmtDate(m.joinDate)} · Next due {fmtDate(m.nextDueDate)}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => onWhatsApp(m)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{ background: theme.successDim, color: theme.success }}
                >
                  <MessageCircle size={13} /> Remind
                </button>
                <button
                  onClick={() => onRecordFee(m)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{ background: theme.surfaceRaised, color: theme.text, border: `1px solid ${theme.border}` }}
                >
                  Record Fee
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <IconBtn icon={Edit2} onClick={() => onEdit(m)} title="Edit" />
                  <IconBtn icon={Trash2} onClick={() => onDelete(m)} title="Delete" color={theme.danger} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberFormModal({ initial, plans, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: initial.id || null,
    name: initial.name || "",
    age: initial.age || "",
    gender: initial.gender || "Male",
    mobile: initial.mobile || "",
    email: initial.email || "",
    address: initial.address || "",
    planId: initial.planId || plans[0]?.id || "",
    joinDate: initial.joinDate || todayStr(),
  });
  const isEdit = !!initial.id;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title={isEdit ? "Edit Member" : "Add Member"} onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, age: Number(form.age) });
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Full Name" required>
            <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Rohit Sharma" />
          </Field>
          <Field label="Age" required>
            <input required type="number" min="10" max="100" value={form.age} onChange={set("age")} className={inputCls} placeholder="27" />
          </Field>
          <Field label="Gender" required>
            <select required value={form.gender} onChange={set("gender")} className={inputCls}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Mobile Number" required>
            <input required value={form.mobile} onChange={set("mobile")} className={inputCls} placeholder="98765 43210" />
          </Field>
          <Field label="Email ID" required>
            <input required type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="name@example.com" />
          </Field>
          <Field label="Membership Plan" required>
            <select required value={form.planId} onChange={set("planId")} className={inputCls}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {fmtMoney(p.price)}/mo</option>
              ))}
            </select>
          </Field>
          <Field label="Join Date" required>
            <input required type="date" value={form.joinDate} onChange={set("joinDate")} className={inputCls} />
          </Field>
        </div>
        <Field label="Address" required>
          <textarea required value={form.address} onChange={set("address")} className={inputCls} rows={2} placeholder="Street, area, city" />
        </Field>
        <ModalActions onCancel={onCancel} saveLabel={isEdit ? "Save Changes" : "Add Member"} />
      </form>
    </Modal>
  );
}

/* --------------------------------- Plans -------------------------------- */
function PlansView({ plans, members, onAdd, onEdit, onDelete }) {
  const countFor = (id) => members.filter((m) => m.planId === id).length;
  return (
    <div className="uffc-fade-in space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="uffc-display text-3xl md:text-4xl">PLANS</h1>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-lg"
          style={{ background: theme.accent, color: theme.bg }}
        >
          <Plus size={16} /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-xl p-5 flex flex-col"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-start justify-between">
              <div className="uffc-display text-2xl">{p.name}</div>
              <div className="flex gap-1.5">
                <IconBtn icon={Edit2} onClick={() => onEdit(p)} title="Edit" />
                <IconBtn icon={Trash2} onClick={() => onDelete(p)} title="Delete" color={theme.danger} />
              </div>
            </div>
            <div className="mt-1">
              <span className="uffc-display text-3xl" style={{ color: theme.accent }}>{fmtMoney(p.price)}</span>
              <span className="text-xs" style={{ color: theme.textFaint }}> /month</span>
            </div>
            <p className="text-sm mt-3 flex-1" style={{ color: theme.textMuted }}>{p.description}</p>
            <div className="text-xs mt-4 pt-3 border-t" style={{ borderColor: theme.border, color: theme.textFaint }}>
              {countFor(p.id)} member{countFor(p.id) === 1 ? "" : "s"} on this plan
            </div>
          </div>
        ))}
        {plans.length === 0 && <EmptyState text="No plans yet. Create your first membership plan." />}
      </div>
    </div>
  );
}

function PlanFormModal({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: initial.id || null,
    name: initial.name || "",
    price: initial.price || "",
    description: initial.description || "",
  });
  const isEdit = !!initial.id;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title={isEdit ? "Edit Plan" : "New Plan"} onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, price: Number(form.price) });
        }}
      >
        <Field label="Plan Name" required>
          <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="e.g. Contender" />
        </Field>
        <Field label="Monthly Price (₹)" required>
          <input required type="number" min="0" value={form.price} onChange={set("price")} className={inputCls} placeholder="2000" />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={set("description")} className={inputCls} rows={3} placeholder="What's included in this plan?" />
        </Field>
        <ModalActions onCancel={onCancel} saveLabel={isEdit ? "Save Changes" : "Create Plan"} />
      </form>
    </Modal>
  );
}

/* --------------------------------- Fees --------------------------------- */
function FeesView({ payments, members, planById, onAdd }) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const sorted = [...payments].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="uffc-fade-in space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="uffc-display text-3xl md:text-4xl">FEE PAYMENTS</h1>
        <button
          onClick={onAdd}
          disabled={members.length === 0}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-lg disabled:opacity-40"
          style={{ background: theme.accent, color: theme.bg }}
        >
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="rounded-xl p-4" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        <div className="text-xs" style={{ color: theme.textMuted }}>Total Collected (all time)</div>
        <div className="uffc-display text-3xl mt-1" style={{ color: theme.success }}>{fmtMoney(totalCollected)}</div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState text="No fee payments recorded yet." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="overflow-x-auto uffc-scroll">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left" style={{ background: theme.surfaceRaised, color: theme.textMuted }}>
                  <th className="px-4 py-2.5 font-semibold text-xs">Member</th>
                  <th className="px-4 py-2.5 font-semibold text-xs">Plan</th>
                  <th className="px-4 py-2.5 font-semibold text-xs">Amount</th>
                  <th className="px-4 py-2.5 font-semibold text-xs">Paid On</th>
                  <th className="px-4 py-2.5 font-semibold text-xs">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: theme.border }}>
                {sorted.map((p) => {
                  const mem = memberById[p.memberId];
                  return (
                    <tr key={p.id} style={{ borderColor: theme.border }}>
                      <td className="px-4 py-2.5 font-medium">{mem ? mem.name : "Deleted member"}</td>
                      <td className="px-4 py-2.5" style={{ color: theme.textMuted }}>{mem ? planById[mem.planId]?.name : "—"}</td>
                      <td className="px-4 py-2.5" style={{ color: theme.success, fontWeight: 600 }}>{fmtMoney(p.amount)}</td>
                      <td className="px-4 py-2.5" style={{ color: theme.textMuted }}>{fmtDate(p.date)}</td>
                      <td className="px-4 py-2.5" style={{ color: theme.textFaint }}>{p.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeFormModal({ members, planById, initialMember, onCancel, onSave }) {
  const [memberId, setMemberId] = useState(initialMember?.id || members[0]?.id || "");
  const member = members.find((m) => m.id === memberId);
  const plan = member ? planById[member.planId] : null;
  const [amount, setAmount] = useState(plan?.price || "");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");

  useEffect(() => {
    const m = members.find((x) => x.id === memberId);
    const pl = m ? planById[m.planId] : null;
    setAmount(pl?.price || "");
  }, [memberId]); // eslint-disable-line

  if (members.length === 0) {
    return (
      <Modal title="Record Fee Payment" onCancel={onCancel}>
        <p className="text-sm" style={{ color: theme.textMuted }}>Add a member first before recording a payment.</p>
        <ModalActions onCancel={onCancel} hideSave />
      </Modal>
    );
  }

  return (
    <Modal title="Record Fee Payment" onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(member, amount, date, note);
        }}
      >
        <Field label="Member" required>
          <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        {member && (
          <div className="text-xs mb-3 -mt-1" style={{ color: theme.textFaint }}>
            Plan: {plan?.name || "—"} · Current next due date: {fmtDate(member.nextDueDate)}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Amount (₹)" required>
            <input required type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Payment Date" required>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Paid by UPI" />
        </Field>
        <div className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: theme.successDim, color: theme.success }}>
          Next due date will move to {fmtDate(addMonths(date, 1))}
        </div>
        <ModalActions onCancel={onCancel} saveLabel="Save Payment" />
      </form>
    </Modal>
  );
}

/* -------------------------------- shared -------------------------------- */
function Modal({ title, children, onCancel }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="uffc-fade-in w-full max-w-lg rounded-xl p-5 max-h-[90vh] overflow-y-auto uffc-scroll"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="uffc-display text-2xl">{title}</h2>
          <button onClick={onCancel} style={{ color: theme.textFaint }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, saveLabel, hideSave }) {
  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg"
        style={{ background: theme.surfaceRaised, color: theme.text, border: `1px solid ${theme.border}` }}
      >
        Cancel
      </button>
      {!hideSave && (
        <button
          type="submit"
          className="flex-1 text-sm font-bold px-4 py-2.5 rounded-lg"
          style={{ background: theme.accent, color: theme.bg }}
        >
          {saveLabel}
        </button>
      )}
    </div>
  );
}

function ConfirmModal({ label, onCancel, onConfirm }) {
  return (
    <Modal title="Confirm Delete" onCancel={onCancel}>
      <p className="text-sm" style={{ color: theme.textMuted }}>
        Are you sure you want to delete <span style={{ color: theme.text, fontWeight: 600 }}>{label}</span>? This can't be undone.
      </p>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
        <button
          onClick={onCancel}
          className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg"
          style={{ background: theme.surfaceRaised, color: theme.text, border: `1px solid ${theme.border}` }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 text-sm font-bold px-4 py-2.5 rounded-lg"
          style={{ background: theme.danger, color: "#fff" }}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

function EmptyState({ text }) {
  return (
    <div
      className="rounded-xl p-10 text-center text-sm col-span-full"
      style={{ background: theme.surface, border: `1px dashed ${theme.border}`, color: theme.textFaint }}
    >
      {text}
    </div>
  );
}
