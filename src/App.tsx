import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Plus, 
  Trash, 
  RefreshCw, 
  Sliders, 
  Calendar, 
  DollarSign, 
  LineChart, 
  Activity, 
  Layers, 
  Table, 
  Compass, 
  BookOpen, 
  ChevronRight,
  FileText,
  Search,
  Sparkles,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart as ReLineChart, 
  Line, 
  ReferenceLine, 
  Legend
} from 'recharts';

import { 
  calculateOptions, 
  calculateStrategyGreeks, 
  generateStrategyPayoff, 
  priceMonteCarlo, 
  solveImpliedVolatility,
  ModelType, 
  OptionType, 
  OptionLeg 
} from './utils/optionsEngine';

import { 
  SUPPORTED_TICKERS, 
  GREEKS_TOOLTIPS, 
  MarketTicker 
} from './types';

import ThreeDVolSurface from './components/ThreeDVolSurface';

export default function App() {
  // 1. Core State
  const [tickers, setTickers] = useState<MarketTicker[]>(SUPPORTED_TICKERS);
  const [selectedTicker, setSelectedTicker] = useState<MarketTicker>(SUPPORTED_TICKERS[0]);
  const [apiStatus, setApiStatus] = useState<'loading' | 'live' | 'fallback' | 'idle'>('idle');
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

  const YAHOO_SYMBOL_MAP: Record<string, string> = useMemo(() => ({
    NIFTY50: "^NSEI",
    NIFTYBANK: "^NSEBANK",
    SENSEX: "^BSEN",
    NIFTY_IT: "^CNXIT",
    NIFTY_PHARMA: "^CNXPHARMA",
    NIFTY_MIDCAP_100: "^NIFTYMDCP100",
    NIFTY_SMALLCAP_100: "^NIFTYSMCP100",
    BSE_100: "^BSE100",
    NIFTY_NEXT_50: "^NIFTYNXT50",
    RELIANCE: "RELIANCE.NS",
    TCS: "TCS.NS",
    HDFCBANK: "HDFCBANK.NS",
    INFY: "INFY.NS",
    ICICIBANK: "ICICIBANK.NS",
    SBIN: "SBIN.NS",
    BHARTIARTL: "BHARTIARTL.NS",
    ITC: "ITC.NS",
    HCLTECH: "HCLTECH.NS",
    BAJFINANCE: "BAJFINANCE.NS",
    ASIANPAINT: "ASIANPAINT.NS",
    TECHM: "TECHM.NS",
    KOTAKBANK: "KOTAKBANK.NS",
    LT: "LT.NS",
    ONGC: "ONGC.NS",
    NESTLEIND: "NESTLEIND.NS",
    TATASTEEL: "TATASTEEL.NS",
    TATACONSUM: "TATACONSUM.NS",
    HINDUNILVR: "HINDUNILVR.NS",
    AXISBANK: "AXISBANK.NS",
    ADANIENT: "ADANIENT.NS",
    BRITANNIA: "BRITANNIA.NS",
    SUNPHARMA: "SUNPHARMA.NS",
    MARUTI: "MARUTI.NS",
    NTPC: "NTPC.NS",
    TATAMOTORS: "TATAMOTORS.NS",
    WIPRO: "WIPRO.NS",
    COALINDIA: "COALINDIA.NS",
    VBL: "VBL.NS",
    MCDOWELL_N: "MCDOWELL-N.NS",
    LTIM: "LTIM.NS",
    GET_D: "GET&D.NS",
    TATACOMM: "TATACOMM.NS",
    SIEMENS: "SIEMENS.NS",
    PCBL: "PCBL.NS",
    MUTHOOTFIN: "MUTHOOTFIN.NS",
    CUMMINSIND: "CUMMINSIND.NS",
    UNIONBANK: "UNIONBANK.NS",
    "S&P500": "^GSPC",
    NASDAQ: "^NDX",
    FTSE: "^FTSE",
    HANGSENG: "^HSI",
    NIKKEI225: "^N225",
    DOW_JONES: "^DJI",
    DAX: "^GDAXI",
    CAC_40: "^FCHI",
    IBEX_35: "^IBEX",
    EURO_STOXX_50: "^STOXX50E",
    SSE_COMPOSITE: "000001.SS",
    TSX_COMPOSITE: "^GSPTSE",
    MSCI_WORLD: "^MSWLD",
    SP_GLOBAL_100: "^SPG100",
    DJ_TITANS_50: "^DJGT50",
    FTSE_ALL_WORLD: "^FTWLD",
    OTCQX_30: "^OTCQX30",
    GLOBAL_DOW: "^GDOW",
    AAPL: "AAPL",
    MSFT: "MSFT",
    TSLA: "TSLA",
    NVDA: "NVDA",
    AMZN: "AMZN",
    GOOGL: "GOOGL",
    AVGO: "AVGO",
    TSM: "TSM",
    ARAMCO: "2222.SR",
    META: "META",
    SAMSUNG: "005930.KS",
    WMT: "WMT",
    "BRK-B": "BRK-B",
    LLY: "LLY",
    JPM: "JPM",
    SKHYNIX: "000660.KS",
    ASML: "ASML",
    TENCENT: "0700.HK",
    ICBC: "1398.HK",
    ABC_CHINA: "1288.HK",
    ROCHE: "ROG.SW",
    ALIBABA: "BABA",
    HSBC: "HSBC",
    PETROCHINA: "0857.HK",
    CCB: "0939.HK",
    CATL: "300750.SZ",
    ASTRAZENECA: "AZN",
    NOVARTIS: "NOVN.SW",
    LVMH: "MC.PA"
  }), []);

  const fetchRealTimeQuotes = async () => {
    setApiStatus('loading');
    setApiError("");
    try {
      const resp = await fetch("/api/quotes");
      const data = await resp.json();
      if (data.success && data.quotes) {
        setTickers((prevTickers) => {
          return prevTickers.map((ticker) => {
            const yahooSymbol = YAHOO_SYMBOL_MAP[ticker.symbol];
            const quote = data.quotes[yahooSymbol];
            if (quote) {
              const currentIndiaVix = data.quotes["^INDIAVIX"]?.price || 14.5;
              const currentGlobalVix = data.quotes["^VIX"]?.price || 15.0;

              const isIndian = ticker.category.startsWith("indian");
              const vixRatio = isIndian 
                ? currentIndiaVix / 14.5 
                : currentGlobalVix / 15.0;
              
              const scaleFactor = Math.min(1.8, Math.max(0.6, vixRatio));
              
              const defaultBase = SUPPORTED_TICKERS.find((t) => t.symbol === ticker.symbol);
              const baseIv = defaultBase ? defaultBase.impliedVol : ticker.impliedVol;
              const liveIv = parseFloat((baseIv * scaleFactor).toFixed(4));
              
              const defaultPercentile = defaultBase ? defaultBase.volPercentile : ticker.volPercentile;
              const livePercentile = Math.min(95, Math.max(5, Math.round(defaultPercentile * scaleFactor)));

              return {
                ...ticker,
                basePrice: quote.price,
                dailyChange: quote.change,
                dailyChangePercent: quote.changePercent,
                impliedVol: liveIv,
                volPercentile: livePercentile
              };
            }
            return ticker;
          });
        });
        setApiStatus('live');
        setLastRefreshed(new Date().toLocaleTimeString());
      } else {
        throw new Error(data.error || "Failed API response structure");
      }
    } catch (err: any) {
      console.warn("Failed to fetch real-time quotes, falling back:", err);
      setApiError(err.message || String(err));
      setApiStatus('fallback');
      
      // Fallback: apply a small random micro-drift to keep numbers alive offline
      setTickers((prevTickers) => {
        return prevTickers.map((ticker) => {
          const drift = (Math.random() - 0.49) * (ticker.basePrice * 0.001);
          const nextPrice = parseFloat((ticker.basePrice + drift).toFixed(2));
          const diff = nextPrice - ticker.basePrice;
          
          return {
            ...ticker,
            basePrice: nextPrice,
            dailyChange: ticker.dailyChange + diff,
            dailyChangePercent: parseFloat(((ticker.dailyChange + diff) / ticker.basePrice * 100).toFixed(2))
          };
        });
      });
      if (!lastRefreshed) {
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    }
  };

  // Sync selectedTicker properties whenever tickers list updates
  useEffect(() => {
    const liveMatch = tickers.find((t) => t.symbol === selectedTicker.symbol);
    if (liveMatch) {
      setSelectedTicker({ ...liveMatch });
    }
  }, [tickers, selectedTicker.symbol]);

  // Initial fetch on load
  useEffect(() => {
    fetchRealTimeQuotes();
  }, []);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [tickerSearchQuery, setTickerSearchQuery] = useState<string>("");
  const filteredTickers = useMemo(() => {
    if (!tickerSearchQuery.trim()) return tickers;
    const query = tickerSearchQuery.toLowerCase().trim();
    return tickers.filter(t => 
      t.symbol.toLowerCase().includes(query) || 
      t.name.toLowerCase().includes(query)
    );
  }, [tickers, tickerSearchQuery]);
  const [model, setModel] = useState<ModelType>('BS');
  const [selectedExpiryDays, setSelectedExpiryDays] = useState<number>(30); // in days
  const [selectedStrikeIndex, setSelectedStrikeIndex] = useState<number>(5); // centered index
  const [selectedOptionType, setSelectedOptionType] = useState<OptionType>('Call');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  
  // Strike Range state for charts (80% to 120% of Spot)
  const [strikeRangeMin, setStrikeRangeMin] = useState<number>(150);
  const [strikeRangeMax, setStrikeRangeMax] = useState<number>(200);

  // Strategy Builder State
  const [strategyLegs, setStrategyLegs] = useState<OptionLeg[]>([
    { id: 'leg_1', type: 'Call', action: 'Buy', strike: 22450, quantity: 1 },
    { id: 'leg_2', type: 'Call', action: 'Sell', strike: 22550, quantity: 1 }
  ]);
  const [strategyPreset, setStrategyPreset] = useState<string>("Bull Call Spread");

  // Interactive Active View Tab
  const [activeTab, setActiveTab] = useState<'payoff' | 'monte-carlo' | 'smile' | 'chain' | 'surface'>('payoff');

  // Interactive Help and Hover Explanations state
  const [activeGreekInfo, setActiveGreekInfo] = useState<string>("delta");

  // Auto Refresh Countdown State
  const [countdown, setCountdown] = useState<number>(60);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  
  // Real-time micro price ticks simulation state
  const [simulatedPriceTick, setSimulatedPriceTick] = useState<number>(0);

  // Currency Converter engine state (USD, INR, EUR, GBP, JPY)
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY'>('INR');

  // Real-world institution standard cross exchange rates relative to USD
  const CURRENCY_RATES = useMemo(() => ({
    USD: 1.0,
    INR: 83.50,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 155.00,
    HKD: 7.81,
    SAR: 3.75,
    KRW: 1350.00,
    CHF: 0.91,
    CNY: 7.24
  }), []);

  const CURRENCY_SYMBOLS = useMemo(() => ({
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    HKD: "HK$",
    SAR: "SR ",
    KRW: "₩",
    CHF: "Fr ",
    CNY: "¥"
  }), []);

  // What-If stress simulation sliders state (Market crash/surge and Dynamic IV shocks)
  const [stressSpotShift, setStressSpotShift] = useState<number>(0); // as percentage -20% to +20%
  const [stressVolShift, setStressVolShift] = useState<number>(0);   // as percentage -15% to +15%

  // Normal Distribution Cumulative Density Function approximation (A&S 26.2.17)
  const normalCDF = (x: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.39894228 * Math.exp(-x * x / 2);
    const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x > 0 ? 1 - p : p;
  };

  // Convert an amount from ticker's base currency to selected currency
  const convertCurrency = (amount: number, fromCurr: 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'HKD' | 'SAR' | 'KRW' | 'CHF' | 'CNY') => {
    if (fromCurr === selectedCurrency) return amount;
    const usdVal = amount / (CURRENCY_RATES[fromCurr] || 1.0);
    return usdVal * (CURRENCY_RATES[selectedCurrency] || 1.0);
  };

  // Human-readable formatted currency expression
  const formatCurrencyValue = (amount: number, fromCurr: 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'HKD' | 'SAR' | 'KRW' | 'CHF' | 'CNY', decimals = 2) => {
    const converted = convertCurrency(amount, fromCurr);
    const symbol = CURRENCY_SYMBOLS[selectedCurrency] || "";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // Risk-Free standard rate
  const RISK_FREE_RATE = 0.0525; // 5.25%

  // Reference for active Spot Price (inclusive of Stress Test overlays)
  const activeSpotPriceBase = useMemo(() => {
    if (customPrice && !isNaN(parseFloat(customPrice))) {
      return parseFloat(customPrice);
    }
    return parseFloat((selectedTicker.basePrice + simulatedPriceTick).toFixed(2));
  }, [selectedTicker, simulatedPriceTick, customPrice]);

  const activeSpotPrice = useMemo(() => {
    // Add real-world spot price stress shift multiplier
    return parseFloat((activeSpotPriceBase * (1 + stressSpotShift / 100)).toFixed(2));
  }, [activeSpotPriceBase, stressSpotShift]);

  const activeImpliedVol = useMemo(() => {
    // Add active Implied Volatility stress shift
    return Math.max(0.01, parseFloat((selectedTicker.impliedVol + stressVolShift / 100).toFixed(4)));
  }, [selectedTicker.impliedVol, stressVolShift]);

  // Adjust strike slider range boundaries dynamically as asset price shifts
  useEffect(() => {
    const minS = Math.floor(activeSpotPrice * 0.85);
    const maxS = Math.ceil(activeSpotPrice * 1.15);
    
    let roundBase = 5;
    if (activeSpotPrice > 30000) roundBase = 100;
    else if (activeSpotPrice > 10000) roundBase = 50;
    else if (activeSpotPrice > 1000) roundBase = 10;

    setStrikeRangeMin(Math.round(minS / roundBase) * roundBase);
    setStrikeRangeMax(Math.round(maxS / roundBase) * roundBase);
    
    const initStrike = Math.round(activeSpotPrice / roundBase) * roundBase;
    const spreadOffset = roundBase * 2;
    setStrategyLegs([
      { id: 'leg_1', type: 'Call', action: 'Buy', strike: initStrike, quantity: 1 },
      { id: 'leg_2', type: 'Call', action: 'Sell', strike: initStrike + spreadOffset, quantity: 1 }
    ]);
    setStrategyPreset("Bull Call Spread");
    setCustomPrice(""); // Reset custom price override when changing active ticker
  }, [selectedTicker]);

  // Handle countdown Timer (Fetches live market data from server, and ticks stock price micro-pulses)
  useEffect(() => {
    let interval: any = null;
    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Trigger actual server API fetch for fresh live prices
            fetchRealTimeQuotes();
            // Reset simulation drift ticket
            setSimulatedPriceTick(0);
            return 60;
          }
          
          // Every 6 seconds, simulate a minor stock price variation to show live pulse indicator
          if (prev % 6 === 0) {
            setSimulatedPriceTick((tick) => {
              const pulseSize = selectedTicker.basePrice * 0.0003;
              const pulse = (Math.random() - 0.5) * pulseSize;
              return parseFloat((tick + pulse).toFixed(2));
            });
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, selectedTicker.basePrice]);

  const forceManualRefresh = () => {
    fetchRealTimeQuotes();
    setCountdown(60);
    setSimulatedPriceTick(0);
  };

  // Convert contract period into Years (decimal T)
  const T_years = useMemo(() => {
    return selectedExpiryDays / 365.25;
  }, [selectedExpiryDays]);

  // Dynamic strike choices centered near the live stock price
  const strikeOptions = useMemo(() => {
    let interval = 2.5;
    if (activeSpotPrice > 50000) {
      interval = 200;
    } else if (activeSpotPrice > 15000) {
      interval = 100;
    } else if (activeSpotPrice > 3000) {
      interval = 50;
    } else if (activeSpotPrice > 1000) {
      interval = 25;
    } else if (activeSpotPrice > 400) {
      interval = 10;
    } else if (activeSpotPrice > 100) {
      interval = 5;
    }
    const atmStrike = Math.round(activeSpotPrice / interval) * interval;
    const strikes: number[] = [];
    for (let i = -6; i <= 6; i++) {
      strikes.push(atmStrike + i * interval);
    }
    return strikes;
  }, [activeSpotPrice]);

  // Adjust default selected option strike index based on strikeOptions
  const focusedStrike = useMemo(() => {
    const idx = Math.max(0, Math.min(strikeOptions.length - 1, selectedStrikeIndex));
    return strikeOptions[idx] || activeSpotPrice;
  }, [strikeOptions, selectedStrikeIndex, activeSpotPrice]);

  // Update underlying legs when strategyPreset is updated
  const applyStrategyPreset = (presetName: string) => {
    let roundBase = 5;
    if (activeSpotPrice > 30000) roundBase = 100;
    else if (activeSpotPrice > 10000) roundBase = 50;
    else if (activeSpotPrice > 1000) roundBase = 25;
    else if (activeSpotPrice > 400) roundBase = 10;

    const atm = Math.round(activeSpotPrice / roundBase) * roundBase;
    const spreadStep = roundBase * 2;
    const wingStep = roundBase;
    let newLegs: OptionLeg[] = [];
    
    switch (presetName) {
      case "Single Call":
        newLegs = [
          { id: 'leg_1', type: 'Call', action: 'Buy', strike: atm, quantity: 1 }
        ];
        break;
      case "Single Put":
        newLegs = [
          { id: 'leg_1', type: 'Put', action: 'Buy', strike: atm, quantity: 1 }
        ];
        break;
      case "Bull Call Spread":
        newLegs = [
          { id: 'leg_1', type: 'Call', action: 'Buy', strike: atm, quantity: 1 },
          { id: 'leg_2', type: 'Call', action: 'Sell', strike: atm + spreadStep, quantity: 1 }
        ];
        break;
      case "Bear Put Spread":
        newLegs = [
          { id: 'leg_1', type: 'Put', action: 'Buy', strike: atm, quantity: 1 },
          { id: 'leg_2', type: 'Put', action: 'Sell', strike: atm - spreadStep, quantity: 1 }
        ];
        break;
      case "Straddle":
        newLegs = [
          { id: 'leg_1', type: 'Call', action: 'Buy', strike: atm, quantity: 1 },
          { id: 'leg_2', type: 'Put', action: 'Buy', strike: atm, quantity: 1 }
        ];
        break;
      case "Strangle":
        newLegs = [
          { id: 'leg_1', type: 'Put', action: 'Buy', strike: atm - wingStep, quantity: 1 },
          { id: 'leg_2', type: 'Call', action: 'Buy', strike: atm + wingStep, quantity: 1 }
        ];
        break;
      case "Iron Condor":
        newLegs = [
          { id: 'leg_1', type: 'Put', action: 'Buy', strike: atm - spreadStep, quantity: 1 },
          { id: 'leg_2', type: 'Put', action: 'Sell', strike: atm - wingStep, quantity: 1 },
          { id: 'leg_3', type: 'Call', action: 'Sell', strike: atm + wingStep, quantity: 1 },
          { id: 'leg_4', type: 'Call', action: 'Buy', strike: atm + spreadStep, quantity: 1 }
        ];
        break;
      case "Butterfly Spread":
        newLegs = [
          { id: 'leg_1', type: 'Call', action: 'Buy', strike: atm - wingStep, quantity: 1 },
          { id: 'leg_2', type: 'Call', action: 'Sell', strike: atm, quantity: 2 },
          { id: 'leg_3', type: 'Call', action: 'Buy', strike: atm + wingStep, quantity: 1 }
        ];
        break;
      default:
        return;
    }
    
    setStrategyLegs(newLegs);
    setStrategyPreset(presetName);
  };

  // Option Metrics for the single active sidebar contract selected
  const activeContractMetrics = useMemo(() => {
    return calculateOptions({
      S: activeSpotPrice,
      K: focusedStrike,
      T: T_years,
      r: RISK_FREE_RATE,
      sigma: activeImpliedVol,
      type: selectedOptionType
    }, model);
  }, [activeSpotPrice, focusedStrike, T_years, selectedOptionType, model, activeImpliedVol]);

  // Greeks & metrics of the total Strategy composite legs
  const strategyGreeks = useMemo(() => {
    return calculateStrategyGreeks(
      strategyLegs,
      activeSpotPrice,
      T_years,
      RISK_FREE_RATE,
      activeImpliedVol,
      model
    );
  }, [strategyLegs, activeSpotPrice, T_years, model, activeImpliedVol]);

  // Strategy Payoff array coordinates calculated for charting
  const payoffData = useMemo(() => {
    const minStrike = activeSpotPrice * 0.75;
    const maxStrike = activeSpotPrice * 1.25;
    return generateStrategyPayoff(
      strategyLegs,
      minStrike,
      maxStrike,
      80, // detailed steps for crisp curves
      T_years,
      RISK_FREE_RATE,
      activeImpliedVol,
      model
    );
  }, [strategyLegs, activeSpotPrice, T_years, model, activeImpliedVol]);

  // Converted payoff data formatted dynamically for charting
  const convertedPayoffData = useMemo(() => {
    return payoffData.map((d) => ({
      spotPrice: convertCurrency(d.spotPrice, selectedTicker.currency),
      expirationProfit: convertCurrency(d.expirationProfit, selectedTicker.currency),
      t0Profit: convertCurrency(d.t0Profit, selectedTicker.currency),
    }));
  }, [payoffData, selectedCurrency, selectedTicker.currency]);

  // Dynamic Option Chain Table Row list near ATM
  const optionChainRowData = useMemo(() => {
    const strikesChain = strikeOptions;
    return strikesChain.map(strike => {
      // Analytical Black Scholes for Chain table to maintain instant load times
      const callBS = calculateOptions({ S: activeSpotPrice, K: strike, T: T_years, r: RISK_FREE_RATE, sigma: activeImpliedVol, type: 'Call' }, 'BS');
      const putBS = calculateOptions({ S: activeSpotPrice, K: strike, T: T_years, r: RISK_FREE_RATE, sigma: activeImpliedVol, type: 'Put' }, 'BS');
      
      return {
        strike,
        callPrice: callBS.price,
        callDelta: callBS.delta,
        callBid: callBS.price * 0.98,
        callAsk: callBS.price * 1.02,
        callIV: activeImpliedVol + Math.pow(strike/activeSpotPrice - 1, 2) * 0.45, // Smile formulation
        callVol: Math.round(1500 * (1 - Math.abs(strike - activeSpotPrice)/activeSpotPrice)),
        
        putPrice: putBS.price,
        putDelta: putBS.delta,
        putBid: putBS.price * 0.98,
        putAsk: putBS.price * 1.02,
        putIV: activeImpliedVol + Math.pow(strike/activeSpotPrice - 1, 2) * 0.52,
        putVol: Math.round(1300 * (1 - Math.abs(strike - activeSpotPrice)/activeSpotPrice))
      };
    });
  }, [activeSpotPrice, T_years, activeImpliedVol, strikeOptions]);

  // Monte Carlo Simulated Stock Pathways coordinates
  const mcSimPaths = useMemo(() => {
    const sampleMC = priceMonteCarlo({
      S: activeSpotPrice,
      K: focusedStrike,
      T: T_years,
      r: RISK_FREE_RATE,
      sigma: activeImpliedVol,
      type: selectedOptionType
    }, 40, 40); // 40 steps, 40 paths

    // Map into Recharts series
    const stepArr = [];
    for (let step = 0; step <= 40; step++) {
      const stepRow: { [key: string]: number } = { step };
      sampleMC.paths.forEach((path, pathIdx) => {
        stepRow[`path_${pathIdx}`] = parseFloat(path[step]?.toFixed(2) || "0");
      });
      stepArr.push(stepRow);
    }
    return stepArr;
  }, [activeSpotPrice, focusedStrike, T_years, selectedOptionType, activeImpliedVol]);

  // Volatility Smile points charting coordinate
  const volSmileCoordinates = useMemo(() => {
    const currentSpot = activeSpotPrice;
    return strikeOptions.map(st => {
      // Quadrature skew curve to model IV smile curve
      const ratio = st / currentSpot;
      const skewValue = Math.pow(ratio - 1.0, 2) * 0.85;
      const smileIV = (activeImpliedVol + skewValue) * 100; // as percent
      return {
        strikePrice: st,
        impliedVol: parseFloat(smileIV.toFixed(2)),
        atmMarker: Math.abs(st - currentSpot) < 3 ? smileIV : null
      };
    });
  }, [strikeOptions, activeSpotPrice, activeImpliedVol]);

  // Volatility Term Structure lines (IV across Expiration dates)
  const volTermStructureCoordinates = useMemo(() => {
    const expirations = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360];
    return expirations.map(days => {
      const t = days / 365.25;
      // Term structure modeling: Base vol decreases slightly across medium, rises for seasonal (seasonal + square root decay)
      const seasonal = 0.015 * Math.sin(days / 60);
      const decay = -0.0125 * Math.sqrt(t);
      const finalIV = (activeImpliedVol + seasonal + decay) * 100;
      return {
        daysToMaturity: days,
        impliedVol: parseFloat(finalIV.toFixed(2))
      };
    });
  }, [activeImpliedVol]);

  // Advanced calculations: Probability of Profit (PoF) & Breakevens solver
  const strategyAnalytics = useMemo(() => {
    const S0 = activeSpotPrice;
    const T = T_years;
    const r = RISK_FREE_RATE;
    const sigma = activeImpliedVol;
    
    // Mean and standard deviation of lognormal distribution of terminal spot
    const mu = Math.log(S0) + (r - 0.5 * sigma * sigma) * T;
    const std = sigma * Math.sqrt(T);

    const numSteps = 200;
    const sMin = Math.exp(mu - 4.2 * std);
    const sMax = Math.exp(mu + 4.2 * std);
    const priceRange = sMax - sMin;
    const stepSize = priceRange / numSteps;

    let totalWeight = 0;
    let profitableWeight = 0;
    let lastSign = 0;
    const breakevensList: number[] = [];

    for (let i = 0; i <= numSteps; i++) {
      const sVal = sMin + i * stepSize;
      
      let payoffAtExpiry = 0;
      strategyLegs.forEach(leg => {
        const mult = leg.action === 'Buy' ? 1 : -1;
        const intrinsic = leg.type === 'Call' 
          ? Math.max(0, sVal - leg.strike) 
          : Math.max(0, leg.strike - sVal);
        
        const optBS = calculateOptions({
          S: S0, K: leg.strike, T: T, r: r, sigma: sigma, type: leg.type
        }, 'BS');
        payoffAtExpiry += (intrinsic - optBS.price) * leg.quantity * mult;
      });

      // Lognormal pdf model 
      const l_s = Math.log(sVal);
      const z = (l_s - mu) / std;
      const pdf = Math.exp(-z * z / 2) / (Math.sqrt(2 * Math.PI) * std * sVal);
      const weight = pdf * stepSize;
      totalWeight += weight;

      if (payoffAtExpiry > 0.01) {
        profitableWeight += weight;
      }

      // Zero-crossing breakevens detection
      if (i > 0) {
        if (lastSign !== 0) {
          const currentSign = payoffAtExpiry >= 0 ? 1 : -1;
          if (currentSign !== lastSign) {
            breakevensList.push(sVal);
          }
        }
      }
      if (payoffAtExpiry >= 0.01 || payoffAtExpiry <= -0.01) {
        lastSign = payoffAtExpiry > 0 ? 1 : -1;
      }
    }

    const pof = totalWeight > 0 ? (profitableWeight / totalWeight) * 100 : 50.0;
    return {
      pof: parseFloat(Math.min(100, Math.max(0, pof)).toFixed(1)),
      breakevens: breakevensList.map(bk => parseFloat(bk.toFixed(1)))
    };
  }, [strategyLegs, activeSpotPrice, T_years, activeImpliedVol, RISK_FREE_RATE]);

  // Append a customized Leg to the current Option Strategy Builder
  const handleAddNewLeg = () => {
    const newLegId = `leg_${Date.now()}`;
    const defaultStrike = Math.round(activeSpotPrice / 5) * 5;
    const newLeg: OptionLeg = {
      id: newLegId,
      type: 'Call',
      action: 'Buy',
      strike: defaultStrike,
      quantity: 1
    };
    setStrategyLegs([...strategyLegs, newLeg]);
    setStrategyPreset("Custom Setup");
  };

  const updateLegProperty = (id: string, propName: keyof OptionLeg, val: any) => {
    setStrategyLegs(strategyLegs.map(leg => {
      if (leg.id === id) {
        return { ...leg, [propName]: val };
      }
      return leg;
    }));
    setStrategyPreset("Custom Setup");
  };

  const handleRemoveLeg = (id: string) => {
    setStrategyLegs(strategyLegs.filter(leg => leg.id !== id));
    setStrategyPreset("Custom Setup");
  };

  // Direct append from option chain table click
  const addLegFromChain = (strike: number, type: OptionType, action: 'Buy' | 'Sell') => {
    const newLegId = `leg_ch_${Date.now()}`;
    const newLeg: OptionLeg = {
      id: newLegId,
      type,
      action,
      strike,
      quantity: 1
    };
    // Append to active legs list
    setStrategyLegs([...strategyLegs, newLeg]);
    setStrategyPreset("Custom Setup");
    
    // Switch active view directly to the strategy payoff chart to show the trade immediately!
    setActiveTab('payoff');
  };

  // Standard CSV Options Chains downloader
  const downloadChainCSV = () => {
    const headers = ['Strike', 'Call Price', 'Call Bid', 'Call Ask', 'Call IV (%)', 'Call Vol', 'Put Price', 'Put Bid', 'Put Ask', 'Put IV (%)', 'Put Vol'];
    const rows = optionChainRowData.map(r => [
      r.strike,
      r.callPrice.toFixed(2),
      r.callBid.toFixed(2),
      r.callAsk.toFixed(2),
      (r.callIV * 100).toFixed(1),
      r.callVol,
      r.putPrice.toFixed(2),
      r.putBid.toFixed(2),
      r.putAsk.toFixed(2),
      (r.putIV * 100).toFixed(1),
      r.putVol
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OpticAnalytics_Chain_${selectedTicker.symbol}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-[#1e293b] font-sans overflow-hidden">
      
      {/* 1. SIDEBAR CONTROLS (Left side, width 325px for perfect double desk alignment) */}
      <aside className="w-[325px] bg-white border-r border-[#e2e8f0] flex flex-col shrink-0 select-none">
        
        {/* Banner Logo */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-gradient-to-r from-blue-50/25 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">
              Ω
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wider text-slate-900 leading-none">OPTIC ANALYTICS</h1>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Professional Option Desk</span>
            </div>
          </div>
        </div>

        {/* Scrollable controls */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto scrollbar-thin">

          {/* Dynamic Currency Converter Widget */}
          <div className="space-y-1.5 p-3.5 bg-blue-50/30 rounded-xl border border-blue-100/40">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex justify-between items-center">
              <span>Denomination Currency</span>
              <span className="text-[8px] text-blue-600 font-mono uppercase bg-blue-100 px-1.5 py-0.2 rounded font-extrabold">
                {selectedCurrency} Converter
              </span>
            </label>
            <div className="grid grid-cols-5 gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
              {(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    selectedCurrency === curr
                      ? "bg-white text-blue-600 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Multi-Column Market Selector Desk */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                Select Active Ticker Instrument
              </label>
              <span className="text-[9px] font-bold text-slate-400">{selectedTicker.symbol} ({selectedTicker.currency})</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[9px] select-none">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  apiStatus === 'loading' ? 'bg-amber-500 animate-pulse' :
                  apiStatus === 'live' ? 'bg-emerald-500' :
                  'bg-rose-500'
                }`} />
                <span className="font-extrabold uppercase text-slate-600">
                  {apiStatus === 'loading' ? 'FETCHING...' :
                   apiStatus === 'live' ? 'LIVE DATA' :
                   'OFFLINE DRIFT'}
                </span>
                {lastRefreshed && (
                  <span className="text-slate-400 font-mono">({lastRefreshed})</span>
                )}
              </div>
              <button 
                onClick={forceManualRefresh} 
                disabled={apiStatus === 'loading'}
                className="text-blue-600 hover:text-blue-800 font-extrabold active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
              >
                {apiStatus === 'loading' ? 'Loading' : 'Refresh'}
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                value={tickerSearchQuery}
                onChange={(e) => setTickerSearchQuery(e.target.value)}
                placeholder="Search symbol or company name..."
                className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-medium"
                id="ticker-search-input"
              />
              {tickerSearchQuery && (
                <button
                  onClick={() => setTickerSearchQuery("")}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 font-extrabold text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            
            {filteredTickers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50/50 rounded-xl border border-slate-200/60">
                <p className="font-semibold text-slate-600">No matching tickers found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Try searching for other Indian or Global assets</p>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                {/* INDIAN REGION MARKET DESK */}
                {filteredTickers.some(t => t.category.startsWith('indian-')) && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-widest block">🇮🇳 Indian Desk</span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Indices Class Column */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Indices</span>
                        <div className="space-y-1 max-h-[142px] overflow-y-auto scrollbar-thin pr-0.5">
                          {filteredTickers.filter(t => t.category === 'indian-indices').map(t => (
                            <button
                              key={t.symbol}
                              onClick={() => setSelectedTicker(t)}
                              className={`w-full text-left px-2 py-1 text-[10px] font-black rounded border transition-all cursor-pointer ${
                                selectedTicker.symbol === t.symbol
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                              }`}
                            >
                              {t.symbol === 'NIFTY50' ? 'NIfty50' : 
                               t.symbol === 'SENSEX' ? 'BSE Sensex' : 
                               t.symbol === 'NIFTY_IT' ? 'NIFTY IT' : 
                               t.symbol === 'NIFTY_PHARMA' ? 'PHARMA' : 
                               t.symbol === 'NIFTY_MIDCAP_100' ? 'MIDCAP 100' : 
                               t.symbol === 'NIFTY_SMALLCAP_100' ? 'SMLCAP 100' : 
                               t.symbol === 'BSE_100' ? 'BSE 100' : 
                               t.symbol === 'NIFTY_NEXT_50' ? 'NEXT 50' : t.symbol}
                            </button>
                          ))}
                          {filteredTickers.filter(t => t.category === 'indian-indices').length === 0 && (
                            <span className="text-[9px] text-slate-400 italic block">No index matches</span>
                          )}
                        </div>
                      </div>
                      {/* Stock Equities Class Column */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Stocks</span>
                        <div className="space-y-1 max-h-[142px] overflow-y-auto scrollbar-thin pr-0.5">
                          {filteredTickers.filter(t => t.category === 'indian-stocks').map(t => (
                            <button
                              key={t.symbol}
                              onClick={() => setSelectedTicker(t)}
                              className={`w-full text-left px-1.5 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer truncate ${
                                selectedTicker.symbol === t.symbol
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xs font-black"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                              }`}
                              title={t.name}
                            >
                              {t.symbol}
                            </button>
                          ))}
                          {filteredTickers.filter(t => t.category === 'indian-stocks').length === 0 && (
                            <span className="text-[9px] text-slate-400 italic block">No stock matches</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GLOBAL REGION MARKET DESK */}
                {filteredTickers.some(t => t.category.startsWith('global-')) && (
                  <div className={`space-y-1.5 pt-2 ${filteredTickers.some(t => t.category.startsWith('indian-')) ? 'border-t border-slate-200/50' : ''}`}>
                    <span className="text-[9px] font-extrabold text-indigo-800 uppercase tracking-widest block">🌎 Global Desk</span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Indices Class Column */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Indices</span>
                        <div className="space-y-1 max-h-[142px] overflow-y-auto scrollbar-thin pr-0.5">
                          {filteredTickers.filter(t => t.category === 'global-indices').map(t => (
                            <button
                              key={t.symbol}
                              onClick={() => setSelectedTicker(t)}
                              className={`w-full text-left px-2 py-1 text-[10px] font-black rounded border transition-all cursor-pointer ${
                                selectedTicker.symbol === t.symbol
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                              }`}
                            >
                              {t.symbol === 'NIKKEI225' ? 'NIKKEI' : 
                               t.symbol === 'HANGSENG' ? 'HSI' : 
                               t.symbol === 'DOW_JONES' ? 'DOW' : 
                               t.symbol === 'CAC_40' ? 'CAC 40' : 
                               t.symbol === 'IBEX_35' ? 'IBEX 35' : 
                               t.symbol === 'EURO_STOXX_50' ? 'STOXX 50' : 
                               t.symbol === 'SSE_COMPOSITE' ? 'SHANGHAI' : 
                               t.symbol === 'TSX_COMPOSITE' ? 'S&P/TSX' : 
                               t.symbol === 'MSCI_WORLD' ? 'MSCI WORLD' : 
                               t.symbol === 'SP_GLOBAL_100' ? 'GLOBAL 100' : 
                               t.symbol === 'DJ_TITANS_50' ? 'TITANS 50' : 
                               t.symbol === 'FTSE_ALL_WORLD' ? 'FTSE ALL' : 
                               t.symbol === 'OTCQX_30' ? 'OTCQX 30' : 
                               t.symbol === 'GLOBAL_DOW' ? 'GLOBAL DOW' : t.symbol}
                            </button>
                          ))}
                          {filteredTickers.filter(t => t.category === 'global-indices').length === 0 && (
                            <span className="text-[9px] text-slate-400 italic block">No index matches</span>
                          )}
                        </div>
                      </div>
                      {/* Stock Equities Class Column */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Stocks</span>
                        <div className="space-y-1 max-h-[142px] overflow-y-auto scrollbar-thin pr-0.5">
                          {filteredTickers.filter(t => t.category === 'global-stocks').map(t => (
                            <button
                              key={t.symbol}
                              onClick={() => setSelectedTicker(t)}
                              className={`w-full text-left px-1.5 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer truncate ${
                                selectedTicker.symbol === t.symbol
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xs font-black"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                              }`}
                              title={t.name}
                            >
                              {t.symbol}
                            </button>
                          ))}
                          {filteredTickers.filter(t => t.category === 'global-stocks').length === 0 && (
                            <span className="text-[9px] text-slate-400 italic block">No stock matches</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Spot Price Manual Override Option */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex justify-between">
              <span>Spot Price Overrides</span>
              {customPrice && (
                <button 
                  onClick={() => setCustomPrice("")}
                  className="text-blue-600 font-bold hover:underline normal-case text-[9px]"
                >
                  Clear Custom
                </button>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                {CURRENCY_SYMBOLS[selectedCurrency]}
              </span>
              <input 
                type="number" 
                placeholder={`Live: ${formatCurrencyValue(selectedTicker.basePrice + simulatedPriceTick, selectedTicker.currency, 2)}`}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg pl-6 pr-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold placeholder:font-normal"
              />
            </div>
          </div>

          {/* Pricing Model selection tabs */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pricing Math Formula</label>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
              <button 
                onClick={() => setModel('BS')}
                className={`flex-1 py-1.5 text-[10px] font-bold transition-all rounded ${
                  model === 'BS' 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Black-Scholes
              </button>
              <button 
                onClick={() => setModel('Binomial')}
                className={`flex-1 py-1.5 text-[10px] font-bold transition-all rounded ${
                  model === 'Binomial' 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                CRR Binomial
              </button>
              <button 
                onClick={() => setModel('MC')}
                className={`flex-1 py-1.5 text-[10px] font-bold transition-all rounded ${
                  model === 'MC' 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Monte Carlo
              </button>
            </div>
          </div>

          {/* Expiration selection selectbox */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex justify-between">
              <span>Contract Expiration</span>
              <span className="text-blue-600 font-semibold font-mono text-[9px] lowercase">
                T = {T_years.toFixed(4)} yrs
              </span>
            </label>
            <div className="relative">
              <Calendar size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <select 
                value={selectedExpiryDays}
                onChange={(e) => setSelectedExpiryDays(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-semibold appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="7">7 Days (Weekly Options)</option>
                <option value="15">15 Days (Bi-weekly options)</option>
                <option value="30">30 Days (Standard Monthly)</option>
                <option value="45">45 Days (Earnings horizon)</option>
                <option value="60">60 Days (Standard 2-Month)</option>
                <option value="90">90 Days (Quarterly Options)</option>
                <option value="180">180 Days (Half-Year LEAPS)</option>
                <option value="365">365 Days (Full 1-Year LEAPS)</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Scenario Risks & Stress Simulator (4 Key Requested Dynamic Portfolio Analytics) */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/55 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders size={13} className="text-blue-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                  Scenario Risk & Stress
                </span>
              </div>
              {(stressSpotShift !== 0 || stressVolShift !== 0) && (
                <button
                  onClick={() => {
                    setStressSpotShift(0);
                    setStressVolShift(0);
                  }}
                  className="text-[9px] text-blue-600 hover:text-blue-800 font-extrabold hover:underline cursor-pointer"
                >
                  Reset Shifts
                </button>
              )}
            </div>

            {/* 1. Underlying Spot Price Shift Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Spot Price Shift (-20% to +20%)</span>
                <span className={`font-mono text-[10px] font-extrabold ${stressSpotShift > 0 ? "text-emerald-600" : stressSpotShift < 0 ? "text-rose-600" : "text-slate-500"}`}>
                  {stressSpotShift > 0 ? "+" : ""}{stressSpotShift}%
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={stressSpotShift}
                onChange={(e) => setStressSpotShift(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-mono font-medium">
                <span>Crash (-20%)</span>
                <span>Neutral</span>
                <span>Surge (+20%)</span>
              </div>
            </div>

            {/* 2. Volatility Shock Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Volatility Shock (-15% to +15%)</span>
                <span className={`font-mono text-[10px] font-extrabold ${stressVolShift > 0 ? "text-indigo-600" : stressVolShift < 0 ? "text-orange-600" : "text-slate-500"}`}>
                  {stressVolShift > 0 ? "+" : ""}{stressVolShift}% IV
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={stressVolShift}
                onChange={(e) => setStressVolShift(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-mono font-medium">
                <span>Crush (-15%)</span>
                <span>Stable</span>
                <span>Exp (+15%)</span>
              </div>
            </div>

            {/* 3 & 4. Probability of Profit and Breakevens Targets Display Grid */}
            <div className="pt-2.5 border-t border-slate-200/50 grid grid-cols-2 gap-2 text-center select-none">
              <div className="bg-white p-2 rounded-lg border border-slate-200/50 flex flex-col justify-between text-left">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Prob of Profit</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-sm font-black font-mono leading-none ${
                    strategyAnalytics.pof > 55 ? "text-emerald-600" : strategyAnalytics.pof < 45 ? "text-rose-600" : "text-blue-600"
                  }`}>
                    {strategyAnalytics.pof}%
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400">PoF</span>
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200/50 flex flex-col justify-between text-left">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Breakevens</span>
                <div className="mt-1 overflow-y-auto max-h-[36px] scrollbar-none">
                  {strategyAnalytics.breakevens.length === 0 ? (
                    <span className="text-[9px] text-slate-400 font-medium block">None Solved</span>
                  ) : (
                    <div className="space-y-0.5">
                      {strategyAnalytics.breakevens.map((bk, idx) => (
                        <span key={idx} className="text-[10px] font-mono font-bold text-slate-700 block leading-none">
                          {formatCurrencyValue(bk, selectedTicker.currency, 1)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* ACTIVE contract focus area for Metric Greeks */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/50 space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded">
                Greeks Focus
              </span>
              <span className="text-[10px] text-slate-500 font-bold">Individual Contract Details</span>
            </div>

            {/* Option type Option selection Call vs Put */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setSelectedOptionType('Call')}
                className={`py-1.5 text-xs font-semibold rounded-md flex justify-center items-center gap-1 transition ${
                  selectedOptionType === 'Call'
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10 font-bold"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Call
              </button>
              <button
                onClick={() => setSelectedOptionType('Put')}
                className={`py-1.5 text-xs font-semibold rounded-md flex justify-center items-center gap-1 transition ${
                  selectedOptionType === 'Put'
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/10 font-bold"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Put
              </button>
            </div>

            {/* Selected Strike Selection with slider indicator */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                <span>Strike Price</span>
                <span className="text-blue-600 font-mono text-xs">${focusedStrike.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={strikeOptions.length - 1}
                value={selectedStrikeIndex}
                onChange={(e) => setSelectedStrikeIndex(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>${strikeOptions[0]?.toFixed(1)}</span>
                <span>ATM</span>
                <span>${strikeOptions[strikeOptions.length - 1]?.toFixed(1)}</span>
              </div>
            </div>

            {/* Selected Contract Quantity adjustment */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                <span>Contract Quantity</span>
                <span className="text-slate-800 font-mono text-xs">{selectedQuantity}x (100 shares share/ct)</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  className="w-7 h-7 bg-white border border-slate-200 flex items-center justify-center rounded font-extrabold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all text-sm select-none"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono text-xs font-bold py-1 bg-white border border-slate-100 rounded">
                  {selectedQuantity}
                </div>
                <button 
                  onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                  className="w-7 h-7 bg-white border border-slate-200 flex items-center justify-center rounded font-extrabold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all text-sm select-none"
                >
                  +
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Live Status indicator bottom footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-1 uppercase tracking-wider">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[9px] font-bold text-slate-500">
                Live options feed: {selectedTicker.symbol}
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 font-extrabold">v1.2.4</span>
          </div>
          <p className="text-[8px] text-slate-400 leading-none lowercase text-center">
            rates fixed at {RISK_FREE_RATE * 100}% Fed fund rate.
          </p>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto scrollbar-thin">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] px-6 flex items-center justify-between shrink-0 select-none">
          
          <div className="flex items-center gap-6">
            
            {/* Stock spot tracker */}
            <div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                  {formatCurrencyValue(activeSpotPrice, selectedTicker.currency)}
                </span>
                <span className={`text-xs font-extrabold flex items-center gap-0.5 ${
                  selectedTicker.dailyChange >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {selectedTicker.dailyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {selectedTicker.dailyChange >= 0 ? "+" : ""}{formatCurrencyValue(selectedTicker.dailyChange, selectedTicker.currency)} ({selectedTicker.dailyChangePercent.toFixed(2)}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Live ticker quote &bull; {selectedTicker.category.startsWith('indian') ? 'NSE/BSE India' : 'Global Exchange'}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Implied Vol Indices indicators */}
            <div className="hidden sm:flex gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">IV base index</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {(activeImpliedVol * 100).toFixed(1)}% {stressVolShift !== 0 && (
                    <span className={`text-[9px] font-extrabold ${stressVolShift > 0 ? "text-indigo-600" : "text-orange-600"}`}>
                      ({stressVolShift > 0 ? "+" : ""}{stressVolShift}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">IV percentile</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {Math.min(99, Math.max(1, Math.round(selectedTicker.volPercentile * (1 + stressVolShift / 100))))}th
                </span>
              </div>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="flex items-center gap-2">
            
            {/* Export data CSV button */}
            <button 
              onClick={downloadChainCSV}
              title="Download full quantitative option chain data to CSV"
              className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-lg hover:border-slate-300 font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <FileText size={12} /> Export CSV
            </button>

            {/* Auto refresh trigger control */}
            <button 
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? "Pause automatic ticking" : "Resume automatic ticking"}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                autoRefreshEnabled 
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
              }`}
            >
              {autoRefreshEnabled ? (
                <>
                  <RefreshCw size={11} className="animate-spin text-blue-600" /> Auto-Refresh {countdown}s
                </>
              ) : (
                <>
                  Paused
                </>
              )}
            </button>
            <button
              onClick={forceManualRefresh}
              title="Manual quote and pricing calculations rebuild"
              className="p-1.5 bg-slate-100 font-bold text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </header>

        {/* MIDDLE SECTION: CORE GREEKS GRID FOR THE COVERED FOCUS CONTRACT */}
        <section className="p-5 space-y-5">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-slate-800">
                <Info size={14} className="text-blue-600" />
                <span className="font-bold text-xs tracking-tight uppercase tracking-widest text-slate-500">
                  Focused Option Contract: {formatCurrencyValue(focusedStrike, selectedTicker.currency, 0)} strike {selectedOptionType} ({selectedExpiryDays} days expiry)
                </span>
              </div>
              <div className="flex gap-4 font-mono text-[10px] text-slate-400">
                <span>Model: {model === 'BS' ? 'Analytical Black-Scholes' : model === 'Binomial' ? 'CRR Binomial American' : 'Monte Carlo Simulation'}</span>
                <span>IV: {(activeImpliedVol * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* SIX GREEKS METRIC CARDS + OPTION PREMIUM PRICE DISPLAY */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-3">
              
              {/* Premium Price displaying */}
              <div 
                onClick={() => setActiveGreekInfo("price")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "price" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium (Price)</span>
                  <BookOpen size={10} className="text-slate-400" />
                </div>
                <p className="text-lg font-black font-mono text-slate-900">{formatCurrencyValue(activeContractMetrics.price, selectedTicker.currency)}</p>
                <p className="text-[9px] text-slate-500 mt-1 leading-none font-medium">Cost: {formatCurrencyValue(activeContractMetrics.price * 100 * selectedQuantity, selectedTicker.currency)}</p>
              </div>

              {/* Delta displaying */}
              <div 
                onClick={() => setActiveGreekInfo("delta")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "delta" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delta (Δ)</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedOptionType === 'Call' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                </div>
                <p className={`text-lg font-black font-mono ${
                  activeContractMetrics.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {activeContractMetrics.delta >= 0 ? "+" : ""}{(activeContractMetrics.delta).toFixed(3)}
                </p>
                
                {/* Horizontal progress bar */}
                <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${activeContractMetrics.delta >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.min(100, Math.abs(activeContractMetrics.delta) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Gamma displaying */}
              <div 
                onClick={() => setActiveGreekInfo("gamma")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "gamma" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gamma (Γ)</span>
                </div>
                <p className="text-lg font-black font-mono text-slate-950">
                  {(activeContractMetrics.gamma).toFixed(4)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium">
                  {Math.abs(focusedStrike - activeSpotPrice) < 4 ? "High ATM sensitivity" : "Stable profile"}
                </p>
              </div>

              {/* Theta displaying */}
              <div 
                onClick={() => setActiveGreekInfo("theta")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "theta" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theta (Θ)</span>
                </div>
                <p className="text-lg font-black font-mono text-rose-600">
                  {(activeContractMetrics.theta).toFixed(3)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium font-mono">
                  Daily decay
                </p>
              </div>

              {/* Vega displaying */}
              <div 
                onClick={() => setActiveGreekInfo("vega")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "vega" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vega (ν)</span>
                </div>
                <p className="text-lg font-black font-mono text-blue-600">
                  {(activeContractMetrics.vega).toFixed(3)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium">
                  Per +1% base volatility
                </p>
              </div>

              {/* Rho displaying */}
              <div 
                onClick={() => setActiveGreekInfo("rho")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "rho" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rho (ρ)</span>
                </div>
                <p className="text-lg font-black font-mono text-purple-600">
                  {(activeContractMetrics.rho).toFixed(3)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium">
                  Per +1% cash rate Change
                </p>
              </div>

              {/* Vanna displaying */}
              <div 
                onClick={() => setActiveGreekInfo("vanna")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "vanna" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vanna</span>
                </div>
                <p className="text-lg font-black font-mono text-teal-600">
                  {(activeContractMetrics.vanna).toFixed(4)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium font-mono">
                  dΔ / dσ
                </p>
              </div>

              {/* Volga displaying */}
              <div 
                onClick={() => setActiveGreekInfo("volga")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "volga" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volga</span>
                </div>
                <p className="text-lg font-black font-mono text-indigo-600">
                  {(activeContractMetrics.volga).toFixed(4)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium font-mono">
                  dVega / dσ
                </p>
              </div>

              {/* Charm displaying */}
              <div 
                onClick={() => setActiveGreekInfo("charm")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGreekInfo === "charm" 
                    ? "bg-blue-50/40 border-blue-500 shadow-xs" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Charm</span>
                </div>
                <p className="text-lg font-black font-mono text-amber-600">
                  {(activeContractMetrics.charm).toFixed(4)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-none font-medium font-mono">
                  Daily Δ bleed
                </p>
              </div>

            </div>

            {/* EXPANDABLE HOVER / CLICK EXPLANATION PANEL */}
            <div className="mt-3.5 p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-xs">
              <div className="space-y-0.5 max-w-2xl">
                <p className="font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    {GREEKS_TOOLTIPS[activeGreekInfo]?.title}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">{GREEKS_TOOLTIPS[activeGreekInfo]?.symbol} = {GREEKS_TOOLTIPS[activeGreekInfo]?.formula}</span>
                </p>
                <p className="text-slate-600 text-[11px] font-medium leading-relaxed mt-1">
                  {GREEKS_TOOLTIPS[activeGreekInfo]?.desc} 
                </p>
              </div>
              <div className="md:border-l md:border-slate-200 md:pl-4 max-w-sm shrink-0">
                <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Trading Desk Interpret</p>
                <p className="text-blue-700 text-[10px] font-semibold mt-0.5 leading-snug">
                  {GREEKS_TOOLTIPS[activeGreekInfo]?.interpretation}
                </p>
              </div>
            </div>

          </div>

        </section>

        {/* CORE ANALYTICAL PANEL TAB WORKSPACE CONTAINER */}
        <section className="px-5 pb-5 grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* TAB VISUALIZERS & CHARTS CONTAINER (Y-Axis Left panels, spanned 2 cols on wide) */}
          <div className="xl:col-span-2 flex flex-col space-y-5">
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex-1 flex flex-col min-h-[460px]">
              
              {/* Tabs list controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 border-b border-slate-100 pb-3">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 items-center">
                  <button
                    onClick={() => setActiveTab('payoff')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      activeTab === 'payoff'
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Layers size={13} /> Strategy Payoff
                  </button>
                  <button
                    onClick={() => setActiveTab('chain')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      activeTab === 'chain'
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Table size={13} /> Interactive Chain Table
                  </button>
                  <button
                    onClick={() => setActiveTab('monte-carlo')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      activeTab === 'monte-carlo'
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Activity size={13} /> MC Pathways
                  </button>
                  <button
                    onClick={() => setActiveTab('smile')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      activeTab === 'smile'
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LineChart size={13} /> Smile & Term
                  </button>
                  <button
                    onClick={() => setActiveTab('surface')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      activeTab === 'surface'
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Compass size={13} /> 3D Vol Surface
                  </button>
                </div>

                {/* Sub annotations info */}
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono shrink-0">
                  {activeTab === 'payoff' && "Expiration vs current profit profile"}
                  {activeTab === 'chain' && "Direct entry transaction pricing desk"}
                  {activeTab === 'monte-carlo' && "Geometric Brownian Motion Random paths"}
                  {activeTab === 'smile' && `Volatility Skew curves: ${selectedTicker.symbol}`}
                  {activeTab === 'surface' && "Isometric Rotating Mesh Graph"}
                </div>
              </div>

              {/* DYNAMIC TAB SWITCHING VIEWPORT */}
              <div className="flex-1 flex flex-col min-h-[350px]">
                
                {/* TAB 1: STRATEGY PAYOFF GRAPH */}
                {activeTab === 'payoff' && (
                  <div className="flex-1 flex flex-col select-none">
                    <div className="mb-3 flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
                      <div className="flex gap-4 text-[10px] font-bold text-slate-500 font-mono">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-blue-600 rounded"></span> Expiration profit</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1 border border-dash border-indigo-400 rounded"></span> T+0 Current profit</span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-black">
                        Asset Spot: {formatCurrencyValue(activeSpotPrice, selectedTicker.currency)} &bull; Strike focus: {formatCurrencyValue(focusedStrike, selectedTicker.currency, 0)}
                      </span>
                    </div>
 
                    {strategyLegs.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-lg text-slate-400">
                        <Layers size={36} className="mb-2 text-slate-300" />
                        <p className="text-xs font-bold">No active legs generated yet</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-sm text-center">
                          Select an option strategy preset or click "+ Add Leg" at the bottom to build and render option payoffs.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[300px] h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={convertedPayoffData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="payoffExpCol" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.06}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.06}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="spotPrice" 
                              stroke="#64748b" 
                              fontSize={10} 
                              fontFamily="monospace"
                              type="number"
                              domain={['dataMin', 'dataMax']}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              fontSize={10} 
                              fontFamily="monospace"
                              tickFormatter={(val) => `${CURRENCY_SYMBOLS[selectedCurrency]}${val}`}
                            />
                            <Tooltip 
                              formatter={(value: any) => [`${CURRENCY_SYMBOLS[selectedCurrency]}${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`, "Total P&L"]}
                              contentStyle={{ fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px' }}
                              labelFormatter={(label) => `Asset Price: ${CURRENCY_SYMBOLS[selectedCurrency]}${parseFloat(label).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
                            />
                            
                            {/* Area color shading for Expiration Curve */}
                            <Area 
                              type="monotone" 
                              dataKey="expirationProfit" 
                              stroke="#2563eb" 
                              strokeWidth={2.5} 
                              fill="url(#payoffExpCol)" 
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                            
                            {/* Line curve for current date T+0 */}
                            <Area 
                              type="monotone" 
                              dataKey="t0Profit" 
                              stroke="#6366f1" 
                              strokeDasharray="4 4"
                              strokeWidth={1.5} 
                              fill="none" 
                              dot={false}
                            />
 
                            {/* Reference line for the Live Spot Price (aligned with the converted spot coordinate) */}
                            <ReferenceLine 
                              x={convertCurrency(activeSpotPrice, selectedTicker.currency)} 
                              stroke="#0f172a" 
                              strokeWidth={2}
                              label={{ 
                                value: `Spot: ${formatCurrencyValue(activeSpotPrice, selectedTicker.currency)}`, 
                                fill: '#0f172a', 
                                fontSize: 9, 
                                fontWeight: 'extrabold', 
                                position: 'top',
                                bg: '#ffffff'
                              }} 
                            />

                            {/* Horizontal Neutral Line Zero P&L */}
                            <ReferenceLine 
                              y={0} 
                              stroke="#64748b" 
                              strokeWidth={1.2} 
                              strokeDasharray="3 2"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                        
                        {/* Interactive custom helper tags overlaid */}
                        <div className="absolute top-2 right-2 text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <Info size={10} /> Multi-Leg Net calculations are modeled dynamically
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: INTERACTIVE OPTION CHAIN TABLE */}
                {activeTab === 'chain' && (
                  <div className="flex-1 flex flex-col overflow-x-auto">
                    <div className="mb-2 px-1 text-[10px] text-slate-400 uppercase font-bold flex justify-between select-none">
                      <span className="text-emerald-600">CALL CONTRACTS (Left) &bull; BULLISH</span>
                      <span className="text-center font-mono text-slate-800">LIVE SPOT STRUCK: {formatCurrencyValue(activeSpotPrice, selectedTicker.currency)}</span>
                      <span className="text-rose-600 text-right">PUT CONTRACTS (Right) &bull; BEARISH</span>
                    </div>

                    <table className="w-full text-[11px] font-mono border-collapse border border-slate-200 text-center select-none bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 tracking-wider">
                          <th className="p-1 px-2 border border-slate-200">Action</th>
                          <th className="p-1 border border-slate-200">Call Ask</th>
                          <th className="p-1 border border-slate-200">Call Bid</th>
                          <th className="p-1 border border-slate-200">Call IV</th>
                          <th className="bg-blue-50/40 text-blue-700 p-1 font-extrabold border border-slate-200">Strike ({CURRENCY_SYMBOLS[selectedCurrency]})</th>
                          <th className="p-1 border border-slate-200">Put IV</th>
                          <th className="p-1 border border-slate-200">Put Bid</th>
                          <th className="p-1 border border-slate-200">Put Ask</th>
                          <th className="p-1 px-2 border border-slate-200">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optionChainRowData.map((row) => (
                          <tr 
                            key={row.strike} 
                            className={`hover:bg-slate-50 border-b border-slate-100 font-medium ${
                              Math.abs(row.strike - activeSpotPrice) < 2.5 
                                ? "bg-amber-50/20" 
                                : ""
                            }`}
                          >
                            {/* Buy/Sell Calls */}
                            <td className="p-1 border border-slate-100 flex gap-1 justify-center">
                              <button 
                                onClick={() => addLegFromChain(row.strike, 'Call', 'Buy')}
                                className="px-2 py-0.5 text-[9px] font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer transition-colors"
                                title="Buy Call Option (Go Long)"
                              >
                                Buy
                              </button>
                              <button 
                                onClick={() => addLegFromChain(row.strike, 'Call', 'Sell')}
                                className="px-2 py-0.5 text-[9px] font-black bg-rose-500 hover:bg-rose-600 text-white rounded cursor-pointer transition-colors"
                                title="Sell Call Option (Go Short)"
                              >
                                Sell
                              </button>
                            </td>

                            <td className="p-1.5 border border-slate-100 text-slate-800">{formatCurrencyValue(row.callAsk, selectedTicker.currency)}</td>
                            <td className="p-1.5 border border-slate-100 text-slate-800">{formatCurrencyValue(row.callBid, selectedTicker.currency)}</td>
                            <td className="p-1.5 border border-slate-100 text-slate-500 font-normal">{(row.callIV * 100).toFixed(1)}%</td>
                            
                            {/* Central Highlight STRIKE */}
                            <td className="p-1.5 border border-slate-100 bg-blue-50/20 text-slate-900 font-bold border-l-2 border-r-2 border-blue-100">
                              {formatCurrencyValue(row.strike, selectedTicker.currency, 0)}
                            </td>

                            <td className="p-1.5 border border-slate-100 text-slate-500 font-normal">{(row.putIV * 100).toFixed(1)}%</td>
                            <td className="p-1.5 border border-slate-100 text-slate-800">{formatCurrencyValue(row.putBid, selectedTicker.currency)}</td>
                            <td className="p-1.5 border border-slate-100 text-slate-800">{formatCurrencyValue(row.putAsk, selectedTicker.currency)}</td>

                            {/* Buy/Sell Puts */}
                            <td className="p-1 border border-slate-100 flex gap-1 justify-center">
                              <button 
                                onClick={() => addLegFromChain(row.strike, 'Put', 'Buy')}
                                className="px-2 py-0.5 text-[9px] font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer transition-colors"
                                title="Buy Put Option (Go Long)"
                              >
                                Buy
                              </button>
                              <button 
                                onClick={() => addLegFromChain(row.strike, 'Put', 'Sell')}
                                className="px-2 py-0.5 text-[9px] font-black bg-rose-500 hover:bg-rose-600 text-white rounded cursor-pointer transition-colors"
                                title="Sell Put Option (Go Short)"
                              >
                                Sell
                              </button>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: MONTE CARLO RANDOM PATHWAYS PLOT */}
                {activeTab === 'monte-carlo' && (
                  <div className="flex-1 flex flex-col select-none">
                    <div className="mb-3 p-3 bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800 rounded-lg flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="font-bold flex items-center gap-1.5 leading-none">
                          <Activity size={13} /> Monte Carlo Stochastic Sim &bull; 40 random walk projections
                        </p>
                        <p className="text-[10px] text-slate-500 font-normal">
                          Models high-performance Geometric Brownian Motion (GBM) drifting at {RISK_FREE_RATE * 100}% Fed fund rate.
                        </p>
                      </div>
                      <span className="font-mono font-bold text-xs">Spot: ${activeSpotPrice}</span>
                    </div>

                    <div className="flex-1 h-full min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart
                          data={mcSimPaths}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="step" 
                            stroke="#64748b" 
                            fontSize={9} 
                            fontFamily="monospace"
                            label={{ value: 'Simulation maturity steps', position: 'bottom', fontSize: 9, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={9} 
                            fontFamily="monospace"
                            tickFormatter={(v) => `$${v}`}
                          />
                          <Tooltip 
                            contentStyle={{ fontSize: '10px', fontFamily: 'monospace', borderRadius: '8px' }}
                            labelFormatter={(s) => `At simulation step ${s}`}
                          />
                          
                          {/* Paths plotter dynamically */}
                          {Array.from({ length: 25 }).map((_, i) => (
                            <Line
                              key={i}
                              type="monotone"
                              dataKey={`path_${i}`}
                              stroke={`hsl(${200 + i * 2}, ${60 + (i % 5)*5}%, ${55 + (i % 3)*5}%)`}
                              strokeWidth={0.8}
                              dot={false}
                              activeDot={false}
                              opacity={0.65}
                            />
                          ))}

                          {/* Horizontal Strike Price boundary tracker for visual profit threshold */}
                          <ReferenceLine 
                            y={focusedStrike} 
                            stroke="#dc2626" 
                            strokeWidth={1.5} 
                            strokeDasharray="4 2"
                            label={{ value: `Focus strike limit: $${focusedStrike}`, fill: '#dc2626', fontSize: 9, fontWeight: 'bold', position: 'insideRight' }}
                          />

                          {/* Reference line for spot price */}
                          <ReferenceLine 
                            y={activeSpotPrice} 
                            stroke="#334155" 
                            strokeWidth={1.5} 
                            label={{ value: `S0: $${activeSpotPrice}`, fill: '#334155', fontSize: 9, fontWeight: 'medium', position: 'left' }}
                          />

                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TAB 4: VOLATILITY SMILE AND TERM STRUCTURE PLOTS */}
                {activeTab === 'smile' && (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                    
                    {/* Plot 1: Volatility Smile Curve */}
                    <div className="space-y-2 flex flex-col">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between px-1">
                        <span>IV Smile / Option Skew</span>
                        <span className="font-mono text-blue-600 font-semibold text-[10px]">ATM implied: {(activeImpliedVol * 100).toFixed(1)}%</span>
                      </p>
                      <div className="flex-1 min-h-[220px] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart
                            data={volSmileCoordinates}
                            margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="strikePrice" stroke="#64748b" fontSize={9} fontFamily="monospace" />
                            <YAxis stroke="#64748b" fontSize={9} fontFamily="monospace" tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                            <Line 
                              type="monotone" 
                              dataKey="impliedVol" 
                              name="Implied Volatility"
                              stroke="#0284c7" 
                              strokeWidth={2}
                              dot={{ r: 2 }}
                            />
                            {/* Vertical marker for direct line ATM Spot */}
                            <ReferenceLine 
                              x={activeSpotPrice} 
                              stroke="#64748b" 
                              strokeDasharray="2 3"
                              label={{ value: "ATM Spot", fill: "#64748b", fontSize: 9, fontStyle: 'italic', position: 'top' }}
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium text-center italic">
                        Strikes further Out-of-the-Money exhibit higher volatility pricing (Tail-risk skew)
                      </p>
                    </div>

                    {/* Plot 2: Volatility Term Structure Curve */}
                    <div className="space-y-2 flex flex-col">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between px-1">
                        <span>IV Term Structure</span>
                        <span className="font-mono text-indigo-600 font-semibold text-[10px]">Seasonal modeling</span>
                      </p>
                      <div className="flex-1 min-h-[220px] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart
                            data={volTermStructureCoordinates}
                            margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="daysToMaturity" stroke="#64748b" fontSize={9} fontFamily="monospace" />
                            <YAxis stroke="#64748b" fontSize={9} fontFamily="monospace" tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                            <Line 
                              type="monotone" 
                              dataKey="impliedVol" 
                              name="IV Expectation"
                              stroke="#6366f1" 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium text-center italic">
                        Implied Volatility expectations mapped across days-to-maturity (Term Structure curve)
                      </p>
                    </div>

                  </div>
                )}

                {/* TAB 5: 3D VOLATILITY SURFACE COMPASS GRAPH */}
                {activeTab === 'surface' && (
                  <ThreeDVolSurface spot={activeSpotPrice} baseIV={activeImpliedVol} />
                )}

              </div>

            </div>

            {/* STRATEGY LEGS CONTROLS PANEL GRID (Added legs list bottom of graph) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 select-none">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Active Option Legs Builder</h3>
                  <select
                    value={strategyPreset}
                    onChange={(e) => applyStrategyPreset(e.target.value)}
                    className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-bold text-slate-800 px-2 py-0.5 rounded focus:outline-none cursor-pointer"
                  >
                    <option value="Single Call">Strategy Preset: Long Call</option>
                    <option value="Single Put">Strategy Preset: Long Put</option>
                    <option value="Bull Call Spread">Strategy Preset: Bull Call Spread</option>
                    <option value="Bear Put Spread">Strategy Preset: Bear Put Spread</option>
                    <option value="Straddle">Strategy Preset: Neutral Straddle</option>
                    <option value="Strangle">Strategy Preset: Neutral Strangle</option>
                    <option value="Iron Condor">Strategy Preset: Iron Condor</option>
                    <option value="Butterfly Spread">Strategy Preset: Butterfly Spread</option>
                    <option value="Custom Setup">Strategy Preset: Custom Setup</option>
                  </select>
                </div>
                
                <button 
                  onClick={handleAddNewLeg}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-blue-200"
                >
                  <Plus size={12} /> Add Custom Leg
                </button>
              </div>

              {strategyLegs.length === 0 ? (
                <div className="py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg text-center flex flex-col justify-center items-center text-slate-400 select-none">
                  <Plus size={24} className="mb-1 text-slate-300" />
                  <p className="text-xs font-bold leading-none">No Legs loaded on building grid</p>
                  <p className="text-[10px] mt-1 text-slate-400">Add custom legs or click presets to inspect premium payoffs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    
                    {/* Legs inputs cards loop */}
                    <div className="md:col-span-3 space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      {strategyLegs.map((leg, index) => (
                        <div 
                          key={leg.id}
                          className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/50 rounded-lg border border-slate-200 transition-all select-none"
                        >
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            #{index + 1}
                          </span>

                          {/* Buy/Sell */}
                          <select
                            value={leg.action}
                            onChange={(e) => updateLegProperty(leg.id, 'action', e.target.value)}
                            className={`text-[10px] font-extrabold p-1 rounded focus:outline-none cursor-pointer border border-transparent ${
                              leg.action === 'Buy' 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            <option value="Buy">BUY (+1)</option>
                            <option value="Sell">SELL (-1)</option>
                          </select>

                          {/* Call / Put */}
                          <select
                            value={leg.type}
                            onChange={(e) => updateLegProperty(leg.id, 'type', e.target.value)}
                            className="bg-white border border-slate-200 text-[10px] font-bold px-1.5 py-1 rounded focus:outline-none cursor-pointer"
                          >
                            <option value="Call">Call Option</option>
                            <option value="Put">Put Option</option>
                          </select>

                          {/* Strike selector */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                            <span className="text-[9px] text-slate-400 font-bold">Strike:</span>
                            <input 
                              type="number" 
                              value={leg.strike}
                              onChange={(e) => updateLegProperty(leg.id, 'strike', parseFloat(e.target.value) || activeSpotPrice)}
                              className="w-12 text-[10px] font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-center"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                            <span className="text-[9px] text-slate-400 font-bold">Qty:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={leg.quantity}
                              onChange={(e) => updateLegProperty(leg.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-8 text-[10px] font-mono font-bold text-slate-800 focus:outline-none text-center"
                            />
                          </div>

                          {/* Dynamic Theoretical calculation for Leg Premium value (specifically solved per leg strike & type) */}
                          {(() => {
                            const legBS = calculateOptions({
                              S: activeSpotPrice,
                              K: leg.strike,
                              T: T_years,
                              r: RISK_FREE_RATE,
                              sigma: activeImpliedVol,
                              type: leg.type
                            }, 'BS');
                            return (
                              <span className="text-[10px] font-mono font-bold text-slate-600 ml-auto leading-none bg-slate-300/60 px-2 py-1 rounded">
                                Th: {formatCurrencyValue(legBS.price * leg.quantity, selectedTicker.currency)}
                              </span>
                            );
                          })()}

                          {/* Trash button */}
                          <button 
                            onClick={() => handleRemoveLeg(leg.id)}
                            className="p-1 px-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete this option leg"
                          >
                            <Trash size={11} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Composite Net strategy summary statistics metrics card */}
                    <div className="md:col-span-2 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-xl p-4 flex flex-col justify-between shadow-sm select-none">
                      <div className="flex justify-between items-start border-b border-slate-700/50 pb-2">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Strategy Mode</p>
                          <h4 className="text-xs font-black tracking-tight mt-0.5 text-blue-400">{strategyPreset}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Net premium</p>
                          <p className="text-sm font-black font-mono tracking-tight text-white mt-1">
                            {/* Positive overall is credit, Negative overall is debit */}
                            {strategyGreeks.totalPremium >= 0 ? "+" : ""}{formatCurrencyValue(strategyGreeks.totalPremium * 100, selectedTicker.currency)}
                          </p>
                          <span className={`text-[9px] font-bold px-1 py-0.2 rounded-sm uppercase mt-0.5 inline-block ${
                            strategyGreeks.totalPremium >= 0 
                              ? "bg-emerald-500/15 text-emerald-400" 
                              : "bg-amber-500/15 text-amber-400"
                          }`}>
                            {strategyGreeks.totalPremium >= 0 ? "Credit Received" : "Debit Outflow"}
                          </span>
                        </div>
                      </div>

                      {/* Display Net Strategy Greeks dynamically */}
                      <div className="grid grid-cols-4 gap-2 text-center pt-3.5 border-t border-slate-700/35">
                        <div>
                          <p className="text-[8px] font-mono uppercase text-slate-400">Net Δ</p>
                          <p className={`text-xs font-extrabold font-mono mt-0.5 ${strategyGreeks.netDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {strategyGreeks.netDelta >= 0 ? "+" : ""}{strategyGreeks.netDelta.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono uppercase text-slate-400">Net Γ</p>
                          <p className="text-xs font-extrabold font-mono mt-0.5 text-slate-200">
                            {strategyGreeks.netGamma.toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono uppercase text-slate-400">Net Θ</p>
                          <p className={`text-xs font-extrabold font-mono mt-0.5 ${strategyGreeks.netTheta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {strategyGreeks.netTheta >= 0 ? "+" : ""}{strategyGreeks.netTheta.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono uppercase text-slate-400">Net ν</p>
                          <p className="text-xs font-extrabold font-mono mt-0.5 text-blue-300">
                            {strategyGreeks.netVega.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Cash limit warnings */}
                      <div className="mt-3 bg-white/5 p-1.5 rounded text-[8.5px] text-slate-300 font-medium leading-normal">
                        Aggregated composite Greeks calculate the simultaneous linear delta sensitivity under compounding legs.
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 3. SIDE TRAINING / ADVENTURE ADVISOR PANEL (Col 3, right column on desktop) */}
          <div className="space-y-5 select-none">
            
            {/* Options educational definitions & training checklist */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <BookOpen size={15} className="text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Options Analyst Strategy Guide
                </h3>
              </div>
              
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Options strategies leverage custom combinations of price directions and volatility contractions. Select an objective to understand your portfolio options:
              </p>

              <div className="space-y-2.5 pt-1">
                
                {/* Rule of directional Calls */}
                <div 
                  onClick={() => applyStrategyPreset("Bull Call Spread")}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-100 flex items-start gap-2.5 cursor-pointer hover:border-blue-200 transition-all"
                >
                  <div className="w-4 h-4 rounded px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                    ▲
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-800">Bullish Directional</h4>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      To capitalize on upward momentum while capping risk margins, execute a **Bull Call Spread**. Uses cheap premium and bounds delta.
                    </p>
                  </div>
                </div>

                {/* Rule of bearish Puts */}
                <div 
                  onClick={() => applyStrategyPreset("Bear Put Spread")}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-100 flex items-start gap-2.5 cursor-pointer hover:border-blue-200 transition-all"
                >
                  <div className="w-4 h-4 rounded px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                    ▼
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-800">Bearish Protection</h4>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Hedge down-gap slides by loading a **Bear Put Spread**. Protects stock portfolio assets from rapid vega contractions.
                    </p>
                  </div>
                </div>

                {/* Straddles for earnings */}
                <div 
                  onClick={() => applyStrategyPreset("Straddle")}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-100 flex items-start gap-2.5 cursor-pointer hover:border-blue-200 transition-all"
                >
                  <div className="w-4 h-4 rounded px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                    ◆
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-800">Volatility breakout (Straddle)</h4>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Earnings catalysts with unknown direction? A **Long Straddle** buys both ATM Call and Put. Wins if stock has major breakout.
                    </p>
                  </div>
                </div>

                {/* Iron Condors for premium decay */}
                <div 
                  onClick={() => applyStrategyPreset("Iron Condor")}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-100 flex items-start gap-2.5 cursor-pointer hover:border-blue-200 transition-all"
                >
                  <div className="w-4 h-4 rounded px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                    ■
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-800">Theta Harvester (Iron Condor)</h4>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      In slow, sideways consolidations, sell out of the money wings. An **Iron Condor** decays premium into credit profit daily.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* AI OPTIONS ADVISOR PANEL using Gemini API description concepts */}
            <div className="bg-gradient-to-tr from-slate-50 to-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-2 border-b border-blue-100 pb-2.5">
                <Sparkles size={14} className="text-blue-600 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest leading-none">
                  Smart Greeks Audit
                </h3>
              </div>

              <div className="space-y-3.5 pt-3">
                <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed">
                  Our embedded quantitative engine has audited the current layout for <strong className="text-slate-950">{selectedTicker.symbol}</strong> options. Here is your portfolio greeks audit report:
                </p>

                <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-100/50 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">Implied Volatility Regime:</span>
                    <strong className="text-blue-700 font-extrabold">
                      {activeImpliedVol * 100 > 30 ? "High (Contraction predicted)" : "Moderate (Base stability)"}
                    </strong>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">Strategy Directional Bias:</span>
                    <strong className={`font-extrabold ${strategyGreeks.netDelta > 0.1 ? 'text-emerald-700' : strategyGreeks.netDelta < -0.1 ? 'text-rose-700' : 'text-slate-600'}`}>
                      {strategyGreeks.netDelta > 0.1 ? "Bullish (Delta positive)" : strategyGreeks.netDelta < -0.1 ? "Bearish (Delta negative)" : "Delta Neutral (Sideways)"}
                    </strong>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">Daily Theta Bleed:</span>
                    <strong className={`font-extrabold ${strategyGreeks.netTheta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {strategyGreeks.netTheta >= 0 ? "+" : ""}{(strategyGreeks.netTheta * 100).toFixed(2)} / day
                    </strong>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-2 text-[9px] text-slate-500 rounded border border-slate-100">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[8px]">Delta Hedging Audit</p>
                  <p className="leading-snug">
                    To completely delta-hedge this option strategy position, you must {strategyGreeks.netDelta > 0 ? "sell short" : "buy long"} <strong>{Math.abs(Math.round(strategyGreeks.netDelta * 100))}</strong> shares of underlying {selectedTicker.symbol} stock. This will force your portfolio into a neutral, variance-only risk envelope.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
