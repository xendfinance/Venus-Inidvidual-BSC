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
const EsusuAdapterContract = artifacts.require('EsusuAdapter');
const EsusuAdapterWithdrawalDelegateContract = artifacts.require('EsusuAdapterWithdrawalDelegate');
const EsusuStorageContract = artifacts.require('EsusuStorage');
const RewardBridgeContract = artifacts.require('RewardBridge');
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

    await deployer.deploy(XendTokenContract, "Xend Token", "$XEND", "18", "200000000000000000000000000");

    console.log("Xend Token Contract address", XendTokenContract.address);
    
    await deployer.deploy(RewardBridgeContract, XendTokenContract.address);
    console.log("Reward Bridge Contract address", RewardBridgeContract.address);


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


     await deployer.deploy(EsusuStorageContract);

    //  address payable serviceContract, address esusuStorageContract, address esusuAdapterContract,
    //                 string memory feeRuleKey, address treasuryContract, address rewardConfigContract, address xendTokenContract

     await deployer.deploy(EsusuAdapterContract,
                            EsusuServiceContract.address,
                            GroupsContract.address,
                            EsusuStorageContract.address);

      await deployer.deploy(EsusuAdapterWithdrawalDelegateContract,
                              EsusuServiceContract.address,
                              EsusuStorageContract.address,
                              EsusuAdapterContract.address,
                              "esusufee",
                              TreasuryContract.address,
                              RewardConfigContract.address,
                              XendTokenContract.address,
                              SavingsConfigContract.address);
    
    

    await deployer.deploy(
      XendFinanceIndividual_Yearn_V1Contract,
      VenusLendingService.address,
      busdAddress,
      ClientRecordContract.address,
      GroupsContract.address,
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
    let groupsContract =null;
    let venusLendingService = null;
    let rewardConfigContract = null;
    let clientRecordContract = null;
    let individualContract = null;
    let esusuAdapterContract = null;
    let esusuAdapterWithdrawalDelegateContract = null;
    let esusuStorageContract = null;
    let esusuServiceContract = null;
    let rewardBridgeContract = null;
    

    savingsConfigContract = await SavingsConfigContract.deployed();
    xendTokenContract = await XendTokenContract.deployed();
    venusLendingService = await VenusLendingService.deployed();
    groupsContract = await GroupsContract.deployed();
    clientRecordContract = await ClientRecordContract.deployed();
    rewardConfigContract = await RewardConfigContract.deployed();
    individualContract = await XendFinanceIndividual_Yearn_V1Contract.deployed();
    esusuAdapterWithdrawalDelegateContract = await EsusuAdapterWithdrawalDelegateContract.deployed();
    esusuStorageContract = await EsusuStorageContract.deployed();
    esusuAdapterContract = await EsusuAdapterContract.deployed();
    esusuServiceContract = await EsusuServiceContract.deployed();
    rewardBridgeContract = await RewardBridgeContract.deployed();


    
  });
};
