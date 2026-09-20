"use client";

import { formatYuan, nextAssignee, splitEqual, yuanToCents, type ExpenseShare } from "@daziwu/domain";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Coins,
  House,
  PackageCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  Settings2,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "today" | "expenses" | "chores" | "supplies" | "more";
type ExpenseStatus = "open" | "settled";
type ChoreStatus = "todo" | "done";
type SupplyStatus = "enough" | "low" | "out" | "buying";

type Member = { id: string; name: string; initials: string; color: string };
type Expense = {
  id: string;
  title: string;
  amountCents: number;
  payerId: string;
  shares: ExpenseShare[];
  date: string;
  status: ExpenseStatus;
  settledMemberIds?: string[];
};
type Chore = {
  id: string;
  title: string;
  area: string;
  assigneeId: string;
  due: string;
  status: ChoreStatus;
  nextAssigneeId: string;
};
type Supply = {
  id: string;
  title: string;
  quantity: number;
  target: number;
  status: SupplyStatus;
  claimantId?: string;
};
type Activity = { id: string; text: string; time: string; tone: "navy" | "green" | "yellow" };
type AppData = { expenses: Expense[]; chores: Chore[]; supplies: Supply[]; activities: Activity[] };
type MorePanel = "invite" | "rules" | "notifications";
type AssistantCandidate =
  | { kind: "expense"; title: string; amountCents: number }
  | { kind: "transfer"; choreId: string; targetMemberId: string }
  | { kind: "supply"; supplyId: string };

const members: Member[] = [
  { id: "lin", name: "林一", initials: "林", color: "#2C668D" },
  { id: "zhou", name: "周周", initials: "周", color: "#D2634C" },
  { id: "xu", name: "许言", initials: "许", color: "#7462A9" },
  { id: "zhe", name: "阿哲", initials: "哲", color: "#2E8B67" },
];

const initialData: AppData = {
  expenses: [
    {
      id: "expense-water",
      title: "八月水电费",
      amountCents: 15440,
      payerId: "zhou",
      shares: splitEqual(15440, members.map((member) => member.id)),
      date: "今天",
      status: "open",
      settledMemberIds: [],
    },
    {
      id: "expense-cleaner",
      title: "厨房清洁剂",
      amountCents: 3190,
      payerId: "lin",
      shares: splitEqual(3190, members.map((member) => member.id)),
      date: "9月18日",
      status: "open",
      settledMemberIds: [],
    },
    {
      id: "expense-tissue",
      title: "抽纸补货",
      amountCents: 3798,
      payerId: "lin",
      shares: splitEqual(3798, members.map((member) => member.id)),
      date: "9月16日",
      status: "open",
      settledMemberIds: [],
    },
  ],
  chores: [
    { id: "chore-floor", title: "客厅拖地", area: "客厅", assigneeId: "lin", due: "今天 21:00", status: "todo", nextAssigneeId: "zhe" },
    { id: "chore-kitchen", title: "厨房台面", area: "厨房", assigneeId: "zhou", due: "明天", status: "todo", nextAssigneeId: "xu" },
    { id: "chore-trash", title: "垃圾分类", area: "玄关", assigneeId: "xu", due: "周日", status: "done", nextAssigneeId: "lin" },
  ],
  supplies: [
    { id: "supply-tissue", title: "抽纸", quantity: 1, target: 8, status: "low" },
    { id: "supply-cleaner", title: "清洁剂", quantity: 0, target: 2, status: "out" },
    { id: "supply-bag", title: "垃圾袋", quantity: 6, target: 10, status: "enough" },
  ],
  activities: [
    { id: "activity-1", text: "周周记录了八月水电费", time: "18 分钟前", tone: "navy" },
    { id: "activity-2", text: "许言完成了垃圾分类", time: "昨天 20:42", tone: "green" },
    { id: "activity-3", text: "抽纸库存降到 1 包", time: "周二", tone: "yellow" },
  ],
};

const storageKey = "daziwu:v2:guest-state";
const sessionKey = "daziwu:v2:guest-session";
const currentMemberId = "lin";

const navItems: { id: Tab; label: string; icon: typeof House }[] = [
  { id: "today", label: "今天", icon: House },
  { id: "expenses", label: "费用", icon: WalletCards },
  { id: "chores", label: "家务", icon: ClipboardCheck },
  { id: "supplies", label: "用品", icon: Boxes },
  { id: "more", label: "更多", icon: Settings2 },
];

