import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Lock,
  PieChart,
  Trash2,
  ExternalLink,
  Layers
} from "lucide-react";
import { ExternalAccount, ExternalAccountsService } from "../services/externalAccountsService";
import { useCurrency } from "../contexts/CurrencyContext";
import { LinkBankAccountModal } from "./LinkBankAccountModal";

export const LinkedExternalAccountsWidget: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<ExternalAccount | null>(null);

  // Load external linked accounts and listen for updates
  useEffect(() => {
    const loadAccounts = () => {
      setAccounts(ExternalAccountsService.getAccounts());
    };
    loadAccounts();

    window.addEventListener('external-accounts-updated', loadAccounts);
    return () => {
      window.removeEventListener('external-accounts-updated', loadAccounts);
    };
  }, []);

  const totalPortfolioValue = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await ExternalAccountsService.syncAllAccounts();
    setIsRefreshing(false);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to disconnect this external bank account?")) {
      ExternalAccountsService.removeAccount(id);
    }
  };

  const handleLinkSuccess = (bankName: string, accountName: string, lastFour: string, balance: number) => {
    ExternalAccountsService.addAccount({
      institution: bankName,
      name: accountName,
      accountType: accountName.toLowerCase().includes('checking') ? 'checking' : accountName.toLowerCase().includes('savings') ? 'savings' : 'investment',
      mask: `•••• ${lastFour}`,
      balance: balance,
      currency: 'USD',
      syncFrequency: 'realtime',
      securityProtocol: 'OAuth 2.0 FDX'
    });
    setIsModalOpen(false);
  };

  return (
    <>
      {isModalOpen && (
        <LinkBankAccountModal 
          onClose={() => setIsModalOpen(false)}
          onLinkSuccess={handleLinkSuccess}
        />
      )}

      {/* Account Detail Modal */}
      {selectedAccountForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-100  flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500 rounded-2xl border border-cyan-500/20 text-cyan-500">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A] dark:text-white">{selectedAccountForDetail.institution}</h3>
                  <p className="text-xs text-[#0F172A]">{selectedAccountForDetail.name} • {selectedAccountForDetail.mask}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccountForDetail(null)}
                className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white dark:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest">Live Synced Balance</p>
                  <p className="text-2xl font-black text-[#0F172A] dark:text-white font-mono mt-0.5">
                    {formatCurrency(selectedAccountForDetail.balance)}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> API Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10">
                  <span className="text-[#0F172A] font-bold">Security Protocol</span>
                  <p className="font-bold text-[#0F172A] dark:text-white mt-0.5">{selectedAccountForDetail.securityProtocol}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10">
                  <span className="text-[#0F172A] font-bold">Sync Frequency</span>
                  <p className="font-bold text-[#0F172A] dark:text-white capitalize mt-0.5">{selectedAccountForDetail.syncFrequency}</p>
                </div>
              </div>

              {selectedAccountForDetail.holdings && selectedAccountForDetail.holdings.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2 flex items-center gap-1">
                    <PieChart className="w-3.5 h-3.5 text-cyan-400" /> Synced Holdings & Positions
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {selectedAccountForDetail.holdings.map((h, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10 text-xs">
                        <div>
                          <p className="font-bold text-[#0F172A] dark:text-white">{h.symbol} <span className="text-[#0F172A] font-normal">• {h.name}</span></p>
                          <p className="text-[10px] text-[#0F172A]">{h.shares} shares @ ${h.price.toFixed(2)}</p>
                        </div>
                        <p className="font-bold font-mono text-[#0F172A] dark:text-white">${h.totalValue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync Latest API State
                </button>
                <button
                  onClick={(e) => {
                    handleRemove(selectedAccountForDetail.id, e);
                    setSelectedAccountForDetail(null);
                  }}
                  className="px-4 py-3 bg-rose-500 hover:bg-rose-500 text-rose-500 font-bold text-xs rounded-xl border border-rose-500/20 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Widget Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 h-full flex flex-col relative overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500 rounded-full blur-3xl -mr-28 -mt-28 pointer-events-none transition-transform group-hover:scale-110"></div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight">External Bank Accounts</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-cyan-400 text-[10px] font-black uppercase tracking-wider border border-cyan-500/20">
                  API Sync Active
                </span>
              </div>
              <p className="text-xs text-[#0F172A] dark:text-white flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Real-Time Open Banking & OAuth 2.0 FDX Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Trigger Instant Real-Time API Sync"
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F172A] dark:text-[#1E293B] rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/10 disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Link Account</span>
            </button>
          </div>
        </div>

        {/* Aggregate Portfolio Bar */}
        <div className="p-4 mb-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">Total External Portfolio Value</span>
            <p className="text-2xl font-black text-[#0F172A] dark:text-white font-mono mt-0.5">
              {formatCurrency(totalPortfolioValue)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider block">Linked Institutions</span>
              <span className="text-[#0F172A] dark:text-white font-mono font-bold">{accounts.length} Active Accounts</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-900"></div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider block">Security Level</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                <Lock className="w-3 h-3" /> Encrypted TLS 1.3
              </span>
            </div>
          </div>
        </div>

        {/* Linked Accounts List */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10 max-h-[260px] pr-1">
          {accounts.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <Building2 className="w-10 h-10 text-[#0F172A] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">No External Accounts Linked</p>
              <p className="text-xs text-[#0F172A] mt-1 max-w-sm mx-auto">
                Connect external checking, savings, or brokerage accounts to track your complete net worth in real time.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Link Your First Institution
              </button>
            </div>
          ) : (
            accounts.map((acc) => (
              <div 
                key={acc.id}
                onClick={() => setSelectedAccountForDetail(acc)}
                className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-cyan-500/40 hover:bg-slate-100 dark:hover:bg-white transition-all cursor-pointer group/item flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm text-cyan-400 group-hover/item:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">{acc.institution}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[#0F172A] dark:text-white uppercase">
                        {acc.accountType}
                      </span>
                    </div>
                    <p className="text-xs text-[#0F172A] dark:text-white font-bold">
                      {acc.name} <span className="font-mono text-[#0F172A]">{acc.mask}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-[#0F172A] dark:text-white font-mono">
                      {formatCurrency(acc.balance)}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 sm:justify-end mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Synced {new Date(acc.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => handleRemove(acc.id, e)}
                      title="Disconnect institution"
                      className="p-2 text-[#0F172A] hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-xl hover:bg-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-[#0F172A] group-hover/item:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
