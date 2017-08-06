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
        bit = payload;
        if (pol) resolve({bit: payload, pol});
      }
    });

    poloniex.returnTicker((err, payload) => {
      if (err) {
        reject(err)
      } else {
        pol = payload;
        if (bit) resolve({bit, pol: payload});
      }
    });
  });
}

const parsePolTicker = (polTicker) => {
  let parsedPol = {}
  Object.keys(polTicker).forEach((polkey)=> { 
    parsedPol[polkey] = {
      id: polTicker[polkey].id,
      last: parseFloat(polTicker[polkey].last),
      lowestAsk: parseFloat(polTicker[polkey].lowestAsk),
      highestBid: parseFloat(polTicker[polkey].highestBid)
      // percentChange, baseVolume, quoteVolume, isFrozen, high24hr, low24hr
    }
  })
  return parsedPol;  // poloniex return its data as strings, this function saves me from having to write parseFloat everywhere in the future
}

const mapCurrencies = (bit, pol, currencies) => { 
  return currencies.map((curr) => {
    const p = pol[`BTC_${curr}`];
    const b = bit.find((market) => {
      return market.MarketName === `BTC-${curr}`;
    })

    if (b && p) {
      return {
        currency: `BTC-${curr}`,
        averageLast: (b.Last + p.last) / 2,
        buyBit: ((p.lowestAsk - b.Bid) / ((b.Bid + p.lowestAsk)) * 0.5) * 100,
        buyPol: ((b.Ask - p.highestBid) / ((p.highestBid) + b.Ask) * 0.5) * 100
      } 
    }
  }).filter(function (item) { return item; });
}

const app = async () => {
  const tickers = await getTickers().catch((err) => { console.error(err) });
  const prices = mapCurrencies(tickers.bit.result, parsePolTicker(tickers.pol), config.tokens)

  fs.readFile("./log.json", function (err, data) {
      var json = JSON.parse(data)
      json.push({date: new Date(), prices: prices})
      fs.writeFile("./log.json", JSON.stringify(json))
      fs.writeFile("../chart/data.js", "var data = " + JSON.stringify(json))
  })

  const sorted = prices.sort(function(a, b){
    return a.buyBit > a.buyPol ? Math.abs(a.buyBit) - Math.abs(b.buyBit) : Math.abs(a.buyPol) - Math.abs(b.buyPol);
  });

  console.log(sorted)

  setTimeout(app, 600000);
}

app();