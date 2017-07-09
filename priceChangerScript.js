var BigNumber = require('bignumber.js');
//var EthereumTx = require('ethereumjs-tx');
const ethjsaccount = require('ethjs-account');
const signer = require('ethjs-signer')
var Web3 = require('web3');
url = "https://kovan.infura.io/";
var web3 = new Web3(new Web3.providers.HttpProvider(url));
var gasLimit = new BigNumber(500000);

reserveAdress = "0x04538b371812D928f49Bc49cDa6384Ae3b7749F3";
reserveAbi = [{"constant":false,"inputs":[{"name":"sourceToken","type":"address"},{"name":"sourceAmount","type":"uint256"},{"name":"destToken","type":"address"},{"name":"destAddress","type":"address"},{"name":"validate","type":"bool"}],"name":"trade","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"ETH_TOKEN_ADDRESS","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"amount","type":"uint256"}],"name":"depositToken","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"source","type":"address"},{"name":"dest","type":"address"}],"name":"getPairInfo","outputs":[{"name":"rate","type":"uint256"},{"name":"expBlock","type":"uint256"},{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"depositEther","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"enable","type":"bool"}],"name":"enableTrade","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tradeEnabled","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"sources","type":"address[]"},{"name":"dests","type":"address[]"},{"name":"conversionRates","type":"uint256[]"},{"name":"expiryBlocks","type":"uint256[]"},{"name":"vaildate","type":"bool"}],"name":"setRate","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"amount","type":"uint256"}],"name":"withdraw","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"token","type":"address"}],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_kyberNetwork","type":"address"},{"name":"_reserveOwner","type":"address"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"origin","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"ErrorReport","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"origin","type":"address"},{"indexed":false,"name":"source","type":"address"},{"indexed":false,"name":"sourceAmount","type":"uint256"},{"indexed":false,"name":"destToken","type":"address"},{"indexed":false,"name":"destAmount","type":"uint256"},{"indexed":false,"name":"destAddress","type":"address"}],"name":"DoTrade","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"source","type":"address"},{"indexed":false,"name":"dest","type":"address"},{"indexed":false,"name":"rate","type":"uint256"},{"indexed":false,"name":"expiryBlock","type":"uint256"}],"name":"SetRate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"enable","type":"bool"}],"name":"EnableTrade","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"DepositToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"}];
privateKey = '0xc7681b9a5216766e979e8c2cbde46a0ceaf56f7f4fc53ba43cc4c8100de96d1b';


reserve = (web3.eth.contract(reserveAbi)).at(reserveAdress);


var updatePrices = function( privateKey, sources, dests, rates, callback ){
    var currentBlock = web3.eth.blockNumber;
    console.log("block = " + currentBlock.toString());
    var expBlock = [];
    var numPairs = sources.length;
    var ratesAsBigNum = [];
    for( var i = 0 ; i < numPairs ; i++ ) {
        expBlock.push( new BigNumber(currentBlock + 1000) );        
    }
    
    var txData = reserve.setRate.getData( sources, dests, rates, expBlock, true );
    return signAndSend( privateKey, txData, reserveAdress, 0, callback );
    
    
};



var signAndSend = function ( userPrivateKey, 
                             txData,
                             destenationAddress,
                             value,
                             callback ) {
    var userAccount = module.exports.privateKeyToAddress(userPrivateKey);

    web3.eth.getTransactionCount(userAccount,
                                 function(err,result){
        if( err ) return callback(err, result);
        var txParams = {
            nonce: "0x" + result.toString(16),
            gasPrice: new BigNumber("0xDF8475800"),
            gasLimit: gasLimit,
            to: destenationAddress,
            value: "0x" + value.toString(16),
            data: txData,
            //chainId: 3         
        };
        
        var raw = signer.sign(txParams, userPrivateKey);
        web3.eth.sendRawTransaction(raw, callback);
                                            
    });    
};


module.exports.privateKeyToAddress = function( privateKey ) {
    return ethjsaccount.privateToAccount(privateKey).address; 
};


var tokens = ["0xdee50257770afe2a63d1d1e8f0506b1cabbd17c4",
              "0xcb5332a9bd3b1c46258f062a6d981c4f89b679cd",
              "0xbedf3c5c45f38ce7f0a6d43e729cf0ab3538c2d9" ];

var baseRate = [2,4,8];

var ether = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";


var counter = 0;

var update = function(callback) {
    var period = counter++ % 20;
    var expFactor = 1;  
    if( period >= 10 ) {
        expFactor = 20 - period; 
    }
    else {
        expFactor = period;
    }
    
    var priceChange = Math.pow( 1.005, expFactor );
    
    var rates = [];
    var sources = [];
    var dests = [];
    var i;
    for ( i = 0 ; i < tokens.length ; i++ ) {
        sources.push(tokens[i]);
        dests.push(ether);
        rates.push( new BigNumber( parseInt(priceChange * baseRate[i] * (10 ** 18)).toString() ) );
    }

    for ( i = 0 ; i < tokens.length ; i++ ) {
        sources.push(ether);
        dests.push(tokens[i]);
        rates.push( new BigNumber(parseInt((10 ** 18)/(priceChange * baseRate[i])).toString()) );
    }

    for( var i = 0 ; i < tokens.length ; i++ ){
        console.log(reserve.getPairInfo( new BigNumber(tokens[i]), ether ) );
        console.log(reserve.getPairInfo( ether, new BigNumber(tokens[i]) ) );        
    } 
    
    console.log(counter);
    
    updatePrices( privateKey, sources, dests, rates, callback );    
};

setInterval(update,1000 * 60 * 5, function(err,result){
    console.log(err,result); 
});


//for( var i = 0 ; i < 100 ; i++ ) update(null);


//function setRate( ERC20[] sources, ERC20[] dests, uint[] conversionRates, uint[] expiryBlocks, bool vaildate ) returns(bool) {


//console.log(reserve.getPairInfo( new BigNumber(tokens[0]), new BigNumber(tokens[3]) ) );
/*
, function(err,result){
    console.log(err,result);        
});*/

//    function getPairInfo( ERC20 source, ERC20 dest ) constant returns(uint rate, uint expBlock, uint balance) {
/*
updatePrices( privateKey, [tokens[0]], [tokens[3]], [3], function(err,result){
    console.log(err,result);

        
});
*/