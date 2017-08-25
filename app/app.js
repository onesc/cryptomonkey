const api = require ('./api.js');
const fs = require('fs');
const config = require('./config.js')

const APPINTERVAL = 300000; // app will tick every 5 mins

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

const app = async () => {
    const tickers = await api.getTickers().catch((err) => { console.error(err) });

    const prices = mapTickers(tickers.bit.result, parsePolTicker(tickers.pol), config.tokens)

    fs.readFile("./log.json", (err, data) => {
        var json = JSON.parse(data)
        json.push({date: new Date(), prices: prices})
        fs.writeFile("./log.json", JSON.stringify(json))
        fs.writeFile("../chart/data.js", "var data = " + JSON.stringify(json))
    })

    setTimeout(app, APPINTERVAL);

    const sorted = prices.sort((a, b) => {
        return Math.abs(a.buyBit) > Math.abs(a.buyPol) ? Math.abs(a.buyBit) - Math.abs(b.buyBit) : Math.abs(a.buyPol) - Math.abs(b.buyPol);
    });

    console.log(sorted)
}

app();