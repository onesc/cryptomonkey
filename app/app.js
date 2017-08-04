"use strict"
const Bittrex = require('node.bittrex.api');
const Poloniex = require('poloniex-api-node');
const fs = require('fs');
const config = require('./config.js')
const poloniex = new Poloniex();

const getTickers = () => {
  return new Promise((resolve, reject) => {
    let bit, pol;

    Bittrex.getmarketsummaries( function( payload, err ) {
      if (err) {
        reject(err)
      } else {
        bit = payload.result;
        if (pol) resolve({bit: payload.result, pol})
      }
    });

    poloniex.returnTicker((err, payload) => {
      if (err) {
        reject(err)
      } else {
        pol = payload;
        if (bit) resolve({bit, pol: payload})
      }
    });
  });
}

const reduceCurrencies = (bit, pol, currencies) => {
  let polPrices = [], bitPrices = [], mergedPrices = [];
  currencies.forEach((curr) => {
    const marketName = `BTC_${curr}`;
    if (pol[marketName]) { 
      polPrices.push({currency: `BTC-${curr}`, last: parseFloat(pol[marketName].last), bid: parseFloat(pol[marketName].highestBid), ask: parseFloat(pol[marketName].lowestAsk)});
    }
  });

  currencies.forEach((curr) => {
    const marketName =  `BTC-${curr}`;
    bit.forEach((market) => {
      if (market.MarketName === marketName) {
        bitPrices.push(({currency: `BTC-${curr}`, last: market.Last, bid: market.Bid, ask: market.Ask}));
      }
    })
  });

  bitPrices.forEach((b) => {
    polPrices.forEach((p) => {
      if (b.currency === p.currency) {
        const percentageDiff = ((b.last - p.last) / ((b.last + p.last) * 0.5)) * 100;
        const buyBitSellPol = ((p.ask - b.bid) / ((b.bid + p.ask) * 0.5)) * 100;
        const buyPolSellBit = ((b.ask - p.bid) / ((p.bid + b.ask) * 0.5)) * 100;
        const mergedPrice = {
              currency: b.currency, 
              bitLast: b.last, 
              polLast: p.last,
              diff: percentageDiff,
              buyBit: buyBitSellPol,
              buyPol: buyPolSellBit
        }
        mergedPrices.push(mergedPrice);
      };
    });
  });
  
  return mergedPrices;
}

const app = async () => {
  const tickers = await getTickers().catch((err) => { console.error(err) });
  // console.log(tickers.pol)
  const prices = reduceCurrencies(tickers.bit, tickers.pol, config.tokens)

  fs.readFile("./log.json", function (err, data) {
      var json = JSON.parse(data)
      json.push({date: new Date(), prices: prices})
      fs.writeFile("./log.json", JSON.stringify(json))
      fs.writeFile("../chart/data.js", "var data = " + JSON.stringify(json))
  })

  const sorted = prices.sort(function(a, b){
    return Math.abs(a.diff) - Math.abs(b.diff);
  });
  console.log(prices)

  setTimeout(app, 30000);
}

app();




// Bittrex.options({
//   'apikey' : config.bittrex.apikey,
//   'apisecret' : config.bittrex.apisecret, 
// });
