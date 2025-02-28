let fs = require("fs");
let path = require("path");
const { ethers } = require("hardhat");
const WETH = require("../artifacts/contracts/mocks/WETH.sol/WETH9.json")
const ERC20Mock = require("../artifacts/contracts/mocks/ERC20Mock.sol/ERC20Mock.json")
const FACTORY = require("../artifacts/contracts/uniswapv2/UniswapV2Factory.sol/UniswapV2Factory.json")
const ROUTER = require("../artifacts/contracts/uniswapv2/UniswapV2Router02.sol/UniswapV2Router02.json")

let FACTORY_ADDRESS;
let ROUTER_ADDRESS;
let WETH_ADDRESS;
let TOKEN1_ADDRESS;
let TOKEN2_ADDRESS;

WETH_ADDRESS = ''
FACTORY_ADDRESS = ''
ROUTER_ADDRESS = ''

const loadJsonFile = require('load-json-file');
let keys = loadJsonFile.sync('./keys.json');
const network = keys.network;
const { infuraKey, deployer, privateKey } = keys.networks[network];
const url = (network === 'hardhat' ? `http://127.0.0.1:8545` : `https://${network}.infura.io/v3/${infuraKey}`)

const config = {
    "url": url,
    "pk": privateKey,
    "gasPrice": "80",
    "users":[deployer],
}

let ETHER_SEND_CONFIG = {
    gasPrice: ethers.utils.parseUnits(config.gasPrice, "gwei")
}
  

console.log("current endpoint  ", config.url)
let provider = new ethers.providers.JsonRpcProvider(config.url)
let walletWithProvider = new ethers.Wallet(config.pk, provider)

function getWallet(key = config.pk) {
  return new ethers.Wallet(key, provider)
}

const sleep = ms =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve()
    }, ms)
  )

async function waitForMint(tx) {
  console.log('tx:', tx)
  let result = null
  do {
    result = await provider.getTransactionReceipt(tx)
    await sleep(100)
  } while (result === null)
  await sleep(200)
}

async function getBlockNumber() {
  return await provider.getBlockNumber()
}

async function deploy() {
  let factory = null, ins = null, tx = null;

  // ERC20Mock Token
  factory = new ethers.ContractFactory(
    ERC20Mock.abi,
    ERC20Mock.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy('Test Tether', 'USDT', '0x3635C9ADC5DEA00000000', ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  TOKEN2_ADDRESS = ins.address
  console.log('USDT_ADDRESS >> ', TOKEN2_ADDRESS);

  ins = new ethers.Contract(
    FACTORY_ADDRESS,
    FACTORY.abi,
    getWallet()
  )

  tx = await ins.createPair(WETH_ADDRESS, TOKEN2_ADDRESS, ETHER_SEND_CONFIG)
  console.log('created Pair')
  await waitForMint(tx.hash)
  console.log('weth/usdt pair >> ', ins.address)
}

async function main() {
    console.log('deploy...')
    await deploy()
    console.log(`
    WETH_ADDRESS = ${WETH_ADDRESS}
    FACTORY_ADDRESS = ${FACTORY_ADDRESS}
    ROUTER_ADDRESS = ${ROUTER_ADDRESS}
  `)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });