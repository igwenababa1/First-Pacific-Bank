
import { Country, Recipient, Transaction, TransactionStatus, Card, CardTransaction, AdvancedTransferLimits, Account, AccountType, CryptoAsset, CryptoHolding, SubscriptionService, SubscriptionServiceType, AppleCardDetails, AppleCardTransaction, SpendingCategory, TravelPlan, TravelPlanStatus, SecuritySettings, TrustedDevice, UserProfile, PlatformSettings, PlatformTheme, Task, TaskCategory, Airport, FlightBooking, UtilityBiller, UtilityBill, UtilityType, AtmLocation, AirtimeProvider, AirtimePurchase, PushNotificationSettings, VirtualCard, FaqItem, LeadershipProfile, View, WalletDetails, WalletTransaction, CustomerReview, StaffProfile, Cause, LoanApplication, LoanProduct, LoanApplicationStatus, Shipment, ShipmentStatus, Trade, Currency, PrivacySettings } from '../types';
import * as Icons from './Icons';

export const ALL_COUNTRIES: Country[] = [
    { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
    { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€' },
    { code: 'CA', name: 'Canada', currency: 'CAD', symbol: '$' },
    { code: 'AU', name: 'Australia', currency: 'AUD', symbol: '$' },
    { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥' },
    { code: 'FR', name: 'France', currency: 'EUR', symbol: '€' },
    { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥' },
    { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
    { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$' },
    { code: 'RU', name: 'Russia', currency: 'RUB', symbol: '₽' },
    { code: 'IT', name: 'Italy', currency: 'EUR', symbol: '€' },
    { code: 'ES', name: 'Spain', currency: 'EUR', symbol: '€' },
    { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: '$' },
    { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩' },
    { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp' },
    { code: 'NL', name: 'Netherlands', currency: 'EUR', symbol: '€' },
    { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF' },
    { code: 'TR', name: 'Turkey', currency: 'TRY', symbol: '₺' },
    { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr' },
    { code: 'PL', name: 'Poland', currency: 'PLN', symbol: 'zł' },
    { code: 'BE', name: 'Belgium', currency: 'EUR', symbol: '€' },
    { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: '$' },
    { code: 'AT', name: 'Austria', currency: 'EUR', symbol: '€' },
    { code: 'NO', name: 'Norway', currency: 'NOK', symbol: 'kr' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R' },
    { code: 'DK', name: 'Denmark', currency: 'DKK', symbol: 'kr' },
    { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: '$' },
    { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM' },
    { code: 'HK', name: 'Hong Kong', currency: 'HKD', symbol: '$' },
    { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: '$' },
    { code: 'CL', name: 'Chile', currency: 'CLP', symbol: '$' },
    { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱' },
    { code: 'IE', name: 'Ireland', currency: 'EUR', symbol: '€' },
    { code: 'PT', name: 'Portugal', currency: 'EUR', symbol: '€' },
    { code: 'GR', name: 'Greece', currency: 'EUR', symbol: '€' },
    { code: 'CZ', name: 'Czech Republic', currency: 'CZK', symbol: 'Kč' },
    { code: 'HU', name: 'Hungary', currency: 'HUF', symbol: 'Ft' },
    { code: 'RO', name: 'Romania', currency: 'RON', symbol: 'lei' },
    { code: 'IL', name: 'Israel', currency: 'ILS', symbol: '₪' },
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س' },
    { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: 'ر.ق' },
    { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: '£' },
    { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿' },
    { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫' },
    { code: 'PK', name: 'Pakistan', currency: 'PKR', symbol: '₨' },
    { code: 'BD', name: 'Bangladesh', currency: 'BDT', symbol: '৳' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
    { code: 'CO', name: 'Colombia', currency: 'COP', symbol: '$' },
    { code: 'PE', name: 'Peru', currency: 'PEN', symbol: 'S/.' },
    { code: 'VE', name: 'Venezuela', currency: 'VES', symbol: 'Bs.' },
    { code: 'UA', name: 'Ukraine', currency: 'UAH', symbol: '₴' },
    { code: 'FI', name: 'Finland', currency: 'EUR', symbol: '€' },
    { code: 'BG', name: 'Bulgaria', currency: 'BGN', symbol: 'лв' },
    { code: 'HR', name: 'Croatia', currency: 'EUR', symbol: '€' },
    { code: 'LT', name: 'Lithuania', currency: 'EUR', symbol: '€' },
    { code: 'LV', name: 'Latvia', currency: 'EUR', symbol: '€' },
    { code: 'EE', name: 'Estonia', currency: 'EUR', symbol: '€' },
    { code: 'SK', name: 'Slovakia', currency: 'EUR', symbol: '€' },
    { code: 'SI', name: 'Slovenia', currency: 'EUR', symbol: '€' },
    { code: 'LU', name: 'Luxembourg', currency: 'EUR', symbol: '€' },
    { code: 'CY', name: 'Cyprus', currency: 'EUR', symbol: '€' },
    { code: 'MT', name: 'Malta', currency: 'EUR', symbol: '€' },
    { code: 'IS', name: 'Iceland', currency: 'ISK', symbol: 'kr' },
    { code: 'EC', name: 'Ecuador', currency: 'USD', symbol: '$' },
    { code: 'GT', name: 'Guatemala', currency: 'GTQ', symbol: 'Q' },
    { code: 'CR', name: 'Costa Rica', currency: 'CRC', symbol: '₡' },
    { code: 'PA', name: 'Panama', currency: 'PAB', symbol: 'B/.' },
    { code: 'UY', name: 'Uruguay', currency: 'UYU', symbol: '$U' },
    { code: 'PY', name: 'Paraguay', currency: 'PYG', symbol: '₲' },
    { code: 'BO', name: 'Bolivia', currency: 'BOB', symbol: 'Bs.' },
    { code: 'SV', name: 'El Salvador', currency: 'USD', symbol: '$' },
    { code: 'HN', name: 'Honduras', currency: 'LNL', symbol: 'L' },
    { code: 'NI', name: 'Nicaragua', currency: 'NIO', symbol: 'C$' },
    { code: 'DO', name: 'Dominican Republic', currency: 'DOP', symbol: 'RD$' },
    { code: 'JM', name: 'Jamaica', currency: 'JMD', symbol: 'J$' },
    { code: 'TT', name: 'Trinidad and Tobago', currency: 'TTD', symbol: 'TT$' },
    { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh' },
    { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: 'GH₵' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh' },
    { code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh' },
    { code: 'MA', name: 'Morocco', currency: 'MAD', symbol: 'د.m.' },
    { code: 'DZ', name: 'Algeria', currency: 'DZD', symbol: 'د.ج' },
    { code: 'TN', name: 'Tunisia', currency: 'TND', symbol: 'د.ت' },
    { code: 'JO', name: 'Jordan', currency: 'JOD', symbol: 'JD' },
    { code: 'LB', name: 'Lebanon', currency: 'LBP', symbol: '£' },
    { code: 'OM', name: 'Oman', currency: 'OMR', symbol: 'ر.ع.' },
    { code: 'KW', name: 'Kuwait', currency: 'KWD', symbol: 'د.ك' },
    { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: '.د.ب' },
    { code: 'LK', name: 'Sri Lanka', currency: 'LKR', symbol: '₨' },
    { code: 'NP', name: 'Nepal', currency: 'NPR', symbol: '₨' },
    { code: 'GE', name: 'Georgia', currency: 'GEL', symbol: '₾' },
    { code: 'AM', name: 'Armenia', currency: 'AMD', symbol: '֏' },
    { code: 'AZ', name: 'Azerbaijan', currency: 'AZN', symbol: '₼' },
    { code: 'KZ', name: 'Kazakhstan', currency: 'KZT', symbol: '₸' },
    { code: 'UZ', name: 'Uzbekistan', currency: 'UZS', symbol: 'лв' },
    { code: 'MN', name: 'Mongolia', currency: 'MNT', symbol: '₮' },
    { code: 'KH', name: 'Cambodia', currency: 'KHR', symbol: '៛' },
    { code: 'LA', name: 'Laos', currency: 'LAK', symbol: '₭' },
    { code: 'MM', name: 'Myanmar', currency: 'MMK', symbol: 'K' },
];

export const COUNTRY_CALLING_CODES: Record<string, string> = {
  US: '1', GB: '44', DE: '49', CA: '1', AU: '61', JP: '81', FR: '33', CN: '86', IN: '91', BR: '55',
  RU: '7', IT: '39', ES: '34', MX: '52', KR: '82', ID: '62', NL: '31', CH: '41', TR: '90', SE: '46',
  PL: '48', BE: '32', AR: '54', AT: '43', NO: '47', AE: '971', ZA: '27', DK: '45', SG: '65', MY: '60',
  HK: '852', NZ: '64', CL: '56', PH: '63', IE: '353', PT: '351', GR: '30', CZ: '420', HU: '36', RO: '40',
  IL: '972', SA: '966', QA: '974', EG: '20', TH: '66', VN: '84', PK: '92', BD: '880', NG: '234', CO: '57',
  PE: '51', VE: '58', UA: '380', FI: '358', BG: '359', HR: '385', LT: '370', LV: '371', EE: '372', SK: '421',
  SI: '386', LU: '352', CY: '357', MT: '356', IS: '354', EC: '593', GT: '502', CR: '506', PA: '507', UY: '598',
  PY: '595', BO: '591', SV: '503', HN: '504', NI: '505', DO: '1809', JM: '1876', TT: '1868', KE: '254', GH: '233',
  TZ: '255', UG: '256', MA: '212', DZ: '213', TN: '216', JO: '962', LB: '961', OM: '968', KW: '965', BH: '973',
  LK: '94', NP: '977', GE: '995', AM: '374', AZ: '994', KZ: '7', UZ: '998', MN: '976', KH: '855', LA: '856', MM: '95'
};

export const BANKS_BY_COUNTRY: Record<string, { name: string; domain: string; features?: string[] }[]> = {
    US: [
        { name: 'JPMorgan Chase', domain: 'chase.com', features: ['FedWire', 'ACH', 'Real-time Payments'] },
        { name: 'Bank of America', domain: 'bankofamerica.com', features: ['Global Treasury', 'Zelle', 'Swift gpi'] },
        { name: 'Wells Fargo', domain: 'wellsfargo.com', features: ['Commercial Banking', 'Foreign Exchange'] },
        { name: 'Citibank', domain: 'citi.com', features: ['Institutional Clients', 'Global Network'] },
        { name: 'US Bank', domain: 'usbank.com', features: ['Trust Services', 'Wealth Management'] },
        { name: 'PNC Bank', domain: 'pnc.com', features: ['Virtual Wallet', 'Business Credit'] },
        { name: 'Capital One', domain: 'capitalone.com', features: ['Digital Banking', 'No Foreign Fees'] },
        { name: 'TD Bank', domain: 'td.com', features: ['Cross-border Banking', 'Convenience'] },
        { name: 'Truist', domain: 'truist.com', features: ['Integrated Finance', 'Community Banking'] },
        { name: 'Goldman Sachs', domain: 'goldmansachs.com', features: ['Investment Banking', 'Marcus'] }
    ],
    GB: [
        { name: 'HSBC', domain: 'hsbc.co.uk', features: ['Global Accounts', 'Premier Service'] },
        { name: 'Barclays', domain: 'barclays.co.uk', features: ['Investment Banking', 'Corporate Credit'] },
        { name: 'Lloyds Bank', domain: 'lloydsbank.com', features: ['Retail Banking', 'Mortgages'] },
        { name: 'NatWest', domain: 'natwest.com', features: ['Business Growth', 'Entrepreneurship'] },
        { name: 'Standard Chartered', domain: 'sc.com', features: ['Emerging Markets', 'Trade Finance'] },
        { name: 'Santander UK', domain: 'santander.co.uk', features: ['1|2|3 Account', 'International'] },
        { name: 'Nationwide', domain: 'nationwide.co.uk', features: ['Building Society', 'Member Benefits'] },
        { name: 'RBS', domain: 'rbs.co.uk', features: ['Scottish Banking', 'Private Wealth'] }
    ],
    DE: [
        { name: 'Deutsche Bank', domain: 'db.com', features: ['Global Markets', 'Private Banking'] },
        { name: 'Commerzbank', domain: 'commerzbank.de', features: ['Mittelstand Banking', 'Digital'] },
        { name: 'KfW', domain: 'kfw.de', features: ['Development Finance', 'Sustainability'] },
        { name: 'DZ Bank', domain: 'dzbank.com', features: ['Cooperative Banking', 'Central Bank'] },
        { name: 'HypoVereinsbank', domain: 'hypovereinsbank.de', features: ['UniCredit Group', 'Corporate'] },
        { name: 'Landesbank Baden-Württemberg', domain: 'lbbw.de', features: ['Regional Focus', 'Capital Markets'] }
    ],
    CH: [
        { name: 'UBS', domain: 'ubs.com', features: ['Global Wealth Management', 'Asset Management'] },
        { name: 'Credit Suisse', domain: 'credit-suisse.com', features: ['Investment Banking', 'Private Banking'] },
        { name: 'Julius Baer', domain: 'juliusbaer.com', features: ['Pure Wealth Management', 'Swiss Heritage'] },
        { name: 'Raiffeisen Switzerland', domain: 'raiffeisen.ch', features: ['Cooperative', 'Local Presence'] },
        { name: 'Zurich Cantonal Bank', domain: 'zkb.ch', features: ['Government Guarantee', 'Universal Bank'] }
    ],
    FR: [
        { name: 'BNP Paribas', domain: 'mabanque.bnpparibas', features: ['European Leader', 'Global Reach'] },
        { name: 'Crédit Agricole', domain: 'credit-agricole.fr', features: ['Mutual Banking', 'Rural Focus'] },
        { name: 'Société Générale', domain: 'societegenerale.fr', features: ['Corporate Finance', 'Retail'] },
        { name: 'Groupe BPCE', domain: 'bpce.fr', features: ['Banque Populaire', 'Caisse d\'Epargne'] }
    ],
    CA: [
        { name: 'RBC Royal Bank', domain: 'rbc.com', features: ['Largest Canadian Bank', 'Wealth Management'] },
        { name: 'TD Canada Trust', domain: 'td.com', features: ['Customer Service', 'US Presence'] },
        { name: 'Scotiabank', domain: 'scotiabank.com', features: ['International Reach', 'Americas'] },
        { name: 'BMO', domain: 'bmo.com', features: ['Commercial Banking', 'Harris Bank'] },
        { name: 'CIBC', domain: 'cibc.com', features: ['Innovation', 'Simplii Financial'] }
    ],
    JP: [
        { name: 'Mitsubishi UFJ', domain: 'mufg.jp', features: ['Global Financial Group', 'Trust Banking'] },
        { name: 'Sumitomo Mitsui', domain: 'smbc.co.jp', features: ['Corporate Banking', 'SMBC Nikko'] },
        { name: 'Mizuho Bank', domain: 'mizuhobank.co.jp', features: ['One Mizuho', 'Industrial Finance'] },
        { name: 'Japan Post Bank', domain: 'jp-bank.japanpost.jp', features: ['Nationwide Network', 'Savings'] }
    ],
    CN: [
        { name: 'ICBC', domain: 'icbc.com.cn', features: ['World\'s Largest Bank', 'Global Settlement'] },
        { name: 'China Construction Bank', domain: 'ccb.com', features: ['Infrastructure Finance', 'Retail'] },
        { name: 'Agricultural Bank of China', domain: 'abchina.com', features: ['Rural Development', 'Commercial'] },
        { name: 'Bank of China', domain: 'boc.cn', features: ['Foreign Exchange', 'International'] }
    ],
    AU: [
        { name: 'Commonwealth Bank', domain: 'commbank.com.au', features: ['CommBiz', 'Retail Leader'] },
        { name: 'Westpac', domain: 'westpac.com.au', features: ['Institutional Banking', 'St.George'] },
        { name: 'NAB', domain: 'nab.com.au', features: ['Business Banking', 'MLC'] },
        { name: 'ANZ', domain: 'anz.com.au', features: ['Asia Pacific Focus', 'Institutional'] }
    ],
    SG: [
        { name: 'DBS Bank', domain: 'dbs.com.sg', features: ['Best Bank in the World', 'Digital Innovation'] },
        { name: 'OCBC Bank', domain: 'ocbc.com', features: ['Wealth Management', 'SME Banking'] },
        { name: 'UOB', domain: 'uob.com.sg', features: ['ASEAN Network', 'Personal Banking'] }
    ],
    AE: [
        { name: 'Emirates NBD', domain: 'emiratesnbd.com', features: ['Digital Banking', 'Priority Banking'] },
        { name: 'First Abu Dhabi Bank', domain: 'bankfab.com', features: ['Largest UAE Bank', 'Global Network'] },
        { name: 'Abu Dhabi Commercial Bank', domain: 'adcb.com', features: ['Retail Excellence', 'Corporate'] }
    ],
    HK: [
        { name: 'HSBC HK', domain: 'hsbc.com.hk', features: ['Note-issuing Bank', 'Global Network'] },
        { name: 'Standard Chartered HK', domain: 'sc.com/hk', features: ['Priority Banking', 'Wealth'] },
        { name: 'Bank of China HK', domain: 'bochk.com', features: ['RMB Clearing', 'Local Presence'] }
    ],
    IN: [
        { name: 'State Bank of India', domain: 'sbi.co.in', features: ['Largest Public Bank', 'Rural Network'] },
        { name: 'HDFC Bank', domain: 'hdfcbank.com', features: ['Private Banking', 'Digital Services'] },
        { name: 'ICICI Bank', domain: 'icicibank.com', features: ['Corporate Banking', 'Wealth Management'] }
    ],
    BR: [
        { name: 'Itaú Unibanco', domain: 'itau.com.br', features: ['Largest Private Bank', 'Asset Management'] },
        { name: 'Banco do Brasil', domain: 'bb.com.br', features: ['Government Owned', 'Agribusiness'] },
        { name: 'Bradesco', domain: 'bradesco.com.br', features: ['Retail Banking', 'Insurance'] }
    ],
    ZA: [
        { name: 'Standard Bank', domain: 'standardbank.co.za', features: ['African Footprint', 'Corporate'] },
        { name: 'FirstRand', domain: 'firstrand.co.za', features: ['FNB', 'Investment Banking'] },
        { name: 'Absa Group', domain: 'absa.africa', features: ['Retail Banking', 'Corporate'] }
    ],
    IT: [
        { name: 'Intesa Sanpaolo', domain: 'intesasanpaolo.com', features: ['Wealth Management', 'Insurance'] },
        { name: 'UniCredit', domain: 'unicreditgroup.eu', features: ['Pan-European', 'CIB'] },
        { name: 'Banco BPM', domain: 'bancobpm.it', features: ['Retail', 'SME'] }
    ],
    ES: [
        { name: 'Santander', domain: 'santander.com', features: ['Global Scale', 'Retail'] },
        { name: 'BBVA', domain: 'bbva.com', features: ['Digital Transformation', 'Fintech'] },
        { name: 'CaixaBank', domain: 'caixabank.com', features: ['Social Responsibility', 'Insurance'] }
    ],
    NL: [
        { name: 'ING', domain: 'ing.com', features: ['Digital First', 'Orange Code'] },
        { name: 'ABN AMRO', domain: 'abnamro.com', features: ['Sustainability', 'Private Banking'] },
        { name: 'Rabobank', domain: 'rabobank.com', features: ['Food & Agri', 'Cooperative'] }
    ],
    MX: [
        { name: 'BBVA Mexico', domain: 'bbva.mx', features: ['Market Leader', 'App'] },
        { name: 'Banorte', domain: 'banorte.com', features: ['Strong Local', 'Government'] },
        { name: 'Citibanamex', domain: 'banamex.com', features: ['Citi Network', 'History'] }
    ],
    TR: [
        { name: 'Ziraat Bankası', domain: 'ziraatbank.com.tr', features: ['Agriculture', 'Public'] },
        { name: 'Isbank', domain: 'isbank.com.tr', features: ['Private', 'Innovation'] },
        { name: 'Garanti BBVA', domain: 'garantibbva.com.tr', features: ['Technology', 'Retail'] }
    ],
    SE: [
        { name: 'SEB', domain: 'seb.se', features: ['Corporate', 'Innovation'] },
        { name: 'Swedbank', domain: 'swedbank.com', features: ['Retail', 'Baltics'] },
        { name: 'Handelsbanken', domain: 'handelsbanken.se', features: ['Decentralized', 'Service'] }
    ],
    NO: [
        { name: 'DNB', domain: 'dnb.no', features: ['Energy', 'Shipping'] }
    ],
    DK: [
        { name: 'Danske Bank', domain: 'danskebank.com', features: ['Nordic', 'Business'] }
    ],
    FI: [
        { name: 'Nordea', domain: 'nordea.com', features: ['Pan-Nordic', 'Digital'] }
    ],
    CZ: [
        { name: 'Česká spořitelna', domain: 'csas.cz', features: ['Largest Bank', 'George Digital'] },
        { name: 'Komerční banka', domain: 'kb.cz', features: ['Société Générale', 'Corporate'] },
        { name: 'ČSOB', domain: 'csob.cz', features: ['KBC Group', 'Insurance'] },
        { name: 'Moneta Money Bank', domain: 'moneta.cz', features: ['Digital', 'Retail'] },
        { name: 'Raiffeisenbank CZ', domain: 'rb.cz', features: ['Premium', 'SME'] }
    ],
    AT: [
        { name: 'Erste Group', domain: 'erstegroup.com', features: ['Retail', 'CEE Region'] },
        { name: 'Raiffeisen Bank International', domain: 'rbinternational.com', features: ['Cooperative', 'CEE'] },
        { name: 'BAWAG Group', domain: 'bawaggroup.com', features: ['Retail', 'SME'] },
        { name: 'UniCredit Bank Austria', domain: 'bankaustria.at', features: ['Pan-European', 'Corporate'] }
    ],
    PL: [
        { name: 'PKO Bank Polski', domain: 'pkobp.pl', features: ['Market Leader', 'Mobile'] },
        { name: 'Bank Pekao', domain: 'pekao.com.pl', features: ['Corporate', 'Investment'] }
    ],
    KR: [
        { name: 'KB Kookmin Bank', domain: 'kbstar.com', features: ['Retail', 'Mobile'] },
        { name: 'Shinhan Bank', domain: 'shinhan.com', features: ['Global', 'Digital'] },
        { name: 'Hana Bank', domain: 'kebhana.com', features: ['Forex', 'Wealth'] }
    ],
    ID: [
        { name: 'Bank Mandiri', domain: 'bankmandiri.co.id', features: ['Corporate', 'Trade'] },
        { name: 'Bank Central Asia (BCA)', domain: 'bca.co.id', features: ['Transaction Banking', 'Digital'] },
        { name: 'Bank Rakyat Indonesia (BRI)', domain: 'bri.co.id', features: ['Microfinance', 'SME'] }
    ],
    MY: [
        { name: 'Maybank', domain: 'maybank.com', features: ['ASEAN Leader', 'Islamic Banking'] },
        { name: 'CIMB', domain: 'cimb.com', features: ['Investment', 'Consumer'] },
        { name: 'Public Bank', domain: 'pbebank.com', features: ['Prudent', 'Retail'] }
    ],
    TH: [
        { name: 'Bangkok Bank', domain: 'bangkokbank.com', features: ['Corporate', 'Regional'] },
        { name: 'SCB', domain: 'scb.co.th', features: ['Digital', 'Wealth'] },
        { name: 'Kasikornbank', domain: 'kasikornbank.com', features: ['SME', 'Mobile'] }
    ],
    VN: [
        { name: 'Vietcombank', domain: 'vietcombank.com.vn', features: ['Trade', 'Forex'] },
        { name: 'BIDV', domain: 'bidv.com.vn', features: ['Development', 'Retail'] },
        { name: 'VietinBank', domain: 'vietinbank.vn', features: ['Corporate', 'Industrial'] }
    ],
    PH: [
        { name: 'BDO Unibank', domain: 'bdo.com.ph', features: ['Largest Network', 'Remittance'] },
        { name: 'BPI', domain: 'bpi.com.ph', features: ['Innovation', 'Corporate'] },
        { name: 'Metrobank', domain: 'metrobank.com.ph', features: ['Commercial', 'Trust'] }
    ],
    SA: [
        { name: 'Al Rajhi Bank', domain: 'alrajhibank.com.sa', features: ['Islamic Banking', 'Retail'] },
        { name: 'Saudi National Bank (SNB)', domain: 'alahli.com', features: ['National Champion', 'Corporate'] },
        { name: 'Riyad Bank', domain: 'riyadbank.com', features: ['Energy', 'Project Finance'] }
    ],
    EG: [
        { name: 'National Bank of Egypt', domain: 'nbe.com.eg', features: ['Public', 'Largest'] },
        { name: 'CIB Egypt', domain: 'cibeg.com', features: ['Private', 'Digital'] }
    ],
    NG: [
        { name: 'Access Bank', domain: 'accessbankplc.com', features: ['Pan-African', 'Retail'] },
        { name: 'Zenith Bank', domain: 'zenithbank.com', features: ['Corporate', 'Trade'] },
        { name: 'UBA', domain: 'ubagroup.com', features: ['Global', 'Digital'] }
    ],
    KE: [
        { name: 'KCB Group', domain: 'kcbgroup.com', features: ['Regional', 'Mobile'] },
        { name: 'Equity Bank', domain: 'equitygroupholdings.com', features: ['Inclusive', 'Agency Banking'] }
    ]
};

export const SERVICES_CONFIG: Record<string, { domain: string }> = {
    'PayPal': { domain: 'paypal.com' },
    'CashApp': { domain: 'cash.app' },
    'Venmo': { domain: 'venmo.com' },
    'Wise': { domain: 'wise.com' },
    'Western Union': { domain: 'westernunion.com' },
    'MoneyGram': { domain: 'moneygram.com' },
    'Zelle': { domain: 'zellepay.com' },
    'Payoneer': { domain: 'payoneer.com' },
    'Skrill': { domain: 'skrill.com' },
    'Revolut': { domain: 'revolut.com' },
    'Chime': { domain: 'chime.com' }
};

export const UTILITY_BILLERS: UtilityBiller[] = [
    { id: 'util_1', name: 'Con Edison', type: 'Electricity' as any, domain: 'coned.com', accountNumber: '****1234' },
    { id: 'util_2', name: 'Verizon Fios', type: 'Internet' as any, domain: 'verizon.com', accountNumber: '****5678' },
    { id: 'util_3', name: 'National Grid', type: 'Gas' as any, domain: 'nationalgridus.com', accountNumber: '****9012' },
    { id: 'util_4', name: 'AT&T', type: 'Internet' as any, domain: 'att.com', accountNumber: '****3456' },
    { id: 'util_5', name: 'American Water', type: 'Water' as any, domain: 'amwater.com', accountNumber: '****7890' },
    { id: 'util_6', name: 'PG&E', type: 'Electricity' as any, domain: 'pge.com', accountNumber: '****2345' },
    { id: 'util_7', name: 'T-Mobile', type: 'Internet' as any, domain: 't-mobile.com', accountNumber: '****6789' },
    { id: 'util_8', name: 'Comcast Xfinity', type: 'Internet' as any, domain: 'xfinity.com', accountNumber: '****0123' },
];

export const AIRTIME_PROVIDERS: AirtimeProvider[] = [
    { id: 'at_1', name: 'Verizon', domain: 'verizon.com' },
    { id: 'at_2', name: 'AT&T', domain: 'att.com' },
    { id: 'at_3', name: 'T-Mobile', domain: 't-mobile.com' },
    { id: 'at_4', name: 'Sprint', domain: 'sprint.com' },
    { id: 'at_5', name: 'Vodafone', domain: 'vodafone.com' },
    { id: 'at_6', name: 'Orange', domain: 'orange.com' },
    { id: 'at_7', name: 'MTN', domain: 'mtn.com' },
    { id: 'at_8', name: 'Airtel', domain: 'airtel.com' },
];

export const BANK_ACCOUNT_CONFIG = {
    routingLength: 9,
    swiftLengthMin: 8,
    swiftLengthMax: 11
};

export const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52,
    JPY: 151.40,
    CNY: 7.23,
    INR: 83.45,
    CHF: 0.90,
    SGD: 1.35,
    BTC: 0.000015, 
    ETH: 0.00029,
};

export const STANDARD_FEE = 0.00;
export const EXPRESS_FEE = 15.00;
export const DOMESTIC_WIRE_FEE = 0.00;
export const INTERNATIONAL_WIRE_FEE = 0.00;
export const CRYPTO_TRADE_FEE_PERCENT = 0.000;

export const USER_PIN = '8829';
export const USER_PASSWORD = 'Igwe122@'; 
export const NETWORK_AUTH_CODE = 'FPB-SEC-8829';
export const CLEARANCE_CODE = 'IMF-GB-892';

export const BRANDING_CONFIG = {
    bankName: 'First Pacific Bank, N.A.',
    shortName: 'FIRST PACIFIC',
    tagline: 'Private Wealth & Institutional Banking',
    networkTitle: 'International Priority Ledger Network',
    logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23D4AF37'%3E%3Cpath fill-rule='evenodd' d='M11.584 2.755a.75.75 0 0 1 .832 0l7.5 5A.75.75 0 0 1 19.5 9H4.5a.75.75 0 0 1-.416-1.245l7.5-5ZM19.25 10H4.75a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5ZM18.25 13H5.75a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12.5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1ZM19.25 19H4.75a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5Z' clip-rule='evenodd'/%3E%3C/svg%3E",
    address: '45 Rockefeller Plaza, New York, NY 10111',
    phone: '+1 (800) LAWRENCE',
    email: 'privatewealth@firstpaba.com',
    supportUrl: 'https://firstpaba.com/support',
    unsubscribeUrl: 'https://firstpaba.com/unsubscribe',
    complianceDisclosure: 'First Pacific Bank, N.A. is a National Banking Association registered under the Office of the Comptroller of the Currency (OCC). Corporate Headquarters: 45 Rockefeller Plaza, New York, NY 10111. Member FDIC. Private Wealth services are restricted to qualified High-Net-Worth individuals.',
};

export const USER_PROFILE: UserProfile = { 
    name: 'Lachy McLean', 
    email: 'info@lawrenceconsultantsorg.org', 
    phone: '+61488836731', 
    address: 'Randwick, Sydney, New South Wales, Australia',
    position: 'Footballer',
    sex: 'Male',
    profilePictureUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop', 
    role: 'super_admin',
    lastLogin: { date: new Date(), from: 'Randwick, Sydney' } 
};

export const INITIAL_ACCOUNTS: Account[] = [
    { id: 'acc_checking_1', type: AccountType.CHECKING, nickname: 'Private Wealth Checking', accountNumber: '8829 3844 9102', fullAccountNumber: '882938449102', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021882938449102', balance: 0.00, features: ['Global ATM Rebates', 'Priority Support'], status: 'Active' },
    { id: 'acc_savings_1', type: AccountType.SAVINGS, nickname: 'High-Yield Reserves', accountNumber: '3321 0098 5543', fullAccountNumber: '332100985543', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021332100985543', balance: 0.00, features: ['4.25% APY', 'Auto-Save'], status: 'Active' },
    { id: 'acc_business_1', type: AccountType.BUSINESS, nickname: 'Venture Capital Holdings', accountNumber: '9988 7766 5544', fullAccountNumber: '998877665544', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021998877665544', balance: 0.00, features: ['Multi-User Access', 'Payroll'], status: 'Active' },
    { id: 'acc_joint_1', type: AccountType.JOINT, nickname: 'Joint Capital Reserve', accountNumber: '4492 8821 7712', fullAccountNumber: '449288217712', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021449288217712', balance: 0.00, features: ['Sarah Marshall (Partner)', 'Consensus Ledger Enabled'], status: 'Active' },
    { id: 'acc_joint_2', type: AccountType.JOINT, nickname: 'Joint Living Expenses', accountNumber: '2281 9924 8831', fullAccountNumber: '228199248831', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021228199248831', balance: 0.00, features: ['Automated Sweep', 'Dual Authorization'], status: 'Active' },
    { id: 'acc_sub_1', type: AccountType.SAVINGS, parentId: 'acc_checking_1', nickname: 'Offshore Wealth Subaccount', accountNumber: '8829 3844 9102-S1', fullAccountNumber: '882938449102S1', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021882938449102S1', balance: 0.00, features: ['Tax Shelter Exempt', 'Parent Swapping'], status: 'Active' },
    { id: 'acc_sub_2', type: AccountType.CHECKING, parentId: 'acc_checking_1', nickname: 'Global Travel Subaccount', accountNumber: '8829 3844 9102-S2', fullAccountNumber: '882938449102S2', routingNumber: '021000021', swiftBic: 'FPBUS33', iban: 'US89FPBU021000021882938449102S2', balance: 0.00, features: ['Zero Forex Fees', 'Direct Allocation'], status: 'Active' },
];

export const SELF_RECIPIENT: Recipient = { 
    id: 'self_0', 
    fullName: USER_PROFILE.name, 
    phone: USER_PROFILE.phone, 
    bankName: 'First Pacific Bank', 
    accountNumber: '**** **** **** 9102', 
    country: ALL_COUNTRIES.find(c => c.code === 'US')!, 
    streetAddress: '202 Spindle Top Dr', 
    city: 'Guntersville', 
    stateProvince: 'AL', 
    postalCode: '35976', 
    deliveryOptions: { bankDeposit: true, cardDeposit: true, cashPickup: false }, 
    realDetails: { accountNumber: '882938449102', swiftBic: 'FPBUS33' }, 
    recipientType: 'bank' 
};

export const INITIAL_RECIPIENTS: Recipient[] = [
    { id: 'rec_1', fullName: 'Jane Doe', nickname: 'Design Contractor', phone: '+1-212-555-0187', bankName: 'Chase Bank', accountNumber: '**** **** **** 1234', country: ALL_COUNTRIES.find(c => c.code === 'US')!, streetAddress: '123 Main St', city: 'New York', stateProvince: 'NY', postalCode: '10001', deliveryOptions: { bankDeposit: true, cardDeposit: true, cashPickup: true }, realDetails: { accountNumber: '987654321', swiftBic: 'CHASUS33' }, recipientType: 'bank', trustScore: 92, lastPaymentDate: new Date('2024-04-15'), verificationStatus: 'verified' },
    { id: 'rec_2', fullName: 'Carlos Ruiz', nickname: 'Madrid Office', phone: '+34-612-345-678', bankName: 'Santander', accountNumber: '**** **** **** 5678', country: ALL_COUNTRIES.find(c => c.code === 'ES')!, streetAddress: 'Calle Gran Vía 22', city: 'Madrid', postalCode: '28013', deliveryOptions: { bankDeposit: true, cardDeposit: false, cashPickup: true }, realDetails: { accountNumber: 'ES910049182938', swiftBic: 'BSCHESMM' }, recipientType: 'bank', trustScore: 88, lastPaymentDate: new Date('2024-03-22'), verificationStatus: 'verified' },
    { id: 'rec_3', fullName: 'Sarah Smith', nickname: 'London Supplier', phone: '+44-7700-900077', bankName: 'Barclays', accountNumber: '**** **** **** 9012', country: ALL_COUNTRIES.find(c => c.code === 'GB')!, streetAddress: '45 Oxford St', city: 'London', postalCode: 'W1D 2DZ', deliveryOptions: { bankDeposit: true, cardDeposit: true, cashPickup: false }, realDetails: { accountNumber: '20459182', swiftBic: 'BARCGB22' }, recipientType: 'bank', trustScore: 95, lastPaymentDate: new Date('2024-05-01'), verificationStatus: 'verified' },
    { id: 'rec_4', fullName: 'Netflix', nickname: 'Streaming', bankName: 'Silicon Valley Bank', accountNumber: '**** **** **** 3322', country: ALL_COUNTRIES.find(c => c.code === 'US')!, realDetails: { accountNumber: '88299281', swiftBic: 'SVBUS33' }, recipientType: 'service', serviceName: 'Netflix', paymentMethod: 'BANK', trustScore: 99, verificationStatus: 'verified' },
    { id: 'rec_5', fullName: 'Liam Chen', nickname: 'Consultant', bankName: 'DBS Bank', accountNumber: '**** 8821', country: ALL_COUNTRIES.find(c => c.code === 'SG')!, realDetails: { accountNumber: '120-4-023912', swiftBic: 'DBSSGSG' }, recipientType: 'bank', trustScore: 85, verificationStatus: 'verified' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CARDS: Card[] = [
    {
        id: 'card_1',
        lastFour: '8829',
        cardholderName: USER_PROFILE.name,
        expiryDate: '12/28',
        fullNumber: '4000 1234 5678 8829',
        cvc: '123',
        network: 'Visa',
        cardType: 'DEBIT',
        linkedAccountId: 'acc_checking_1',
        balance: 0.00,
        controls: {
            isFrozen: false,
            onlinePurchases: true,
            internationalTransactions: true,
            transactionLimits: { daily: 10000, perTransaction: 5000 },
            blockedCategories: []
        }
    }
];

export const INITIAL_VIRTUAL_CARDS: VirtualCard[] = [];

export const INITIAL_ADVANCED_TRANSFER_LIMITS: AdvancedTransferLimits = {
  p2p: { perTransaction: 500, daily: 1000, monthly: 5000 },
  ach: { daily: 10000, monthly: 50000 },
  wire: { daily: 50000, monthly: 250000 },
  internal: { daily: 100000, monthly: 1000000 }
};

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
    mfa: { enabled: true, method: 'sms' },
    biometricsEnabled: true,
    transactionMonitoringEnabled: true,
    darkWebMonitoringEnabled: false,
    forceLockEnabled: false,
    forceLockTimeout: 30000,
    travelModeEnabled: false,
    registeredHomeRegion: 'Guntersville, AL (North America)',
    geofenceAlertsEnabled: true,
    geofenceSensitivityKm: 100,
    currentDetectedRegion: 'Guntersville, AL (North America)',
    lastLocationCheckTimestamp: new Date().toISOString()
};

export const INITIAL_TRUSTED_DEVICES: TrustedDevice[] = [
    { id: 'dev_1', deviceType: 'mobile', browser: 'iPhone 15 Pro', location: 'Guntersville, AL', lastLogin: new Date(), isCurrent: true }
];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
    hapticsEnabled: true,
    theme: 'blue',
    themeMode: 'dark',
    privacyMode: false,
    hftMode: false
};

export const INITIAL_PUSH_SETTINGS: PushNotificationSettings = {
    transactions: true,
    security: true,
    promotions: false,
    alertOnAmountEnabled: true,
    alertAmountThreshold: 1000,
    alertOnFlaggedEnabled: true,
    alertOnComplianceFeeEnabled: true,
    complianceFeeThresholdPercentage: 15
};

export const INITIAL_TASKS: Task[] = [
    { id: 't1', text: 'Complete identity verification', completed: false, dueDate: new Date(Date.now() + 86400000 * 7), category: TaskCategory.Personal, priority: 'High' },
    { id: 't2', text: 'Fund your account', completed: false, category: TaskCategory.Financial, priority: 'High' }
];

export const INITIAL_FLIGHT_BOOKINGS: FlightBooking[] = [];

export const INITIAL_UTILITY_BILLS: UtilityBill[] = [];

export const INITIAL_AIRTIME_PURCHASES: AirtimePurchase[] = [];

export const getInitialCryptoAssets = (Icons: any): CryptoAsset[] => [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 64230.50, change24h: 2.4, marketCap: 1200000000000, priceHistory: [60000, 61000, 62000, 61500, 63000, 64230], icon: Icons.BtcIcon },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 3450.25, change24h: -1.2, marketCap: 400000000000, priceHistory: [3500, 3550, 3480, 3400, 3420, 3450], icon: Icons.EthIcon },
    { id: 'sol', name: 'Solana', symbol: 'SOL', price: 145.80, change24h: 5.6, marketCap: 65000000000, priceHistory: [130, 135, 140, 138, 142, 145], icon: Icons.SolIcon },
    { id: 'ada', name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: 0.5, marketCap: 16000000000, priceHistory: [0.42, 0.43, 0.44, 0.44, 0.45, 0.45], icon: Icons.AdaIcon },
    { id: 'dot', name: 'Polkadot', symbol: 'DOT', price: 7.20, change24h: -0.8, marketCap: 10000000000, priceHistory: [7.5, 7.4, 7.3, 7.2, 7.1, 7.2], icon: Icons.DotIcon },
];

export const INITIAL_CRYPTO_HOLDINGS: CryptoHolding[] = [
    { assetId: 'btc', amount: 0.45, avgBuyPrice: 62000.00, stakedAmount: 0.15, stakingApr: 3.5 },
    { assetId: 'eth', amount: 4.8, avgBuyPrice: 3200.00, stakedAmount: 1.5, stakingApr: 5.2 },
    { assetId: 'sol', amount: 42.0, avgBuyPrice: 135.00, stakedAmount: 0.0, stakingApr: 7.8 }
];

export const INITIAL_LOAN_APPLICATIONS: LoanApplication[] = [];

export const INITIAL_SUBSCRIPTIONS: SubscriptionService[] = [];

export const INITIAL_APPLE_CARD_DETAILS: AppleCardDetails = {
    lastFour: '8829',
    balance: 0.00,
    creditLimit: 25000,
    availableCredit: 25000,
    spendingLimits: [
        { category: 'Food & Drink', limit: 500 },
        { category: 'Entertainment', limit: 200 }
    ]
};

export const INITIAL_APPLE_CARD_TRANSACTIONS: AppleCardTransaction[] = [];

export const SPENDING_CATEGORIES: SpendingCategory[] = [
    'Electronics', 'Transport', 'Food & Drink', 'Groceries', 'Shopping', 'Entertainment', 'Travel', 'Other'
];

export const INITIAL_WALLET_DETAILS: WalletDetails = {
    balance: 0.00,
    currency: 'USD',
    cardLastFour: '8829'
};

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [];

export const INITIAL_CARD_TRANSACTIONS: CardTransaction[] = [];

export const LEADERSHIP_TEAM: LeadershipProfile[] = [
    { name: "Jonathan Sterling", title: "Chief Executive Officer", imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop", bio: "Former Goldman Sachs Partner with 25+ years in global finance." },
    { name: "Elena Rossi", title: "Head of Private Wealth", imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop", bio: "Expert in cross-border wealth structuring and sovereign trusts." },
    { name: "Marcus Thorne", title: "Chief Technology Officer", imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop", bio: "Pioneered blockchain settlement layers for Tier-1 banks." },
    { name: "Sarah Jenkins", title: "Head of Concierge", imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop", bio: "Delivering bespoke lifestyle management for ultra-high-net-worth clients." }
];

export const CUSTOMER_REVIEWS: CustomerReview[] = [
    { id: 'rev1', author: "James L.", location: "London, UK", rating: 5, comment: "The speed of international wires is unmatched. Truly a borderless experience.", date: new Date('2024-04-10') },
    { id: 'rev2', author: "Maria G.", location: "Madrid, ES", rating: 5, comment: "Exceptional concierge service. They handled my entire relocation finance.", date: new Date('2024-03-22') },
    { id: 'rev3', author: "Chen W.", location: "Singapore", rating: 4, comment: "Secure, private, and efficient. The crypto integration is seamless.", date: new Date('2024-05-05') }
];

export const TOP_RATED_STAFF: StaffProfile[] = [
    { id: 'st1', name: "David Kim", title: "Senior Wealth Advisor", imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop", bio: "Specializes in APAC market growth strategies.", rating: 4.9 },
    { id: 'st2', name: "Emily Chen", title: "Concierge Specialist", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop", bio: "Expert in luxury travel and logistics.", rating: 5.0 },
    { id: 'st3', name: "Michael Ross", title: "Loan Officer", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop", bio: "Dedicated to complex lending structures.", rating: 4.8 }
];

export const INITIAL_CAUSES: Cause[] = [
    { id: 'c1', title: 'Global Education Fund', shortDescription: 'Building schools in underserved regions.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop', details: { description: 'Providing quality education to children worldwide.', impacts: ['Built 50 schools', 'Educated 10,000 children'] } },
    { id: 'c2', title: 'Clean Water Initiative', shortDescription: 'Sustainable water solutions for communities.', imageUrl: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?q=80&w=1000&auto=format&fit=crop', details: { description: 'Ensuring access to clean and safe drinking water.', impacts: ['Installed 200 wells', 'Served 50,000 people'] } },
    { id: 'c3', title: 'Reforestation Project', shortDescription: 'Planting trees to combat climate change.', imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop', details: { description: 'Restoring forests and biodiversity.', impacts: ['Planted 1 million trees', 'Restored 500 acres'] } }
];

export const INITIAL_SHIPMENT: Shipment = {
    trackingId: 'TRK-8821-9923',
    currentStatus: ShipmentStatus.IN_TRANSIT,
    statusHealth: 'on-time',
    serviceType: 'Secure Armored Transport',
    weight: '12.5 kg',
    estimatedTime: '14:30',
    estimatedDate: 'Oct 24, 2024',
    deliveryWindow: '13:00 - 16:00',
    dimensions: '40x30x20 cm',
    signatureRequired: true,
    insuranceValue: '$250,000.00',
    sealNumber: 'SL-99281-X',
    events: [
        { status: 'Departed Hub', location: 'Zurich Secure Facility', timestamp: 'Oct 23, 09:15', type: 'warehouse' },
        { status: 'Customs Clearance', location: 'JFK Intl Airport', timestamp: 'Oct 23, 18:45', type: 'flight' },
        { status: 'In Transit', location: 'New York Metro Area', timestamp: 'Oct 24, 08:30', type: 'truck' }
    ],
    recipient: 'Jonathan Sterling',
    recipientPhoto: USER_PROFILE.profilePictureUrl,
    recipientAddress: { street: '123 Finance St', city: 'New York, NY', zip: '10001' },
    deliveryInstructions: 'Direct hand-off to principal only. Biometric ID required upon receipt.',
    handlingProtocols: ['Temperature Controlled', 'GPS Monitored', 'Armed Escort'],
    certifiedBy: 'Global Logistics Authority',
    blockchainHash: '0x8f2a...991c'
};

export const TRANSFER_PURPOSES = [
  'Family Support',
  'Property Purchase',
  'Investment',
  'Gift',
  'Bill Payment',
  'Education',
  'Travel Expenses',
  'Charity',
  'Business Services',
  'Other'
];

export const TASK_CATEGORIES: TaskCategory[] = [TaskCategory.Financial, TaskCategory.Personal, TaskCategory.Work, TaskCategory.Other];

export const CRYPTO_CURRENCIES: Currency[] = [
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', countryCode: 'BTC' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', countryCode: 'ETH' },
    { code: 'SOL', name: 'Solana', symbol: '◎', countryCode: 'SOL' },
    { code: 'ADA', name: 'Cardano', symbol: '₳', countryCode: 'ADA' },
    { code: 'DOT', name: 'Polkadot', symbol: '●', countryCode: 'DOT' },
    { code: 'USDC', name: 'USD Coin', symbol: '$', countryCode: 'USDC' },
    { code: 'USDT', name: 'Tether', symbol: '₮', countryCode: 'USDT' },
];

// Cache-busted currency list export
export const CURRENCIES_LIST: Currency[] = Array.from(new Map([
    ...ALL_COUNTRIES.map(c => ({
        code: c.currency,
        name: c.name, 
        symbol: c.symbol,
        countryCode: c.code
    })),
    ...CRYPTO_CURRENCIES
].map(c => [c.code, c] as [string, Currency])).values());

export const EXTENDED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', countryCode: 'US' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', countryCode: 'ES' },
    { code: 'fr', name: 'French', nativeName: 'Français', countryCode: 'FR' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', countryCode: 'DE' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', countryCode: 'IT' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', countryCode: 'PT' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', countryCode: 'CN' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', countryCode: 'TW' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', countryCode: 'JP' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', countryCode: 'RU' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', countryCode: 'SA' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', countryCode: 'IN' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', countryCode: 'KR' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', countryCode: 'VN' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', countryCode: 'TH' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', countryCode: 'TR' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', countryCode: 'NL' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', countryCode: 'SE' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', countryCode: 'PL' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', countryCode: 'ID' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', countryCode: 'MY' },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino', countryCode: 'PH' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', countryCode: 'IL' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', countryCode: 'IR' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', countryCode: 'PK' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', countryCode: 'BD' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', countryCode: 'UA' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', countryCode: 'CZ' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', countryCode: 'GR' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', countryCode: 'RO' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', countryCode: 'DK' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', countryCode: 'FI' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', countryCode: 'NO' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', countryCode: 'HU' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', countryCode: 'SK' },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български', countryCode: 'BG' },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', countryCode: 'HR' },
    { code: 'sr', name: 'Serbian', nativeName: 'Српски', countryCode: 'RS' },
    { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščина', countryCode: 'SI' },
    { code: 'et', name: 'Estonian', nativeName: 'Eesti', countryCode: 'EE' },
    { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', countryCode: 'LV' },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', countryCode: 'LT' },
    { code: 'sq', name: 'Albanian', nativeName: 'Shqip', countryCode: 'AL' },
    { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', countryCode: 'MK' },
    { code: 'ka', name: 'Georgian', nativeName: 'ქართული', countryCode: 'GE' },
    { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', countryCode: 'AM' },
    { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', countryCode: 'AZ' },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', countryCode: 'KZ' },
    { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', countryCode: 'UZ' },
    { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', countryCode: 'GB' },
    { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', countryCode: 'IE' },
    { code: 'mt', name: 'Maltese', nativeName: 'Malti', countryCode: 'MT' },
    { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', countryCode: 'IS' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', countryCode: 'KE' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', countryCode: 'ET' },
    { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', countryCode: 'NG' },
    { code: 'ig', name: 'Igbo', nativeName: 'Igbo', countryCode: 'NG' },
    { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', countryCode: 'ZA' },
    { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', countryCode: 'ZA' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', countryCode: 'ZA' },
    { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', countryCode: 'MG' },
    { code: 'sn', name: 'Shona', nativeName: 'chiShona', countryCode: 'ZW' },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa', countryCode: 'NG' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', countryCode: 'IN' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', countryCode: 'IN' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', countryCode: 'IN' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', countryCode: 'IN' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', countryCode: 'IN' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', countryCode: 'IN' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', countryCode: 'IN' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', countryCode: 'LK' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', countryCode: 'NP' },
    { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', countryCode: 'MM' },
    { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', countryCode: 'KH' },
    { code: 'lo', name: 'Lao', nativeName: 'ລາວ', countryCode: 'LA' },
    { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', countryCode: 'MN' },
    { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', countryCode: 'PK' },
    { code: 'ps', name: 'Pashto', nativeName: 'پښتو', countryCode: 'AF' },
    { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', countryCode: 'IQ' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali', countryCode: 'SO' },
    { code: 'rw', name: 'Kinyarwanda', nativeName: 'Kinyarwanda', countryCode: 'RW' },
    { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', countryCode: 'MW' },
    { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', countryCode: 'LS' },
    { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', countryCode: 'UZ' },
    { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen', countryCode: 'TM' },
    { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргыз', countryCode: 'KG' },
    { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', countryCode: 'TJ' },
    { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', countryCode: 'CN' }
];

export const AIRPORTS: Airport[] = [
    { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US', lat: 40.6413, lng: -73.7781 },
    { code: 'LHR', name: 'Heathrow', city: 'London', country: 'GB', lat: 51.4700, lng: -0.4543 },
    { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lng: 2.5479 },
    { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE', lat: 25.2532, lng: 55.3657 },
    { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lng: 103.9915 },
    { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lng: 139.7798 },
    { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.9399, lng: 151.1753 },
    { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'DE', lat: 50.0379, lng: 8.5622 },
    { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.9416, lng: -118.4085 },
    { code: 'YYZ', name: 'Pearson', city: 'Toronto', country: 'CA', lat: 43.6777, lng: -79.6248 },
];

export const FAQS: FaqItem[] = [
    { question: "How do I reset my password?", answer: "You can reset your password by going to the Settings page and selecting 'Change Password'. You'll need to verify your identity via email or SMS." },
    { question: "What are the fees for international transfers?", answer: "International wire transfers incur a flat fee of $45. Currency conversion fees may apply depending on the destination currency." },
    { question: "Is my account FDIC insured?", answer: "Yes, all deposit accounts at First Pacific Bank are FDIC insured up to $250,000 per depositor, per ownership category." },
    { question: "How do I report a lost card?", answer: "Go to the 'Cards' tab, select the card, and toggle 'Lock Card'. Then contact support immediately to request a replacement." },
    { question: "Can I use my card abroad?", answer: "Yes, ensure 'International Transactions' is enabled in your Card Controls settings before you travel." },
];

export const ATM_LOCATIONS: AtmLocation[] = [
    { id: 'atm1', name: 'Downtown Branch', address: '123 Main St', city: 'New York', state: 'NY', zip: '10001', network: 'Premium Reserved Bank', lat: 40.7128, lng: -74.0060 },
    { id: 'atm2', name: 'Airport Terminal 4', address: 'JFK Intl Airport', city: 'Queens', state: 'NY', zip: '11430', network: 'Allpoint', lat: 40.6413, lng: -73.7781 },
    { id: 'atm3', name: 'Midtown Center', address: '45 Rockefeller Plaza', city: 'New York', state: 'NY', zip: '10111', network: 'Visa Plus', lat: 40.7587, lng: -73.9787 },
    { id: 'atm4', name: 'Financial District', address: '88 Wall St', city: 'New York', state: 'NY', zip: '10005', network: 'Cirrus', lat: 40.7056, lng: -74.0083 },
    { id: 'atm5', name: 'Brooklyn Heights', address: '200 Cadman Plaza W', city: 'Brooklyn', state: 'NY', zip: '11201', network: 'Allpoint', lat: 40.6946, lng: -73.9903 },
];

export const LEGAL_CONTENT: Record<string, { title: string, content: string }> = {
    terms: {
        title: "Terms of Service",
        content: `<h3>1. Introduction</h3><p>Welcome to First Pacific Bank. By accessing our services, you agree to these terms.</p><h3>2. Account Usage</h3><p>You agree to use your account for lawful purposes only.</p><h3>3. Privacy</h3><p>Your data is protected according to our Privacy Policy.</p>`
    },
    privacy: {
        title: "Privacy Policy",
        content: `<h3>1. Data Collection</h3><p>We collect information to provide better services.</p><h3>2. Data Usage</h3><p>We do not sell your personal data.</p><h3>3. Security</h3><p>We use bank-grade encryption.</p>`
    },
    licenses: {
        title: "Licenses & Disclosures",
        content: `<h3>1. FDIC Insurance</h3><p>Member FDIC.</p><h3>2. Equal Housing Lender</h3><p>We do business in accordance with Federal Fair Lending Laws.</p>`
    }
};

export const generateRealisticTradeHistory = (currentPrice: number): Trade[] => {
    return Array.from({ length: 15 }).map((_, i) => ({
        id: `trade_${Date.now()}_${i}`,
        price: currentPrice * (1 + (Math.random() * 0.005 - 0.0025)),
        size: Math.random() * 2 + 0.1,
        time: new Date(Date.now() - i * 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: Math.random() > 0.5 ? 'buy' : 'sell'
    }));
};

export { MASTER_WALLPAPERS as WALLPAPER_BACKGROUNDS } from './bankingImageAssets';
