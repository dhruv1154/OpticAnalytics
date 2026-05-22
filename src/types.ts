import { OptionType, ModelType, OptionLeg } from './utils/optionsEngine';

export interface MarketTicker {
  symbol: string;
  name: string;
  basePrice: number;
  impliedVol: number; // e.g. 0.184
  volPercentile: number; // e.g. 34
  dailyChange: number; // e.g. 1.24
  dailyChangePercent: number; // e.g. 0.71
  category: "indian-indices" | "indian-stocks" | "global-indices" | "global-stocks";
  currency: "INR" | "USD" | "GBP" | "HKD" | "JPY" | "EUR" | "SAR" | "KRW" | "CHF" | "CNY";
}

export const SUPPORTED_TICKERS: MarketTicker[] = [
  // --- INDIAN INDICES ---
  {
    symbol: "NIFTY50",
    name: "Nifty50 Index (^NSEI)",
    basePrice: 22450.00,
    impliedVol: 0.124,
    volPercentile: 26,
    dailyChange: 82.50,
    dailyChangePercent: 0.37,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "NIFTYBANK",
    name: "Nifty Bank Index (^NSEBANK)",
    basePrice: 48120.00,
    impliedVol: 0.142,
    volPercentile: 30,
    dailyChange: 310.20,
    dailyChangePercent: 0.65,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "SENSEX",
    name: "BSE Sensex Index (^BSEN)",
    basePrice: 73950.00,
    impliedVol: 0.126,
    volPercentile: 25,
    dailyChange: 290.40,
    dailyChangePercent: 0.39,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "NIFTY_IT",
    name: "Nifty IT Index (^CNXIT)",
    basePrice: 33450.00,
    impliedVol: 0.155,
    volPercentile: 28,
    dailyChange: 210.50,
    dailyChangePercent: 0.63,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "NIFTY_PHARMA",
    name: "Nifty Pharma Index (^CNXPHARMA)",
    basePrice: 18900.00,
    impliedVol: 0.135,
    volPercentile: 22,
    dailyChange: -45.20,
    dailyChangePercent: -0.24,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "NIFTY_MIDCAP_100",
    name: "Nifty Midcap 100 Index (^NIFTYMDCP100)",
    basePrice: 51600.00,
    impliedVol: 0.162,
    volPercentile: 35,
    dailyChange: 420.10,
    dailyChangePercent: 0.82,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "NIFTY_SMALLCAP_100",
    name: "Nifty Smallcap 100 Index (^NIFTYSMCP100)",
    basePrice: 16400.00,
    impliedVol: 0.185,
    volPercentile: 40,
    dailyChange: 185.30,
    dailyChangePercent: 1.14,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "BSE_100",
    name: "BSE 100 Index (^BSE100)",
    basePrice: 23150.00,
    impliedVol: 0.128,
    volPercentile: 26,
    dailyChange: 94.10,
    dailyChangePercent: 0.41,
    category: "indian-indices",
    currency: "INR"
  },
  {
    symbol: "NIFTY_NEXT_50",
    name: "Nifty Next 50 Index (^NIFTYNXT50)",
    basePrice: 62800.00,
    impliedVol: 0.148,
    volPercentile: 31,
    dailyChange: 155.40,
    dailyChangePercent: 0.25,
    category: "indian-indices",
    currency: "INR"
  },
  // --- INDIAN STOCKS ---
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    basePrice: 2950.00,
    impliedVol: 0.165,
    volPercentile: 44,
    dailyChange: -18.20,
    dailyChangePercent: -0.61,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd",
    basePrice: 3850.00,
    impliedVol: 0.148,
    volPercentile: 32,
    dailyChange: 42.10,
    dailyChangePercent: 1.10,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    basePrice: 1550.00,
    impliedVol: 0.172,
    volPercentile: 38,
    dailyChange: 11.45,
    dailyChangePercent: 0.74,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd",
    basePrice: 1450.00,
    impliedVol: 0.195,
    volPercentile: 40,
    dailyChange: 8.50,
    dailyChangePercent: 0.59,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd",
    basePrice: 1120.00,
    impliedVol: 0.168,
    volPercentile: 35,
    dailyChange: -5.40,
    dailyChangePercent: -0.48,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    basePrice: 810.00,
    impliedVol: 0.224,
    volPercentile: 51,
    dailyChange: 14.80,
    dailyChangePercent: 1.86,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Ltd",
    basePrice: 1390.00,
    impliedVol: 0.185,
    volPercentile: 36,
    dailyChange: 3.20,
    dailyChangePercent: 0.23,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "ITC",
    name: "ITC Ltd",
    basePrice: 435.00,
    impliedVol: 0.154,
    volPercentile: 22,
    dailyChange: -2.10,
    dailyChangePercent: -0.48,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "HCLTECH",
    name: "HCL Technologies Ltd",
    basePrice: 1320.00,
    impliedVol: 0.175,
    volPercentile: 33,
    dailyChange: 8.40,
    dailyChangePercent: 0.64,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance Ltd",
    basePrice: 6850.00,
    impliedVol: 0.220,
    volPercentile: 45,
    dailyChange: -55.30,
    dailyChangePercent: -0.80,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "ASIANPAINT",
    name: "Asian Paints Ltd",
    basePrice: 2850.00,
    impliedVol: 0.165,
    volPercentile: 29,
    dailyChange: 14.20,
    dailyChangePercent: 0.50,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "TECHM",
    name: "Tech Mahindra Ltd",
    basePrice: 1280.00,
    impliedVol: 0.198,
    volPercentile: 38,
    dailyChange: -12.50,
    dailyChangePercent: -0.97,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank Ltd",
    basePrice: 1720.00,
    impliedVol: 0.182,
    volPercentile: 37,
    dailyChange: 5.10,
    dailyChangePercent: 0.30,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Ltd",
    basePrice: 3450.00,
    impliedVol: 0.178,
    volPercentile: 41,
    dailyChange: 25.40,
    dailyChangePercent: 0.74,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "ONGC",
    name: "Oil & Natural Gas Corporation Ltd",
    basePrice: 275.00,
    impliedVol: 0.245,
    volPercentile: 55,
    dailyChange: 3.80,
    dailyChangePercent: 1.40,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "NESTLEIND",
    name: "Nestle India Ltd",
    basePrice: 2500.00,
    impliedVol: 0.155,
    volPercentile: 25,
    dailyChange: -15.40,
    dailyChangePercent: -0.61,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "TATASTEEL",
    name: "Tata Steel Ltd",
    basePrice: 165.00,
    impliedVol: 0.222,
    volPercentile: 48,
    dailyChange: 1.85,
    dailyChangePercent: 1.13,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "TATACONSUM",
    name: "Tata Consumer Products Ltd",
    basePrice: 1120.00,
    impliedVol: 0.168,
    volPercentile: 28,
    dailyChange: 4.50,
    dailyChangePercent: 0.40,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever Ltd",
    basePrice: 2350.00,
    impliedVol: 0.160,
    volPercentile: 32,
    dailyChange: -22.10,
    dailyChangePercent: -0.93,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank Ltd",
    basePrice: 1150.00,
    impliedVol: 0.188,
    volPercentile: 39,
    dailyChange: -8.30,
    dailyChangePercent: -0.72,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "ADANIENT",
    name: "Adani Enterprises Ltd",
    basePrice: 3120.00,
    impliedVol: 0.385,
    volPercentile: 65,
    dailyChange: 42.10,
    dailyChangePercent: 1.37,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "BRITANNIA",
    name: "Britannia Industries Ltd",
    basePrice: 5120.00,
    impliedVol: 0.162,
    volPercentile: 27,
    dailyChange: 12.40,
    dailyChangePercent: 0.24,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical Industries Ltd",
    basePrice: 1520.00,
    impliedVol: 0.175,
    volPercentile: 28,
    dailyChange: -12.40,
    dailyChangePercent: -0.81,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Ltd",
    basePrice: 12100.00,
    impliedVol: 0.192,
    volPercentile: 34,
    dailyChange: 145.00,
    dailyChangePercent: 1.21,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "NTPC",
    name: "NTPC Ltd",
    basePrice: 360.00,
    impliedVol: 0.224,
    volPercentile: 45,
    dailyChange: 8.40,
    dailyChangePercent: 2.39,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd",
    basePrice: 950.00,
    impliedVol: 0.245,
    volPercentile: 48,
    dailyChange: 12.50,
    dailyChangePercent: 1.33,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "WIPRO",
    name: "Wipro Ltd",
    basePrice: 460.00,
    impliedVol: 0.198,
    volPercentile: 37,
    dailyChange: -3.40,
    dailyChangePercent: -0.73,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "COALINDIA",
    name: "Coal India Ltd",
    basePrice: 480.00,
    impliedVol: 0.235,
    volPercentile: 49,
    dailyChange: 5.20,
    dailyChangePercent: 1.10,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "VBL",
    name: "Varun Beverages Ltd",
    basePrice: 1520.00,
    impliedVol: 0.211,
    volPercentile: 39,
    dailyChange: 18.50,
    dailyChangePercent: 1.23,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "MCDOWELL_N",
    name: "United Spirits Ltd",
    basePrice: 1200.00,
    impliedVol: 0.184,
    volPercentile: 31,
    dailyChange: -8.50,
    dailyChangePercent: -0.70,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "LTIM",
    name: "LTIMindtree Ltd",
    basePrice: 4750.00,
    impliedVol: 0.225,
    volPercentile: 41,
    dailyChange: 45.00,
    dailyChangePercent: 0.96,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "GET_D",
    name: "GE Vernova T&D India",
    basePrice: 980.00,
    impliedVol: 0.315,
    volPercentile: 52,
    dailyChange: 14.50,
    dailyChangePercent: 1.50,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "TATACOMM",
    name: "Tata Communications Ltd",
    basePrice: 1780.00,
    impliedVol: 0.208,
    volPercentile: 36,
    dailyChange: 22.00,
    dailyChangePercent: 1.25,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "SIEMENS",
    name: "Siemens Energy India",
    basePrice: 6450.00,
    impliedVol: 0.215,
    volPercentile: 42,
    dailyChange: -35.00,
    dailyChangePercent: -0.54,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "PCBL",
    name: "PCBL Chemical Ltd",
    basePrice: 260.00,
    impliedVol: 0.285,
    volPercentile: 46,
    dailyChange: 3.00,
    dailyChangePercent: 1.17,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "MUTHOOTFIN",
    name: "Muthoot Finance Ltd",
    basePrice: 1650.00,
    impliedVol: 0.212,
    volPercentile: 35,
    dailyChange: 11.20,
    dailyChangePercent: 0.68,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "CUMMINSIND",
    name: "Cummins India Ltd",
    basePrice: 3250.00,
    impliedVol: 0.232,
    volPercentile: 44,
    dailyChange: 45.50,
    dailyChangePercent: 1.42,
    category: "indian-stocks",
    currency: "INR"
  },
  {
    symbol: "UNIONBANK",
    name: "Union Bank of India",
    basePrice: 140.00,
    impliedVol: 0.265,
    volPercentile: 49,
    dailyChange: -1.50,
    dailyChangePercent: -1.06,
    category: "indian-stocks",
    currency: "INR"
  },
  // --- GLOBAL INDICES ---
  {
    symbol: "S&P500",
    name: "S&P 500 Index (^GSPC)",
    basePrice: 5150.00,
    impliedVol: 0.128,
    volPercentile: 19,
    dailyChange: 23.00,
    dailyChangePercent: 0.45,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "NASDAQ",
    name: "Nasdaq-100 Index (^NDX)",
    basePrice: 18200.00,
    impliedVol: 0.154,
    volPercentile: 24,
    dailyChange: 142.30,
    dailyChangePercent: 0.79,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "FTSE",
    name: "FTSE 100 Index (^FTSE)",
    basePrice: 8420.00,
    impliedVol: 0.115,
    volPercentile: 15,
    dailyChange: -34.50,
    dailyChangePercent: -0.41,
    category: "global-indices",
    currency: "GBP"
  },
  {
    symbol: "HANGSENG",
    name: "Hang Seng Index (^HSI)",
    basePrice: 19120.00,
    impliedVol: 0.218,
    volPercentile: 46,
    dailyChange: 215.10,
    dailyChangePercent: 1.14,
    category: "global-indices",
    currency: "HKD"
  },
  {
    symbol: "NIKKEI225",
    name: "Nikkei 225 (^N225)",
    basePrice: 38650.00,
    impliedVol: 0.198,
    volPercentile: 42,
    dailyChange: 450.00,
    dailyChangePercent: 1.18,
    category: "global-indices",
    currency: "JPY"
  },
  {
    symbol: "DOW_JONES",
    name: "Dow Jones Industrial Average (^DJI)",
    basePrice: 39850.00,
    impliedVol: 0.125,
    volPercentile: 18,
    dailyChange: 134.20,
    dailyChangePercent: 0.34,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "DAX",
    name: "DAX Performance Index (^GDAXI)",
    basePrice: 18700.00,
    impliedVol: 0.135,
    volPercentile: 20,
    dailyChange: 85.40,
    dailyChangePercent: 0.46,
    category: "global-indices",
    currency: "EUR"
  },
  {
    symbol: "CAC_40",
    name: "CAC 40 Index (^FCHI)",
    basePrice: 8150.00,
    impliedVol: 0.142,
    volPercentile: 22,
    dailyChange: -24.50,
    dailyChangePercent: -0.30,
    category: "global-indices",
    currency: "EUR"
  },
  {
    symbol: "IBEX_35",
    name: "IBEX 35 Index (^IBEX)",
    basePrice: 11300.00,
    impliedVol: 0.150,
    volPercentile: 23,
    dailyChange: 62.10,
    dailyChangePercent: 0.55,
    category: "global-indices",
    currency: "EUR"
  },
  {
    symbol: "EURO_STOXX_50",
    name: "EURO STOXX 50 (^STOXX50E)",
    basePrice: 5050.00,
    impliedVol: 0.138,
    volPercentile: 19,
    dailyChange: 12.50,
    dailyChangePercent: 0.25,
    category: "global-indices",
    currency: "EUR"
  },
  {
    symbol: "SSE_COMPOSITE",
    name: "Shanghai Composite Index (000001.SS)",
    basePrice: 3150.00,
    impliedVol: 0.175,
    volPercentile: 32,
    dailyChange: -15.20,
    dailyChangePercent: -0.48,
    category: "global-indices",
    currency: "HKD"
  },
  {
    symbol: "TSX_COMPOSITE",
    name: "S&P/TSX Composite Index (^GSPTSE)",
    basePrice: 22300.00,
    impliedVol: 0.122,
    volPercentile: 17,
    dailyChange: 110.50,
    dailyChangePercent: 0.50,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "MSCI_WORLD",
    name: "MSCI World Index (^MSWLD)",
    basePrice: 3420.00,
    impliedVol: 0.118,
    volPercentile: 15,
    dailyChange: 18.40,
    dailyChangePercent: 0.54,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "SP_GLOBAL_100",
    name: "S&P Global 100 Index (^SPG100)",
    basePrice: 3180.00,
    impliedVol: 0.120,
    volPercentile: 16,
    dailyChange: 14.20,
    dailyChangePercent: 0.45,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "DJ_TITANS_50",
    name: "Dow Jones Global Titans 50 (^DJGT50)",
    basePrice: 480.00,
    impliedVol: 0.124,
    volPercentile: 17,
    dailyChange: 2.40,
    dailyChangePercent: 0.50,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "FTSE_ALL_WORLD",
    name: "FTSE All-World Index (^FTWLD)",
    basePrice: 520.00,
    impliedVol: 0.116,
    volPercentile: 14,
    dailyChange: 2.85,
    dailyChangePercent: 0.55,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "OTCQX_30",
    name: "OTCQX ADR 30 Index (^OTCQX30)",
    basePrice: 1650.00,
    impliedVol: 0.145,
    volPercentile: 24,
    dailyChange: -12.30,
    dailyChangePercent: -0.74,
    category: "global-indices",
    currency: "USD"
  },
  {
    symbol: "GLOBAL_DOW",
    name: "The Global Dow (^GDOW)",
    basePrice: 4580.00,
    impliedVol: 0.121,
    volPercentile: 16,
    dailyChange: 18.90,
    dailyChangePercent: 0.41,
    category: "global-indices",
    currency: "USD"
  },
  // --- GLOBAL STOCKS ---
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    basePrice: 174.79,
    impliedVol: 0.184,
    volPercentile: 34,
    dailyChange: 1.24,
    dailyChangePercent: 0.71,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    basePrice: 420.10,
    impliedVol: 0.156,
    volPercentile: 28,
    dailyChange: -3.42,
    dailyChangePercent: -0.81,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    basePrice: 180.50,
    impliedVol: 0.482,
    volPercentile: 57,
    dailyChange: -4.12,
    dailyChangePercent: -2.23,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    basePrice: 900.20,
    impliedVol: 0.554,
    volPercentile: 82,
    dailyChange: 14.50,
    dailyChangePercent: 1.63,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    basePrice: 185.20,
    impliedVol: 0.198,
    volPercentile: 35,
    dailyChange: 2.15,
    dailyChangePercent: 1.17,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc. (Google)",
    basePrice: 172.50,
    impliedVol: 0.189,
    volPercentile: 31,
    dailyChange: -0.85,
    dailyChangePercent: -0.49,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "AVGO",
    name: "Broadcom Inc.",
    basePrice: 1420.00,
    impliedVol: 0.285,
    volPercentile: 42,
    dailyChange: 11.20,
    dailyChangePercent: 0.79,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "TSM",
    name: "Taiwan Semiconductor Mfg. Co.",
    basePrice: 153.50,
    impliedVol: 0.312,
    volPercentile: 52,
    dailyChange: 2.10,
    dailyChangePercent: 1.39,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "ARAMCO",
    name: "Saudi Arabian Oil Co.",
    basePrice: 29.80,
    impliedVol: 0.138,
    volPercentile: 18,
    dailyChange: -0.15,
    dailyChangePercent: -0.50,
    category: "global-stocks",
    currency: "SAR"
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    basePrice: 472.20,
    impliedVol: 0.235,
    volPercentile: 35,
    dailyChange: -5.40,
    dailyChangePercent: -1.13,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "SAMSUNG",
    name: "Samsung Electronics Co., Ltd.",
    basePrice: 77800.00,
    impliedVol: 0.218,
    volPercentile: 30,
    dailyChange: 350.00,
    dailyChangePercent: 0.45,
    category: "global-stocks",
    currency: "KRW"
  },
  {
    symbol: "WMT",
    name: "Walmart Inc.",
    basePrice: 62.40,
    impliedVol: 0.142,
    volPercentile: 16,
    dailyChange: 0.35,
    dailyChangePercent: 0.56,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "BRK-B",
    name: "Berkshire Hathaway Inc.",
    basePrice: 408.50,
    impliedVol: 0.128,
    volPercentile: 14,
    dailyChange: -1.80,
    dailyChangePercent: -0.44,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "LLY",
    name: "Eli Lilly and Company",
    basePrice: 785.20,
    impliedVol: 0.264,
    volPercentile: 49,
    dailyChange: 18.50,
    dailyChangePercent: 2.41,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    basePrice: 198.40,
    impliedVol: 0.158,
    volPercentile: 24,
    dailyChange: 0.95,
    dailyChangePercent: 0.48,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "SKHYNIX",
    name: "SK hynix Inc.",
    basePrice: 190000.00,
    impliedVol: 0.325,
    volPercentile: 46,
    dailyChange: 3500.00,
    dailyChangePercent: 1.88,
    category: "global-stocks",
    currency: "KRW"
  },
  {
    symbol: "ASML",
    name: "ASML Holding N.V.",
    basePrice: 945.00,
    impliedVol: 0.285,
    volPercentile: 38,
    dailyChange: 12.40,
    dailyChangePercent: 1.33,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "TENCENT",
    name: "Tencent Holdings Limited",
    basePrice: 382.40,
    impliedVol: 0.265,
    volPercentile: 35,
    dailyChange: 5.60,
    dailyChangePercent: 1.49,
    category: "global-stocks",
    currency: "HKD"
  },
  {
    symbol: "ICBC",
    name: "Industrial & Commercial Bank of China",
    basePrice: 4.45,
    impliedVol: 0.185,
    volPercentile: 22,
    dailyChange: 0.06,
    dailyChangePercent: 1.37,
    category: "global-stocks",
    currency: "HKD"
  },
  {
    symbol: "ABC_CHINA",
    name: "Agricultural Bank of China",
    basePrice: 3.52,
    impliedVol: 0.192,
    volPercentile: 24,
    dailyChange: 0.04,
    dailyChangePercent: 1.15,
    category: "global-stocks",
    currency: "HKD"
  },
  {
    symbol: "ROCHE",
    name: "Roche Holding AG",
    basePrice: 245.80,
    impliedVol: 0.165,
    volPercentile: 20,
    dailyChange: 1.20,
    dailyChangePercent: 0.49,
    category: "global-stocks",
    currency: "CHF"
  },
  {
    symbol: "ALIBABA",
    name: "Alibaba Group Holding Ltd.",
    basePrice: 83.20,
    impliedVol: 0.292,
    volPercentile: 41,
    dailyChange: 1.45,
    dailyChangePercent: 1.77,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "HSBC",
    name: "HSBC Holdings plc",
    basePrice: 44.80,
    impliedVol: 0.162,
    volPercentile: 21,
    dailyChange: 0.32,
    dailyChangePercent: 0.72,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "PETROCHINA",
    name: "PetroChina Co. Ltd.",
    basePrice: 7.28,
    impliedVol: 0.285,
    volPercentile: 39,
    dailyChange: 0.12,
    dailyChangePercent: 1.68,
    category: "global-stocks",
    currency: "HKD"
  },
  {
    symbol: "CCB",
    name: "China Construction Bank Corp.",
    basePrice: 5.34,
    impliedVol: 0.178,
    volPercentile: 23,
    dailyChange: 0.05,
    dailyChangePercent: 0.94,
    category: "global-stocks",
    currency: "HKD"
  },
  {
    symbol: "CATL",
    name: "Contemporary Amperex Technology Co., Ltd.",
    basePrice: 202.50,
    impliedVol: 0.342,
    volPercentile: 51,
    dailyChange: -3.20,
    dailyChangePercent: -1.56,
    category: "global-stocks",
    currency: "CNY"
  },
  {
    symbol: "ASTRAZENECA",
    name: "AstraZeneca plc",
    basePrice: 122.50,
    impliedVol: 0.184,
    volPercentile: 24,
    dailyChange: 1.10,
    dailyChangePercent: 0.91,
    category: "global-stocks",
    currency: "USD"
  },
  {
    symbol: "NOVARTIS",
    name: "Novartis AG",
    basePrice: 93.40,
    impliedVol: 0.168,
    volPercentile: 22,
    dailyChange: 0.45,
    dailyChangePercent: 0.48,
    category: "global-stocks",
    currency: "CHF"
  },
  {
    symbol: "LVMH",
    name: "LVMH Moët Hennessy Louis Vuitton",
    basePrice: 748.20,
    impliedVol: 0.224,
    volPercentile: 33,
    dailyChange: -8.40,
    dailyChangePercent: -1.11,
    category: "global-stocks",
    currency: "EUR"
  }
];

