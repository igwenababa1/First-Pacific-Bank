/**
 * Background & Media Asset Configuration
 * Categorizes all institutional banking images, previous wallpapers,
 * module backgrounds, email banners, and security backdrops.
 */

import { NEW_BANKING_IMAGE_URLS, PREVIOUS_BACKGROUND_IMAGES, MASTER_WALLPAPERS } from '../components/bankingImageAssets';

export type AppSection = 
  | 'WelcomePage' 
  | 'Auth' 
  | 'BannerSystem' 
  | 'Headers'
  | 'Dashboard'
  | 'Transfers'
  | 'Cards'
  | 'AtmLocator'
  | 'Investments'
  | 'Corporate'
  | 'Settings'
  | 'Vault';

export interface BackgroundAsset {
  id: string;
  url: string;
  title: string;
  description: string;
  category: AppSection;
  overlayType?: 'subtle' | 'medium' | 'deep' | 'gradient' | 'glass';
}

export const CATEGORIZED_BACKGROUNDS: Record<AppSection, string[]> = {
  WelcomePage: [
    ...PREVIOUS_BACKGROUND_IMAGES,
    "https://www.datocms-assets.com/163939/1760200402-titelbild-mas-banking-finance-hwz.jpg?w=1920",
    "https://fullerengr.com/app/uploads/2022/06/banking-financing-img.jpg",
    "https://capaciteam.com/wp-content/uploads/2025/02/industry-finance-and-banking-image.jpg",
    "https://www.thecable.ng/wp-content/uploads/2026/03/Lagos-skyscrapers.jpg",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop"
  ],

  Auth: [
    "https://www.temenos.com/wp-content/uploads/2025/04/Temenos-digital-banking-scaled.jpg",
    "https://cms-assets.themuse.com/media/lead/is-my-money-safe-in-the-bank.png",
    "https://personal-finance.bnpparibas/app/uploads/sites/4/2024/11/starting-partnership-2023-11-27-05-27-01-utc-scaled.jpg",
    "https://www.ccscu.org/wp-content/uploads/2025/11/5400.jpg",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1920&auto=format&fit=crop"
  ],

  BannerSystem: [
    "https://smartzone.ae/wp-content/uploads/2026/02/Can-Foreigners-Start-a-Business-in-Dubai.jpg",
    "https://www.housingfinance.co.ug/wp-content/uploads/2022/11/hfb-Safety-precautions-at-the-ATM-1024x768.jpg",
    "https://www.theforage.com/blog/wp-content/uploads/2023/05/what-explains-the-difference-between-retail-and-commercial-banking-1-1024x768.jpg",
    "https://www.investopedia.com/thmb/jkQJy7DLbDtBqS-odz8YW8vFTq8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/investmentbank-final-1bbd4ca5d3904dbba5b8b8b19d7d65b8.jpg",
    "https://www.hiscox.com/sites/default/files/styles/blog_main_image/public/images/hero/2024/banks-for-small-business.png.webp?itok=k5otwAkk",
    "https://cdn.corporatefinanceinstitute.com/assets/mobile-banking.jpeg"
  ],

  Headers: [
    "https://www.firstbankms.com/assets/files/EYOHeMqn/hero-dw.jpeg",
    "https://www.naac.edu.ng/wp-content/uploads/2025/08/qtq80-mz7TWZ-1024x836.jpeg",
    "https://media.licdn.com/dms/image/v2/D5612AQGWnededffVrw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1686166687302?e=2147483647&v=beta&t=SPQ3CCOto2v6wb5h_V_iCcci0QE5-hH0mDvqXWQiiRE",
    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=1920&auto=format&fit=crop"
  ],

  Dashboard: [
    "https://www.datocms-assets.com/163939/1760200402-titelbild-mas-banking-finance-hwz.jpg?w=1920",
    "https://cdn.pixabay.com/photo/2020/02/18/08/35/finance-4858797_1280.jpg",
    "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1920&auto=format&fit=crop"
  ],

  Transfers: [
    "https://static.vecteezy.com/system/resources/thumbnails/051/170/340/small/online-banking-interbank-payment-concept-businessman-with-virtual-global-currency-symbols-in-hand-free-photo.jpg",
    "https://openbanking.ng/wp-content/uploads/2019/09/F6-1.jpg",
    "https://www.temenos.com/wp-content/uploads/2025/04/Temenos-digital-banking-scaled.jpg",
    "https://wise.com/imaginary-v2/98070557aeeaabfd3fe0aef4b985f6d2.jpg?width=1200"
  ],

  Cards: [
    "https://cdn.businessday.ng/wp-content/uploads/2025/12/POS-terminal-.jpg",
    "https://t4.ftcdn.net/jpg/05/07/09/51/360_F_507095163_5mMsSeqoCjv0MWT2NDIcDPYGwGhxrqyh.jpg",
    "https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1920&auto=format&fit=crop",
    "https://cdn.guardian.ng/wp-content/uploads/2017/02/ATM-follow-my-vote.jpg"
  ],

  AtmLocator: [
    "https://www.housingfinance.co.ug/wp-content/uploads/2022/11/hfb-Safety-precautions-at-the-ATM-1024x768.jpg",
    "https://media.istockphoto.com/id/1789123613/photo/happy-young-woman-on-vacation-using-the-atm.jpg?s=612x612&w=0&k=20&c=4Tw6hv-CHGsLmxYiDFo7LjytmuEXXUnBNevat4-J7Eo=",
    "https://cdn.guardian.ng/wp-content/uploads/2017/02/ATM-follow-my-vote.jpg",
    "https://cdn.businessday.ng/wp-content/uploads/2025/12/POS-terminal-.jpg"
  ],

  Investments: [
    "https://www.investopedia.com/thmb/WYwNJFmxNMRvlqXSWCphA9-PR_M=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/investment-banking.asp-43442f55f0ee4d9ab0185c3c6a8fb450.jpg",
    "https://www.investopedia.com/thmb/jkQJy7DLbDtBqS-odz8YW8vFTq8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/investmentbank-final-1bbd4ca5d3904dbba5b8b8b19d7d65b8.jpg",
    "https://images.unsplash.com/photo-1610375461246-83df859d8222?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1920&auto=format&fit=crop"
  ],

  Corporate: [
    "https://smartzone.ae/wp-content/uploads/2026/02/Can-Foreigners-Start-a-Business-in-Dubai.jpg",
    "https://shandaconsult.com/wp-content/uploads/2018/01/uae_bank_accounts_india_information_share_850.jpg.webp",
    "https://uaebizsignal.com/wp-content/uploads/2026/07/business-bank-account-uae.webp",
    "https://diamondrock.ae/wp-content/uploads/2026/02/blog138.webp",
    "https://personal-finance.bnpparibas/app/uploads/sites/4/2024/11/starting-partnership-2023-11-27-05-27-01-utc-scaled.jpg",
    "https://www.theforage.com/blog/wp-content/uploads/2023/05/what-explains-the-difference-between-retail-and-commercial-banking-1-1024x768.jpg"
  ],

  Settings: [
    "https://cms-assets.themuse.com/media/lead/is-my-money-safe-in-the-bank.png",
    "https://vtn-partners.com/data/uploads/2023/03/nganh-tai-chinh-ngan-hang-la-gi-hinh-anh3.jpg",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1920&auto=format&fit=crop"
  ],

  Vault: [
    "https://lh3.googleusercontent.com/p/AF1QipOt9-a-WR_Fur_p5csZkQerDEWMRkN2VN6Us2xS=s1600",
    "https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1610375461246-83df859d8222?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop"
  ]
};

export const DEFAULT_ROTATION_INTERVAL_MS = 8000;
export const PRELOAD_PRIORITY_COUNT = 6;
