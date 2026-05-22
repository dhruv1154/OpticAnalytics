/**
 * OpticAnalytics - Options Pricing & Greeks Engine
 * High-precision quantitative finance model suite
 */

// Math Helper: Standard Normal Cumulative Distribution Function (rational approximation)
export function cndf(x: number): number {
  const a1 = 0.319381530;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  
  const L = Math.abs(x);
  const K = 1.0 / (1.0 + 0.2316419 * L);
  let cnd = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L * L / 2) * 
    (a1 * K + a2 * Math.pow(K, 2) + a3 * Math.pow(K, 3) + a4 * Math.pow(K, 4) + a5 * Math.pow(K, 5));
  
  if (x < 0) {
    cnd = 1.0 - cnd;
  }
  return cnd;
}

// Math Helper: Standard Normal Probability Density Function (PDF)
export function ndf(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

// Box-Muller transform for standard normal random numbers
export function randomNormal(): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export type OptionType = 'Call' | 'Put';
export type ModelType = 'BS' | 'Binomial' | 'MC';

export interface OptionsParams {
  S: number;       // Spot stock price
  K: number;       // Strike price
  T: number;       // Time to maturity in years (e.g., 30 days = 30 / 365)
  r: number;       // Risk-free interest rate (e.g., 5% = 0.05)
  sigma: number;   // Implied volatility (e.g., 20% = 0.20)
  type: OptionType;
}

export interface OptionsMetrics {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // Daily decay
  vega: number;  // For 1% vol change
  rho: number;   // For 1% rate change
  vanna: number; // For 1% vol change & 1 unit spot change
  volga: number; // Change in vega per 1% vol change
  charm: number; // Daily delta decay
}

// 1. Black-Scholes-Merton (European) Calculator
export function priceBSM(params: OptionsParams): number {
  const { S, K, T, r, sigma, type } = params;
  if (T <= 0) {
    return type === 'Call' ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  if (type === 'Call') {
    return S * cndf(d1) - K * Math.exp(-r * T) * cndf(d2);
  } else {
    return K * Math.exp(-r * T) * cndf(-d2) - S * cndf(-d1);
  }
}

// 2. Black-Scholes-Merton Analytical Greeks Calculator
export function calculateBSMGreeks(params: OptionsParams): OptionsMetrics {
  const { S, K, T, r, sigma, type } = params;
  
  if (T <= 0) {
    const isCall = type === 'Call';
    const price = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
    const delta = isCall ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
    return { price, delta, gamma: 0, theta: 0, vega: 0, rho: 0, vanna: 0, volga: 0, charm: 0 };
  }

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const n_d1 = ndf(d1);
  const sqrt_T = Math.sqrt(T);
  const exp_rT = Math.exp(-r * T);

  // Price
  const price = priceBSM(params);

  // Delta
  const delta = type === 'Call' ? cndf(d1) : cndf(d1) - 1;

  // Gamma
  const gamma = n_d1 / (S * sigma * sqrt_T);

  // Vega (derivative wrt sigma, scaled to 1% move)
  const vegaRaw = S * n_d1 * sqrt_T;
  const vega = vegaRaw / 100;

  // Theta (decay per year, converted to daily)
  const term1 = -(S * n_d1 * sigma) / (2 * sqrt_T);
  const term2 = r * K * exp_rT * (type === 'Call' ? cndf(d2) : -cndf(-d2));
  const thetaYear = term1 - term2;
  const theta = thetaYear / 365.25; // per day decay

  // Rho (derivative wrt risk-free rate, scaled to 1% rate change)
  const rhoRaw = K * T * exp_rT * (type === 'Call' ? cndf(d2) : -cndf(-d2));
  const rho = rhoRaw / 100;

  // Vanna (dDelta / dSigma, change in Delta per 1% change in volatility)
  const vannaRaw = -n_d1 * d2 / sigma;
  const vanna = vannaRaw / 100;

  // Volga / Vomma (dVega / dSigma, change in Vega per 1% change in vol)
  const volgaRaw = vegaRaw * d1 * d2 / sigma;
  const volga = volgaRaw / 10000; // Scaled twice for 1% vol change squared

  // Charm (dDelta / dT, daily delta bleed)
  const charmTerm1 = n_d1 * (r * T - d2 * sigma * sqrt_T / 2) / (T * sigma * sqrt_T);
  const charmRaw_call = -charmTerm1 - r * exp_rT * cndf(d2);
  const charmRaw_put = -charmTerm1 + r * exp_rT * cndf(-d2);
  const charm = (type === 'Call' ? charmRaw_call : charmRaw_put) / 365.25;

  return { price, delta, gamma, theta, vega, rho, vanna, volga, charm };
}

// 3. Cox-Ross-Rubinstein (CRR) American Binomial Tree option pricing
export function priceBinomialAmerican(params: OptionsParams, steps = 60): { price: number; nodes: number[][] } {
  const { S, K, T, r, sigma, type } = params;
  if (T <= 0) {
    const val = type === 'Call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: val, nodes: [[val]] };
  }

  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1.0 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const discount = Math.exp(-r * dt);

  // Initialize stock prices at expiration
  const stockPrices: number[] = new Array(steps + 1);
  for (let j = 0; j <= steps; j++) {
    stockPrices[j] = S * Math.pow(u, steps - j) * Math.pow(d, j);
  }

  // Option values at expiration
  let optionValues: number[] = new Array(steps + 1);
  for (let j = 0; j <= steps; j++) {
    optionValues[j] = type === 'Call' ? Math.max(0, stockPrices[j] - K) : Math.max(0, K - stockPrices[j]);
  }

  // Step backwards
  for (let i = steps - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      // Continuation value
      const continuationPrice = discount * (p * optionValues[j] + (1 - p) * optionValues[j + 1]);
      
      // Stock price at this node
      const sNode = S * Math.pow(u, i - j) * Math.pow(d, j);
      const exercisePrice = type === 'Call' ? Math.max(0, sNode - K) : Math.max(0, K - sNode);
      
      // Early exercise check for American Option
      optionValues[j] = Math.max(continuationPrice, exercisePrice);
    }
  }

  return { price: optionValues[0], nodes: [[optionValues[0]]] };
}

// 4. Monte Carlo pricing algorithm + pathway simulator
export function priceMonteCarlo(params: OptionsParams, sims = 2000, steps = 50): { price: number; paths: number[][] } {
  const { S, K, T, r, sigma, type } = params;
  if (T <= 0) {
    const val = type === 'Call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: val, paths: [[val]] };
  }

  const dt = T / steps;
  const drift = (r - 0.5 * sigma * sigma) * dt;
  const vol_sqrt_dt = sigma * Math.sqrt(dt);
  const discount = Math.exp(-r * T);

  let payoffSum = 0;
  const pathsToPlotCount = 40; // Collect 40 paths for plotting in the UI
  const pathsToPlot: number[][] = [];

  for (let i = 0; i < sims; i++) {
    let currentS = S;
    const currentPath: number[] = [S];
    
    for (let j = 0; j < steps; j++) {
      const rand = randomNormal();
      currentS = currentS * Math.exp(drift + vol_sqrt_dt * rand);
      if (i < pathsToPlotCount) {
        currentPath.push(currentS);
      }
    }
    
    const payoff = type === 'Call' ? Math.max(0, currentS - K) : Math.max(0, K - currentS);
    payoffSum += payoff;
    
    if (i < pathsToPlotCount) {
      pathsToPlot.push(currentPath);
    }
  }

  const price = (payoffSum / sims) * discount;
  return { price, paths: pathsToPlot };
}

// 5. Numerical Greek solver (vital for general-purpose consistency across models!)
export function calculateNumericalGreeks(
  params: OptionsParams, 
  model: ModelType
): OptionsMetrics {
  const S_eps = Math.max(0.01, params.S * 0.005);
  const sig_eps = 0.002; // Volatility perturbation
  const T_eps = 0.002;   // Time perturbation
  const r_eps = 0.002;   // Rate perturbation

  const evalPrice = (p: OptionsParams): number => {
    if (model === 'BS') {
      return priceBSM(p);
    } else if (model === 'Binomial') {
      return priceBinomialAmerican(p, 50).price;
    } else { // MC
      return priceMonteCarlo(p, 1000, 30).price;
    }
  };

  const currentPrice = evalPrice(params);

  // Delta & Gamma (Spot perturbation)
  const priceSUp = evalPrice({ ...params, S: params.S + S_eps });
  const priceSDown = evalPrice({ ...params, S: Math.max(0.001, params.S - S_eps) });
  
  const delta = (priceSUp - priceSDown) / (2 * S_eps);
  const gamma = (priceSUp - 2 * currentPrice + priceSDown) / (S_eps * S_eps);

  // Vega (Volatility perturbation)
  const priceSigUp = evalPrice({ ...params, sigma: params.sigma + sig_eps });
  const priceSigDown = evalPrice({ ...params, sigma: Math.max(0.001, params.sigma - sig_eps) });
  const vega = ((priceSigUp - priceSigDown) / (2 * sig_eps)) / 100; // for 1% absolute chang

  // Theta (Time decay perturbation, moving forward in time so T reduces)
  const nextT = Math.max(0.0001, params.T - T_eps);
  const priceTDown = evalPrice({ ...params, T: nextT });
  const thetaYear = (priceTDown - currentPrice) / (-T_eps);
  const theta = thetaYear / 365.25; // daily decay

  // Rho (Rate perturbation)
  const priceRUp = evalPrice({ ...params, r: params.r + r_eps });
  const priceRDown = evalPrice({ ...params, r: Math.max(0, params.r - r_eps) });
  const rho = ((priceRUp - priceRDown) / (2 * r_eps)) / 100; // for 1% absolute rate change

  // Vanna (dDelta / dSigma)
  const deltaSigUp = (evalPrice({ ...params, S: params.S + S_eps, sigma: params.sigma + sig_eps }) - evalPrice({ ...params, S: params.S - S_eps, sigma: params.sigma + sig_eps })) / (2 * S_eps);
  const deltaSigDown = (evalPrice({ ...params, S: params.S + S_eps, sigma: params.sigma - sig_eps }) - evalPrice({ ...params, S: params.S - S_eps, sigma: params.sigma - sig_eps })) / (2 * S_eps);
  const vanna = ((deltaSigUp - deltaSigDown) / (2 * sig_eps)) / 100; // scaled for 1% vol

  // Volga (dVega / dSigma)
  const vegaSigUp = (((evalPrice({ ...params, sigma: params.sigma + sig_eps * 2 }) - currentPrice) / (2 * sig_eps))) / 100;
  const vegaSigDown = (((currentPrice - evalPrice({ ...params, sigma: params.sigma - sig_eps * 2 })) / (2 * sig_eps))) / 100;
  const volga = (vegaSigUp - vegaSigDown) / (2 * sig_eps); // scaled twice

  // Charm (dDelta / dT)
  const deltaTDown = (evalPrice({ ...params, S: params.S + S_eps, T: nextT }) - evalPrice({ ...params, S: params.S - S_eps, T: nextT })) / (2 * S_eps);
  const charm = ((deltaTDown - delta) / (-T_eps)) / 365.25; // per day delta bleed

  return {
    price: currentPrice,
    delta: isNaN(delta) ? 0 : delta,
    gamma: isNaN(gamma) ? 0 : gamma,
    theta: isNaN(theta) ? 0 : theta,
    vega: isNaN(vega) ? 0 : vega,
    rho: isNaN(rho) ? 0 : rho,
    vanna: isNaN(vanna) ? 0 : vanna,
    volga: isNaN(volga) ? 0 : volga,
    charm: isNaN(charm) ? 0 : charm
  };
}

// Full option parameter calculation runner based on selection
export function calculateOptions(params: OptionsParams, model: ModelType): OptionsMetrics {
  // Use speed-optimized exact analytic equations for Black Scholes
  if (model === 'BS') {
    return calculateBSMGreeks(params);
  }
  // Otherwise, fallback to the robust numerical finite-difference method for Binomial or MC
  return calculateNumericalGreeks(params, model);
}

// 6. Implied Volatility (IV) Newton-Raphson & Bisection Solver
export function solveImpliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  type: OptionType
): number {
  if (marketPrice <= 0) return 0.01;
  
  // Intrinsic check: IV must reflect parity
  const intrinsic = type === 'Call' ? Math.max(0, S - K) : Math.max(0, K - S);
  if (marketPrice <= intrinsic) {
    return 0.01; // Parity limit
  }

  // Define solver parameters
  let sigma = 0.30; // Initial guess: 30% Volatility
  const maxIterations = 100;
  const epsilon = 1e-6;

  // Newton-Raphson Loop
  for (let i = 0; i < maxIterations; i++) {
    const params: OptionsParams = { S, K, T, r, sigma, type };
    const price = priceBSM(params);
    const diff = price - marketPrice;

    if (Math.abs(diff) < epsilon) {
      return sigma;
    }

    const greeks = calculateBSMGreeks(params);
    const vegaRaw = greeks.vega * 100; // Raw vega with respect to sigma (not 1%)

    if (Math.abs(vegaRaw) > 1e-4) {
      const nextSigma = sigma - diff / vegaRaw;
      if (nextSigma > 0.001 && nextSigma < 5.0) {
        sigma = nextSigma;
        continue;
      }
    }

    // Binary search fallback if Newton-Raphson explodes or hits a non-derivative zone
    let low = 0.001;
    let high = 5.0;
    for (let j = 0; j < 60; j++) {
      const mid = (low + high) / 2;
      const midPrice = priceBSM({ S, K, T, r, sigma: mid, type });
      if (Math.abs(midPrice - marketPrice) < epsilon) {
        return mid;
      }
      if (midPrice > marketPrice) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return (low + high) / 2;
  }

  return sigma;
}

// Multi-leg Options Strategy Calculator
export interface OptionLeg {
  id: string;
  type: OptionType;
  action: 'Buy' | 'Sell'; // 'Buy' (+1) or 'Sell' (-1)
  strike: number;
  quantity: number;
}

export interface StrategyMetrics {
  totalPremium: number; // Positive = credit (+), Negative = debit (-)
  legsPrice: { [key: string]: number };
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  netRho: number;
}

// Calculation of total premium & composite Greeks for any leg arrangement
export function calculateStrategyGreeks(
  legs: OptionLeg[],
  S: number,
  T: number,
  r: number,
  defSigma: number, // current defaults IV
  model: ModelType
): StrategyMetrics {
  let totalPremium = 0;
  let netDelta = 0;
  let netGamma = 0;
  let netTheta = 0;
  let netVega = 0;
  let netRho = 0;
  const legsPrice: { [key: string]: number } = {};

  legs.forEach(leg => {
    // Leg specific params
    const params: OptionsParams = {
      S,
      K: leg.strike,
      T,
      r,
      sigma: defSigma,
      type: leg.type
    };

    const metrics = calculateOptions(params, model);
    const multiplier = leg.action === 'Buy' ? 1 : -1;
    const totalLegQty = leg.quantity;

    legsPrice[leg.id] = metrics.price;
    
    // Net Debit/Credit: Buying costs premium (-), Selling earns premium (+)
    // Cash value: we'll define Debit as standard premium price, sum option costs
    // Value = action * quantity * optionPrice * 100
    const legCost = multiplier * totalLegQty * metrics.price;
    totalPremium += legCost; // positive is profit outflow/debit depending on index

    // Aggregate Greek Contributions
    netDelta += metrics.delta * multiplier * totalLegQty;
    netGamma += metrics.gamma * multiplier * totalLegQty;
    netTheta += metrics.theta * multiplier * totalLegQty;
    netVega += metrics.vega * multiplier * totalLegQty;
    netRho += metrics.rho * multiplier * totalLegQty;
  });

  return {
    totalPremium,
    legsPrice,
    netDelta,
    netGamma,
    netTheta,
    netVega,
    netRho
  };
}

// Strategy Payoff Coordinate Plot Generator (multi-leg)
export interface PayoffPoint {
  spotPrice: number;
  expirationProfit: number;
  t0Profit: number;
}

export function generateStrategyPayoff(
  legs: OptionLeg[],
  minSpot: number,
  maxSpot: number,
  stepsCount = 60,
  T: number,
  r: number,
  defSigma: number,
  model: ModelType
): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  const spotStep = (maxSpot - minSpot) / stepsCount;

  // Initial cost setup at creation time (using specified pricing model)
  const initialCost = calculateStrategyGreeks(legs, legs.length > 0 ? legs[0].strike : 100, T, r, defSigma, model).totalPremium;

  for (let i = 0; i <= stepsCount; i++) {
    const spot = minSpot + i * spotStep;
    let expirationValueSum = 0;
    let t0ValueSum = 0;

    legs.forEach(leg => {
      const multiplier = leg.action === 'Buy' ? 1 : -1;
      const qty = leg.quantity;

      // 1. Payoff at Expiration (T = 0)
      const valueAtExp = leg.type === 'Call' 
        ? Math.max(0, spot - leg.strike)
        : Math.max(0, leg.strike - spot);
      expirationValueSum += valueAtExp * multiplier * qty;

      // 2. Continuous value at current date (T = input, e.g. T+0)
      const currentVal = model === 'BS' 
        ? priceBSM({ S: spot, K: leg.strike, T, r, sigma: defSigma, type: leg.type })
        : priceBinomialAmerican({ S: spot, K: leg.strike, T, r, sigma: defSigma, type: leg.type }, 40).price;
      t0ValueSum += currentVal * multiplier * qty;
    });

    // Option strategy Profit = Current composite option value - Initial composite option cost
    // For Buyers, profit is option value - stock premium paid.
    // For Sellers, profit is premium received - option value.
    const expirationProfit = (expirationValueSum - initialCost) * 100;
    const t0Profit = (t0ValueSum - initialCost) * 100;

    points.push({
      spotPrice: parseFloat(spot.toFixed(2)),
      expirationProfit: parseFloat(expirationProfit.toFixed(2)),
      t0Profit: parseFloat(t0Profit.toFixed(2))
    });
  }

  return points;
}
