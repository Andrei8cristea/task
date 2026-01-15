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

export default function Dashboard() {
    const [symbol, setSymbol] = useState('AAPL');
    const [searchInput, setSearchInput] = useState('');
    const [quote, setQuote] = useState<Quote | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async (sym: string) => {
        setLoading(true);
        setError('');
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

            setQuote(quoteData);
            setProfile(profileData);
            setNews(Array.isArray(newsData) ? newsData : []); // Company news is array, general news has data prop but here we use company news mostly
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
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.logo}>Finnhub<span className={styles.logoAccent}>Interface</span></h1>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search Symbol (e.g., TSLA)"
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton}>Search</button>
                </form>
            </header>

            {error && <div className={styles.error}>{error}</div>}
            {loading && <div className={styles.loading}>Loading market data...</div>}

            {!loading && !error && quote && (
                <main className={styles.main}>
                    <div className={styles.hero}>
                        {profile?.logo && <img src={profile.logo} alt={profile.name} className={styles.companyLogo} />}
                        <div className={styles.priceContainer}>
                            <h2 className={styles.ticker}>{symbol}</h2>
                            <div className={styles.price}>${quote.c.toFixed(2)}</div>
                            <div className={`${styles.change} ${quote.d >= 0 ? styles.up : styles.down}`}>
                                {quote.d >= 0 ? '+' : ''}{quote.d.toFixed(2)} ({quote.dp.toFixed(2)}%)
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
