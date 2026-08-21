
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { Currency } from '../types';
import { EXCHANGE_RATES, CURRENCIES_LIST } from '../components/constants';
import { db } from '../services/database';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  rates: { [key: string]: number };
  disabledCurrencies: string[];
  currencyLiquiditySettings: Record<string, any>;
  isCurrencySupported: (currencyCode: string) => boolean;
  supportedCurrencies: Currency[];
  convertFromUSD: (amount: number, toCurrency?: string) => number;
  formatCurrency: (amountInUSD: number, currencyCode?: string) => string;
  getCurrencyInfo: (currencyCode: string) => Currency | undefined;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [rates, setRates] = useState<{ [key: string]: number }>(EXCHANGE_RATES);
  const [disabledCurrencies, setDisabledCurrencies] = useState<string[]>([]);
  const [currencyLiquiditySettings, setCurrencyLiquiditySettings] = useState<Record<string, any>>({});

  // Fetch disabled currencies and liquidity settings from DB / systemOptions
  useEffect(() => {
    const loadCurrencySystemOptions = async () => {
      try {
        const opts = await db.getSystemOptions();
        if (opts) {
          if (Array.isArray(opts.disabledCurrencies)) {
            setDisabledCurrencies(opts.disabledCurrencies);
          }
          if (opts.currencyLiquiditySettings) {
            setCurrencyLiquiditySettings(opts.currencyLiquiditySettings);
          }
        }
      } catch (e) {
        // Fallback silently if systemOptions unavailable
      }
    };

    loadCurrencySystemOptions();

    const handleSystemOptsUpdated = (e: any) => {
      if (e?.detail) {
        if (Array.isArray(e.detail.disabledCurrencies)) {
          setDisabledCurrencies(e.detail.disabledCurrencies);
        }
        if (e.detail.currencyLiquiditySettings) {
          setCurrencyLiquiditySettings(e.detail.currencyLiquiditySettings);
        }
      } else {
        loadCurrencySystemOptions();
      }
    };

    window.addEventListener('db_system_options_updated', handleSystemOptsUpdated);
    window.addEventListener('db_currencies_updated', handleSystemOptsUpdated);

    return () => {
      window.removeEventListener('db_system_options_updated', handleSystemOptsUpdated);
      window.removeEventListener('db_currencies_updated', handleSystemOptsUpdated);
    };
  }, []);

  // Advanced Feature: Fetch real-time rates or use expanded static fallback
  useEffect(() => {
    const fetchRates = async () => {
        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            // Attempt to fetch from public API
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`, { signal: controller.signal });
            clearTimeout(timeoutId);

            let fetchedRates: { [key: string]: number } = {};

            if (response.ok) {
                const data = await response.json();
                if (data && data.rates) {
                    fetchedRates = { ...data.rates };
                }
            } else {
                console.warn("Using offline currency rates (API Unreachable).");
            }

            // Fetch real-time crypto prices from Coinbase API to complement fiat rates
            try {
                const cbResponse = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
                if (cbResponse.ok) {
                    const cbData = await cbResponse.json();
                    if (cbData?.data?.rates) {
                        const targetCryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LTC', 'XRP', 'DOGE'];
                        targetCryptos.forEach(coin => {
                            const val = cbData.data.rates[coin];
                            if (val) {
                                fetchedRates[coin] = parseFloat(val);
                            }
                        });
                    }
                }
            } catch (cryptoErr) {
                console.warn("Coinbase API failed to fetch, using simulated crypto rates.", cryptoErr);
            }

            if (Object.keys(fetchedRates).length > 0) {
                setRates(prev => ({ ...prev, ...fetchedRates }));
            }
        } catch (e) {
            // Completely silent fallback to prevent "Failed to fetch" noise in console/UI
            // The default state EXCHANGE_RATES is sufficient for the app to function
        }
    };

    fetchRates();
    // Refresh rates every 60 seconds if online
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const contextValue = useMemo(() => {
    const convertFromUSD = (amount: number, toCurrency?: string): number => {
      const code = toCurrency || displayCurrency;
      // Default to 1 if rate missing (fallback to USD essentially)
      const rate = rates[code] || 1;
      return amount * rate;
    };

    const formatCurrency = (amountInUSD: number, currencyCode?: string): string => {
      const code = currencyCode || displayCurrency;
      const convertedAmount = convertFromUSD(amountInUSD, code);
      
      // Check for custom symbol first (e.g. Crypto)
      const customCurrency = CURRENCIES_LIST.find(c => c.code === code);
      if (customCurrency && customCurrency.symbol && ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'USDT', 'USDC'].includes(code)) {
          return `${customCurrency.symbol} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
      }

      try {
        return convertedAmount.toLocaleString(undefined, {
          style: 'currency',
          currency: code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } catch (e) {
        // Fallback for invalid currency codes
        console.warn(`Invalid currency code for formatting: ${code}`);
        return `${code} ${convertedAmount.toFixed(2)}`;
      }
    };

    const getCurrencyInfo = (currencyCode: string): Currency | undefined => {
        return CURRENCIES_LIST.find(c => c.code === currencyCode);
    };

    const isCurrencySupported = (currencyCode: string): boolean => {
      if (!currencyCode) return true;
      const code = currencyCode.toUpperCase();
      return !disabledCurrencies.includes(code);
    };

    const supportedCurrencies = CURRENCIES_LIST.filter(c => !disabledCurrencies.includes(c.code.toUpperCase()));

    return {
      displayCurrency,
      setDisplayCurrency,
      rates,
      disabledCurrencies,
      currencyLiquiditySettings,
      isCurrencySupported,
      supportedCurrencies,
      convertFromUSD,
      formatCurrency,
      getCurrencyInfo,
    };
  }, [displayCurrency, rates, disabledCurrencies, currencyLiquiditySettings]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