export function DaziwuApp() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<AppData>(initialData);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [morePanel, setMorePanel] = useState<MorePanel | null>(null);
  const [purchaseSupply, setPurchaseSupply] = useState<Supply | null>(null);
  const [toast, setToast] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect -- This mount-only effect hydrates browser-local guest data after SSR. */
  useEffect(() => {
    const storedData = window.localStorage.getItem(storageKey);
    const storedSession = window.localStorage.getItem(sessionKey);
    if (storedData) {
      try {
        setData(JSON.parse(storedData) as AppData);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setEntered(Boolean(storedSession));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const finance = useMemo(() => calculateMemberFinance(data.expenses, currentMemberId), [data.expenses]);
  const todoChores = data.chores.filter((chore) => chore.assigneeId === currentMemberId && chore.status === "todo");
  const urgentSupplies = data.supplies.filter((supply) => supply.status === "low" || supply.status === "out");
  const pendingCount = todoChores.length + urgentSupplies.filter((supply) => !supply.claimantId).length + (finance.owesCents > 0 ? 1 : 0);

  function enterGuestMode() {
    window.localStorage.setItem(sessionKey, JSON.stringify({ id: crypto.randomUUID(), createdAt: new Date().toISOString() }));
    setEntered(true);
  }

  function showToast(message: string) {
    setToast(message);
  }

  function addExpense(expense: Expense) {
    setData((current) => ({
      ...current,
      expenses: [expense, ...current.expenses],
      activities: [
        { id: crypto.randomUUID(), text: `林一记录了${expense.title}`, time: "刚刚", tone: "navy" },
        ...current.activities,
      ],
    }));
    setExpenseOpen(false);
    showToast("费用已保存，分摊结果已同步到本机小屋");
  }

  function settleExpense(id: string) {
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => {
        if (expense.id !== id) return expense;
        const settledMemberIds = Array.from(new Set([...(expense.settledMemberIds ?? []), currentMemberId]));
        const debtorIds = expense.shares.filter((share) => share.memberId !== expense.payerId).map((share) => share.memberId);
        return {
          ...expense,
          settledMemberIds,
          status: debtorIds.every((memberId) => settledMemberIds.includes(memberId)) ? "settled" : "open",
        };
      }),
      activities: [
        { id: crypto.randomUUID(), text: "林一确认完成一笔结算", time: "刚刚", tone: "green" },
        ...current.activities,
      ],
    }));
    showToast("已记录结算，本地余额已更新");
  }

  function completeChore(id: string) {
    const chore = data.chores.find((item) => item.id === id);
    if (!chore) return;
    setData((current) => ({
      ...current,
      chores: [
        ...current.chores.map((item) => (item.id === id ? { ...item, status: "done" as const } : item)),
        {
          ...chore,
          id: crypto.randomUUID(),
          assigneeId: chore.nextAssigneeId,
          nextAssigneeId: nextAssignee(chore.nextAssigneeId, members.map((member) => member.id)),
          due: "下周同一时间",
          status: "todo" as const,
        },
      ],
      activities: [
        { id: crypto.randomUUID(), text: `林一完成了${chore.title}，下一轮由${memberName(chore.nextAssigneeId)}负责`, time: "刚刚", tone: "green" },
        ...current.activities,
      ],
    }));
    showToast(`已完成；下一轮由${memberName(chore.nextAssigneeId)}负责`);
  }

  function transferChore(id: string) {
    const chore = data.chores.find((item) => item.id === id);
    if (!chore) return;
    setData((current) => ({
      ...current,
      chores: current.chores.map((item) => (item.id === id ? { ...item, assigneeId: item.nextAssigneeId } : item)),
      activities: [
        { id: crypto.randomUUID(), text: `${chore.title}已转交给${memberName(chore.nextAssigneeId)}`, time: "刚刚", tone: "yellow" },
        ...current.activities,
      ],
    }));
    showToast(`已转交给${memberName(chore.nextAssigneeId)}`);
  }

  function claimSupply(id: string) {
    const supply = data.supplies.find((item) => item.id === id);
    if (!supply) return;
    setData((current) => ({
      ...current,
      supplies: current.supplies.map((item) =>
        item.id === id ? { ...item, claimantId: currentMemberId, status: "buying" } : item,
      ),
      activities: [
        { id: crypto.randomUUID(), text: `林一认领采购${supply.title}`, time: "刚刚", tone: "yellow" },
        ...current.activities,
      ],
    }));
    showToast(`已认领${supply.title}，其他室友不会重复购买`);
  }

  function reportSupplyOut(id: string) {
    const supply = data.supplies.find((item) => item.id === id);
    if (!supply) return;
    setData((current) => ({
      ...current,
      supplies: current.supplies.map((item) => item.id === id ? { ...item, quantity: 0, status: "out" } : item),
      activities: [
        { id: crypto.randomUUID(), text: `林一报告${supply.title}已用完`, time: "刚刚", tone: "yellow" },
        ...current.activities,
      ],
    }));
    showToast(`${supply.title}已标记为缺货`);
  }

  function executeAssistantCandidate(candidate: AssistantCandidate) {
    if (candidate.kind === "expense") {
      addExpense({
        id: crypto.randomUUID(),
        title: candidate.title,
        amountCents: candidate.amountCents,
        payerId: currentMemberId,
        shares: splitEqual(candidate.amountCents, members.map((member) => member.id)),
        date: "今天",
        status: "open",
        settledMemberIds: [],
      });
    }
    if (candidate.kind === "transfer") transferChore(candidate.choreId);
    if (candidate.kind === "supply") reportSupplyOut(candidate.supplyId);
    setAssistantOpen(false);
  }

  function finishPurchase(supply: Supply, quantity: number, amountCents: number) {
    const shares = splitEqual(amountCents, members.map((member) => member.id));
    const expense: Expense = {
      id: crypto.randomUUID(),
      title: `${supply.title}补货`,
      amountCents,
      payerId: currentMemberId,
      shares,
      date: "今天",
      status: "open",
      settledMemberIds: [],
    };
    setData((current) => ({
      ...current,
      supplies: current.supplies.map((item) =>
        item.id === supply.id
          ? { ...item, quantity: item.quantity + quantity, claimantId: undefined, status: "enough" }
          : item,
      ),
      expenses: [expense, ...current.expenses],
      activities: [
        { id: crypto.randomUUID(), text: `${supply.title}已入库，并生成共同费用`, time: "刚刚", tone: "green" },
        ...current.activities,
      ],
    }));
    setPurchaseSupply(null);
    showToast("采购已入库，共同费用只生成了一次");
  }

  function resetDemo() {
    setData(initialData);
    showToast("本机示例数据已恢复");
  }

  if (!ready) return <div className="min-h-screen bg-paper" />;

  if (!entered) return <Welcome onEnter={enterGuestMode} />;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="app-layout">
        <DesktopRail active={tab} onChange={setTab} pendingCount={pendingCount} />
        <main className="app-main">
          <MobileHeader pendingCount={pendingCount} onNotifications={() => setMorePanel("notifications")} />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {tab === "today" && (
                <TodayPage
                  finance={finance}
                  chores={todoChores}
                  supplies={urgentSupplies}
                  activities={data.activities}
                  onAddExpense={() => setExpenseOpen(true)}
                  onOpenAssistant={() => setAssistantOpen(true)}
                  onGo={setTab}
                  onCompleteChore={completeChore}
                  onClaimSupply={claimSupply}
                />
              )}
              {tab === "expenses" && (
                <ExpensesPage expenses={data.expenses} finance={finance} onAdd={() => setExpenseOpen(true)} onSettle={settleExpense} />
              )}
              {tab === "chores" && <ChoresPage chores={data.chores} onComplete={completeChore} onTransfer={transferChore} />}
              {tab === "supplies" && (
                <SuppliesPage supplies={data.supplies} onClaim={claimSupply} onPurchase={setPurchaseSupply} />
              )}
              {tab === "more" && <MorePage activities={data.activities} onReset={resetDemo} onOpenPanel={setMorePanel} />}
            </motion.div>
          </AnimatePresence>
        </main>
        <ActivityAside activities={data.activities} finance={finance} />
      </div>

      <MobileNav active={tab} onChange={setTab} />
      <AnimatePresence>{expenseOpen && <ExpenseModal onClose={() => setExpenseOpen(false)} onSave={addExpense} />}</AnimatePresence>
      <AnimatePresence>
        {assistantOpen && (
          <AssistantModal
            chores={data.chores}
            supplies={data.supplies}
            onClose={() => setAssistantOpen(false)}
            onExecute={executeAssistantCandidate}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {morePanel && (
          <MoreModal
            panel={morePanel}
            onClose={() => setMorePanel(null)}
            onDone={(message) => {
              setMorePanel(null);
              showToast(message);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {purchaseSupply && (
          <PurchaseModal supply={purchaseSupply} onClose={() => setPurchaseSupply(null)} onSave={finishPurchase} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <CheckCircle2 size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="welcome-shell">
      <div className="welcome-grid" aria-hidden="true" />
      <motion.section
        className="welcome-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Brand size="large" />
        <div className="welcome-copy">
          <h1>合租的事，<br />不必总靠人催。</h1>
          <p>费用算清、家务轮换、缺货有人接。先进入示例小屋，所有操作都会保存在这台设备。</p>
        </div>
        <button className="primary-button welcome-button" onClick={onEnter}>
          直接进入梧桐里 3B
          <ArrowRight size={19} />
        </button>
        <p className="welcome-note">不用注册，不收集邮箱。未来开启多人同步时可再绑定账号。</p>
        <div className="welcome-proof">
          <span><Coins size={17} />整数分分摊</span>
          <span><RotateCcw size={17} />自动轮值</span>
          <span><PackageCheck size={17} />采购自动入账</span>
        </div>
      </motion.section>
    </main>
  );
}

function Brand({ size = "small" }: { size?: "small" | "large" }) {
  return (
    <div className={`brand brand-${size}`}>
      <span className="brand-bars" aria-hidden="true"><i /><i /><i /></span>
      <span>搭子屋</span>
      {size === "large" && <b>2.0</b>}
    </div>
  );
}

function DesktopRail({ active, onChange, pendingCount }: { active: Tab; onChange: (tab: Tab) => void; pendingCount: number }) {
  return (
    <aside className="desktop-rail">
      <Brand />
      <div className="home-chip">
        <div><span>梧桐里 3B</span><small>4 位室友</small></div>
        <ChevronRight size={17} />
      </div>
      <nav aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
              <Icon size={20} />
              <span>{item.label}</span>
              {item.id === "today" && pendingCount > 0 && <b>{pendingCount}</b>}
            </button>
          );
        })}
      </nav>
      <div className="rail-promise">
        <small>本月约定</small>
        <strong>费用当天记，家务做完点一下。</strong>
      </div>
      <div className="rail-profile">
        <Avatar memberId="lin" />
        <div><strong>林一</strong><small>访客管理员</small></div>
      </div>
    </aside>
  );
}

function MobileHeader({ pendingCount, onNotifications }: { pendingCount: number; onNotifications: () => void }) {
  return (
    <header className="mobile-header">
      <div><small>梧桐里 3B</small><strong>今天要处理 {pendingCount} 件事</strong></div>
      <button aria-label="查看通知" onClick={onNotifications}><Bell size={20} /><span>{pendingCount}</span></button>
    </header>
  );
}

function MobileNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="mobile-nav" aria-label="主导航">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

type Finance = { owesCents: number; receivesCents: number; netCents: number; openExpenses: Expense[] };

function TodayPage({
  finance,
  chores,
  supplies,
  activities,
  onAddExpense,
  onOpenAssistant,
  onGo,
  onCompleteChore,
  onClaimSupply,
}: {
  finance: Finance;
  chores: Chore[];
  supplies: Supply[];
  activities: Activity[];
  onAddExpense: () => void;
  onOpenAssistant: () => void;
  onGo: (tab: Tab) => void;
  onCompleteChore: (id: string) => void;
  onClaimSupply: (id: string) => void;
}) {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="周日，9月20日" title="今日待办" action={<Avatar memberId="lin" />} />
      <section className="action-ticket">
        <div className="ticket-head">
          <span>我的行动单</span>
          <b>{chores.length + supplies.filter((item) => !item.claimantId).length + (finance.owesCents ? 1 : 0)} 项待处理</b>
        </div>
        {chores.map((chore) => (
          <article className="ticket-row" key={chore.id}>
            <span className="ticket-icon"><ClipboardCheck size={19} /></span>
            <div><strong>{chore.title}</strong><small>{chore.due} · 下一轮 {memberName(chore.nextAssigneeId)}</small></div>
            <button onClick={() => onCompleteChore(chore.id)}>完成</button>
          </article>
        ))}
        {finance.owesCents > 0 && (
          <article className="ticket-row">
            <span className="ticket-icon"><ArrowUpRight size={19} /></span>
            <div><strong>向周周结算 {formatYuan(finance.owesCents)}</strong><small>八月水电费 · 账目已核对</small></div>
            <button onClick={() => onGo("expenses")}>去结算</button>
          </article>
        )}
        {supplies.filter((item) => !item.claimantId).map((supply) => (
          <article className="ticket-row urgent" key={supply.id}>
            <span className="ticket-icon"><Boxes size={19} /></span>
            <div><strong>补充{supply.title}</strong><small>只剩 {supply.quantity} / {supply.target}</small></div>
            <button onClick={() => onClaimSupply(supply.id)}>我来买</button>
          </article>
        ))}
      </section>

      <div className="metric-strip">
        <button onClick={() => onGo("expenses")}>
          <span><ArrowDownLeft size={16} />待收</span><strong>{formatYuan(finance.receivesCents)}</strong>
        </button>
        <button onClick={() => onGo("expenses")}>
          <span><ArrowUpRight size={16} />待付</span><strong>{formatYuan(finance.owesCents)}</strong>
        </button>
        <button onClick={() => onGo("chores")}>
          <span><ClipboardCheck size={16} />本周家务</span><strong>6 / 8</strong>
        </button>
      </div>

      <button className="assistant-entry" onClick={onOpenAssistant}>
        <span className="assistant-entry-icon"><Sparkles size={21} /></span>
        <span><small>搭子屋 AI</small><strong>一句话记账、调家务、报缺货</strong></span>
        <ChevronRight size={19} />
      </button>

      <section>
        <SectionHead title="顺手处理" hint="常用动作" />
        <div className="quick-grid">
          <button className="quick-action primary" onClick={onAddExpense}><ReceiptText size={22} /><span><strong>记一笔费用</strong><small>自动均分到整数分</small></span><Plus size={19} /></button>
          <button className="quick-action" onClick={() => onGo("chores")}><ClipboardCheck size={22} /><span><strong>安排家务</strong><small>看看本周轮到谁</small></span><ChevronRight size={19} /></button>
          <button className="quick-action" onClick={() => onGo("supplies")}><Boxes size={22} /><span><strong>报告缺货</strong><small>避免室友重复购买</small></span><ChevronRight size={19} /></button>
        </div>
      </section>

      <section className="mobile-activity">
        <SectionHead title="家里刚发生" hint="共同记录" />
        <ActivityList activities={activities.slice(0, 3)} />
      </section>
    </div>
  );
}

function ExpensesPage({ expenses, finance, onAdd, onSettle }: { expenses: Expense[]; finance: Finance; onAdd: () => void; onSettle: (id: string) => void }) {
  const payable = expenses.find((expense) => expense.status === "open" && expense.payerId !== currentMemberId && expense.shares.some((share) => share.memberId === currentMemberId) && !(expense.settledMemberIds ?? []).includes(currentMemberId));
  return (
    <div className="page-stack">
      <PageHeading eyebrow="收支与结算" title="费用账本" action={<button className="icon-button" onClick={onAdd} aria-label="新增费用"><Plus size={21} /></button>} />
      <section className="balance-board">
        <div><small>我的净余额</small><strong className={finance.netCents >= 0 ? "positive" : "negative"}>{finance.netCents >= 0 ? "+" : "-"}{formatYuan(Math.abs(finance.netCents))}</strong><span>{finance.netCents >= 0 ? "整体应收" : "整体应付"}</span></div>
        <div className="balance-split">
          <span><small>待收</small><b>{formatYuan(finance.receivesCents)}</b></span>
          <span><small>待付</small><b>{formatYuan(finance.owesCents)}</b></span>
        </div>
      </section>
      {payable && (
        <section className="settle-card">
          <div className="settle-route"><Avatar memberId="lin" /><span><i /><ArrowRight size={17} /><i /></span><Avatar memberId={payable.payerId} /></div>
          <div><small>建议一次结清</small><strong>林一付给{memberName(payable.payerId)} {formatYuan(shareFor(payable, currentMemberId))}</strong></div>
          <button className="primary-button" onClick={() => onSettle(payable.id)}>记录已转账</button>
        </section>
      )}
      <section>
        <SectionHead title="本月账目" hint={`${expenses.length} 笔`} />
        <div className="list-card">
          {expenses.map((expense) => (
            <article className="expense-row" key={expense.id}>
              <span className={`expense-mark ${expense.status}`}><ReceiptText size={18} /></span>
              <div><strong>{expense.title}</strong><small>{memberName(expense.payerId)}付款 · {expense.date}</small></div>
              <div className="expense-amount"><strong>{formatYuan(expense.amountCents)}</strong><small>{expense.status === "settled" ? "已结清" : expense.payerId === currentMemberId ? `待收 ${formatYuan(receivableFor(expense, currentMemberId))}` : (expense.settledMemberIds ?? []).includes(currentMemberId) ? "我的份额已结清" : `我的份额 ${formatYuan(shareFor(expense, currentMemberId))}`}</small></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChoresPage({ chores, onComplete, onTransfer }: { chores: Chore[]; onComplete: (id: string) => void; onTransfer: (id: string) => void }) {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="本周轮值" title="家务排班" action={<span className="week-badge">第 38 周</span>} />
      <div className="week-strip" aria-label="本周日期">
        {["一 14", "二 15", "三 16", "四 17", "五 18", "六 19", "日 20"].map((day) => <span key={day} className={day === "日 20" ? "active" : ""}>{day}</span>)}
      </div>
      <section className="chore-board">
        {chores.map((chore) => (
          <article className={`chore-card ${chore.status}`} key={chore.id}>
            <div className="chore-top"><span>{chore.area}</span>{chore.status === "done" ? <b><Check size={15} />已完成</b> : <b><Clock3 size={15} />{chore.due}</b>}</div>
            <h3>{chore.title}</h3>
            <div className="assignee-line"><Avatar memberId={chore.assigneeId} /><span><small>本轮负责人</small><strong>{memberName(chore.assigneeId)}</strong></span><i /><span><small>下一轮</small><strong>{memberName(chore.nextAssigneeId)}</strong></span></div>
            {chore.status === "todo" && chore.assigneeId === currentMemberId && (
              <div className="button-row"><button className="primary-button" onClick={() => onComplete(chore.id)}>完成任务</button><button className="secondary-button" onClick={() => onTransfer(chore.id)}>转交给{memberName(chore.nextAssigneeId)}</button></div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function SuppliesPage({ supplies, onClaim, onPurchase }: { supplies: Supply[]; onClaim: (id: string) => void; onPurchase: (supply: Supply) => void }) {
  const urgent = supplies.filter((item) => item.status !== "enough");
  const stocked = supplies.filter((item) => item.status === "enough");
  return (
    <div className="page-stack">
      <PageHeading eyebrow="公共用品" title="用品库存" action={<span className="week-badge">{urgent.length} 项待补</span>} />
      <section>
        <SectionHead title="先补这些" hint="按库存排序" />
        <div className="supply-grid">
          {urgent.map((supply) => (
            <article className="supply-card urgent" key={supply.id}>
              <div className="supply-head"><span>{supply.status === "out" ? "已用完" : supply.status === "buying" ? "采购中" : "库存偏低"}</span><strong>{supply.quantity} / {supply.target}</strong></div>
              <h3>{supply.title}</h3>
              <div className="stock-bar"><i style={{ width: `${Math.max(4, (supply.quantity / supply.target) * 100)}%` }} /></div>
              {supply.claimantId ? <button className="primary-button" onClick={() => onPurchase(supply)}>完成采购并入库</button> : <button className="secondary-button" onClick={() => onClaim(supply.id)}>认领采购</button>}
            </article>
          ))}
        </div>
      </section>
      <section>
        <SectionHead title="库存正常" hint={`${stocked.length} 项`} />
        <div className="list-card">
          {stocked.map((supply) => (
            <article className="stock-row" key={supply.id}>
              <span><Boxes size={19} /></span><div><strong>{supply.title}</strong><small>目标库存 {supply.target}</small></div><b>{supply.quantity} / {supply.target}</b>
            </article>
          ))}
        </div>
      </section>
      <section className="supply-flow-card">
        <div><PackageCheck size={20} /><span><small>搭子屋的补货闭环</small><strong>一次确认，两条记录</strong></span></div>
        <ol><li><b>1</b><span>认领采购</span></li><li><b>2</b><span>完成入库</span></li><li><b>3</b><span>自动生成共同费用</span></li></ol>
        <p>先认领可避免重复购买；只有填写实际金额并确认入库后，才会创建费用。</p>
      </section>
    </div>
  );
}

function MorePage({ activities, onReset, onOpenPanel }: { activities: Activity[]; onReset: () => void; onOpenPanel: (panel: MorePanel) => void }) {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="梧桐里 3B" title="小屋管理" action={<Avatar memberId="lin" />} />
      <section className="member-card">
        <SectionHead title="室友成员" hint="4 位" />
        <div className="member-row">{members.map((member) => <div key={member.id}><Avatar memberId={member.id} /><span>{member.name}</span><small>{member.id === "lin" ? "访客管理员" : "成员"}</small></div>)}</div>
      </section>
      <section className="settings-list">
        <button onClick={() => onOpenPanel("invite")}><span><Users size={20} /></span><div><strong>邀请室友</strong><small>先体验邀请码流程，云端阶段再开放同步</small></div><ChevronRight size={18} /></button>
        <button onClick={() => onOpenPanel("rules")}><span><ClipboardCheck size={20} /></span><div><strong>合租规则</strong><small>2 条规则 · 全员已确认</small></div><ChevronRight size={18} /></button>
        <button onClick={() => onOpenPanel("notifications")}><span><Bell size={20} /></span><div><strong>通知与安静时段</strong><small>只提醒真正需要处理的事</small></div><ChevronRight size={18} /></button>
      </section>
      <section>
        <SectionHead title="最近活动" hint="本机记录" />
        <ActivityList activities={activities.slice(0, 5)} />
      </section>
      <button className="reset-button" onClick={onReset}>恢复本机示例数据</button>
    </div>
  );
}

function ActivityAside({ activities, finance }: { activities: Activity[]; finance: Finance }) {
  return (
    <aside className="activity-aside">
      <div className="aside-head"><span>家里动态</span><Bell size={18} /></div>
      <ActivityList activities={activities.slice(0, 5)} />
      <section className="aside-summary"><small>本月净状态</small><strong>{finance.netCents >= 0 ? "室友需要付给你" : "你还需要结算"}</strong><b>{formatYuan(Math.abs(finance.netCents))}</b></section>
      <section className="guest-note"><Sparkles size={18} /><div><strong>当前是点击即用模式</strong><small>数据只保存在这台设备。接入云端后再开放邀请和跨设备同步。</small></div></section>
    </aside>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return <div className="activity-list">{activities.map((activity) => <article key={activity.id}><i className={activity.tone} /><div><strong>{activity.text}</strong><small>{activity.time}</small></div></article>)}</div>;
}

function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <header className="page-heading"><div><small>{eyebrow}</small><h1>{title}</h1></div>{action}</header>;
}

function SectionHead({ title, hint }: { title: string; hint: string }) {
  return <div className="section-head"><h2>{title}</h2><span>{hint}</span></div>;
}

function Avatar({ memberId }: { memberId: string }) {
  const member = members.find((item) => item.id === memberId) ?? members[0];
  return <span className="avatar" style={{ backgroundColor: member.color }} aria-label={member.name}>{member.initials}</span>;
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ y: 32 }} animate={{ y: 0 }} exit={{ y: 32 }} transition={{ type: "spring", stiffness: 310, damping: 30 }} onMouseDown={(event) => event.stopPropagation()}>
        <header><div><small>{subtitle}</small><h2 id="modal-title">{title}</h2></div><button onClick={onClose} aria-label="关闭"><X size={21} /></button></header>
        {children}
      </motion.section>
    </motion.div>
  );
}

function ExpenseModal({ onClose, onSave }: { onClose: () => void; onSave: (expense: Expense) => void }) {
  const [title, setTitle] = useState("厨房清洁剂");
  const [amount, setAmount] = useState("31.90");
  const [selected, setSelected] = useState(members.map((member) => member.id));
  const [error, setError] = useState("");
  let preview: ExpenseShare[] = [];
  try { preview = splitEqual(yuanToCents(amount), selected); } catch { preview = []; }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const amountCents = yuanToCents(amount);
      const shares = splitEqual(amountCents, selected);
      if (!title.trim()) throw new Error("请填写费用名称");
      onSave({ id: crypto.randomUUID(), title: title.trim(), amountCents, payerId: currentMemberId, shares, date: "今天", status: "open", settledMemberIds: [] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "请检查输入");
    }
  }

  return (
    <ModalShell title="记一笔共同费用" subtitle="保存前先核对每个人的份额" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label><span>费用名称</span><input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
        <label><span>总金额</span><div className="money-input"><b>¥</b><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></div></label>
        <fieldset><legend>参与室友</legend><div className="participant-grid">{members.map((member) => <label key={member.id} className={selected.includes(member.id) ? "selected" : ""}><input type="checkbox" checked={selected.includes(member.id)} onChange={() => setSelected((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} /><Avatar memberId={member.id} /><span>{member.name}</span></label>)}</div></fieldset>
        <div className="split-preview"><div><strong>均分核对</strong><span>{preview.length} 人 · 合计 {preview.length ? formatYuan(preview.reduce((sum, share) => sum + share.amountCents, 0)) : "—"}</span></div>{preview.map((share) => <span key={share.memberId}><i>{memberName(share.memberId)}</i><b>{formatYuan(share.amountCents)}</b></span>)}</div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button modal-submit" type="submit">确认并保存费用</button>
      </form>
    </ModalShell>
  );
}

function AssistantModal({
  chores,
  supplies,
  onClose,
  onExecute,
}: {
  chores: Chore[];
  supplies: Supply[];
  onClose: () => void;
  onExecute: (candidate: AssistantCandidate) => void;
}) {
  const [input, setInput] = useState("昨晚买了牛奶 36 元，四个人平摊");
  const [candidate, setCandidate] = useState<AssistantCandidate | null>(null);
  const [error, setError] = useState("");
  const samples = ["昨晚买了牛奶 36 元，四个人平摊", "把客厅拖地转给阿哲", "抽纸用完了"];

  function understand() {
    const normalized = input.trim();
    setError("");
    const amountMatch = normalized.match(/(\d+(?:\.\d{1,2})?)\s*(?:元|块)/);
    if (amountMatch && /(买|付|花)/.test(normalized)) {
      const itemMatch = normalized.match(/(?:买了|买|付了|花了)\s*([^，,。]*?)(?=\s*\d)/);
      setCandidate({ kind: "expense", title: itemMatch?.[1]?.trim() || "共同费用", amountCents: yuanToCents(amountMatch[1]) });
      return;
    }
    if (/(拖地|客厅)/.test(normalized) && /(转|换)/.test(normalized)) {
      const chore = chores.find((item) => item.title.includes("拖地") && item.status === "todo");
      if (chore) {
        setCandidate({ kind: "transfer", choreId: chore.id, targetMemberId: "zhe" });
        return;
      }
    }
    const supply = supplies.find((item) => normalized.includes(item.title));
    if (supply && /(没了|用完|缺|补货)/.test(normalized)) {
      setCandidate({ kind: "supply", supplyId: supply.id });
      return;
    }
    setCandidate(null);
    setError("这句话暂时没有识别出可执行事项。可以试试下方示例。");
  }

  const preview = candidate ? describeCandidate(candidate, chores, supplies) : null;

  return (
    <ModalShell title="告诉搭子屋" subtitle="AI 理解意图，程序核算并执行" onClose={onClose}>
      <div className="assistant-panel">
        <div className="assistant-local-note"><Sparkles size={18} /><span><strong>当前为本机安全解析</strong><small>这版先验证确认流程；接入模型后仍由确定性程序计算金额和写入数据。</small></span></div>
        <label className="assistant-input"><span>你想处理什么？</span><textarea value={input} onChange={(event) => { setInput(event.target.value); setCandidate(null); setError(""); }} rows={3} /></label>
        <div className="assistant-samples">{samples.map((sample) => <button key={sample} onClick={() => { setInput(sample); setCandidate(null); setError(""); }}>{sample}</button>)}</div>
        {!candidate && <button className="primary-button assistant-understand" onClick={understand}>生成确认单<ArrowRight size={18} /></button>}
        {error && <p className="form-error">{error}</p>}
        {preview && (
          <motion.section className="assistant-confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <header><span><CheckCircle2 size={18} />执行前确认</span><b>{preview.kind}</b></header>
            <div><small>将要执行</small><strong>{preview.title}</strong><p>{preview.detail}</p></div>
            <div className="assistant-guard"><strong>由程序保证</strong><span>{preview.guard}</span></div>
            <button className="primary-button" onClick={() => candidate && onExecute(candidate)}>确认执行</button>
          </motion.section>
        )}
      </div>
    </ModalShell>
  );
}

function describeCandidate(candidate: AssistantCandidate, chores: Chore[], supplies: Supply[]) {
  if (candidate.kind === "expense") {
    const shares = splitEqual(candidate.amountCents, members.map((member) => member.id));
    return {
      kind: "共同费用",
      title: `${candidate.title} · ${formatYuan(candidate.amountCents)}`,
      detail: `由林一付款，4 人均分：${shares.map((share) => `${memberName(share.memberId)} ${formatYuan(share.amountCents)}`).join("、")}`,
      guard: "金额统一换算为整数分，所有份额之和严格等于总额。",
    };
  }
  if (candidate.kind === "transfer") {
    const chore = chores.find((item) => item.id === candidate.choreId);
    return {
      kind: "家务转交",
      title: `${chore?.title ?? "家务"}转交给${memberName(candidate.targetMemberId)}`,
      detail: "仅变更本轮负责人，原排班与后续轮值记录继续保留。",
      guard: "确认后才变更负责人，并写入共同活动记录。",
    };
  }
  const supply = supplies.find((item) => item.id === candidate.supplyId);
  return {
    kind: "库存变更",
    title: `${supply?.title ?? "用品"}标记为已用完`,
    detail: "库存会变为 0，并进入待认领采购列表。",
    guard: "此步骤不会自动产生费用，完成采购入库时才记账。",
  };
}

function MoreModal({ panel, onClose, onDone }: { panel: MorePanel; onClose: () => void; onDone: (message: string) => void }) {
  const [quietHours, setQuietHours] = useState(true);
  const [choreAlerts, setChoreAlerts] = useState(true);
  const [expenseAlerts, setExpenseAlerts] = useState(true);

  if (panel === "invite") {
    async function copyCode() {
      try {
        await navigator.clipboard.writeText("DZW-3B-7K9Q");
        onDone("邀请码已复制；云端协作上线后即可加入同一小屋");
      } catch {
        onDone("邀请码：DZW-3B-7K9Q");
      }
    }
    return (
      <ModalShell title="邀请室友" subtitle="点击即用阶段的邀请体验" onClose={onClose}>
        <div className="more-modal-content">
          <div className="invite-code"><small>梧桐里 3B 邀请码</small><strong>DZW-3B-7K9Q</strong><span>有效期将在云端版本中由管理员设置</span></div>
          <div className="phase-note"><Users size={19} /><span><strong>当前不会创建假同步</strong><small>这版保留完整邀请交互；接入匿名云端身份后，室友才会真正共享同一份小屋数据。</small></span></div>
          <button className="primary-button modal-submit" onClick={copyCode}>复制邀请码</button>
        </div>
      </ModalShell>
    );
  }

  if (panel === "rules") {
    return (
      <ModalShell title="合租规则" subtitle="共同确认后，减少重复沟通" onClose={onClose}>
        <div className="more-modal-content">
          <div className="rule-list">
            <article><b>01</b><div><strong>共同费用当天记录</strong><small>单笔超过 ¥200，付款前先在小屋里说明。</small></div><span>4/4 已确认</span></article>
            <article><b>02</b><div><strong>安静时段 23:00–08:00</strong><small>临时聚会至少提前一天告知其他室友。</small></div><span>4/4 已确认</span></article>
          </div>
          <button className="primary-button modal-submit" onClick={() => onDone("规则状态没有变更")}>知道了</button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="通知与安静时段" subtitle="只有需要行动时才提醒" onClose={onClose}>
      <div className="more-modal-content">
        <div className="preference-list">
          <PreferenceRow title="家务到期提醒" detail="到期前 2 小时提醒负责人" checked={choreAlerts} onChange={setChoreAlerts} />
          <PreferenceRow title="费用待结算提醒" detail="账目核对后提醒，不重复催促" checked={expenseAlerts} onChange={setExpenseAlerts} />
          <PreferenceRow title="安静时段" detail="23:00–08:00 只保留紧急提醒" checked={quietHours} onChange={setQuietHours} />
        </div>
        <button className="primary-button modal-submit" onClick={() => onDone("通知偏好已保存在本机")}>保存偏好</button>
      </div>
    </ModalShell>
  );
}

function PreferenceRow({ title, detail, checked, onChange }: { title: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="preference-row">
      <span><strong>{title}</strong><small>{detail}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function PurchaseModal({ supply, onClose, onSave }: { supply: Supply; onClose: () => void; onSave: (supply: Supply, quantity: number, amountCents: number) => void }) {
  const [quantity, setQuantity] = useState("8");
  const [amount, setAmount] = useState("24.80");
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const parsedQuantity = Number(quantity);
      if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) throw new Error("购买数量需要是正整数");
      onSave(supply, parsedQuantity, yuanToCents(amount));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "请检查输入"); }
  }
  return (
    <ModalShell title={`完成${supply.title}采购`} subtitle="入库和共同费用会一起生成" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label><span>购买数量</span><input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} autoFocus /></label>
        <label><span>实际金额</span><div className="money-input"><b>¥</b><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></div></label>
        <div className="atomic-note"><PackageCheck size={20} /><span><strong>一次确认，两条记录</strong><small>{supply.title}库存会增加，同时创建四人均分的共同费用。</small></span></div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button modal-submit" type="submit">确认入库并记账</button>
      </form>
    </ModalShell>
  );
}

function calculateMemberFinance(expenses: Expense[], memberId: string): Finance {
  let owesCents = 0;
  let receivesCents = 0;
  const openExpenses = expenses.filter((expense) => expense.status === "open");
  for (const expense of openExpenses) {
    if (expense.payerId === memberId) receivesCents += receivableFor(expense, memberId);
    else if (!(expense.settledMemberIds ?? []).includes(memberId)) owesCents += shareFor(expense, memberId);
  }
  return { owesCents, receivesCents, netCents: receivesCents - owesCents, openExpenses };
}

function shareFor(expense: Expense, memberId: string): number {
  return expense.shares.find((share) => share.memberId === memberId)?.amountCents ?? 0;
}

function receivableFor(expense: Expense, payerId: string): number {
  const settled = expense.settledMemberIds ?? [];
  return expense.shares.filter((share) => share.memberId !== payerId && !settled.includes(share.memberId)).reduce((sum, share) => sum + share.amountCents, 0);
}

function memberName(id: string): string {
  return members.find((member) => member.id === id)?.name ?? "室友";
}
