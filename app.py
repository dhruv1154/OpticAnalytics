import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from scipy.stats import norm
from datetime import datetime

# ==============================================================================
# 1. PAGE CONFIG & THEME SETUP
# ==============================================================================
st.set_page_config(
    page_title="Indian Options Analytics & Strategy Dashboard",
    page_icon="🇮🇳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .reportview-container {
        background: #fafafa;
    }
    .main .block-container{
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
    div[data-testid="stMetricValue"] {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1e293b;
    }
    .custom-card {
        background-color: white;
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin-bottom: 1rem;
    }
    .metric-title {
        color: #64748b;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 2. CORE MATHEMATICS (BLACK-SCHOLES MODELLING & GREEKS)
# ==============================================================================
def black_scholes_greeks(S, K, T, r, sigma, option_type="Call"):
    """
    Computes theoretical value and first-order Greeks for Vanilla Options.
    Parameters:
      S: Spot price
      K: Strike price
      T: Time to expiration in years
      r: Risk-free rate (decimal, e.g. 0.05)
      sigma: Implied volatility (decimal, e.g. 0.22)
    """
    if T <= 0:
        # Expiry payoff
        val = max(0.0, S - K) if option_type == "Call" else max(0.0, K - S)
        return {
            "price": val, "delta": 1.0 if (option_type == "Call" and S > K) else (-1.0 if (option_type == "Put" and S < K) else 0.0),
            "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0
        }
    
    if sigma <= 0.0001:
        sigma = 0.0001
        
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    # Calculate CDF and PDF
    N_d1 = norm.cdf(d1)
    N_d2 = norm.cdf(d2)
    N_minus_d1 = norm.cdf(-d1)
    N_minus_d2 = norm.cdf(-d2)
    n_d1 = norm.pdf(d1)
    
    # Value
    if option_type == "Call":
        price = S * N_d1 - K * np.exp(-r * T) * N_d2
        delta = N_d1
        rho = K * T * np.exp(-r * T) * N_d2 / 100.0  # Normalized to 1% rate change
    else:
        price = K * np.exp(-r * T) * N_minus_d2 - S * N_minus_d1
        delta = -N_minus_d1
        rho = -K * T * np.exp(-r * T) * N_minus_d2 / 100.0
        
    # Share both Call & Put Greeks
    gamma = n_d1 / (S * sigma * np.sqrt(T))
    vega = S * np.sqrt(T) * n_d1 / 100.0  # Normalized to 1% absolute IV change
    
    # Theta (Daily decomposition)
    theta_call = (- (S * n_d1 * sigma) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * N_d2) / 365.25
    theta_put = (- (S * n_d1 * sigma) / (2 * np.sqrt(T)) + r * K * np.exp(-r * T) * N_minus_d2) / 365.25
    theta = theta_call if option_type == "Call" else theta_put
    
    return {
        "price": max(0.01, price),
        "delta": delta,
        "gamma": gamma,
        "theta": theta,
        "vega": vega,
        "rho": rho
    }

def solve_implied_volatility(market_price, S, K, T, r, option_type="Call"):
    """
    Bisection algorithm to solve for Implied Volatility given a market option price.
    """
    if T <= 0:
        return 0.15
    low_vol, high_vol = 0.0001, 3.0
    for _ in range(100):
        mid_vol = (low_vol + high_vol) / 2
        theoretical = black_scholes_greeks(S, K, T, r, mid_vol, option_type)["price"]
        if abs(theoretical - market_price) < 1e-4:
            return mid_vol
        if theoretical > market_price:
            high_vol = mid_vol
        else:
            low_vol = mid_vol
    return mid_vol

# ==============================================================================
# 3. YFINANCE DATA ACQUISITION & FALLBACK
# ==============================================================================
@st.cache_data(ttl=300)
def fetch_ticker_data(symbol):
    """
    Fetches real-time spot price and historical volatility for key Indian products.
    """
    try:
        yf_ticker = yf.Ticker(symbol)
        history = yf_ticker.history(period="5d")
        if history.empty:
            return None
        
        # Spot Price
        spot = float(history["Close"].iloc[-1])
        prev_close = float(history["Close"].iloc[-2]) if len(history) > 1 else spot
        daily_change = spot - prev_close
        pct_change = (daily_change / prev_close) * 100.0
        
        # Basic name lookup
        info = yf_ticker.info
        name = info.get("longName", symbol)
        
        return {
            "symbol": symbol,
            "name": name,
            "spot": spot,
            "change": daily_change,
            "pct_change": pct_change,
            "ticker_obj": yf_ticker
        }
    except Exception as e:
        return None

# Dictionary of Indian stocks and indexes
INDIAN_TICKERS = {
    "NIFTY 50 Index": "^NSEI",
    "NIFTY BANK Index": "^NSEBANK",
    "BSE SENSEX Index": "^BSEN",
    "RELIANCE Industries": "RELIANCE.NS",
    "TATA Consultancy Services (TCS)": "TCS.NS",
    "HDFC Bank": "HDFCBANK.NS",
    "INFOSYS": "INFY.NS",
    "ICICI Bank": "ICICIBANK.NS",
    "STATE Bank of India": "SBIN.NS",
    "BHARTI Airtel": "BHARTIARTL.NS",
    "ITC Limited": "ITC.NS"
}

# ==============================================================================
# 4. APP HEADER & SIDEBAR CONTROLS
# ==============================================================================
st.title("🇮🇳 Indian Options Pricing & Advanced Strategy Dashboard")
st.markdown("""
An institutional-grade option analytics workspace for Indian indices & equities. Pricing engine runs real-time Black-Scholes integrations, Greeks analysis, and multi-leg risk profiling.
""")

# Sidebar settings
st.sidebar.header("Asset Selection & Parameters")
selected_label = st.sidebar.selectbox("Select Asset / Index", list(INDIAN_TICKERS.keys()))
ticker_symbol = INDIAN_TICKERS[selected_label]

# Fetch market statistics
with st.spinner(f"Loading live quote for {ticker_symbol} from yfinance..."):
    data = fetch_ticker_data(ticker_symbol)

# If offline or yfinance rate limited, use beautiful simulated data!
if data is None:
    st.sidebar.warning("Unable to fetch live data from yfinance. Running in simulated fallback mode.")
    simulated_spots = {
        "^NSEI": 22450.00, "^NSEBANK": 48120.00, "^BSEN": 73950.00,
        "RELIANCE.NS": 2950.00, "TCS.NS": 3850.00, "HDFCBANK.NS": 1550.00,
        "INFY.NS": 1450.00, "ICICIBANK.NS": 1120.00, "SBIN.NS": 810.00,
        "BHARTIARTL.NS": 1390.00, "ITC.NS": 435.00
    }
    spot_price = simulated_spots.get(ticker_symbol, 1000.0)
    change = 42.50
    pct_change = 0.19
    asset_name = f"Simulated {selected_label}"
else:
    spot_price = data["spot"]
    change = data["change"]
    pct_change = data["pct_change"]
    asset_name = data["name"]

# Live Price Header widget
col_spot, col_chg, col_rf, col_iv = st.columns(4)
with col_spot:
    st.metric(label=f"🟢 {asset_name}", value=f"₹{spot_price:,.2f}")
with col_chg:
    st.metric(
        label="Daily Price Action", 
        value=f"{'+' if change >= 0 else ''}{change:,.2f} INR", 
        delta=f"{pct_change:+.2f}%"
    )

# Risk-free rate (7.0% represents Indian sovereign yield curve)
r_input = st.sidebar.slider("Risk-Free Rate (India G-Sec %)", min_value=1.0, max_value=12.0, value=7.0, step=0.1) / 100.0
with col_rf:
    st.metric(label="Risk-Free Rate (r)", value=f"{r_input*100:.1f}%")

# Implied Volatility
iv_input = st.sidebar.slider("Base Option Volatility (IV %)", min_value=5.0, max_value=90.0, value=15.5, step=0.5) / 100.0
with col_iv:
    st.metric(label="Implied Volatility (σ)", value=f"{iv_input*100:.1f}%")

# Expiry controls
days_to_expiry = st.sidebar.slider("Days to Expiration (DTE)", min_value=1, max_value=365, value=30, step=1)
T = days_to_expiry / 365.25

# ==============================================================================
# 5. STRATEGY LEG BUILDER (MULTI-LEG STRATEGIES)
# ==============================================================================
st.subheader("🛠️ Option Strategy Builder & Payoff Simulator")

# Presets inside column
preset_col, add_col = st.columns([3, 1])
preset_strategy = preset_col.selectbox(
    "Apply Standard Option Playbook Preset", 
    ["Custom / Manual", "Single Call", "Single Put", "Bull Call Spread", "Bear Put Spread", "Straddle", "Iron Condor", "Butterfly Spread"]
)

# Adaptive Indian Strikes increments centered at live spot
if spot_price > 30000:
    strike_step = 100
elif spot_price > 10000:
    strike_step = 50
elif spot_price > 2000:
    strike_step = 25
else:
    strike_step = 10

atm_strike = int(round(spot_price / strike_step) * strike_step)

# Initialize Session State legs if not present
if "legs" not in st.session_state or preset_strategy != "Custom / Manual":
    if preset_strategy == "Single Call":
        st.session_state.legs = [
            {"id": 1, "type": "Call", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input}
        ]
    elif preset_strategy == "Single Put":
        st.session_state.legs = [
            {"id": 1, "type": "Put", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input}
        ]
    elif preset_strategy == "Bull Call Spread":
        st.session_state.legs = [
            {"id": 1, "type": "Call", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input},
            {"id": 2, "type": "Call", "action": "Sell", "strike": atm_strike + strike_step * 2, "qty": 1, "iv": iv_input}
        ]
    elif preset_strategy == "Bear Put Spread":
        st.session_state.legs = [
            {"id": 1, "type": "Put", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input},
            {"id": 2, "type": "Put", "action": "Sell", "strike": atm_strike - strike_step * 2, "qty": 1, "iv": iv_input}
        ]
    elif preset_strategy == "Straddle":
        st.session_state.legs = [
            {"id": 1, "type": "Call", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input},
            {"id": 2, "type": "Put", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input}
        ]
    elif preset_strategy == "Iron Condor":
        st.session_state.legs = [
            {"id": 1, "type": "Put", "action": "Buy", "strike": atm_strike - strike_step * 3, "qty": 1, "iv": iv_input},
            {"id": 2, "type": "Put", "action": "Sell", "strike": atm_strike - strike_step * 1, "qty": 1, "iv": iv_input},
            {"id": 3, "type": "Call", "action": "Sell", "strike": atm_strike + strike_step * 1, "qty": 1, "iv": iv_input},
            {"id": 4, "type": "Call", "action": "Buy", "strike": atm_strike + strike_step * 3, "qty": 1, "iv": iv_input}
        ]
    elif preset_strategy == "Butterfly Spread":
        st.session_state.legs = [
            {"id": 1, "type": "Call", "action": "Buy", "strike": atm_strike - strike_step * 1, "qty": 1, "iv": iv_input},
            {"id": 2, "type": "Call", "action": "Sell", "strike": atm_strike, "qty": 2, "iv": iv_input},
            {"id": 3, "type": "Call", "action": "Buy", "strike": atm_strike + strike_step * 1, "qty": 1, "iv": iv_input}
        ]
    else:  # Initial Default
        st.session_state.legs = [
            {"id": 1, "type": "Call", "action": "Buy", "strike": atm_strike, "qty": 1, "iv": iv_input}
        ]

# Create editing interface for strategy legs arranged in columns
legs_to_keep = []
leg_cols = st.columns(len(st.session_state.legs))

for i, leg in enumerate(st.session_state.legs):
    with leg_cols[i]:
        st.markdown(f"**Option Leg #{leg['id']}**")
        leg_type = st.selectbox(f"Type", ["Call", "Put"], index=0 if leg["type"] == "Call" else 1, key=f"type_{i}")
        leg_act = st.selectbox(f"Action", ["Buy", "Sell"], index=0 if leg["action"] == "Buy" else 1, key=f"act_{i}")
        leg_strike = st.number_input(f"Strike Price (₹)", value=int(leg["strike"]), step=strike_step, key=f"strike_{i}")
        leg_qty = st.number_input(f"Lot Quantity", min_value=1, max_value=100, value=leg["qty"], step=1, key=f"qty_{i}")
        leg_iv = st.slider(f"Leg IV % Override", min_value=5.0, max_value=90.0, value=float(leg["iv"] * 100), key=f"iv_{i}") / 100.0
        
        # Calculate theoretical price for this item
        stats = black_scholes_greeks(spot_price, leg_strike, T, r_input, leg_iv, leg_type)
        premium = stats["price"]
        st.caption(f"Theoretical Cost: **₹{premium:,.1f}**")
        
        legs_to_keep.append({
            "id": leg["id"],
            "type": leg_type,
            "action": leg_act,
            "strike": leg_strike,
            "qty": leg_qty,
            "iv": leg_iv,
            "premium": premium
        })

st.session_state.legs = legs_to_keep

# ==============================================================================
# 6. COMPUTE COMPOSITE ANALYTICS & GREEKS
# ==============================================================================
net_delta, net_gamma, net_theta, net_vega, net_rho = 0.0, 0.0, 0.0, 0.0, 0.0
initial_cost = 0.0

for leg in st.session_state.legs:
    mult = 1.0 if leg["action"] == "Buy" else -1.0
    stats = black_scholes_greeks(spot_price, leg["strike"], T, r_input, leg["iv"], leg["type"])
    
    net_delta += stats["delta"] * leg["qty"] * mult
    net_gamma += stats["gamma"] * leg["qty"] * mult
    net_theta += stats["theta"] * leg["qty"] * mult
    net_vega += stats["vega"] * leg["qty"] * mult
    net_rho += stats["rho"] * leg["qty"] * mult
    initial_cost += stats["price"] * leg["qty"] * mult

# Interactive Metrics cards for Composite Strategy
st.markdown("### Strategy Risk Profile (Composite Net Greeks)")
greek_col1, greek_col2, greek_col3, greek_col4, greek_col5, greek_col6 = st.columns(6)

with greek_col1:
    st.metric("Net Cost / Credit", f"₹{initial_cost:,.2f}", help="Positive means debit (cost) to open, negative means credit received.")
with greek_col2:
    st.metric("Strategy Delta (Δ)", f"{net_delta:+.4f}", help="Position bias. Rising ₹1 in spot changes strategy premium by this much.")
with greek_col3:
    st.metric("Strategy Gamma (Γ)", f"{net_gamma:+.6f}", help="Delta acceleration. Measures stability of position Delta.")
with greek_col4:
    st.metric("Strategy Theta (Θ)", f"₹{net_theta:+.2f} / day", help="Daily time decay decay vector across active positions.")
with greek_col5:
    st.metric("Strategy Vega (ν)", f"₹{net_vega:+.2f} / %", help="Volatility exposure. Gain/loss per 1% absolute IV shift.")
with greek_col6:
    st.metric("Strategy Rho (ρ)", f"{net_rho:+.4f}", help="Sensitivity to Reserve Bank of India (RBI) rate shifts.")

# ==============================================================================
# 7. VISUALIZATIONS & TAB INTEGRATION
# ==============================================================================
tab_payoff, tab_greek_profiles, tab_chains = st.tabs(["📊 Option Payoff Profiles", "📈 Greek Sensitivity Analysis", "⛓️ Implied Volatility Smile"])

# Generative pricing boundary for charts
price_grid = np.linspace(spot_price * 0.82, spot_price * 1.18, 100)

with tab_payoff:
    st.markdown("#### Dynamic Strategy Payoff Diagrams")
    st.markdown("""
    This interactive plot compares the **Payoff at Expiration (Solid)** against the **Theoretical Unexpired Value (Dashed)** across a ±18% price range of the selected asset.
    """)
    
    # Expiration Payoff & Current Value Payoff grids
    payoff_values = []
    current_values = []
    
    for S_val in price_grid:
        leg_exit_total = 0.0
        leg_current_total = 0.0
        for leg in st.session_state.legs:
            mult = 1.0 if leg["action"] == "Buy" else -1.0
            
            # Payoff at Expiry
            intrinsic = max(0.0, S_val - leg["strike"]) if leg["type"] == "Call" else max(0.0, leg["strike"] - S_val)
            leg_exit_payoff = (intrinsic - leg["premium"]) * leg["qty"] * mult
            leg_exit_total += leg_exit_payoff
            
            # Current Theoretical Value
            cur_stats = black_scholes_greeks(S_val, leg["strike"], T, r_input, leg["iv"], leg["type"])
            leg_cur_val = (cur_stats["price"] - leg["premium"]) * leg["qty"] * mult
            leg_current_total += leg_cur_val
            
        payoff_values.append(leg_exit_total)
        current_values.append(leg_current_total)

    # Plot Go Graph
    fig = go.Figure()
    
    # Expiry line
    fig.add_trace(go.Scatter(
        x=price_grid, y=payoff_values,
        mode='lines',
        name='Payoff at Expiration (T=0)',
        line=dict(color='#ef4444', width=2.5)
    ))
    
    # Current unexpired line
    fig.add_trace(go.Scatter(
        x=price_grid, y=current_values,
        mode='lines',
        name=f'Theoretical Payoff Today (DTE={days_to_expiry})',
        line=dict(color='#3b82f6', width=2, dash='dash')
    ))
    
    # Spot Price Indicator
    fig.add_vline(x=spot_price, line_dash="solid", line_color="#10b981", line_width=1.5, annotation_text=f"Live Spot (₹{spot_price:,.1f})")
    
    # Zero line
    fig.add_hline(y=0.0, line_dash="solid", line_color="#64748b", line_width=1.0)
    
    fig.update_layout(
        title=f"Multi-Leg Strategy Interactive Payoff Spectrum (Spot: ₹{spot_price:,.1f})",
        xaxis_title="Underlying Asset Spot Price (INR)",
        yaxis_title="Profit / Loss (₹)",
        template="plotly_white",
        hovermode="x unified",
        margin=dict(l=40, r=40, t=55, b=40),
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01)
    )
    st.plotly_chart(fig, use_container_width=True)

with tab_greek_profiles:
    st.markdown("#### Individual Greeks Sensitivity Profiles")
    st.markdown("""
    Select a target option Greek vector to observe how the strategy's total risk transforms continuously as the underlying spot asset trends.
    """)
    
    select_greek = st.selectbox("Select Greek Parameter profile to plot", ["Delta (Δ)", "Gamma (Γ)", "Theta (Θ)", "Vega (ν)", "Rho (ρ)"])
    
    greek_grid_vals = []
    for S_val in price_grid:
        total_g_val = 0.0
        for leg in st.session_state.legs:
            mult = 1.0 if leg["action"] == "Buy" else -1.0
            g_stats = black_scholes_greeks(S_val, leg["strike"], T, r_input, leg["iv"], leg["type"])
            
            if select_greek == "Delta (Δ)":
                total_g_val += g_stats["delta"] * leg["qty"] * mult
            elif select_greek == "Gamma (Γ)":
                total_g_val += g_stats["gamma"] * leg["qty"] * mult
            elif select_greek == "Theta (Θ)":
                total_g_val += g_stats["theta"] * leg["qty"] * mult
            elif select_greek == "Vega (ν)":
                total_g_val += g_stats["vega"] * leg["qty"] * mult
            elif select_greek == "Rho (ρ)":
                total_g_val += g_stats["rho"] * leg["qty"] * mult
                
        greek_grid_vals.append(total_g_val)
        
    fig_g = go.Figure()
    fig_g.add_trace(go.Scatter(
        x=price_grid, y=greek_grid_vals,
        mode='lines',
        name=select_greek,
        line=dict(color='#8b5cf6', width=2.5)
    ))
    fig_g.add_vline(x=spot_price, line_dash="solid", line_color="#10b981", line_width=1.5, annotation_text=f"Live Spot (₹{spot_price:,.1f})")
    fig_g.add_hline(y=0.0, line_dash="solid", line_color="#64748b", line_width=1.0)
    
    fig_g.update_layout(
        title=f"Strategy Net {select_greek} Transformation Curve",
        xaxis_title="Underlying Asset Spot Price (INR)",
        yaxis_title="Greeks Vector Value",
        template="plotly_white",
        margin=dict(l=40, r=40, t=55, b=40)
    )
    st.plotly_chart(fig_g, use_container_width=True)

with tab_chains:
    st.markdown("#### The Volatility Smile Model Matrix")
    st.markdown("""
    In equity derivative markets, options are subject to volatility smiles or smirks—meaning At-The-Money options trade at lower implied volatilities compared to protective OTM Puts due to downside tail-risk hedging demand.
    """)
    
    # Generate an elegant continuous mock Volatility smile mapping (customizable based on asset parameters)
    smile_strikes = np.linspace(spot_price * 0.85, spot_price * 1.15, 12)
    smile_ivs = []
    for K_val in smile_strikes:
        # standard skew equation center at ATM
        pct_dist = (K_val - spot_price) / spot_price
        skew_adjust = iv_input * (1.0 - 0.9 * pct_dist + 2.5 * (pct_dist ** 2))
        smile_ivs.append(skew_adjust * 100.0)
        
    fig_smile = go.Figure()
    fig_smile.add_trace(go.Scatter(
        x=smile_strikes, y=smile_ivs,
        mode='lines+markers',
        name='Implied Volatility Smile',
        line=dict(color='#06b6d4', width=2.5),
        marker=dict(size=6, color='#0891b2')
    ))
    fig_smile.add_vline(x=spot_price, line_dash="solid", line_color="#10b981", line_width=1.5, annotation_text="ATM Spot Boundary")
    
    fig_smile.update_layout(
        title="Computed Implied Volatility Profile Across Strike Matrix (Strike Skew Model)",
        xaxis_title="Option Strike Price (INR)",
        yaxis_title="Implied Volatility (IV %)",
        template="plotly_white",
        margin=dict(l=40, r=40, t=55, b=40)
    )
    st.plotly_chart(fig_smile, use_container_width=True)

# ==============================================================================
# 8. HOW TO RUN INSTRUCTIONS
# ==============================================================================
st.markdown("---")
st.markdown("### 🚀 Deployment & Local Execution")
st.markdown("""
To run this application locally on your computer or deploy it to stream, perform the following steps:

1. **Setup Workspace Directories**:
   Create a new folder and add this code as `app.py`.
   
2. **Setup Dependencies**:
   Save a file named `requirements.txt` containing the following package declarations:
   ```text
   streamlit>=1.30.0
   yfinance>=0.2.30
   plotly>=5.18.0
   pandas>=2.0.0
   numpy>=1.24.0
   scipy>=1.10.0
   ```
   
3. **Execute locally in Terminal**:
   ```bash
   pip install -r requirements.txt
   streamlit run app.py
   ```
   
4. **Publish online**:
   Commit `app.py` and `requirements.txt` to a GitHub repository, visit [Streamlit Community Cloud](https://share.streamlit.io/), log in, select your repository, and click **Deploy**. Your app is live with single-click zero-cost execution!
""")
