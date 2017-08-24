const api = require ('./api.js');
const fs = require('fs');
const config = require('./config.js')
const apikeys = require('./apikeys');
console.log(api)

// (market, quantity, rate, buyOrSell)


const parsePolTicker = (polTicker) => { 
    const parsedData = {}
    Object.keys(polTicker).forEach((coin) => { 
        parsedData[coin] = {}
        Object.keys(polTicker[coin]).forEach((coindata) => {
            parsedData[coin][coindata] = parseFloat(polTicker[coin][coindata])
        });
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
        buyPol: ((p.lowestAsk - b.Bid) / ((b.Bid + p.lowestAsk)) * 0.5) * 100,
        bittrexData: {...b}, 
        polData: {...p}
    } : undefined
}).filter((item) => item);

const pendingTradeWrapper = (trade, params) => {
   
}


const app = async () => {
    // const tickers = await api.getTickers().catch((err) => { console.error(err) });

    // const prices = mapTickers(tickers.bit.result, parsePolTicker(tickers.pol), config.tokens)

    // fs.readFile("./log.json", (err, data) => {
    //     var json = JSON.parse(data)
    //     json.push({date: new Date(), prices: prices})
    //     fs.writeFile("./log.json", JSON.stringify(json))
    //     fs.writeFile("../chart/data.js", "var data = " + JSON.stringify(json))
    // })

    // setTimeout(app, 300000);

    // const sorted = prices.sort((a, b) => {
    //     return Math.abs(a.buyBit) > Math.abs(a.buyPol) ? Math.abs(a.buyBit) - Math.abs(b.buyBit) : Math.abs(a.buyPol) - Math.abs(b.buyPol);
    // });
}

const trade = async () => {
    const pendingTrades = fs.readFile("./pendingTrades.json", async (err, data) => {
       return JSON.parse(data)   
    })

    const tradeResult = await api.makeBittrexOrder('BTC-OMG', 1, 0.00194001, 'sell').catch((err) => { console.error(err) });
    pendingTrades.push(tradeResult.result.uuid)
    fs.writeFile("./pendingTrades.json", JSON.stringify(pendingTrades.result.uuid))
}

app();