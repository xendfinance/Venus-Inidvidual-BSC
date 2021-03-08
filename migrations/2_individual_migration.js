const Web3 = require("web3");
const DaiContractAddress = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";
const GroupsContract = artifacts.require("Groups");
const TreasuryContract = artifacts.require("Treasury");
const ClientRecordContract = artifacts.require("ClientRecord");
const SavingsConfigContract = artifacts.require("SavingsConfig");
const VenusAdapter = artifacts.require("VenusAdapter");
const VenusLendingService = artifacts.require("VenusLendingService");
const XendFinanceIndividual_Yearn_V1Contract = artifacts.require(
  "XendFinanceIndividual_Yearn_V1"
);
const RewardConfigContract = artifacts.require("RewardConfig");
const XendTokenContract = artifacts.require("XendToken");
const EsusuServiceContract = artifacts.require("EsusuService");
const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
const ibbusdAddress = "0x95c78222B3D6e262426483D42CfA53685A67Ab9D"
// const web3 = new Web3("HTTP://127.0.0.1:8545");
// const daiContract = new web3.eth.Contract(DaiContractABI, DaiContractAddress);

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(GroupsContract);

    console.log("GroupsContract address: " + GroupsContract.address);

    await deployer.deploy(TreasuryContract);

    console.log("TreasuryContract address: " + TreasuryContract.address);

    await deployer.deploy(ClientRecordContract);

    console.log("ClientRecordContract address", ClientRecordContract.address);

    await deployer.deploy(SavingsConfigContract);

    console.log("Savings config address", SavingsConfigContract.address);

    await deployer.deploy(EsusuServiceContract);

    console.log(
      "EsusuServiceContract address: " + EsusuServiceContract.address
    );

    await deployer.deploy(
      RewardConfigContract,
      EsusuServiceContract.address,
      GroupsContract.address
    );

    console.log(
      "RewardConfigContract address: " + RewardConfigContract.address
    );

    await deployer.deploy(XendTokenContract, "Xend Token", "$XEND", "18", "200000000000000000000000000")

    console.log("Xend Token Contract address", XendTokenContract.address);

    await deployer.deploy(VenusLendingService);

    console.log(
      "venusLendingService Contract address: " + VenusLendingService.address
    );

    await deployer.deploy(
      VenusAdapter,
      VenusLendingService.address
    );

    console.log(
      "VenusAdapter address: " + VenusAdapter.address
    );

    
    

    await deployer.deploy(
      XendFinanceIndividual_Yearn_V1Contract,
      VenusLendingService.address,
      busdAddress,
      ClientRecordContract.address,
      SavingsConfigContract.address,
      ibbusdAddress,
      RewardConfigContract.address,
      XendTokenContract.address,
      TreasuryContract.address
    );

    console.log(
      "Xend finance individual",
      XendFinanceIndividual_Yearn_V1Contract.address
    );
   
    let savingsConfigContract = null
    let xendTokenContract = null;
    let venusLendingService = null;
    let rewardConfigContract = null;
    let clientRecordContract = null;
    let individualContract = null;

    savingsConfigContract = await SavingsConfigContract.deployed();
    xendTokenContract = await XendTokenContract.deployed();
    venusLendingService = await VenusLendingService.deployed();
    clientRecordContract = await ClientRecordContract.deployed();
    rewardConfigContract = await RewardConfigContract.deployed();
    individualContract = await XendFinanceIndividual_Yearn_V1Contract.deployed();

    await xendTokenContract.grantAccess(XendFinanceIndividual_Yearn_V1Contract.address);
    console.log("11->Xend Token Has Given access To Xend individual contract to transfer tokens ...");

    await individualContract.setAdapterAddress();
    console.log("12->Set the adapter address ...");

    await clientRecordContract.activateStorageOracle(XendFinanceIndividual_Yearn_V1Contract.address);
     
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
   

    
  });
};
