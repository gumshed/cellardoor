var BN = web3.utils.BN;


var prices = new Object();	
	
var assetsIn;
var accountLiquidityAvailable;
const gasLimitStake = 300000;
const gasLimitApprove = 70000;

var formatter = new Intl.NumberFormat('us-US', {
  style: 'currency',
  currency: 'USD',
});
 
var _MAINNET_ENV = {
	"id": 1,
	"mvtAddress": "0x3d46454212c61ecb7b31248047fa033120b88668",
	"uniswapMiningAddress": "0xC7ED274D6e2A158CDBE8DA8141000AFFA11D33E5",
	"uniswapMiningAddress2": "0xdc00239b1D593E2Cbe6f908cBa1747296C8697Ae",
	"lpAddress": "0xbcc5378b8bc3a305ac30501357467a824de8fe55",
	"lpAddress2": "0x21bd2e44c421f1d34516c8875a8e92d5912e1a05",
	"uniswapAddress": "0xbcc5378b8bc3a305ac30501357467a824de8fe55",
	"uniswapAddress2": "0x21bd2e44c421f1d34516c8875a8e92d5912e1a05",

	"etherscan": "https://etherscan.io/",
	
}
 
var _GOERLI_ENV = {
	"id": 5,
	
	"mvtAddress": "0xfcfc79623431ccf254f01091d4c8b2ce7722b1f1",
	"uniswapMiningAddress": "0x51b668098047f3FF45BDCB0449604f060FD0e4F4",
	"lpAddress": "0xc270f9d3800d308ee7a5213164650be9372ae1f9",
	"uniswapAddress": "0x8f5702821cB454081AAfE1232b89957E19B89Cd7",
	"etherscan": "https://goerli.etherscan.io/",
	
}

var ENV = _MAINNET_ENV;
var OLD_ENVID;
change_environment = function(chainId){
	if(!chainId) return false;
	
	OLD_ENVID = ENV.id;
	
	if(chainId=='0x1'||chainId=='0x01'){ //mainnet
		ENV = _MAINNET_ENV;
		$('.goerli-testnet').addClass('d-none');
		$('.mainnet').removeClass('d-none');
		
	}
	else if(chainId=='0x5'||chainId=='0x05'){
		ENV = _GOERLI_ENV;
		$('.mainnet').addClass('d-none');
		$('.goerli-testnet').removeClass('d-none');
	}
	else{
		Swal.fire(
		  'Only support Mainnet and Goerli',
		  '',
		  'warning'
		)
		return false;
	}
	
	if(page=='main'){ 
		syncCont();
		if(account) syncAccount(account);
	}
	else if(page=='genesis') init_genesis();
	else if(page=='staking') init_staking();
	
	if(OLD_ENVID!=ENV.id){
		setTimeout(refreshData, 50);
	}
	
	return true;
}

var syncCont = function(){
	
	if(page!='main') return;
	
	ENV = _GOERLI_ENV;
	
	
	
}

const blocksPerDay = 4 * 60 * 24;
const daysPerYear = 365;
const mentissa = 1e18;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}



var refreshData = function(){
	syncRate();
	syncAccount(account);
}

function numberToString(num)
{
    let numStr = String(num);

    if (Math.abs(num) < 1.0)
    {
        let e = parseInt(num.toString().split('e-')[1]);
        if (e)
        {
            let negative = num < 0;
            if (negative) num *= -1
            num *= Math.pow(10, e - 1);
            numStr = '0.' + (new Array(e)).join('0') + num.toString().substring(2);
            if (negative) numStr = "-" + numStr;
        }
    }
    else
    {
        let e = parseInt(num.toString().split('+')[1]);
        if (e > 20)
        {
            e -= 20;
            num /= Math.pow(10, e);
            numStr = num.toString() + (new Array(e + 1)).join('0');
        }
    }

    return numStr;
}


/* genesis */



var addMvtToMetamask = async function(){
	
	if(!account){
		Swal.fire(
		  'Error',
		  'Connect MetaMask to continue.',
		  'error'
		)
		return;
	}

	await ethereum.request({
	method: 'wallet_watchAsset',
	params: {
	  type: 'ERC20', // Initially only supports ERC20, but eventually more!
	  options: {
		address: ENV.mvtAddress, // The address that the token is at.
		symbol: 'MVT', // A ticker symbol or shorthand, up to 5 chars.
		decimals: 18, // The number of decimals in the token
		image: 'http://movement.finance/assets/images/new-logo/Logo-Movement-128x128px.png', // A string url of the token logo
	  },
	},
	});
}



var getMvtPrices = async function(){
	let data = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	  },
	  body: JSON.stringify({query: "{ \
		  tokens(where: {id_in: [\"0x3d46454212c61ecb7b31248047fa033120b88668\"]}) {\
			id derivedETH symbol\
			}\
		  bundle(id: \"1\"){ ethPrice }	  }"})
	})
	  .then(r => r.json())
	  .then(data => {return data;});
	  
	  var ethPrice = data.data.bundle.ethPrice;
	  var mvtPrice = data.data.tokens[0].derivedETH * ethPrice;
	  
	  
	  return {MVT: mvtPrice,};
}




var toMaxDecimal = function(num, max=8){
	if(typeof num=='float') num = num.toString();
	
	if(!num) return '0';
	num = num+"";
	
	var tmp = num.split('.');
	
	if(!tmp[1]){
		return tmp[0];
	}
	
	var decNow = tmp[1].length;
	
	if(decNow>max){
		num = tmp[0]+'.'+tmp[1].substring(0, max);
	}
	return num;
}




$(function(){
	if(page=='main'){

		syncCont();
		displayCoinList();
		refreshData();

		setInterval(function(){
			refreshData();
		}, 60000);
		
	}
	else if(page=='genesis'){
		init_genesis();

		setInterval(function(){
			init_genesis();
		}, 60000);
	}
});