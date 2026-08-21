export interface ExternalHolding {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  totalValue: number;
}

export interface ExternalAccount {
  id: string;
  institution: string;
  name: string;
  accountType: 'checking' | 'savings' | 'investment' | 'crypto' | 'credit';
  mask: string;
  balance: number;
  currency: string;
  status: 'connected' | 'syncing' | 'error' | 'reauth_required';
  lastSync: string;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  securityProtocol: 'OAuth 2.0 FDX' | 'Plaid Link Direct' | 'ISO 20022 Open Banking';
  holdings?: ExternalHolding[];
}

const STORAGE_KEY = 'prb_linked_external_accounts_v2';

const DEFAULT_ACCOUNTS: ExternalAccount[] = [
  {
    id: 'ext_chase_01',
    institution: 'JPMorgan Chase & Co.',
    name: 'Sapphire Private Client Checking',
    accountType: 'checking',
    mask: '•••• 7812',
    balance: 48520.50,
    currency: 'USD',
    status: 'connected',
    lastSync: new Date().toISOString(),
    syncFrequency: 'realtime',
    securityProtocol: 'OAuth 2.0 FDX'
  },
  {
    id: 'ext_fidelity_02',
    institution: 'Fidelity Investments',
    name: 'Institutional Wealth Portfolio',
    accountType: 'investment',
    mask: '•••• 9940',
    balance: 142800.00,
    currency: 'USD',
    status: 'connected',
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    syncFrequency: 'realtime',
    securityProtocol: 'OAuth 2.0 FDX',
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', shares: 120, price: 232.50, totalValue: 27900.00 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 350, price: 128.40, totalValue: 44940.00 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 150, price: 446.00, totalValue: 66900.00 },
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 60, price: 516.00, totalValue: 30960.00 }
    ]
  },
  {
    id: 'ext_schwab_03',
    institution: 'Charles Schwab',
    name: 'High Yield Savings Reserve',
    accountType: 'savings',
    mask: '•••• 3319',
    balance: 65400.00,
    currency: 'USD',
    status: 'connected',
    lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    syncFrequency: 'hourly',
    securityProtocol: 'ISO 20022 Open Banking'
  }
];

export class ExternalAccountsService {
  public static getAccounts(): ExternalAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse external accounts from localStorage', e);
    }
    // Initialize default if not present
    this.saveAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }

  public static saveAccounts(accounts: ExternalAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
      window.dispatchEvent(new Event('external-accounts-updated'));
    } catch (e) {
      console.error('Failed to save external accounts to localStorage', e);
    }
  }

  public static addAccount(account: Omit<ExternalAccount, 'id' | 'lastSync' | 'status'>): ExternalAccount {
    const current = this.getAccounts();
    const newAcc: ExternalAccount = {
      ...account,
      id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      lastSync: new Date().toISOString(),
      status: 'connected'
    };
    const updated = [newAcc, ...current];
    this.saveAccounts(updated);
    return newAcc;
  }

  public static removeAccount(id: string): void {
    const current = this.getAccounts();
    const updated = current.filter(a => a.id !== id);
    this.saveAccounts(updated);
  }

  public static syncAllAccounts(): Promise<ExternalAccount[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const current = this.getAccounts();
        const updated = current.map(acc => {
          // Micro-fluctuation simulation for real-time API sync
          const delta = (Math.random() - 0.48) * (acc.balance * 0.005);
          const newBalance = Math.max(100, parseFloat((acc.balance + delta).toFixed(2)));
          return {
            ...acc,
            balance: newBalance,
            lastSync: new Date().toISOString(),
            status: 'connected' as const
          };
        });
        this.saveAccounts(updated);
        resolve(updated);
      }, 1500);
    });
  }

  public static getTotalExternalPortfolioValue(): number {
    const accounts = this.getAccounts();
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }
}
