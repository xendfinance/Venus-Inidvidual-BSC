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
 await esusuAdapterWithdrawalDelegateContract.setGroupCreatorRewardPercent(10);
 console.log("11-> Group Creator reward set on ESUSU Withdrawal Delegate ...");
    
  });
};
