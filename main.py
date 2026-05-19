import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import yfinance as yf
from datetime import datetime, date, timedelta
from scipy.stats import norm
from black_scholes import BlackScholesModel

# --- Helper Functions ---
def resolve_ticker(ticker_input, is_nse):
    if not is_nse:
        return ticker_input
    
    t_in = ticker_input.upper()
    if t_in == "NIFTY": return "^NSEI"
    elif t_in in ["BANKNIFTY", "NIFTYBANK"]: return "^NSEBANK"
    elif t_in == "RELIANCE": return "RELIANCE.NS"
    elif not t_in.endswith(".NS") and not t_in.startswith("^"): return f"{t_in}.NS"
    return t_in

def get_upcoming_expiry(target_weekday=1, monthly=False):
    """target_weekday: 0=Mon, 1=Tue, 2=Wed, 3=Thu..."""
    dt = date.today()
    if monthly:
        # Find last Tuesday of the month
        last_day = date(dt.year, dt.month, 1) + timedelta(days=32)
        last_day = last_day.replace(day=1) - timedelta(days=1)
        while last_day.weekday() != target_weekday:
            last_day -= timedelta(days=1)
        if last_day < dt:
            # Get next month's last Tuesday
            next_mon = date(dt.year + (dt.month // 12), (dt.month % 12) + 1, 1)
            last_day = next_mon + timedelta(days=32)
            last_day = last_day.replace(day=1) - timedelta(days=1)
            while last_day.weekday() != target_weekday:
                last_day -= timedelta(days=1)
        return last_day
    else:
        # Get next Tuesday
        days_ahead = target_weekday - dt.weekday()
        if days_ahead <= 0: days_ahead += 7
        return dt + timedelta(days=days_ahead)

def calculate_pop(s, k_low, k_high, sigma, t, strategy_type):
    """Simplified Probability of Profit using Log-Normal distribution"""
    if t <= 0: return 0.5
    # Standard deviation of log returns
    std_dev = sigma * np.sqrt(t)
    
    def prob_below(price):
        # Probability move is below 'price'
        d2 = (np.log(price / s) - (-0.5 * sigma**2) * t) / std_dev
        return norm.cdf(d2)

    if "Call" in strategy_type and "Short" not in strategy_type:
        return 1 - prob_below(k_low)
    if "Put" in strategy_type and "Short" not in strategy_type:
        return prob_below(k_low)
    if "Straddle" in strategy_type or "Strangle" in strategy_type:
        if "Short" in strategy_type:
            return prob_below(k_high) - prob_below(k_low)
        else:
            return 1 - (prob_below(k_high) - prob_below(k_low))
    return 0.5 # Default

def calc_complex_payoff(spot, k_low, k_high, cost, lot, type):
    if type == "Long Call": return (max(0, spot - k_low) - cost) * lot
    if type == "Short Call": return (cost - max(0, spot - k_low)) * lot
    if type == "Long Put": return (max(0, k_low - spot) - cost) * lot
    if type == "Short Put": return (cost - max(0, k_low - spot)) * lot
    
    if type == "Long Straddle": 
        return (max(0, spot - k_low) + max(0, k_low - spot) - cost) * lot
    if type == "Short Straddle": 
        return (cost - (max(0, spot - k_low) + max(0, k_low - spot))) * lot
        
    if type == "Long Strangle":
        return (max(0, k_low - spot) + max(0, spot - k_high) - cost) * lot
    if type == "Short Strangle":
        return (cost - (max(0, k_low - spot) + max(0, spot - k_high))) * lot
        
    if type == "Bull Call Spread":
        return (max(0, spot - k_low) - max(0, spot - k_high) - cost) * lot
    if type == "Bear Put Spread":
        return (max(0, k_high - spot) - max(0, k_low - spot) - cost) * lot
        
    if type == "Covered Call": return (spot - s + cost - max(0, spot - k_low)) * lot
    if type == "Protective Put": return (spot - s - cost + max(0, k_low - spot)) * lot
    return 0

# --- Page Config ---
st.set_page_config(
    page_title="Greeks Pro | Options Analytics",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- State Management ---
if 's_val' not in st.session_state:
    st.session_state.s_val = 150.0
if 'ui_theme' not in st.session_state:
    st.session_state.ui_theme = "Deep Space"

# --- UI Themes Persistence ---
THEMES = {
    "Deep Space": {
        "main_bg": "#0e1117",
        "card_bg": "#1e2130",
        "border": "#3e4253",
        "accent": "#00d4ff",
        "text": "#ffffff"
    },
    "Cyberpunk": {
        "main_bg": "#00050a",
        "card_bg": "#0a0e14",
        "border": "#ff0055",
        "accent": "#00ffd5",
        "text": "#e0e0e0"
    },
    "Forest": {
        "main_bg": "#0a1a0a",
        "card_bg": "#142814",
        "border": "#2e4d2e",
        "accent": "#4dff4d",
        "text": "#d0ffd0"
    }
}

theme = THEMES[st.session_state.ui_theme]

# Custom Styling
st.markdown(f"""
    <style>
    .main {{ background-color: {theme['main_bg']}; color: {theme['text']}; }}
    .stMetric {{ background-color: {theme['card_bg']}; padding: 15px; border-radius: 12px; border: 1px solid {theme['border']}; }}
    [data-testid="stExpander"] {{ border: 1px solid {theme['border']}; border-radius: 12px; margin-bottom: 15px; background-color: {theme['card_bg']}; }}
    .stButton>button {{ border-radius: 8px; border: 1px solid {theme['border']}; background-color: {theme['card_bg']}; color: {theme['accent']}; }}
    .stTab {{ color: {theme['text']}; }}
    .st-emotion-cache-183011a {{ background-color: {theme['card_bg']}; }}
    </style>
""", unsafe_allow_html=True)

# --- Sidebar Inputs ---
st.sidebar.title("Analytics Engine")

# Theme Switcher (UI Choose)
with st.sidebar.expander("UI Customization", expanded=False):
    selected_theme = st.selectbox("Select Interface Mood", list(THEMES.keys()), index=list(THEMES.keys()).index(st.session_state.ui_theme))
    if selected_theme != st.session_state.ui_theme:
        st.session_state.ui_theme = selected_theme
        st.rerun()

# Section 0: Market Data Sync
with st.sidebar.expander("Market Search", expanded=True):
    col_t1, col_t2 = st.columns([3, 1])
    ticker_input = col_t1.text_input("Ticker", value="AAPL", help="e.g. AAPL, TSLA, RELIANCE, NIFTY").upper()
    is_nse = col_t2.checkbox("NSE", help="Append .NS for Indian Stocks", value=False)
    
    st.caption("Common: NIFTY (^NSEI), BANKNIFTY (^NSEBANK), RELIANCE, TCS")
    
    if st.button("Fetch Real-Time Data", use_container_width=True):
        final_ticker = resolve_ticker(ticker_input, is_nse)
            
        try:
            with st.spinner(f"Querying {final_ticker}..."):
                ticker_obj = yf.Ticker(final_ticker)
                data = ticker_obj.history(period="1d")
                
                if not data.empty:
                    last_price = data['Close'].iloc[-1]
                    st.session_state.s_val = float(last_price)
                    st.success(f"Market Quote: {last_price:,.2f}")
                else:
                    # Try basic info as fallback
                    fast = ticker_obj.fast_info
                    if 'last_price' in fast:
                        st.session_state.s_val = float(fast['last_price'])
                        st.success(f"Price: {st.session_state.s_val:,.2f}")
                    else:
                        st.warning(f"Could not fetch {final_ticker}. Please ensure the symbol is correct.")
                        st.info("Tip: For NSE indices, use ^NSEI (Nifty) or ^NSEBANK (Bank Nifty).")
        except Exception as e:
            st.error(f"Sync Issue: Ticker might be restricted or invalid.")

# Section 1: Global Config
with st.sidebar.expander("Currency & Scale", expanded=True):
    currency_map = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
    currency = st.selectbox("Base Currency", list(currency_map.keys()), index=0 if is_nse else 1)
    c_sym = currency_map[currency]
    
    # Auto-suggest lot sizes for NSE
    def_lot = 1
    if is_nse:
        if ticker_input == "NIFTY" or "^NSEI" in ticker_input: def_lot = 50
        elif ticker_input == "BANKNIFTY" or "^NSEBANK" in ticker_input: def_lot = 15
        
    lot_size = st.number_input("Lot Size (Qty)", value=def_lot, step=1)

# Section 2: Asset & Strike
with st.sidebar.expander("Core Parameters", expanded=True):
    s = st.number_input(f"Stock Price ({c_sym})", value=st.session_state.s_val, step=0.05)
    k = st.number_input(f"Strike Price ({c_sym})", value=s, step=0.05)

# Section 3: Time to Expiry (Prominent)
with st.sidebar.expander("Expiration Date", expanded=True):
    today = date.today()
    
    if is_nse:
        exp_type = st.radio("NSE Expiry Rule", ["Weekly (Tue)", "Monthly (Last Tue)", "Custom"], horizontal=True)
        if exp_type == "Weekly (Tue)":
            suggested_date = get_upcoming_expiry(1, monthly=False)
        elif exp_type == "Monthly (Last Tue)":
            suggested_date = get_upcoming_expiry(1, monthly=True)
        else:
            suggested_date = today + timedelta(days=30)
    else:
        suggested_date = today + timedelta(days=30)
        
    expiry_date = st.date_input("Select Expiry Date", value=suggested_date)
    t_days = (expiry_date - today).days
    if t_days < 0:
        st.error("Invalid Expiry!")
        t_days = 0
    st.info(f"Time to Expiry: {t_days} Days")

# Section 4: Market Dynamics
with st.sidebar.expander("Risk & Volatility", expanded=False):
    r = st.slider("Risk-Free Rate (%)", 0.0, 15.0, 7.0 if is_nse else 5.0) / 100
    sigma_input = st.slider("Implied Volatility (%)", 1.0, 150.0, 20.0) / 100

# Section 5: Analytics Settings
with st.sidebar.expander("Wheel Settings", expanded=False):
    strike_range_wheel = st.slider("Strike Range (%)", 5, 50, 15)
    strike_step_wheel = st.number_input("Strike Interval", value=2.5 if s < 1000 else 50.0, step=0.5)

# Master Variables
t = t_days / 365
# Handle T=0 edge case to avoid division by zero in greeks
t_safe = max(t, 1e-6)
model = BlackScholesModel(S=s, K=k, T=t_safe, r=r, sigma=sigma_input)

# --- Calculations ---
premium_call = model.call_price() * lot_size
premium_put = model.put_price() * lot_size
# Margin estimate (Roughly 20% of contract value for NSE)
margin_est = (s * lot_size) * 0.20 if is_nse else (s * lot_size) * 0.15

# --- Quick Snapshot ---
st.sidebar.markdown("---")
st.sidebar.subheader("Execution Snapshot")
snap_col1, snap_col2 = st.sidebar.columns(2)
snap_col1.metric("Call Prem.", f"{c_sym}{premium_call:,.0f}")
snap_col2.metric("Put Prem.", f"{c_sym}{premium_put:,.0f}")
st.sidebar.metric("Estimated Margin", f"{c_sym}{margin_est:,.0f}")

# --- Main App Layout ---
st.title("Greeks : Professional Terminal")

tabs = st.tabs(["Analytics Hub", "Trading Wheel", "Payoff Simulation", "Market History"])

# --- TAB 1: ANALYTICS HUB ---
with tabs[0]:
    col_call, col_put = st.columns(2)
    
    with col_call:
        st.markdown(f'<div style="border-left: 5px solid #00FF00; padding: 10px; background-color: {theme["card_bg"]}; border-radius: 8px;"><h3>Call Option</h3></div>', unsafe_allow_html=True)
        st.metric("Fair Value", f"{c_sym}{model.call_price():.2f}")
        g1, g2, g3 = st.columns(3)
        g1.metric("Delta", f"{model.delta()['call']:.3f}")
        g2.metric("Theta", f"{model.theta()['call']:.3f}")
        g3.metric("Gamma", f"{model.gamma():.5f}")
        g4, g5 = st.columns(2)
        g4.metric("Vega", f"{model.vega():.3f}")
        g5.metric("Rho", f"{model.rho()['call']:.3f}")

    with col_put:
        st.markdown(f'<div style="border-left: 5px solid #FF0000; padding: 10px; background-color: {theme["card_bg"]}; border-radius: 8px;"><h3>Put Option</h3></div>', unsafe_allow_html=True)
        st.metric("Fair Value", f"{c_sym}{model.put_price():.2f}")
        g1, g2, g3 = st.columns(3)
        g1.metric("Delta", f"{model.delta()['put']:.3f}")
        g2.metric("Theta", f"{model.theta()['put']:.3f}")
        g3.metric("Gamma", f"{model.gamma():.5f}")
        g4, g5 = st.columns(2)
        g4.metric("Vega", f"{model.vega():.3f}")
        g5.metric("Rho", f"{model.rho()['put']:.3f}")

    st.markdown("---")
    st.subheader("Greek Sensitivity Surfaces")
    greek_sel = st.selectbox("Primary Heatmap Greek", ["Delta", "Gamma", "Vega", "Theta"])
    
    # Fast surface gen
    s_range = np.linspace(s * 0.85, s * 1.15, 12)
    v_range = np.linspace(0.1, 0.6, 12)
    z_val = np.zeros((12, 12))
    
    for i, vol in enumerate(v_range):
        for j, spot in enumerate(s_range):
            m_temp = BlackScholesModel(S=spot, K=k, T=t_safe, r=r, sigma=vol)
            if greek_sel == "Delta": z_val[i, j] = m_temp.delta()["call"]
            elif greek_sel == "Gamma": z_val[i, j] = m_temp.gamma()
            elif greek_sel == "Vega": z_val[i, j] = m_temp.vega()
            elif greek_sel == "Theta": z_val[i, j] = m_temp.theta()["call"]

    fig_surface = go.Figure(data=[go.Surface(z=z_val, x=s_range, y=v_range, colorscale="IceFire")])
    fig_surface.update_layout(
        title=f"Call {greek_sel} Surface",
        scene=dict(xaxis_title="Spot", yaxis_title="IV", zaxis_title=greek_sel),
        height=500, margin=dict(l=0, r=0, b=0, t=40)
    )
    st.plotly_chart(fig_surface, use_container_width=True)

# --- TAB 2: TRADING WHEEL ---
with tabs[1]:
    st.subheader("Professional Trading Wheel")
    
    # Expiry Multi-selector at top of tab
    exp_col1, exp_col2, exp_col3 = st.columns([2, 2, 1])
    with exp_col1:
        wheel_expiry = st.date_input("Tab Expiry Context", value=expiry_date, key="wheel_exp")
    with exp_col2:
        wheel_days = (wheel_expiry - today).days
        st.info(f"Days to Expiry: {wheel_days}")
    with exp_col3:
        if st.button("Sync Global", use_container_width=True):
            # This is a bit tricky in Streamlit without session state for expiry_date specifically
            # but we can just use the local wheel_expiry for this tab.
            pass

    # Market Sentiment Summary
    sent_bg = theme['card_bg']
    
    # Try to fetch HV for the sentiment card
    hv_display = "N/A"
    try:
        t_obj = yf.Ticker(resolve_ticker(ticker_input, is_nse))
        h_data = t_obj.history(period="1mo")
        if not h_data.empty:
            rets = h_data['Close'].pct_change()
            hv_val = rets.std() * np.sqrt(252) * 100
            hv_display = f"{hv_val:.1f}%"
    except:
        pass

    st.markdown(f"""
        <div style="background-color: {sent_bg}; padding: 15px; border-radius: 10px; border: 1px solid {theme['border']}; margin-bottom: 20px;">
            <h4 style="margin-top: 0;">Market Sentiment & Volatility</h4>
            <div style="display: flex; justify-content: space-around;">
                <div style="text-align: center;"> <p style="margin: 0; color: gray;">Implied Vol (IV)</p> <h3 style="margin: 0;">{sigma_input*100:.1f}%</h3> </div>
                <div style="text-align: center;"> <p style="margin: 0; color: gray;">Hist. Vol (HV)</p> <h3 style="margin: 0;">{hv_display}</h3> </div>
                <div style="text-align: center;"> <p style="margin: 0; color: gray;">Lot Size</p> <h3 style="margin: 0;">{lot_size}</h3> </div>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    col_f1, col_f2 = st.columns([2, 1])
    with col_f1:
        view_mode = st.radio("Chain View", ["All", "Calls Only", "Puts Only"], horizontal=True, key="wheel_view")
    with col_f2:
        itm_only = st.checkbox("Focus At-The-Money (±5%)", value=False, key="wheel_itm")

    def generate_pro_chain(s, r, sigma, t, pct, step):
        t_w = max(t, 1e-6)
        rng = s * (pct / 100)
        lower_strike = (s - rng)//step*step
        upper_strike = (s + rng)//step*step + step
        strikes = np.arange(lower_strike, upper_strike, step)
        
        rows = []
        for strike in strikes:
            m = BlackScholesModel(S=s, K=strike, T=t_w, r=r, sigma=sigma)
            rows.append({
                "C_Delta": m.delta()["call"],
                "C_Theta": m.theta()["call"],
                "Call Price": m.call_price(),
                " STRIKE ": strike,
                "Put Price": m.put_price(),
                "P_Theta": m.theta()["put"],
                "P_Delta": m.delta()["put"]
            })
        df = pd.DataFrame(rows)
        
        if itm_only:
            df = df[(df[" STRIKE "] >= s * 0.95) & (df[" STRIKE "] <= s * 1.05)]
            
        if view_mode == "Calls Only":
            df = df[["C_Delta", "C_Theta", "Call Price", " STRIKE "]]
        elif view_mode == "Puts Only":
            df = df[[" STRIKE ", "Put Price", "P_Theta", "P_Delta"]]
            
        return df

    # Use the wheel-specific days
    t_wheel = (wheel_expiry - today).days / 365
    chain_df = generate_pro_chain(s, r, sigma_input, t_wheel, strike_range_wheel, strike_step_wheel)
    
    # Proper wheel styling: Highlight the closest strike to spot
    def highlight_atm(row):
        is_atm = abs(row[" STRIKE "] - s) < (strike_step_wheel * 0.6)
        color = f"background-color: {theme['accent']}33" if is_atm else ""
        return [color] * len(row)

    fmt_dict = {
        "Call Price": f"{c_sym}{{:.2f}}",
        "Put Price": f"{c_sym}{{:.2f}}",
        " STRIKE ": f"**{c_sym}{{:.2f}}**",
        "C_Delta": "{:.2f}",
        "P_Delta": "{:.2f}",
        "C_Theta": "{:.2f}",
        "P_Theta": "{:.2f}"
    }
    
    # Filter keys in fmt_dict to match df columns
    active_fmts = {k: v for k, v in fmt_dict.items() if k in chain_df.columns}

    styled_chain = chain_df.style.format(active_fmts)
    
    if "Call Price" in chain_df.columns:
        styled_chain = styled_chain.background_gradient(subset=["Call Price"], cmap="Greens")
    if "Put Price" in chain_df.columns:
        styled_chain = styled_chain.background_gradient(subset=["Put Price"], cmap="Reds")
    
    styled_chain = styled_chain.apply(highlight_atm, axis=1)

    st.dataframe(styled_chain, use_container_width=True, height=600)
    
    st.caption("Row highlighted in blue indicates the At-The-Money (ATM) region.")

# --- TAB 3: PAYOFF SIMULATION ---
with tabs[2]:
    st.subheader("Advanced Strategy Analysis")
    
    comp_col1, comp_col2 = st.columns([3, 1])
    with comp_col2:
        compare_mode = st.toggle("Compare Two Strategies", value=False)
    
    strategies = [
        "Long Call", "Short Call", "Long Put", "Short Put", 
        "Long Straddle", "Short Straddle", 
        "Long Strangle", "Short Strangle",
        "Bull Call Spread", "Bear Put Spread",
        "Covered Call", "Protective Put"
    ]
    
    def get_strat_config(prefix, default_type):
        with st.expander(f"{prefix} Strategy Details", expanded=True):
            col1, col2, col3 = st.columns(3)
            s_type = col1.selectbox(f"{prefix} Type", strategies, index=strategies.index(default_type), key=f"{prefix}_type")
            
            m_at_k = BlackScholesModel(S=s, K=k, T=t_safe, r=r, sigma=sigma_input)
            
            # Local strike logic
            if "Strangle" in s_type:
                lk_low = col2.number_input(f"{prefix} Low Strike", value=s * 0.95, step=1.0, key=f"{prefix}_lk_low")
                lk_high = col3.number_input(f"{prefix} High Strike", value=s * 1.05, step=1.0, key=f"{prefix}_lk_high")
                m_low = BlackScholesModel(S=s, K=lk_low, T=t_safe, r=r, sigma=sigma_input)
                m_high = BlackScholesModel(S=s, K=lk_high, T=t_safe, r=r, sigma=sigma_input)
                def_cost = m_low.put_price() + m_high.call_price()
            elif "Spread" in s_type:
                lk_low = col2.number_input(f"{prefix} Low Strike", value=s * 0.98, step=1.0, key=f"{prefix}_lk_low")
                lk_high = col3.number_input(f"{prefix} High Strike", value=s * 1.02, step=1.0, key=f"{prefix}_lk_high")
                m_low = BlackScholesModel(S=s, K=lk_low, T=t_safe, r=r, sigma=sigma_input)
                m_high = BlackScholesModel(S=s, K=lk_high, T=t_safe, r=r, sigma=sigma_input)
                if "Bull" in s_type: def_cost = m_low.call_price() - m_high.call_price()
                else: def_cost = m_high.put_price() - m_low.put_price()
            else:
                lk_low = col2.number_input(f"{prefix} Strike", value=k, step=1.0, key=f"{prefix}_lk_low")
                lk_high = lk_low
                def_cost = m_at_k.call_price() if "Call" in s_type else m_at_k.put_price()
                if "Straddle" in s_type: def_cost = m_at_k.call_price() + m_at_k.put_price()

            c_cost = col1.number_input(f"{prefix} Cost/Credit", value=float(def_cost), step=0.1, key=f"{prefix}_cost")
            c_lot = col2.number_input(f"{prefix} Lot Size", value=int(lot_size), step=1, key=f"{prefix}_lot")
            
            return {"type": s_type, "k_low": lk_low, "k_high": lk_high, "cost": c_cost, "lot": c_lot}

    conf1 = get_strat_config("Primary", "Long Call")
    conf2 = None
    if compare_mode:
        conf2 = get_strat_config("Overlay", "Short Put")

    # Simulation range (expanded for visibility)
    sim_spots = np.linspace(s * 0.4, s * 1.6, 150)
    
    p1 = [calc_complex_payoff(sp, conf1['k_low'], conf1['k_high'], conf1['cost'], conf1['lot'], conf1['type']) for sp in sim_spots]
    
    fig_payoff = go.Figure()
    fig_payoff.add_trace(go.Scatter(x=sim_spots, y=p1, name=f"P1: {conf1['type']}", line=dict(color=theme['accent'], width=3), fill='tozeroy'))
    
    if conf2:
        p2 = [calc_complex_payoff(sp, conf2['k_low'], conf2['k_high'], conf2['cost'], conf2['lot'], conf2['type']) for sp in sim_spots]
        fig_payoff.add_trace(go.Scatter(x=sim_spots, y=p2, name=f"P2: {conf2['type']}", line=dict(color="#FFD700", width=2, dash='dot')))

    fig_payoff.add_shape(type="line", x0=s, x1=s, y0=min(p1), y1=max(p1), line=dict(color="white", dash="dash"), name="Spot")
    fig_payoff.add_shape(type="line", x0=min(sim_spots), x1=max(sim_spots), y0=0, y1=0, line=dict(color="gray", width=1))
    
    fig_payoff.update_layout(
        title="Strategy Payoff Comparison" if compare_mode else f"{conf1['type']} Payoff Analysis",
        xaxis_title="Price @ Expiry", yaxis_title=f"P/L ({c_sym})",
        template="plotly_dark", height=500, hovermode="x unified"
    )
    st.plotly_chart(fig_payoff, use_container_width=True)
    
    # Probability & Risk Stats
    st.markdown("---")
    st.subheader("Risk Metrics & Probability")
    
    pop1 = calculate_pop(s, conf1['k_low'], conf1['k_high'], sigma_input, t_safe, conf1['type'])
    
    rm_col1, rm_col2, rm_col3 = st.columns(3)
    with rm_col1:
        st.metric("Primary PoP (%)", f"{pop1*100:.1f}%", help="Probability of finishing in profit based on log-normal distribution.")
        st.caption("Based on current IV and Time.")
    
    with rm_col2:
        max_p1 = max(p1)
        max_l1 = min(p1)
        st.write(f"**Max Profit:** {c_sym}{max_p1:,.0f}")
        st.write(f"**Max Risk:** {c_sym}{abs(max_l1):,.0f}")

    with rm_col3:
        breakeven = conf1['k_low'] + conf1['cost'] if "Call" in conf1['type'] else conf1['k_low'] - conf1['cost']
        st.write(f"**Est. Breakeven:** {c_sym}{breakeven:,.2f}")
        st.write(f"**Risk/Reward:** {abs(max_p1/max_l1):.2f}" if max_l1 != 0 else "N/A")

# --- TAB 4: MARKET HISTORY ---
with tabs[3]:
    st.subheader(f"Market Analysis: {ticker_input}")
    
    col_h_cfg1, col_h_cfg2 = st.columns([1, 2])
    with col_h_cfg1:
        h_lookback = st.selectbox("History Period", ["1mo", "3mo", "6mo", "1y", "2y", "5y"], index=3)
    with col_h_cfg2:
        sma_choice = st.multiselect("Technical Indicators", ["SMA 20", "SMA 50", "SMA 200"], default=["SMA 20"])
    
    try:
        ticker_final = resolve_ticker(ticker_input, is_nse)
        st_data = yf.Ticker(ticker_final).history(period=h_lookback)
        
        if not st_data.empty:
            # Candlestick chart with indicators
            fig_hist = go.Figure()
            
            # Candlestick
            fig_hist.add_trace(go.Candlestick(
                x=st_data.index,
                open=st_data['Open'],
                high=st_data['High'],
                low=st_data['Low'],
                close=st_data['Close'],
                name="Price"
            ))
            
            # Indicators
            if "SMA 20" in sma_choice:
                st_data['SMA20'] = st_data['Close'].rolling(window=20).mean()
                fig_hist.add_trace(go.Scatter(x=st_data.index, y=st_data['SMA20'], name='SMA 20', line=dict(color='#00d4ff', width=1)))
            if "SMA 50" in sma_choice:
                st_data['SMA50'] = st_data['Close'].rolling(window=50).mean()
                fig_hist.add_trace(go.Scatter(x=st_data.index, y=st_data['SMA50'], name='SMA 50', line=dict(color='#ff00ff', width=1)))
            if "SMA 200" in sma_choice:
                st_data['SMA200'] = st_data['Close'].rolling(window=200).mean()
                fig_hist.add_trace(go.Scatter(x=st_data.index, y=st_data['SMA200'], name='SMA 200', line=dict(color='#ffffff', width=1, dash='dot')))

            # Volume as separate plot or overlay (let's do overlay with secondary y-axis)
            from plotly.subplots import make_subplots
            
            fig_final = make_subplots(rows=2, cols=1, shared_xaxes=True, 
                                     vertical_spacing=0.03, subplot_titles=(f'{ticker_final} Trend', 'Volume'), 
                                     row_width=[0.2, 0.7])

            # Add Traces back to subplots
            for trace in fig_hist.data:
                fig_final.add_trace(trace, row=1, col=1)
            
            # Add Volume
            fig_final.add_trace(go.Bar(x=st_data.index, y=st_data['Volume'], name='Volume', marker_color='#3e4253'), row=2, col=1)

            fig_final.update_layout(
                template="plotly_dark",
                height=650,
                xaxis_rangeslider_visible=False,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=0, r=0, t=50, b=0)
            )
            st.plotly_chart(fig_final, use_container_width=True)
            
            # Quantitative Summary
            st.markdown("---")
            q_col1, q_col2, q_col3 = st.columns(3)
            
            # Volatility Calculation
            st_data['Returns'] = st_data['Close'].pct_change()
            ann_vol_hist = st_data['Returns'].std() * np.sqrt(252) * 100
            
            q_col1.metric("Current price", f"{c_sym}{st_data['Close'].iloc[-1]:,.2f}")
            q_col1.metric("Historical Vol (HV)", f"{ann_vol_hist:.2f}%")
            
            # High/Low
            period_high = st_data['High'].max()
            period_low = st_data['Low'].min()
            q_col2.metric("Period High", f"{c_sym}{period_high:,.2f}")
            q_col2.metric("Period Low", f"{c_sym}{period_low:,.2f}")

            # Volume Stats
            avg_vol = st_data['Volume'].mean()
            q_col3.metric("Avg daily Volume", f"{avg_vol/1e6:.1f}M")
            if st.button("Sync Price & Vol to Simulator"):
                st.session_state.s_val = float(st_data['Close'].iloc[-1])
                st.rerun()

        else:
            st.warning("Historical data currently restricted or unavailable for this symbol.")
            st.info("Note: Many NSE indices and stocks require '.NS' suffix or '^' prefix.")
    except Exception as e:
        st.error(f"Market analysis module failure: {str(e)}")

st.markdown("---")
#st.caption("⚡ Built with Real-time Quant Engine | Data provided by yfinance")
