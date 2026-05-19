# Greek Project: Backend Logic (Phase 1)
# Professional Black-Scholes-Merton Implementation

import numpy as np
from scipy.stats import norm
from typing import Dict, Tuple

class BlackScholesModel:
    """
    A professional-grade implementation of the Black-Scholes-Merton model
    for pricing European options and calculating their Greeks.
    
    This class handles the core mathematical engine for option valuation.
    """

    def __init__(self, S: float, K: float, T: float, r: float, sigma: float):
        """
        Initialize the Black-Scholes model parameters.

        Args:
            S (float): Current Underlying Stock Price
            K (float): Option Strike Price
            T (float): Time to Expiration (in years, e.g., 0.5 for 6 months)
            r (float): Risk-free Interest Rate (as decimal, e.g., 0.05 for 5%)
            sigma (float): Annual Volatility (as decimal, e.g., 0.20 for 20%)
        """
        self.S = S
        self.K = K
        self.T = T
        self.r = r
        self.sigma = sigma

    def _get_d1_d2(self) -> Tuple[float, float]:
        """
        Internal helper to calculate d1 and d2 parameters.
        
        Returns:
            Tuple[float, float]: (d1, d2)
        """
        # Safety checks for stable math
        if self.T <= 0 or self.sigma <= 0:
            return 0.0, 0.0
            
        d1 = (np.log(self.S / self.K) + (self.r + 0.5 * self.sigma ** 2) * self.T) / (self.sigma * np.sqrt(self.T))
        d2 = d1 - self.sigma * np.sqrt(self.T)
        return d1, d2

    def call_price(self) -> float:
        """
        Calculate the theoretical price of an European Call option.
        
        Returns:
            float: Call option price
        """
        d1, d2 = self._get_d1_d2()
        return self.S * norm.cdf(d1) - self.K * np.exp(-self.r * self.T) * norm.cdf(d2)

    def put_price(self) -> float:
        """
        Calculate the theoretical price of an European Put option.
        
        Returns:
            float: Put option price
        """
        d1, d2 = self._get_d1_d2()
        return self.K * np.exp(-self.r * self.T) * norm.cdf(-d2) - self.S * norm.cdf(-d1)

    def delta(self) -> Dict[str, float]:
        """
        Calculate Delta: Rate of change in option price relative to asset price.
        
        Returns:
            Dict[str, float]: {'call': delta_call, 'put': delta_put}
        """
        d1, _ = self._get_d1_d2()
        return {
            "call": float(norm.cdf(d1)),
            "put": float(norm.cdf(d1) - 1.0)
        }

    def gamma(self) -> float:
        """
        Calculate Gamma: Rate of change in Delta relative to asset price.
        Gamma is identical for both Calls and Puts.
        
        Returns:
            float: Gamma value
        """
        d1, _ = self._get_d1_d2()
        return float(norm.pdf(d1) / (self.S * self.sigma * np.sqrt(self.T)))

    def vega(self) -> float:
        """
        Calculate Vega: Sensitivity of option price to underlying volatility.
        Represented as change for a 1% absolute change in volatility.
        
        Returns:
            float: Vega value
        """
        d1, _ = self._get_d1_d2()
        # Adjusted for 1% change for standard reporting
        return float(self.S * norm.pdf(d1) * np.sqrt(self.T) * 0.01)

    def theta(self) -> Dict[str, float]:
        """
        Calculate Theta: Sensitivity to time decay.
        Returns the daily theta (change in price for 1 day passing).
        
        Returns:
            Dict[str, float]: {'call': theta_call, 'put': theta_put}
        """
        d1, d2 = self._get_d1_d2()
        
        common_term = - (self.S * norm.pdf(d1) * self.sigma) / (2 * np.sqrt(self.T))
        
        call_theta = common_term - self.r * self.K * np.exp(-self.r * self.T) * norm.cdf(d2)
        put_theta = common_term + self.r * self.K * np.exp(-self.r * self.T) * norm.cdf(-d2)
        
        # Standardize to daily decay
        return {
            "call": float(call_theta / 365),
            "put": float(put_theta / 365)
        }

    def rho(self) -> Dict[str, float]:
        """
        Calculate Rho: Sensitivity to changes in the risk-free interest rate.
        Represented as change for a 1% absolute change in rate.
        
        Returns:
            Dict[str, float]: {'call': rho_call, 'put': rho_put}
        """
        _, d2 = self._get_d1_d2()
        # Adjusted for 1% change
        return {
            "call": float((self.K * self.T * np.exp(-self.r * self.T) * norm.cdf(d2)) * 0.01),
            "put": float((-self.K * self.T * np.exp(-self.r * self.T) * norm.cdf(-d2)) * 0.01)
        }

if __name__ == "__main__":
    # Test Suite with Dummy Values
    print("="*40)
    print("BLACK-SCHOLES BACKEND TEST")
    print("="*40)
    
    # Parameters
    S, K, T, r, sigma = 100, 100, 1, 0.05, 0.2
    
    engine = BlackScholesModel(S, K, T, r, sigma)
    
    print(f"Underlying: {S} | Strike: {K} | T: {T}Y | r: {r*100}% | Vol: {sigma*100}%")
    print("-" * 20)
    print(f"Call Price: ${engine.call_price():.4f}")
    print(f"Put Price:  ${engine.put_price():.4f}")
    print("-" * 20)
    print(f"Delta: {engine.delta()}")
    print(f"Gamma: {engine.gamma():.6f}")
    print(f"Vega:  {engine.vega():.4f}")
    print(f"Theta: {engine.theta()}")
    print(f"Rho:   {engine.rho()}")
    print("="*40)
