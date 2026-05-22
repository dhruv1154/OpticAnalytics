# OpticAnalytics

OpticAnalytics is a high-performance, full-stack interactive options analytics dashboard powered by **React 19**, **Vite**, **Express**, and **Tailwind CSS**. It incorporates professional-grade option pricing models (Black-Scholes-Merton, Cox-Ross-Rubinstein Binomial Trees, and Monte Carlo multi-path simulations) along with real-time Greeks engine calculations ($\Delta, \Gamma, \Theta, \Vega, \Rho$). 

The platform supports live-streaming market prices, customizable multi-leg option strategies, interactive payoff charts, dynamic implied volatility (IV) shock testing, and 3D volatility surface visualizations across a comprehensive selection of Indian and Global Indices and Stocks.

---

## Key Features

- **Professional Pricing Engine**: Under-the-hood quantitative calculations computing fair values and Greeks utilizing analytical **Black-Scholes**, numerical **Binomial Tree (up to 100 steps)**, and stochastic **Monte Carlo** simulations.
- **Multicurrency & Multi-market Support**: Track assets in INR, USD, EUR, GBP, JPY, CAD, CHF, and CNY with an intelligent automated spot currency converter.
- **Dynamic Stress-Testing (What-If Analysis)**: Slide through instant macroeconomic stress simulations—modifying broad market prices (-50% to +50%) and implied volatility shocks to visualize real-time payoff shifts.
- **Advanced Interactive Dashboard**:
  - Live local and global ticker listings, including highly requested Indian and International giants (such as Nifty50, BSE Sensex, TSMC, ASML, LVMH, Reliance, TCS, and more).
  - Premium real-time data integration with a light-weight backend proxy server.
  - Multi-leg strategy customizers (Calls, Puts, Buy/Sell limits, Quantities).
  - Elegant charting visualization constructed via **Recharts** with customizable line modes, responsive boundaries, and absolute precision.
- **Beautiful, High-Contrast UI**: Ultra-clean professional aesthetic optimized with high information density, sleek custom scrollbars, transition feedback via `motion`, and fully responsive desktop-first controls.

---

## Architecture

OpticAnalytics is structured as a robust **full-stack model**:
* **Frontend**: Crafted using modern React 19, TypeScript, and styling with unified Tailwind CSS utility configurations. Designed with complete modularity separating data types, layout view states, and pricing math.
* **Backend**: Powered by a lightweight Express server (`server.ts`) that orchestrates API proxy calls to securely retrieve live stock quotes while handling native CORS, rate-limits, and routing. At compile-time, `esbuild` bundles the server from TypeScript straight to standalone CommonJS (`dist/server.cjs`) to guarantee high-performance execution.

---

## Getting Started (Local Development)

Follow these steps to set up and run the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or above recommended)
- [npm](https://www.npmjs.com/) (usually bundles with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/opticanalytics.git
cd opticanalytics
```

### 2. Install Dependencies
Install all front-end and back-end integration packages defined in `package.json`:
```bash
npm install
```

### 3. Run the Development Server
Fire up the local development environment:
```bash
npm run dev
```
Once the development server boots up, open your browser and navigate to the local address displayed in your terminal (typically **[http://localhost:5173](http://localhost:5173)** for the frontend client). 

The backend proxy server will run concurrently in the background to handle hot-reloading client-side assets and live stock data streams.


---

## Production Delivery & Compilation

To build a production-ready optimized build of the full-stack application, run:

```bash
npm run build
```

The build command compiles both worlds of the application:
1. **Client-Side Build**: Resolves React JSX, tree-shakes assets, compiles TS, and outputs optimized static assets in the `/dist` folder.
2. **Server-Side Build**: Transpiles your standalone server into an optimized, self-contained single script located at `/dist/server.cjs` utilizing the highly efficient `esbuild` compiler.

To launch the compiled server in standard production state, run:
```bash
npm run start
```

---

## Project Structure

```text
├── src/
│   ├── components/       # Reusable React components (payoffs, 3D surface charts, dashboard cards)
│   ├── types.ts          # Shared TypeScript models, ticker constants, metrics, and contracts
│   ├── App.tsx           # Primary dashboard UI, state engine, stress parameters, and controls
│   ├── main.tsx          # Client entry mounting script
│   └── index.css         # Tailwind global styles
├── server.ts             # Full-stack Express server integrating live data pipelines & proxy route engines
├── tsconfig.json         # Static analysis TypeScript compiler options
├── vite.config.ts        # Modular front-end bundler presets
└── package.json          # Main scripts, tool definitions, and modular dependency bindings
```

---

## Future Roadmap & Contribution guidelines

Contributions are always welcome to strengthen the analytical capabilities of OpticAnalytics! 
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
