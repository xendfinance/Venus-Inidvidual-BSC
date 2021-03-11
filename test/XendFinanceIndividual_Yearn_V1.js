const { assert } = require("console");

const Web3 = require("web3");

const web3 = new Web3("HTTP://127.0.0.1:8545");

const GroupsContract = artifacts.require("Groups");

const TreasuryContract = artifacts.require("Treasury");

const utils = require("./helpers/utils");

const ClientRecordContract = artifacts.require("ClientRecord");

const SavingsConfigContract = artifacts.require("SavingsConfig");

const VenusAdapter = artifacts.require("VenusAdapter");
const VenusLendingService = artifacts.require("VenusLendingService");

const XendFinanceIndividual_Yearn_V1 = artifacts.require(
  "XendFinanceIndividual_Yearn_V1"
);

const RewardConfigContract = artifacts.require("RewardConfig");

const XendTokenContract = artifacts.require("XendToken");

const EsusuServiceContract = artifacts.require("EsusuService");

const DaiContractABI = require("./abi/DaiContract.json");

const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

const daiContract = new web3.eth.Contract(DaiContractABI, busdAddress);

const unlockedAddress = "0x631fc1ea2270e98fbd9d92658ece0f5a269aa161";

//  Approve a smart contract address or normal address to spend on behalf of the owner
async function approveDai(spender, owner, amount) {
  await daiContract.methods.approve(spender, amount).send({ from: owner });

  console.log(
    `Address ${spender}  has been approved to spend ${amount} x 10^-18 Dai by Owner:  ${owner}`
  );
}

//  Send Dai from our constant unlocked address to any recipient
async function sendDai(amount, recipient) {
  var amountToSend = BigInt(amount); //  1000 Dai

  console.log(`Sending  ${amountToSend} x 10^-18 Dai to  ${recipient}`);

  await daiContract.methods
    .transfer(recipient, amountToSend)
    .send({ from: unlockedAddress });

  let recipientBalance = await daiContract.methods.balanceOf(recipient).call();

  console.log(`Recipient: ${recipient} DAI Balance: ${recipientBalance}`);
}
var account1;
var account2;
var account3;

var account1Balance;
var account2Balance;
var account3Balance;

