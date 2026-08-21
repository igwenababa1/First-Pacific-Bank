import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BANKS_BY_COUNTRY, ALL_COUNTRIES } from "./constants";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getBankIcon,
  SearchIcon,
  BrandLogo,
  PlusCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  XIcon,
  BuildingOfficeIcon,
  StarIcon,
  StarIconFilled,
} from "./Icons";

interface GlobalBankingNetworkProps {
  onOpenWireTransfer: (data: any) => void;
}

// Mapping country codes to continents for organization
const CONTINENT_MAP: { [key: string]: string } = {
  US: "North America",
  CA: "North America",
  MX: "North America",
  GB: "Europe",
  DE: "Europe",
  FR: "Europe",
  ES: "Europe",
  IT: "Europe",
  NL: "Europe",
  CH: "Europe",
  SE: "Europe",
  IE: "Europe",
  PL: "Europe",
  BE: "Europe",
  AT: "Europe",
  NO: "Europe",
  DK: "Europe",
  PT: "Europe",
  GR: "Europe",
  CZ: "Europe",
  HU: "Europe",
  RO: "Europe",
  FI: "Europe",
  BG: "Europe",
  HR: "Europe",
  LT: "Europe",
  LV: "Europe",
  EE: "Europe",
  SK: "Europe",
  SI: "Europe",
  LU: "Europe",
  CY: "Europe",
  MT: "Europe",
  IS: "Europe",
  CN: "Asia",
  JP: "Asia",
  IN: "Asia",
  SG: "Asia",
  KR: "Asia",
  HK: "Asia",
  ID: "Asia",
  MY: "Asia",
  AE: "Asia",
  SA: "Asia",
  QA: "Asia",
  IL: "Asia",
  KW: "Asia",
  TR: "Asia",
  PH: "Asia",
  TH: "Asia",
  VN: "Asia",
  PK: "Asia",
  BD: "Asia",
  OM: "Asia",
  BH: "Asia",
  LK: "Asia",
  NP: "Asia",
  GE: "Asia",
  AM: "Asia",
  AZ: "Asia",
  KZ: "Asia",
  UZ: "Asia",
  MN: "Asia",
  KH: "Asia",
  LA: "Asia",
  MM: "Asia",
  AU: "Australia",
  NZ: "Australia",
  BR: "South America",
  AR: "South America",
  CO: "South America",
  CL: "South America",
  PE: "South America",
  VE: "South America",
  EC: "South America",
  GT: "South America",
  CR: "South America",
  PA: "South America",
  UY: "South America",
  PY: "South America",
  BO: "South America",
  SV: "South America",
  HN: "South America",
  NI: "South America",
  DO: "South America",
  JM: "South America",
  TT: "South America",
  ZA: "Africa",
  NG: "Africa",
  EG: "Africa",
  KE: "Africa",
  GH: "Africa",
  TZ: "Africa",
  UG: "Africa",
  MA: "Africa",
  DZ: "Africa",
  TN: "Africa",
  JO: "Africa",
  LB: "Africa",
};

const generateSpeedData = (bankName: string) => {
  const data = [];
  const startSpeed = 60 + (bankName.length % 20); // randomish base speed
  for (let i = 0; i < 6; i++) {
    data.push({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
      efficiency: startSpeed + Math.random() * 15 + i * 2,
      globalAvg: 65 + Math.random() * 5 + i,
    });
  }
  return data;
};

const findCountryForBank = (bankName: string) => {
  for (const countryCode in BANKS_BY_COUNTRY) {
    if (
      BANKS_BY_COUNTRY[countryCode as keyof typeof BANKS_BY_COUNTRY].some(
        (b) => b.name === bankName,
      )
    ) {
      return ALL_COUNTRIES.find((c) => c.code === countryCode);
    }
  }
  return undefined;
};

