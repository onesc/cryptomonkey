const Bittrex = require('node.bittrex.api');
const apikeys = require('./apikeys');
const Poloniex = require('poloniex-api-node');
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

exports.makeBittrexOrder = makeBittrexOrder;
exports.getTickers = getTickers;