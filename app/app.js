"use strict"
const Bittrex = require('node.bittrex.api');
const Poloniex = require('poloniex-api-node');
const fs = require('fs');
const config = require('./config.js')
const apikeys = require('../apikeys');

Bittrex.options(apikeys.bittrex);

const getTickers = () => new Promise((resolve, reject) => {
    let bit, pol;

    Bittrex.getmarketsummaries((payload, err) => {
        if (err) {
            reject(err)
        } else {
            bit = payload;
            if (pol) resolve({bit, pol});
        }
    });

    new Poloniex().returnTicker((err, payload) => {
        if (err) {
            reject(err)
        } else {
            pol = payload;
            if (bit) resolve({bit, pol});
        }
    });
});

const makeBittrexOrder = (market, quantity, rate, buyOrSell) => new Promise((resolve, reject) => {
    const url = `https://bittrex.com/api/v1.1/market/${buyOrSell}limit?apikey=${apikeys.bittrex.apikey}&market=${market}&quantity=${quantity}&rate=${rate}`;
    Bittrex.sendCustomRequest(url, (data, err) => {
        if (err) reject(err)
        else resolve(data);
    }, true);
});
// await makeBittrexOrder('BTC-ETH', 0.01, 0.079, 'sell').catch((err) => { console.error(err) });

const reducePolTicker = (polTicker) => {
    let parsedData = {}
    Object.keys(polTicker).forEach((polkey) => { 
        parsedData[polkey] = {
            id: polTicker[polkey].id,
            last: parseFloat(polTicker[polkey].last),
            lowestAsk: parseFloat(polTicker[polkey].lowestAsk),
            highestBid: parseFloat(polTicker[polkey].highestBid)
            // percentChange, baseVolume, quoteVolume, isFrozen, high24hr, low24hr; other properties we can use
        }
    })
    return parsedData;  
}

const mapTickers = (bit, pol, currencies) => currencies.map((curr) => {
    const p = pol[`BTC_${curr}`];
    const b = bit.find((market) => market.MarketName === `BTC-${curr}`);
    return b && p ? {
        currency: `BTC-${curr}`,
        averageLast: (b.Last + p.last) / 2,
        buyBit: ((b.Ask - p.highestBid) / ((p.highestBid) + b.Ask) * 0.5) * 100,
        buyPol: ((p.lowestAsk - b.Bid) / ((b.Bid + p.lowestAsk)) * 0.5) * 100
    } : undefined
}).filter((item) => item);


const app = async () => {
    const tickers = await getTickers().catch((err) => { console.error(err) });

    const prices = mapTickers(tickers.bit.result, reducePolTicker(tickers.pol), config.tokens)

    fs.readFile("./log.json", (err, data) => {
        var json = JSON.parse(data)
        json.push({date: new Date(), prices: prices})
        fs.writeFile("./log.json", JSON.stringify(json))
        fs.writeFile("../chart/data.js", "var data = " + JSON.stringify(json))
    })

    setTimeout(app, 300000);

    const sorted = prices.sort((a, b) => {
        return Math.abs(a.buyBit) > Math.abs(a.buyPol) ? Math.abs(a.buyBit) - Math.abs(b.buyBit) : Math.abs(a.buyPol) - Math.abs(b.buyPol);
    });

    console.log(sorted)
}

app();