const axios = require('axios');

const currencyService = {
  exchangeRateCache: { rates: {}, timestamp: null },
  CACHE_DURATION: 24 * 60 * 60 * 1000,

  getExchangeRates: async () => {
    const now = Date.now();
    if (
      currencyService.exchangeRateCache.rates &&
      currencyService.exchangeRateCache.timestamp &&
      now - currencyService.exchangeRateCache.timestamp < currencyService.CACHE_DURATION
    ) {
      return currencyService.exchangeRateCache.rates;
    }
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      currencyService.exchangeRateCache = {
        rates: response.data.rates,
        timestamp: now,
      };
      return response.data.rates;
    } catch (err) {
      console.error('Exchange rate fetch error:', err.message);
      if (currencyService.exchangeRateCache.rates) {
        return currencyService.exchangeRateCache.rates;
      }
      throw new Error('Failed to fetch exchange rates');
    }
  },

  convertToUSD: async (amount, currency) => {
    if (currency === 'USD') return amount;
    const rates = await currencyService.getExchangeRates();
    const rate = rates[currency];
    if (!rate) {
      throw new Error(`Exchange rate not found for currency: ${currency}`);
    }
    return amount / rate;
  },
};

module.exports = currencyService;