const BankCard: React.FC<{
  name: string;
  domain?: string;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
}> = ({ name, domain, isFavorite, onToggleFavorite, onClick }) => {
  const FallbackIcon = getBankIcon(name);
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 rounded-lg flex flex-col items-center justify-center text-center h-20 transition-transform hover:scale-105 hover:bg-white dark:hover:bg-white group"
      >
        <div className="w-10 h-10 flex items-center justify-center mb-1.5 shrink-0">
          <BrandLogo
            domain={domain || `${name.toLowerCase().replace(/\s/g, "")}.com`}
            name={name}
            fallback={FallbackIcon}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="font-bold text-[#0F172A] dark:text-white text-[9px] group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {name}
        </p>
      </button>
      <button
        onClick={onToggleFavorite}
        className="absolute top-1 right-1 p-1 z-10 text-[#0F172A] hover:text-yellow-400 transition-opacity"
      >
        {isFavorite ? (
          <StarIconFilled className="w-3.5 h-3.5 text-yellow-400" />
        ) : (
          <StarIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
        )}
      </button>
    </div>
  );
};

export const GlobalBankingNetwork: React.FC<GlobalBankingNetworkProps> = ({
  onOpenWireTransfer,
}) => {
  const navigate = useNavigate();
  const banksByContinent = useMemo(() => {
    const continents: {
      [continent: string]: { name: string; domain: string }[];
    } = {};
    for (const countryCode in BANKS_BY_COUNTRY) {
      const continent = CONTINENT_MAP[countryCode] || "Other";
      if (!continents[continent]) {
        continents[continent] = [];
      }
      continents[continent].push(
        ...BANKS_BY_COUNTRY[countryCode as keyof typeof BANKS_BY_COUNTRY],
      );
    }

    const sortedContinents: {
      [continent: string]: { name: string; domain: string }[];
    } = {};
    const continentOrder = [
      "North America",
      "Europe",
      "Asia",
      "South America",
      "Africa",
      "Australia",
      "Other",
    ];
    continentOrder.forEach((continentName) => {
      if (continents[continentName]) {
        // Deduplicate banks within each continent and sort them
        const uniqueBanks = Array.from(
          new Map(continents[continentName].map((b) => [b.name, b])).values(),
        );
        uniqueBanks.sort((a, b) => a.name.localeCompare(b.name));
        sortedContinents[continentName] = uniqueBanks;
      }
    });

    return sortedContinents;
  }, []);

  const [favoriteBanks, setFavoriteBanks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Favorites");

  useEffect(() => {
    const saved = localStorage.getItem("iCreditUnion_FavoriteBanks");
    if (saved) {
      try {
        setFavoriteBanks(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleFavorite = (bankName: string) => {
    setFavoriteBanks((prev) => {
      const isFav = prev.includes(bankName);
      const nextFavorites = isFav
        ? prev.filter((n) => n !== bankName)
        : [...prev, bankName];
      localStorage.setItem(
        "iCreditUnion_FavoriteBanks",
        JSON.stringify(nextFavorites)
      );
      return nextFavorites;
    });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBank, setSelectedBank] = useState<{
    name: string;
    domain?: string;
    country?: any;
  } | null>(null);

  const filteredBanks = useMemo(() => {
    let banks = [];
    if (activeTab === "Favorites") {
      const allBanks = Object.values(banksByContinent).flat();
      const uniqueAll = Array.from(
        new Map(allBanks.map((b) => [b.name, b])).values()
      );
      banks = uniqueAll.filter((b) => favoriteBanks.includes(b.name));
    } else {
      banks = banksByContinent[activeTab] || [];
    }

    if (!searchTerm) return banks;
    return banks.filter((bank) =>
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [activeTab, searchTerm, banksByContinent, favoriteBanks]);

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-xl dark:shadow-black/40 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10 h-full flex flex-col relative overflow-hidden group space-y-4">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
        <div>
          <h2 className="text-sm font-black text-[#0F172A] dark:text-white flex items-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5 primary-" /> Global
            Banking Network
          </h2>
          <p className="text-[8px] uppercase font-bold tracking-widest text-[#0F172A] mt-0.5 ml-5">
            Partner Financial Institutions
          </p>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10">
        <div className="p-2 border-b border-slate-200 dark:border-white/10">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-[#0F172A] dark:text-white absolute top-1/2 left-2.5 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search banks..."
              className="w-full bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white text-xs p-2 pl-8 rounded-lg border border-slate-200 dark:border-white/10 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div className="border-b border-slate-200 dark:border-white/10">
          <nav className="-mb-px flex space-x-2 overflow-x-auto p-2 custom-scrollbar">
            {["Favorites", ...Object.keys(banksByContinent)].map((continent) => (
              <button
                key={continent}
                onClick={() => {
                  setSearchTerm("");
                  setActiveTab(continent);
                }}
                className={`whitespace-nowrap py-1 px-2.5 font-bold text-[9px] uppercase tracking-wider rounded transition-all ${
                  activeTab === continent
                    ? "bg-white dark:bg-slate-900 shadow-sm text-[#0F172A] dark:text-white"
                    : "text-[#0F172A] hover:bg-slate-200 dark:hover:bg-white"
                }`}
              >
                {continent}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 max-h-[160px] overflow-y-auto custom-scrollbar">
          {filteredBanks.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredBanks.map((bank) => (
                <BankCard
                  key={bank.name}
                  name={bank.name}
                  domain={bank.domain}
                  isFavorite={favoriteBanks.includes(bank.name)}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    toggleFavorite(bank.name);
                  }}
                  onClick={() =>
                    setSelectedBank({
                      name: bank.name,
                      domain: bank.domain,
                      country: findCountryForBank(bank.name),
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[#0F172A]">
              <p className="font-semibold text-xs">No banks found</p>
              <p className="text-[9px]">
                Try clearing your search or selecting a different continent.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedBank && (
        <div
          className="fixed inset-0 z-[200] bg-slate-100  flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedBank(null)}
        >
          <div
            className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 relative bg-white dark:bg-slate-900">
              <button
                onClick={() => setSelectedBank(null)}
                className="absolute top-6 right-6 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrandLogo
                    domain={selectedBank.domain || ""}
                    name={selectedBank.name}
                    fallback={getBankIcon(selectedBank.name)}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight">
                    {selectedBank.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-400">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Verified Global Node
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#0F172A] dark:text-white font-bold leading-relaxed">
                Select an action for this institution. You can initiate a direct
                wire transfer or register a new beneficiary node.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="p-3 bg-white border border-slate-200 dark:border-white/10 rounded-xl dark:bg-slate-800">
                  <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">
                    Coverage Area
                  </div>
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-white">
                    {selectedBank.country ? `${selectedBank.country.name}, Global` : "Global"}
                  </div>
                </div>
                <div className="p-3 bg-white border border-slate-200 dark:border-white/10 rounded-xl dark:bg-slate-800">
                  <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">
                    Success Rate
                  </div>
                  <div className="text-xs font-semibold text-emerald-500">
                    {(98 + Math.random() * 1.9).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Transaction Speed Efficiency Chart */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A]">
                    Transaction Speed Efficiency
                  </h4>
                  <span className="text-[9px] bg-emerald-500 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                    Above Global Avg
                  </span>
                </div>
                <div className="h-32 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={generateSpeedData(selectedBank.name)}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorEfficiency"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff10"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 9, fill: "#888" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#888" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "8px",
                          fontSize: "10px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="globalAvg"
                        stroke="#64748b"
                        strokeWidth={1}
                        fill="none"
                        strokeDasharray="4 4"
                      />
                      <Area
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEfficiency)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center mt-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full primary-"></div>
                    <span className="text-[9px] text-[#0F172A]">
                      {selectedBank.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-500 border border-dashed border-slate-400 dark:bg-slate-900"></div>
                    <span className="text-[9px] text-[#0F172A]">
                      Global Average
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() =>
                    navigate("/wire-transfer", {
                      state: {
                        bankName: selectedBank.name,
                        step: 0,
                        recipientCountry: selectedBank.country,
                      },
                    })
                  }
                  className="w-full flex flex-col items-center justify-center p-3 bg-white hover:bg-white border border-slate-200 dark:border-white/10 rounded-xl transition-all group gap-2 dark:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-full primary- primary- flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BuildingOfficeIcon className="w-4 h-4" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-[#0F172A] dark:text-white mb-0.5">
                      Wire Transfer
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    navigate("/recipients/add", {
                      state: {
                        bankName: selectedBank.name,
                        country: selectedBank.country,
                      },
                    })
                  }
                  className="w-full flex flex-col items-center justify-center p-3 bg-emerald-500 hover:bg-emerald-500 border border-emerald-500/20 rounded-xl transition-all group gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusCircleIcon className="w-4 h-4" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-[#0F172A] dark:text-white mb-0.5">
                      Add Beneficiary
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
