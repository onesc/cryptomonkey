const Bittrex = require('node.bittrex.api');
const Poloniex = require('poloniex-api-node');

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

const makeBittrexOrder = options => new Promise((resolve, reject) => {
    const url = `https://bittrex.com/api/v1.1/market/${options.buyOrSell}limit?apikey=${apikeys.bittrex.apikey}&market=${options.market}&quantity=${options.quantity}&rate=${options.rate}`;
    Bittrex.sendCustomRequest(url, (data, err) => {
        if (err) reject(err)
        else resolve(data);
    }, true);
});

const checkOrderStatus = uuid => new Promise((resolve, reject) => {
    const url = `https://bittrex.com/api/v1.1/account/getorder?uuid=${uuid}`
    Bittrex.sendCustomRequest(url, (data, err) => {
        if (err) reject(err)
        else resolve(data);
    }, true);
});

exports.makeBittrexOrder = makeBittrexOrder;
exports.getTickers = getTickers;
exports.checkOrderStatus = checkOrderStatus;