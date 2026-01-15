"use client";

import { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';

interface Quote {
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High
    l: number; // Low
    o: number; // Open
    pc: number; // Previous close
}

interface Profile {
    name: string;
    logo: string;
    ticker: string;
    finnhubIndustry: string;
    weburl: string;
    marketCapitalization: number;
}

interface News {
    id: number;
    headline: string;
    summary: string;
    url: string;
    image: string;
    datetime: number;
    source: string;
}

interface SearchResult {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
}

export default function Dashboard() {
    const [symbol, setSymbol] = useState('AAPL');
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ... data states (quote, profile, news, loading, error) ...
    const [quote, setQuote] = useState<Quote | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchInput.length > 0) {
                try {
                    const res = await fetch(`/api/search?q=${searchInput}`);
                    const data = await res.json();
                    if (data.result) {
                        // Filter out dots to avoid potential errors with foreign exchanges if desired, or keep all
                        setSuggestions(data.result.slice(0, 8));
                        setShowSuggestions(true);
                    }
                } catch (e) {
                    // Silent fail for suggestions
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchData = async (sym: string) => {
        setLoading(true);
        setError('');
        setShowSuggestions(false); // Hide suggestions on search
        try {
            const [quoteRes, profileRes, newsRes] = await Promise.all([
                fetch(`/api/quote?symbol=${sym}`),
                fetch(`/api/profile?symbol=${sym}`),
                fetch(`/api/news?symbol=${sym}`)
            ]);

            if (!quoteRes.ok || !profileRes.ok || !newsRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const quoteData = await quoteRes.json();
            const profileData = await profileRes.json();
            const newsData = await newsRes.json();

            if (quoteData.error) throw new Error(quoteData.error);
            if (quoteData.c === 0) throw new Error('Symbol not found');

            setQuote(quoteData);
            setProfile(profileData);
            setNews(Array.isArray(newsData) ? newsData : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(symbol);
    }, [symbol]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setSymbol(searchInput.toUpperCase());
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (sym: string) => {
        setSymbol(sym);
        setSearchInput(sym);
        setShowSuggestions(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.logo}>Finnhub<span className={styles.logoAccent}>Interface</span></h1>
                <div className={styles.searchContainer}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            // Blur handling needs care to not hide before click processes. 
                            // Using a timeout is a simple hack, or use clicking outside logic.
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Search Symbol (e.g., TSLA)"
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchButton}>Search</button>
                    </form>
                    {showSuggestions && suggestions.length > 0 && (
                        <div className={styles.suggestionsList}>
                            {suggestions.map((item) => (
                                <div
                                    key={item.symbol}
                                    className={styles.suggestionItem}
                                    onClick={() => handleSelectSuggestion(item.symbol)}
                                >
                                    <span className={styles.suggestionSymbol}>{item.displaySymbol}</span>
                                    <span className={styles.suggestionName}>{item.description}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {error && <div className={styles.error}>{error}</div>}
            {loading && <div className={styles.loading}>Loading market data...</div>}

            {!loading && !error && quote && (
                <main className={styles.main}>
                    <div className={styles.hero}>
                        {profile?.logo && <img src={profile.logo} alt={profile.name} className={styles.companyLogo} />}
                        <div className={styles.priceContainer}>
                            <h2 className={styles.ticker}>{symbol}</h2>
                            <div className={styles.price}>${(quote.c || 0).toFixed(2)}</div>
                            <div className={`${styles.change} ${(quote.d || 0) >= 0 ? styles.up : styles.down}`}>
                                {(quote.d || 0) >= 0 ? '+' : ''}{(quote.d || 0).toFixed(2)} ({(quote.dp || 0).toFixed(2)}%)
                            </div>
                        </div>
                        <div className={styles.companyInfo}>
                            <h3>{profile?.name}</h3>
                            <p>{profile?.finnhubIndustry}</p>
                            <a href={profile?.weburl} target="_blank" rel="noopener noreferrer" className={styles.link}>Website</a>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.newsSection}>
                            <h3>Latest News</h3>
                            <div className={styles.newsGrid}>
                                {news.slice(0, 6).map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={styles.newsCard}>
                                        {item.image && <img src={item.image} alt={item.headline} className={styles.newsImage} />}
                                        <div className={styles.newsContent}>
                                            <h4>{item.headline}</h4>
                                            <span className={styles.source}>{item.source} • {new Date(item.datetime * 1000).toLocaleDateString()}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}