export interface TooltipExplanation {
  title: string;
  symbol: string;
  formula: string;
  desc: string;
  interpretation: string;
}

export const GREEKS_TOOLTIPS: { [key: string]: TooltipExplanation } = {
  price: {
    title: "Option Premium (Price)",
    symbol: "V",
    formula: "f(S, K, T, r, σ)",
    desc: "The fair theoretical value of the option contract as solved by the selected pricing model.",
    interpretation: "Higher spot/volatility results in higher Call value. Higher strike results in lower Call value."
  },
  delta: {
    title: "Delta",
    symbol: "Δ = ∂V / ∂S",
    formula: "N(d1) for Calls",
    desc: "The rate of change of the option's premium with respect to a change in the underlying asset's price.",
    interpretation: "A Delta of 0.54 means the option price will rise by ~$0.54 for every $1.00 increase in the spot stock price."
  },
  gamma: {
    title: "Gamma",
    symbol: "Γ = ∂²V / ∂S²",
    formula: "n(d1) / (S * σ * √T)",
    desc: "The rate of change in Delta per dollar change in the underlying stock price.",
    interpretation: "Peak gamma occurs 'At-the-Money' (ATM). High Gamma means Delta is highly sensitive to price action (violent rehedging risk)."
  },
  theta: {
    title: "Theta (Time Decay)",
    symbol: "Θ = ∂V / ∂t",
    formula: "[Annual Decay / 365.25]",
    desc: "The rate of change of the option premium with respect to the passage of time, holding everything else constant.",
    interpretation: "Theta is typically negative, showing how much premium is lost daily. Value bleeds aggressively as expiration approaches."
  },
  vega: {
    title: "Vega (Volatility Sensitivity)",
    symbol: "ν = ∂V / ∂σ",
    formula: "(S * n(d1) * √T) / 100",
    desc: "The dollar sensitivity of the option price to a 1% absolute change in the Implied Volatility (IV).",
    interpretation: "A Vega of 0.18 means the option price will gain/lose $0.18 if Implied Volatility expands or collapses by 1%."
  },
  rho: {
    title: "Rho (Interest Rate Sensitivity)",
    symbol: "ρ = ∂V / ∂r",
    formula: "(K * T * e^-rT * N(d2)) / 100",
    desc: "The sensitivity of the option's value to change in the risk-free interest rate by 1%.",
    interpretation: "Typically of minor significance for near-term retail options, but critical for long-term equity anticipation securities (LEAPS)."
  },
  vanna: {
    title: "Vanna (Cross Vol Sensitivity)",
    symbol: "∂²V / (∂S ∂σ)",
    formula: "dDelta / dSigma (scaled to 1%)",
    desc: "Represents the change in Option Delta per 1% absolute change in Implied Volatility.",
    interpretation: "Crucial for delta-hedgers. High Vanna means vol collapses automatically reduce or expand absolute position exposure."
  },
  volga: {
    title: "Volga / Vomma (Vol Acceleration)",
    symbol: "∂²V / ∂σ²",
    formula: "dVega / dSigma",
    desc: "The second-order volatility sensitivity. Shows the speed at which Vega changes as Implied Volatility moves.",
    interpretation: "Buying Out-of-the-Money option legs gains cheap Volga, which values volatility expansions exponentially."
  },
  charm: {
    title: "Charm / Delta Bleed",
    symbol: "∂Δ / ∂t",
    formula: "Delta decay per day",
    desc: "Shows the rate at which Option Delta decays or bleeds each day as time marches toward expiration.",
    interpretation: "An At-the-Money option's delta moves towards 0.50 (for Calls) or -0.50 (for Puts) as time ticks, while OTM bleeds to 0.0."
  }
};