contract("XendFinanceIndividual_Yearn_V1", () => {
  let contractInstance = null;
  let savingsConfigContract = null;
  let xendTokenContract = null;
  let venusLendingService = null;
  let rewardConfigContract = null;
  let clientRecordContract = null;
  let groupsContract = null;
  let venusAdapter = null;

  before(async () => {
    savingsConfigContract = await SavingsConfigContract.deployed();
    xendTokenContract = await XendTokenContract.deployed();
    venusLendingService = await VenusLendingService.deployed();
    clientRecordContract = await ClientRecordContract.deployed();
    rewardConfigContract = await RewardConfigContract.deployed();
    contractInstance = await XendFinanceIndividual_Yearn_V1.deployed();
    venusAdapter = await VenusAdapter.deployed();
    groupsContract = await GroupsContract.deployed();
    //  Get the addresses and Balances of at least 2 accounts to be used in the test
    //  Send DAI to the addresses
    web3.eth.getAccounts().then(function (accounts) {
      account1 = accounts[0];
      account2 = accounts[1];
      account3 = accounts[2];

      //  send money from the unlocked dai address to accounts 1 and 2
      var amountToSend = BigInt(2000000000000000000); //   10,000 Dai

      //  get the eth balance of the accounts
      web3.eth.getBalance(account1, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          account1Balance = web3.utils.fromWei(result, "ether");
          console.log(
            "Account 1: " +
              accounts[0] +
              "  Balance: " +
              account1Balance +
              " ETH"
          );
          
        }
      });

      web3.eth.getBalance(account2, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          account2Balance = web3.utils.fromWei(result, "ether");
          console.log(
            "Account 2: " +
              accounts[1] +
              "  Balance: " +
              account2Balance +
              " ETH"
          );
          sendDai(amountToSend, account2);
        }
      });

      web3.eth.getBalance(account3, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          account3Balance = web3.utils.fromWei(result, "ether");
          console.log(
            "Account 3: " +
              accounts[2] +
              "  Balance: " +
              account3Balance +
              " ETH"
          );
          sendDai(amountToSend, account3);
        }
      });
    });
  });

  it("Should deploy the XendFinanceIndividual_Yearn_V1 smart contracts", async () => {
    assert(contractInstance.address !== "");
  });

  it("should throw error because no client records exist", async () => {
    await utils.shouldThrow(contractInstance.getClientRecord(account2));
  });

  it("should get price per full share", async () => {
    const pricePerFullShare = await venusAdapter.GetPricePerFullShare();

    let value = BigInt(pricePerFullShare);

    console.log(value.toString(), "price per full share");

    assert(value > 0);
  });
  it("should check if client records exist", async () => {
    const doesClientRecordExistResult = await contractInstance.doesClientRecordExist(
      account2
    );

    assert(doesClientRecordExistResult == false);
  });

  it("should deposit and withdraw in flexible savings", async () => {
    console.log(contractInstance.address, "address");

    //  Give allowance to the xend finance individual to spend DAI on behalf of account 1 and 2
    var approvedAmountToSpend = BigInt(2000000000000000000); //   1,000 Dai

    await sendDai(approvedAmountToSpend, account1);

    await approveDai(contractInstance.address, account1, approvedAmountToSpend);

    // await clientRecord.createClientRecord(accounts[2], 0, 0, 0, 0, 0, {from : accounts[3]})
    let balanceBeforeDeposit = await daiContract.methods
      .balanceOf(account1)
      .call();

    console.log(
      `Recipient: ${account1} DAI Balance before deposit: ${balanceBeforeDeposit}`
    );

    await contractInstance.deposit({ from: account1 });

    let balanceAfterDeposit = await daiContract.methods
      .balanceOf(account1)
      .call();

    console.log(
      `Recipient: ${account1} DAI Balance after deposit: ${balanceAfterDeposit}`
    );

    let result = await clientRecordContract.getClientRecordByAddress(account1);

    console.log(
      `depositors address: ${BigInt(result[0])}`,
      `underlyingTotalDeposits:  ${BigInt(result[1])}`,
      `underlyingTotalWithdrawn:  ${BigInt(result[2])}`,
      `derivativeBalance:  ${BigInt(result[3])}`,
      `derivativeTotalDeposits:  ${BigInt(result[4])}`,
      `derivateive total withdrawn:  ${BigInt(result[5])}`,
      "lol"
    );
    const pricePerFullShare = await venusAdapter.GetPricePerFullShare();

    let value = BigInt(pricePerFullShare);

    let derivedDeposit = BigInt(result[4]);

    console.log(derivedDeposit * value, 'here is the guy')

    let amountToWithdraw = BigInt(9000671371);

    await contractInstance.withdraw(amountToWithdraw);

    let balanceAfterWithdrawal = await daiContract.methods
      .balanceOf(account1)
      .call();

    console.log(
      `Recipient: ${account1} DAI Balance after withdrawal: ${balanceAfterWithdrawal}`
    );

    let result2 = await clientRecordContract.getClientRecordByAddress(account1);

    console.log(
      `depositors address: ${BigInt(result2[0])}`,
      `underlyingTotalDeposits:  ${BigInt(result2[1])}`,
      `underlyingTotalWithdrawn:  ${BigInt(result2[2])}`,
      `derivativeBalance:  ${BigInt(result2[3])}`,
      `derivativeTotalDeposits:  ${BigInt(result2[4])}`,
      `derivateive total withdrawn:  ${BigInt(result2[5])}`,
      "lol"
    );


  });

  it("should deposit and withdraw in fixed deposit savings", async () => {
     //  Give allowance to the xend finance individual to spend DAI on behalf of account 1 and 2
     var approvedAmountToSpend = BigInt(2000000000000000000); //   1,000 Dai

     await sendDai(approvedAmountToSpend, account1);
 
     await approveDai(contractInstance.address, account1, approvedAmountToSpend);
 
     // await clientRecord.createClientRecord(accounts[2], 0, 0, 0, 0, 0, {from : accounts[3]})
     let balanceBeforeDeposit = await daiContract.methods
       .balanceOf(account1)
       .call();
 
     console.log(
       `Recipient: ${account1} DAI Balance before deposit: ${balanceBeforeDeposit}`
     );

     let depositDateInSeconds = Date.now().toString();
     
     let lockPeriodInSeconds  = "2"

     await contractInstance.setMinimumLockPeriod(lockPeriodInSeconds);

     await contractInstance.FixedDeposit(depositDateInSeconds, lockPeriodInSeconds);

     let balanceAfterDeposit = await daiContract.methods
     .balanceOf(account1)
     .call();

   console.log(
     `Recipient: ${account1} DAI Balance after deposit: ${balanceAfterDeposit}`
   );

     let depositRecord = await clientRecordContract.GetRecordById(1);

    
     console.log(
      `record id: ${BigInt(depositRecord[0])}`,
      `depositor address:  ${BigInt(depositRecord[1])}`,
      `amount:  ${BigInt(depositRecord[2])}`,
      `derivative amount:  ${BigInt(depositRecord[3])}`,
      `deposit date in seconds:  ${BigInt(depositRecord[4])}`,
      `lock period in seconds:  ${BigInt(depositRecord[5])}`,
      `withdrawn:  ${BigInt(depositRecord[6])}`,
      "deposit record details"
    );

    //const waitTime = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    const pricePerFullShare = await venusAdapter.GetPricePerFullShare();

    let amountToWithdraw = depositRecord[2] / pricePerFullShare;

    //waitTime(60);

    let result = await contractInstance.WithdrawFromFixedDeposit(BigInt(depositRecord[0]));

    let balanceAfterWithdrawal = await daiContract.methods
     .balanceOf(account1)
     .call();

   console.log(
     `Recipient: ${account1} DAI Balance after withdrawal: ${balanceAfterWithdrawal}`
   );

   assert(balanceAfterWithdrawal >= balanceAfterDeposit);

    // console.log(result)

    assert(result.receipt.status == true)

  })
});
