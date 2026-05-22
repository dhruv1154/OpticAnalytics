import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

const SYMBOLS = [
  "^NSEI", "^NSEBANK", "^BSEN",
  "^CNXIT", "^CNXPHARMA", "^NIFTYMDCP100", "^NIFTYSMCP100", "^BSE100", "^NIFTYNXT50",
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS",
  "HCLTECH.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "TECHM.NS", "KOTAKBANK.NS", "LT.NS", "ONGC.NS", "NESTLEIND.NS", "TATASTEEL.NS", "TATACONSUM.NS", "HINDUNILVR.NS", "AXISBANK.NS", "ADANIENT.NS", "BRITANNIA.NS",
  "SUNPHARMA.NS", "MARUTI.NS", "NTPC.NS", "TATAMOTORS.NS", "WIPRO.NS", "COALINDIA.NS", "VBL.NS", "MCDOWELL-N.NS", "LTIM.NS", "GET&D.NS", "TATACOMM.NS", "SIEMENS.NS", "PCBL.NS", "MUTHOOTFIN.NS", "CUMMINSIND.NS", "UNIONBANK.NS",
  "^GSPC", "^NDX", "^FTSE", "^HSI", "^N225",
  "^DJI", "^GDAXI", "^FCHI", "^IBEX", "^STOXX50E", "000001.SS", "^GSPTSE", "^MSWLD", "^SPG100", "^DJGT50", "^FTWLD", "^OTCQX30", "^GDOW",
  "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL",
  "AVGO", "TSM", "2222.SR", "META", "005930.KS", "WMT", "BRK-B", "LLY", "JPM",
  "000660.KS", "ASML", "0700.HK", "1398.HK", "1288.HK", "ROG.SW", "BABA", "HSBC", "0857.HK", "0939.HK", "300750.SZ", "AZN", "NOVN.SW", "MC.PA",
  "^VIX", "^INDIAVIX"
];

// Yahoo Finance chart proxy route with multi-endpoint fallback
app.get("/api/quotes", async (req, res) => {
  try {
    const fetchQuoteFromChart = async (symbol: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000); // 2 second timeout per request
      
      // Try query2 first as it is less rate-limited, fallback to query1
      for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
        try {
          const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: controller.signal
          });

          if (response.ok) {
            const data: any = await response.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (meta) {
              const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
              const prevClose = meta.chartPreviousClose ?? price;
              const change = parseFloat((price - prevClose).toFixed(4));
              const changePercent = prevClose !== 0 ? parseFloat(((change / prevClose) * 100).toFixed(4)) : 0;
              clearTimeout(id);
              return {
                symbol,
                price,
                change,
                changePercent,
                name: meta.symbol
              };
            }
          }
        } catch (err) {
          // Continue to next host if one fails
        }
      }
      clearTimeout(id);
      return null;
    };

    // Parallel execution with graceful resolution
    const results = await Promise.all(SYMBOLS.map(symbol => fetchQuoteFromChart(symbol)));
    
    const quotes: Record<string, {
      price: number;
      change: number;
      changePercent: number;
      name?: string;
    }> = {};

    let validCount = 0;
    for (const r of results) {
      if (r && r.price > 0) {
        quotes[r.symbol] = {
          price: r.price,
          change: r.change,
          changePercent: r.changePercent,
          name: r.name,
        };
        validCount++;
      }
    }

    // If we couldn't fetch a single live symbol, trigger fallback mode cleanly
    if (validCount === 0) {
      throw new Error("All parallel quote fetches timed out or returned invalid data");
    }

    res.json({
      success: true,
      source: "Yahoo Finance Chart API",
      quotes,
      refreshedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn("API quote fetch failed, running inside local simulator mode:", error.message || error);
    res.json({
      success: false,
      source: "Local Simulator Mode",
      error: error.message || String(error),
      quotes: {},
      refreshedAt: new Date().toISOString()
    });
  }
});

// Start full-stack web setup
async function startServer() {
  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Live Option Server booted successfully on port ${PORT}`);
  });
}

startServer();
