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

const EsusuAdapterContract = artifacts.require('EsusuAdapter');
const EsusuAdapterWithdrawalDelegateContract = artifacts.require('EsusuAdapterWithdrawalDelegate');
const EsusuStorageContract = artifacts.require('EsusuStorage');

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
  let esusuAdapterContract = null;
    let esusuAdapterWithdrawalDelegateContract = null;
    let esusuStorageContract = null;
    let esusuServiceContract = null;

  before(async () => {
    savingsConfigContract = await SavingsConfigContract.deployed();
    xendTokenContract = await XendTokenContract.deployed();
    venusLendingService = await VenusLendingService.deployed();
    clientRecordContract = await ClientRecordContract.deployed();
    rewardConfigContract = await RewardConfigContract.deployed();
    contractInstance = await XendFinanceIndividual_Yearn_V1.deployed();
    venusAdapter = await VenusAdapter.deployed();
    groupsContract = await GroupsContract.deployed();
    esusuAdapterWithdrawalDelegateContract = await EsusuAdapterWithdrawalDelegateContract.deployed();
    esusuStorageContract = await EsusuStorageContract.deployed();
    esusuAdapterContract = await EsusuAdapterContract.deployed();
    esusuServiceContract = await EsusuServiceContract.deployed();



    await xendTokenContract.grantAccess(contractInstance.address);
    console.log("11->Xend Token Has Given access To Xend individual contract to transfer tokens ...");

    await contractInstance.setAdapterAddress();
    console.log("12->Set the adapter address ...");

    await clientRecordContract.activateStorageOracle(contractInstance.address);
     
    await savingsConfigContract.createRule("XEND_FINANCE_COMMISION_DIVISOR", 0, 0, 100, 1)

    await savingsConfigContract.createRule("XEND_FINANCE_COMMISION_DIVIDEND", 0, 0, 1, 1)

    await savingsConfigContract.createRule("PERCENTAGE_PAYOUT_TO_USERS", 0, 0, 0, 1)

    await savingsConfigContract.createRule("PERCENTAGE_AS_PENALTY", 0, 0, 1, 1);

    //0. update fortube adapter
    await venusLendingService.updateAdapter(VenusAdapter.address)

     //12.
     await rewardConfigContract.SetRewardParams("100000000000000000000000000", "10000000000000000000000000", "2", "7", "10","15", "4","60", "4");

     //13. 
     await rewardConfigContract.SetRewardActive(true);

     await groupsContract.activateStorageOracle(contractInstance.address);
     
   
  //3. Update the DaiLendingService Address in the EsusuAdapter Contract
  await esusuAdapterContract.UpdateDaiLendingService(venusLendingService.address);
  console.log("3->VenusLendingService Address Updated In EsusuAdapter ...");

  //4. Update the EsusuAdapter Address in the EsusuService Contract
  await esusuServiceContract.UpdateAdapter(esusuAdapterContract.address);
  console.log("4->EsusuAdapter Address Updated In EsusuService ...");

  //5. Activate the storage oracle in Groups.sol with the Address of the EsusuApter
  await  groupsContract.activateStorageOracle(esusuAdapterContract.address);
  console.log("5->EsusuAdapter Address Updated In Groups contract ...");

  //6. Xend Token Should Grant access to the  Esusu Adapter Contract
  await xendTokenContract.grantAccess(esusuAdapterContract.address);
  console.log("6->Xend Token Has Given access To Esusu Adapter to transfer tokens ...");

  //7. Esusu Adapter should Update Esusu Adapter Withdrawal Delegate
  await esusuAdapterContract.UpdateEsusuAdapterWithdrawalDelegate(esusuAdapterWithdrawalDelegateContract.address);
  console.log("7->EsusuAdapter Has Updated Esusu Adapter Withdrawal Delegate Address ...");

  //8. Esusu Adapter Withdrawal Delegate should Update Dai Lending Service
  await esusuAdapterWithdrawalDelegateContract.UpdateDaiLendingService(venusLendingService.address);
  console.log("8->Esusu Adapter Withdrawal Delegate Has Updated Dai Lending Service ...");

  //9. Esusu Service should update esusu adapter withdrawal delegate
  await esusuServiceContract.UpdateAdapterWithdrawalDelegate(esusuAdapterWithdrawalDelegateContract.address);
  console.log("9->Esusu Service Contract Has Updated  Esusu Adapter Withdrawal Delegate Address ...");

  //10. Esusu Storage should Update Adapter and Adapter Withdrawal Delegate
  await esusuStorageContract.UpdateAdapterAndAdapterDelegateAddresses(esusuAdapterContract.address,esusuAdapterWithdrawalDelegateContract.address);
  console.log("10->Esusu Storage Contract Has Updated  Esusu Adapter and Esusu Adapter Withdrawal Delegate Address ...");

  //11. Xend Token Should Grant access to the  Esusu Adapter Withdrawal Delegate Contract
  await xendTokenContract.grantAccess(esusuAdapterWithdrawalDelegateContract.address);
  console.log("11->Xend Token Has Given access To Esusu Adapter Withdrawal Delegate to transfer tokens ...");

 //12. Set Group Creator Reward Percentage
 await esusuAdapterWithdrawalDelegateContract.setGroupCreatorRewardPercent("100");
 console.log("11-> Group Creator reward set on ESUSU Withdrawal Delegate ...");
    
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
     
     let lockPeriodInSeconds  = "1"

     await contractInstance.setMinimumLockPeriod(lockPeriodInSeconds);

     await contractInstance.FixedDeposit(lockPeriodInSeconds);

    let totalTokenDeposited =  await groupsContract.getTokenDeposit(busdAddress);

     console.log(BigInt(totalTokenDeposited).toString(), "total tokens deposited")

     let balanceAfterDeposit = await daiContract.methods
     .balanceOf(account1)
     .call();

   console.log(
     `Recipient: ${account1} DAI Balance after deposit: ${balanceAfterDeposit}`
   );

     let depositRecord = await contractInstance.getFixedDepositRecord("1");

    
    //  console.log(
    //   `record id: ${BigInt(depositRecord[0])}`,
    //   `depositor address:  ${depositRecord[1]}`,
    //   `amount:  ${BigInt(depositRecord[2])}`,
    //   `derivative amount:  ${BigInt(depositRecord[3])}`,
    //   `deposit date in seconds:  ${BigInt(depositRecord[4])}`,
    //   `lock period in seconds:  ${BigInt(depositRecord[5])}`,
    //   `withdrawn:  ${BigInt(depositRecord[6])}`,
    //   "fixed deposit record details"
    // );
    console.log(depositRecord, "fixed deposit record")

    

    const waitTime = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    const pricePerFullShare = await venusAdapter.GetPricePerFullShare();

    let amountToWithdraw = depositRecord[2] / pricePerFullShare;
    let currentTimeStamp = await contractInstance.currentTimeStamp();
    console.log(BigInt(currentTimeStamp).toString(), "current timestamp");

    await waitTime(10);

    currentTimeStamp = await contractInstance.currentTimeStamp();

    console.log(BigInt(currentTimeStamp).toString(), "after await current timestamp");

    await sendDai(approvedAmountToSpend, account1);
 
    await approveDai(contractInstance.address, account1, approvedAmountToSpend);

   await contractInstance.FixedDeposit(depositDateInSeconds, lockPeriodInSeconds);

    let result = await contractInstance.WithdrawFromFixedDeposit("1");

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
