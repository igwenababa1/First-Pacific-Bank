
import React, { useState, useEffect, useCallback } from 'react';
import { getFinancialNews, getCountryBankingTip, BankingTipResult } from '../services/geminiService';
import { NewsArticle, Country } from '../types';
import { ALL_COUNTRIES } from './constants';
import { SpinnerIcon, InfoIcon, StarIcon, LightBulbIcon, ArrowPathIcon } from './Icons';

const NewsArticleCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <div className="p-4 rounded-lg shadow-inner bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-300">
        <span className="inline-block bg-primary-500 dark:bg-primary-500 text-primary-700 dark:text-primary-300 text-xs font-semibold px-2 py-1 rounded-full mb-2">
            {article.category}
        </span>
        <h4 className="font-bold text-[#0F172A] dark:text-white mb-1">{article.title}</h4>
        <p className="text-sm text-[#0F172A] dark:text-white">{article.summary}</p>
    </div>
);

const AdCard: React.FC = () => (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-[#0F172A] dark:text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 text-primary-500/20">
            <StarIcon />
        </div>
        <div className="relative z-10">
            <h3 className="text-xl font-bold">Upgrade to Premium Reserved Bank</h3>
            <p className="mt-2 text-sm text-primary-100">Unlock higher transfer limits, a dedicated account manager, and exclusive investment opportunities.</p>
            <button className="mt-4 bg-white text-primary font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-100 transition-colors dark:bg-slate-800">
                Learn More
            </button>
        </div>
    </div>
);


const NewsSkeletonLoader: React.FC = () => (
    <div className="p-4 rounded-lg shadow-inner bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 animate-pulse">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
        <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-4/5"></div>
    </div>
);


export const FinancialNews: React.FC = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [newsError, setNewsError] = useState<string | null>(null);

    // New state for the banking tip feature
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('GB'); // Default to UK
    const [bankingTip, setBankingTip] = useState<string>('');
    const [isTipLoading, setIsTipLoading] = useState(true);
    const [tipError, setTipError] = useState<string | null>(null);

    const fetchNews = useCallback(async () => {
        setIsLoadingNews(true);
        setNewsError(null);
        const result = await getFinancialNews();
        if (result.isError) {
            setNewsError(result.errorMessage || "Failed to load news.");
        } else {
            setArticles(result.articles);
        }
        setIsLoadingNews(false);
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const fetchTip = useCallback(async () => {
        if (!selectedCountryCode) return;

        const country = ALL_COUNTRIES.find(c => c.code === selectedCountryCode);
        if (!country) return;

        setIsTipLoading(true);
        setTipError(null);
        const result: BankingTipResult = await getCountryBankingTip(country.name);
        
        if (result.isError) {
            setTipError(result.errorMessage || "Could not generate tip.");
        } else {
            setBankingTip(result.tip);
        }
        setIsTipLoading(false);
    }, [selectedCountryCode]);

    useEffect(() => {
        fetchTip();
    }, [fetchTip]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-white dark:bg-slate-700 rounded-2xl shadow-digital-light dark:shadow-digital-dark">
                <div className="p-6 border-b border-slate-200 dark:border-slate-300 flex justify-between items-center">
                    <h2 id="financial-news-heading" className="text-xl font-bold text-[#0F172A] dark:text-white">Market Insights & News</h2>
                    {newsError && (
                        <button onClick={fetchNews} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                            <ArrowPathIcon className="w-4 h-4" /> Retry
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {isLoadingNews ? (
                        <div className="space-y-4">
                           <NewsSkeletonLoader />
                           <NewsSkeletonLoader />
                           <NewsSkeletonLoader />
                        </div>
                    ) : newsError ? (
                        <div className="flex items-center space-x-3 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg shadow-inner">
                            <InfoIcon className="w-6 h-6 flex-shrink-0" />
                            <p>{newsError} Please check your connection.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {articles.map((article, index) => (
                                <NewsArticleCard key={index} article={article} />
                            ))}
                        </div>
                    )}
                </div>
                
                {/* NEW "Did You Know?" Section */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-300">
                    <div className="flex items-center space-x-3 mb-4">
                        <LightBulbIcon className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Did You Know?</h3>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <label htmlFor="country-tip-select" className="text-sm font-bold text-[#0F172A] dark:text-white flex-shrink-0">
                            Get transfer tips for:
                        </label>
                        <select
                            id="country-tip-select"
                            value={selectedCountryCode}
                            onChange={(e) => setSelectedCountryCode(e.target.value)}
                            className="w-full sm:w-auto bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-[#0F172A] dark:text-white p-2 rounded-md shadow-inner focus:ring-2 focus:ring-primary-400"
                        >
                            {ALL_COUNTRIES.map((country: Country) => (
                                <option key={country.code} value={country.code}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={`p-4 rounded-lg flex items-start space-x-3 shadow-inner ${tipError ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300' : 'bg-primary-50 dark:bg-primary-500 text-primary-800 dark:text-primary-300'}`}>
                        {isTipLoading ? (
                            <SpinnerIcon className="w-5 h-5 mt-0.5 flex-shrink-0 animate-spin" />
                        ) : (
                            <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-grow">
                            <p className="text-sm">
                                {isTipLoading ? 'Fetching AI-powered tip...' : tipError ? tipError : bankingTip}
                            </p>
                        </div>
                        {tipError && !isTipLoading && (
                             <button onClick={fetchTip} className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1">
                <AdCard />
            </div>
        </div>
    );
};
