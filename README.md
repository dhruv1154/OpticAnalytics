# 🔮 Greeks Pro: Advanced Options Analytics Terminal

A professional-grade Options Greeks simulator and strategy visualizer built with Python and Streamlit. This terminal supports both Global markets and the Indian NSE (Nifty/Bank Nifty) with real-time data integration via `yfinance`.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)
![Streamlit](https://img.shields.io/badge/streamlit-1.32.0-red.svg)

## 🚀 Features

### 1. Analytics Hub
- **Black-Scholes Pricing:** Real-time theoretical fair value for Call and Put options.
- **Dynamic Greeks:** Precise calculation of Delta (Δ), Gamma (Γ), Theta (Θ), Vega (ν), and Rho (ρ).
- **Sensitivity Surfaces:** 3D interactive heatmaps showing how Greeks evolve with Spot Price and Volatility.

### 2. Professional Trading Wheel
- **Interactive Option Chain:** Real-time chain with customizable Strike Intervals and Ranges.
- **ATM Highlighting:** Visual cues for At-The-Money regions.
- **NSE Support:** Specialized logic for Indian indices including weekly and monthly expiry rules.

### 3. Strategy Payoff Visualizer
- **Multi-Strategy Simulation:** Compare payoffs for Straddles, Strangles, Spreads, Covered Calls, and more.
- **Probability of Profit (PoP):** Quant-driven probability estimates based on log-normal price distributions.
- **Comparison Mode:** Overlay two different strategies to see relative risk/reward profiles.

### 4. Market History & Technicals
- **Interactive Candlesticks:** Zoomable price charts with Volume bars.
- **Technical Indicators:** SMA 20, 50, and 200 overlays.
- **Volatility Analysis:** Historical Volatility (HV) calculation to help identify over/underpriced options.

## Tech Stack
- **Frontend/App:** [Streamlit](https://streamlit.io/)
- **Quant Logic:** Python (NumPy, SciPy)
- **Data Engine:** [yfinance](https://github.com/ranaroussi/yfinance)
- **Visualization:** [Plotly](https://plotly.com/python/)

## Local Setup

1. **Clone the Repository:**
   ```bash
   git clone <your-github-repo-url>
   cd greeks-pro
   ```

2. **Create a Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application:**
   ```bash
   streamlit run main.py
   ```

## Indian Market (NSE) Tips
- Use tickers like `^NSEI` (Nifty 50) or `^NSEBANK` (Bank Nifty).
- For stocks, append `.NS` (e.g., `RELIANCE.NS`).
- The app automatically suggests lot sizes (50 for Nifty, 15 for Bank Nifty) and expiry rules.

---

*Disclaimer: This tool is for educational and analytical purposes only. Trading options involves significant risk.*
