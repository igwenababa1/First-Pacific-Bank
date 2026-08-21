import { useMemo } from "react";
import { Account, CryptoHolding, CryptoAsset } from "../types";

export const useNetWorthSync = (
  accounts: Account[],
  cryptoHoldings: CryptoHolding[],
  cryptoAssets: CryptoAsset[]
) => {
  const totalNetWorth = useMemo(() => {
    const accountsTotal = accounts.reduce((acc, curr) => acc + (curr?.balance || 0), 0);
    const cryptoTotal = cryptoHoldings.reduce((acc, curr) => {
      const asset = cryptoAssets.find((a) => a.id === curr.assetId);
      return acc + curr.amount * (asset?.price || 0);
    }, 0);
    return accountsTotal + cryptoTotal;
  }, [accounts, cryptoHoldings, cryptoAssets]);

  return totalNetWorth;
};
