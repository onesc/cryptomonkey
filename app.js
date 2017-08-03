"use strict"
const Bittrex = require('node.bittrex.api');
const Poloniex = require('poloniex-api-node');
const fs = require('fs');
const config = require('./config.js')
const poloniex = new Poloniex();

Bittrex.options({
  'apikey' : config.bittrex.apikey,
  'apisecret' : config.bittrex.apisecret, 
});

const getBittrexTicker = () => {
  return new Promise((resolve, reject) => {
    Bittrex.getmarketsummaries( function( payload, err ) {
      if (err) {
        reject(err)
      } else {
        resolve(payload.result)
      }
    });
  });
} 

const getPoloniexTicker = () => {
  return new Promise((resolve, reject) => {
    poloniex.returnTicker((err, payload) => {
      if (err) {
        reject(err)
      } else {
        resolve(payload)
      }
    });
  });
}

const reduceCurrencies = (bit, pol, currencies) => {
  let polPrices = [];
  let bitPrices = [];
  let mergedPrices = [];

  currencies.forEach((curr) => {
    const marketName = `BTC_${curr}`;
    if (pol[marketName]) { 
      polPrices.push({currency: `BTC-${curr}`, last: parseFloat(pol[marketName].last)})
    }
  });

  currencies.forEach((curr) => {
    const marketName =  `BTC-${curr}`;
    bit.forEach((market) => {
      if (market.MarketName === marketName) {
        bitPrices.push(({currency: `BTC-${curr}`, last: market.Last}));
      }
    })
  });

  bitPrices.forEach((b) => {
    polPrices.forEach((p) => {
      if (b.currency === p.currency) {
        let mergedPrice = {};
        mergedPrice.currency = b.currency;
        mergedPrice.bitLast = b.last;
        mergedPrice.polLast = p.last;
        mergedPrice.diff = b.last - p.last !== 0 ? ((b.last - p.last) / ((b.last + p.last) * 0.5)) * 100 : '0'
        mergedPrices.push(mergedPrice);
      };
    });
  });
  
  return mergedPrices;
}

const logData = (dataToLog, filePath) => {
  fs.readFile(filePath, function (err, data) {
      var json = JSON.parse(data)
      console.log(json)
      json.push(dataToLog)
      fs.writeFile(filePath, JSON.stringify(json))
  })
}

async function app () {
  const bit = await getBittrexTicker();
  const pol = await getPoloniexTicker();
  if (!bit || !pol) return;

  const currencyList = ["ETH", "LTC", "STRAT", "XRP", "DGB", "BTS", "ETC", "QTUM", "WAVES"];
  const prices = reduceCurrencies(bit, pol, currencyList)
  logData({date: new Date(), prices, prices}, "log.json") 
  console.log(prices)
}

app();