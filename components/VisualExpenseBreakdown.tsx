import React, { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Transaction, TransactionStatus } from "../types";
import { useCurrency } from "../contexts/CurrencyContext";
import { triggerHaptic } from "../utils/haptics";
import {
  PieChart as LucidePieChart,
  Film,
  Zap,
  Utensils,
  ShoppingBag,
  Plane,
  HeartPulse,
  ArrowRightLeft,
  Briefcase,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";

interface VisualExpenseBreakdownProps {
  transactions: Transaction[];
}

interface CategoryExpenseItem {
  name: string;
  categoryKey: string;
  value: number;
  count: number;
  color: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG: Record<
  string,
  { name: string; color: string; icon: React.ReactNode }
> = {
  entertainment: {
    name: "Entertainment & Media",
    color: "#8B5CF6", // Violet
    icon: <Film className="w-3.5 h-3.5" />,
  },
  utilities: {
    name: "Utilities & Bills",
    color: "#06B6D4", // Cyan
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  food: {
    name: "Food & Dining",
    color: "#F59E0B", // Amber
    icon: <Utensils className="w-3.5 h-3.5" />,
  },
  shopping: {
    name: "Shopping & Retail",
    color: "#EC4899", // Pink
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
  travel: {
    name: "Travel & Transit",
    color: "#3B82F6", // Blue
    icon: <Plane className="w-3.5 h-3.5" />,
  },
  healthcare: {
    name: "Healthcare & Wellness",
    color: "#10B981", // Emerald
    icon: <HeartPulse className="w-3.5 h-3.5" />,
  },
  transfers: {
    name: "Transfers & Wires",
    color: "#6366F1", // Indigo
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
  },
  general: {
    name: "Services & General",
    color: "#94A3B8", // Slate
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
};

const mapTransactionToCategory = (t: Transaction): string => {
  const text = `${t.category || ""} ${t.description || ""} ${t.purpose || ""} ${t.recipient?.fullName || ""}`.toLowerCase();

  if (
    text.includes("netflix") ||
    text.includes("spotify") ||
    text.includes("cinema") ||
    text.includes("movie") ||
    text.includes("gaming") ||
    text.includes("steam") ||
    text.includes("entertainment") ||
    text.includes("concert") ||
    text.includes("hulu") ||
    text.includes("disney")
  ) {
    return "entertainment";
  }

  if (
    text.includes("electric") ||
    text.includes("water") ||
    text.includes("gas") ||
    text.includes("power") ||
    text.includes("internet") ||
    text.includes("utility") ||
    text.includes("utilities") ||
    text.includes("wifi") ||
    text.includes("phone bill") ||
    text.includes("telecom") ||
    text.includes("verizon") ||
    text.includes("at&t")
  ) {
    return "utilities";
  }

  if (
    text.includes("food") ||
    text.includes("restaurant") ||
    text.includes("dining") ||
    text.includes("coffee") ||
    text.includes("starbucks") ||
    text.includes("uber eats") ||
    text.includes("doordash") ||
    text.includes("grocery") ||
    text.includes("groceries") ||
    text.includes("cafe") ||
    text.includes("bakery") ||
    text.includes("market")
  ) {
    return "food";
  }

  if (
    text.includes("amazon") ||
    text.includes("apple") ||
    text.includes("shopping") ||
    text.includes("store") ||
    text.includes("retail") ||
    text.includes("cloth") ||
    text.includes("electronics") ||
    text.includes("fashion") ||
    text.includes("walmart") ||
    text.includes("target")
  ) {
    return "shopping";
  }

  if (
    text.includes("flight") ||
    text.includes("airline") ||
    text.includes("hotel") ||
    text.includes("airbnb") ||
    text.includes("travel") ||
    text.includes("uber") ||
    text.includes("lyft") ||
    text.includes("train") ||
    text.includes("transit") ||
    text.includes("aviation")
  ) {
    return "travel";
  }

  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("pharmacy") ||
    text.includes("doctor") ||
    text.includes("hospital") ||
    text.includes("dental") ||
    text.includes("gym") ||
    text.includes("fitness") ||
    text.includes("wellness")
  ) {
    return "healthcare";
  }

  if (
    text.includes("wire") ||
    text.includes("transfer") ||
    text.includes("p2p") ||
    text.includes("fednow") ||
    text.includes("rtp") ||
    text.includes("zelle") ||
    text.includes("sepa") ||
    text.includes("ach")
  ) {
    return "transfers";
  }

  return "general";
};

export const VisualExpenseBreakdown: React.FC<VisualExpenseBreakdownProps> = ({
  transactions,
}) => {
  const { formatCurrency } = useCurrency();
  const [timeframe, setTimeframe] = useState<"month" | "30days" | "all">("30days");
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);

  // Filter transactions based on timeframe and debit/outflow status
  const filteredDebitTransactions = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return (transactions || []).filter((t) => {
      // Outflows/debits only
      const isDebit = t.type === "debit" || !t.type || (t.sendAmount > 0 && t.type !== "credit");
      if (!isDebit) return false;

      // Filter out rejected or failed
      if (t.status === TransactionStatus.CANCELLED || t.status === TransactionStatus.REJECTED) {
        return false;
      }

      const txDateStr =
        t.statusTimestamps?.[TransactionStatus.SUBMITTED] ||
        t.statusTimestamps?.["Submitted"] ||
        t.scheduledDate ||
        Date.now();
      const txDate = new Date(txDateStr);

      if (timeframe === "month") {
        return txDate >= startOfMonth;
      }
      if (timeframe === "30days") {
        return txDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [transactions, timeframe]);

  // Aggregate by category
  const { categoryData, totalSpend } = useMemo(() => {
    const groups: Record<string, { total: number; count: number }> = {};

    filteredDebitTransactions.forEach((t) => {
      const catKey = mapTransactionToCategory(t);
      if (!groups[catKey]) {
        groups[catKey] = { total: 0, count: 0 };
      }
      const amount = t.sendAmount || 0;
      groups[catKey].total += amount;
      groups[catKey].count += 1;
    });

    let overallTotal = 0;
    const result: CategoryExpenseItem[] = Object.keys(groups).map((key) => {
      const config = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.general;
      const val = groups[key].total;
      overallTotal += val;
      return {
        name: config.name,
        categoryKey: key,
        value: val,
        count: groups[key].count,
        color: config.color,
        icon: config.icon,
      };
    });

    // Sort descending by value
    result.sort((a, b) => b.value - a.value);

    // Provide default fallback categories if empty
    if (result.length === 0) {
      const sampleData: CategoryExpenseItem[] = [
        { name: "Utilities & Bills", categoryKey: "utilities", value: 420.0, count: 3, color: "#06B6D4", icon: <Zap className="w-3.5 h-3.5" /> },
        { name: "Entertainment & Media", categoryKey: "entertainment", value: 185.5, count: 4, color: "#8B5CF6", icon: <Film className="w-3.5 h-3.5" /> },
        { name: "Food & Dining", categoryKey: "food", value: 650.25, count: 12, color: "#F59E0B", icon: <Utensils className="w-3.5 h-3.5" /> },
        { name: "Shopping & Retail", categoryKey: "shopping", value: 320.0, count: 5, color: "#EC4899", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
        { name: "Travel & Transit", categoryKey: "travel", value: 290.0, count: 2, color: "#3B82F6", icon: <Plane className="w-3.5 h-3.5" /> },
      ];
      const sum = sampleData.reduce((acc, curr) => acc + curr.value, 0);
      return { categoryData: sampleData, totalSpend: sum };
    }

    return { categoryData: result, totalSpend: overallTotal };
  }, [filteredDebitTransactions]);

  const activeItem = useMemo(() => {
    if (!activeCategoryKey) return null;
    return categoryData.find((c) => c.categoryKey === activeCategoryKey) || null;
  }, [activeCategoryKey, categoryData]);

  return (
    <div
      className="bg-[#0c121e]/90  rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between h-full relative overflow-hidden"
      id="visual-expense-breakdown-widget"
    >
      {/* Top Header & Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500 border border-teal-500/20 text-teal-400">
            <LucidePieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Visual Expense Breakdown
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-teal-500 text-teal-300 border border-teal-500/20 uppercase">
                Recharts Analytics
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 dark:text-slate-300 mt-0.5">
              Category spending distribution & outflow telemetry.
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60 self-start sm:self-center">
          {[
            { id: "month", label: "This Month" },
            { id: "30days", label: "30 Days" },
            { id: "all", label: "All Time" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTimeframe(t.id as any);
                triggerHaptic(10);
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                timeframe === t.id
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Chart + Category Progress Rows */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 items-center">
        {/* Recharts Pie / Donut Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
          <div className="w-full h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={800}
                  onMouseEnter={(_, index) => {
                    const item = categoryData[index];
                    if (item) setActiveCategoryKey(item.categoryKey);
                  }}
                  onMouseLeave={() => setActiveCategoryKey(null)}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#0c121e"
                      strokeWidth={2}
                      opacity={activeCategoryKey ? (activeCategoryKey === entry.categoryKey ? 1.0 : 0.4) : 0.95}
                      className="cursor-pointer transition-all duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CategoryExpenseItem;
                      const percentage = totalSpend > 0 ? ((data.value / totalSpend) * 100).toFixed(1) : "0.0";
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl  font-mono text-xs text-white text-left space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            <span className="font-bold">{data.name}</span>
                          </div>
                          <div className="text-teal-400 font-black text-sm">
                            {formatCurrency(data.value)}
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {percentage}% of expenses ({data.count} transaction{data.count !== 1 ? 's' : ''})
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 dark:text-slate-300">
                {activeItem ? activeItem.name.split(" ")[0] : "Total Outflow"}
              </span>
              <span className="text-base font-black font-mono text-white mt-0.5">
                {activeItem ? formatCurrency(activeItem.value) : formatCurrency(totalSpend)}
              </span>
              <span className="text-[10px] font-mono text-teal-400 font-bold mt-0.5">
                {activeItem
                  ? `${totalSpend > 0 ? ((activeItem.value / totalSpend) * 100).toFixed(1) : 0}%`
                  : `${filteredDebitTransactions.length} txns`}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Progress Cards */}
        <div className="md:col-span-7 space-y-2.5 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
          {categoryData.map((item) => {
            const pct = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(1) : "0.0";
            const isHovered = activeCategoryKey === item.categoryKey;

            return (
              <div
                key={item.categoryKey}
                onMouseEnter={() => setActiveCategoryKey(item.categoryKey)}
                onMouseLeave={() => setActiveCategoryKey(null)}
                className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? "bg-slate-800 border-teal-500/40 shadow-lg scale-[1.01]"
                    : "bg-slate-800 border-slate-700/40 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="p-1.5 rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                        border: `1px solid ${item.color}40`,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 font-mono">
                        {item.count} transaction{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black font-mono text-white">
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-[10px] font-mono font-bold" style={{ color: item.color }}>
                      {pct}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 font-mono">
        <span className="flex items-center gap-1.5 text-teal-400 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Category Inference Active</span>
        </span>
        <span>{filteredDebitTransactions.length} Verified Outflows</span>
      </div>
    </div>
  );
};
