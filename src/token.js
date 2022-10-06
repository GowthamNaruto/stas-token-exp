const expect = require('chai').expect;
const utils = require('./utils/test_utils');
const bsv = require('bsv');
require('dotenv').config();

const {
  contract,
  issue,
  transfer,
  transferWithCallback,
  unsignedTransfer,
} = require('../index');

const { getTransaction, getFundsFromFaucet, broadcast } =
  require('../index').utils;

let issuerPrivateKey;
let fundingPrivateKey;
let bobPrivateKey;
let alicePrivateKey;
let contractUtxos;
let fundingUtxos;
let publicKeyHash;
let aliceAddr;
let bobAddr;
let fundingAddress;
let symbol;
let issueTxid;
let issueTx;
let issueOutFundingVout;
const keyMap = new Map();

// beforeEach(async () => {
//   await setup(); // contract and issue
//   issueOutFundingVout = issueTx.vout.length - 1;
// });

// async function transferToken() {
//   const transferHex = await transfer(
//     bobPrivateKey,
//     utils.getUtxo(issueTxid, issueTx, 1),
//     aliceAddr,
//     utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
//     fundingPrivateKey
//   );
//   const transferTxid = await broadcast(transferHex);
//   expect(await utils.getVoutAmount(transferTxid, 0)).to.equal(0.00003);
//   await utils.isTokenBalance(aliceAddr, 10000);
//   await utils.isTokenBalance(bobAddr, 0);

//   console.log(transferTxid);
// }

async function setup() {
  issuerPrivateKey = bsv.PrivateKey();
  // console.log(issuerPrivateKey);
  keyMap.set(issuerPrivateKey.publicKey, issuerPrivateKey);
  fundingPrivateKey = bsv.PrivateKey();
  // console.log(fundingPrivateKey);
  keyMap.set(fundingPrivateKey.publicKey, fundingPrivateKey);
  bobPrivateKey = bsv.PrivateKey();
  // console.log(bobPrivateKey);
  keyMap.set(bobPrivateKey.publicKey, bobPrivateKey);
  alicePrivateKey = bsv.PrivateKey();
  // console.log(alicePrivateKey);
  keyMap.set(alicePrivateKey.publicKey, alicePrivateKey);
  contractUtxos = await getFundsFromFaucet(
    issuerPrivateKey.toAddress(process.env.NETWORK).toString()
  );
  fundingUtxos = await getFundsFromFaucet(
    fundingPrivateKey.toAddress(process.env.NETWORK).toString()
  );
  publicKeyHash = bsv.crypto.Hash.sha256ripemd160(
    issuerPrivateKey.publicKey.toBuffer()
  ).toString('hex');
  symbol = 'CSINR';
  const supply = 10000;
  const schema = utils.schema(publicKeyHash, symbol, supply);
  aliceAddr = alicePrivateKey.toAddress(process.env.NETWORK).toString();
  bobAddr = bobPrivateKey.toAddress(process.env.NETWORK).toString();
  fundingAddress = fundingPrivateKey.toAddress(process.env.NETWORK).toString();

  console.log(schema);

  const contractHex = await contract(
    issuerPrivateKey,
    contractUtxos,
    fundingUtxos,
    fundingPrivateKey,
    schema,
    supply
  );
  const contractTxid = await broadcast(contractHex);
  const contractTx = await getTransaction(contractTxid);

  const issueHex = await issue(
    issuerPrivateKey,
    utils.getIssueInfo(aliceAddr, 7000, bobAddr, 3000),
    utils.getUtxo(contractTxid, contractTx, 0),
    utils.getUtxo(contractTxid, contractTx, 1),
    fundingPrivateKey,
    true,
    symbol,
    2
  );
  issueTxid = await broadcast(issueHex);
  issueTx = await getTransaction(issueTxid);

  issueOutFundingVout = issueTx.vout.length - 1;
  // console.log(issueTxid);
  // console.log(issueTx);
  // console.log(contractTx);
  // console.log(contractTxid);

  const transferHex = await transfer(
    bobPrivateKey,
    utils.getUtxo(issueTxid, issueTx, 1),
    aliceAddr,
    utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
    fundingPrivateKey
  );
  const transferTxid = await broadcast(transferHex);
  expect(await utils.getVoutAmount(transferTxid, 0)).to.equal(0.00003);
  await utils.isTokenBalance(aliceAddr, 10000);
  await utils.isTokenBalance(bobAddr, 0);

  console.log(transferTxid);
}
setup();
// transferToken();
console.log('Everything is working');
