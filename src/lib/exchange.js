import { getWithExpiry, setWithExpiry } from './localstorage-cache';

const binanceApi = new window.ccxt.binance();

export async function getMarketsData() {
  let marketsData = getWithExpiry('marketsData');
  if (!marketsData) {
    marketsData = await binanceApi.loadMarkets();
    setWithExpiry('marketsData', marketsData, 1000 * 60 * 5);
  }

  return marketsData;
}

export async function getTickersData() {
  let tickersData = getWithExpiry('tickersData');
  if (!tickersData) {
    tickersData = await binanceApi.fetchTickers();
    setWithExpiry('tickersData', tickersData, 1000 * 60 * 30);
  }

  return tickersData;
}
