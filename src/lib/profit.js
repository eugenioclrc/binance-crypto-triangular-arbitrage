import Decimal from 'decimal.js';

import { getMarketsData, getTickersData } from './exchange';

export default async function createProfitFunc(BASE_USD_BUDGET = 100, FEE = '0.00075') {
  const tickers = await getTickersData();
  const marketsData = await getMarketsData();

  function baseBudget(coin, markets) {
    const stables = 'USDT,USDC,BUSD,DAI,PAX'.split(',');

    let symbol = '';
    if (stables.indexOf(coin) > -1) {
      return new Decimal(BASE_USD_BUDGET);
    }
    for (let i = 0; i < stables.length; i += 1) {
      const stable = stables[i];
      const p1Stable = `${coin}/${stable}`;
      const stablep2 = `${stable}/${coin}`;
      if (marketsData[p1Stable] && markets[p1Stable]) {
        symbol = p1Stable;

        return (new Decimal(BASE_USD_BUDGET))
          .div(markets[symbol].bidPrice)
          .toDecimalPlaces(marketsData[symbol].precision.amount, Decimal.ROUND_DOWN);
      } if (marketsData[stablep2] && markets[stablep2]) {
        symbol = stablep2;
        return (new Decimal(BASE_USD_BUDGET))
          .mul(markets[symbol].bidPrice)
          .toDecimalPlaces(marketsData[symbol].precision.quote, Decimal.ROUND_DOWN);
      }
    }

    for (let i = 0; i < stables.length; i += 1) {
      const stable = stables[i];
      const p1Stable = `${coin}/${stable}`;
      const stablep2 = `${stable}/${coin}`;
      if (marketsData[p1Stable] && tickers[p1Stable]) {
        symbol = p1Stable;

        return (new Decimal(BASE_USD_BUDGET))
          .div(tickers[symbol].bid)
          .toDecimalPlaces(marketsData[symbol].precision.amount, Decimal.ROUND_DOWN);
      } if (marketsData[stablep2] && tickers[stablep2]) {
        symbol = stablep2;
        return (new Decimal(BASE_USD_BUDGET))
          .mul(tickers[symbol].bid)
          .toDecimalPlaces(marketsData[symbol].precision.quote, Decimal.ROUND_DOWN);
      }
    }

    throw new Error(`no budget price for ${coin}`);
  }

  return function checkProfit(pairsToTest, markets) {
    const ret = [];
    const winners = [];

    for (let j = 0; j < pairsToTest.length; j += 1) {
      const chain = pairsToTest[j];
      let initialBudget;
      try {
        initialBudget = new Decimal(baseBudget(chain[0], markets));
      } catch (er) {
        continue;
      }
      let budget = initialBudget;
      const orders = [];
      const log = [];
      let fail = false;
      for (let i = 0; i < 3; i += 1) {
        const p12 = [chain[i], chain[i + 1]].join('/');
        const p21 = [chain[i + 1], chain[i]].join('/');
        log.push(budget + chain[i]);
        if (markets[p12] && marketsData[p12]) {
          if (!markets[p12].bidPrice) {
            fail = true;
            break;
          }
          const bidPrice = Decimal(markets[p12].bidPrice)
            .toDecimalPlaces(marketsData[p12].precision.price, Decimal.ROUND_DOWN);
          budget = budget.toDecimalPlaces(marketsData[p12].precision.amount, Decimal.ROUND_DOWN);

          orders.push({
            market: p12,
            side: 'sell',
            amount: budget,
            price: bidPrice,
            link: `https://www.binance.com/en/trade/${p12.replace('/', '_')}?ref=OJN3QQMJ`,
            total: budget.mul(bidPrice).toDecimalPlaces(marketsData[p12].precision.quote, Decimal.ROUND_DOWN),
          });

          budget = budget.mul(bidPrice);

          log.push(JSON.stringify({ n: p12, p: markets[p12] }));
        } else if (markets[p21] && marketsData[p21]) {
          if (!markets[p21].askPrice) {
            fail = true;
            break;
          }
          const askPrice = Decimal(markets[p21].askPrice).toDecimalPlaces(marketsData[p21].precision.price, Decimal.ROUND_DOWN);
          const prevBudget = budget;
          budget = budget.div(askPrice)
            .toDecimalPlaces(marketsData[p21].precision.amount, Decimal.ROUND_DOWN);

          orders.push({
            market: p21,
            side: 'buy',
            amount: budget,
            price: askPrice,
            link: `https://www.binance.com/en/trade/${p21.replace('/', '_')}`,
            total: prevBudget.toDecimalPlaces(marketsData[p21].precision.quote, Decimal.ROUND_DOWN),
          });

        } else {
          fail = true;
          break;
        }

      }
      if (!fail) {
        const fee = Decimal(FEE).mul(3);
        const profit = budget.div(initialBudget).sub(fee);
        ret.push({
          chain, profit, orders,
        });
      }
    }

    return ret;
  };
}
