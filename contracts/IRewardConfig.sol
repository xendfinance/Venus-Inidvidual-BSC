pragma solidity ^0.6.6;


interface IRewardConfig{

    function CalculateIndividualSavingsReward(uint totalCycleTimeInSeconds, uint amountDeposited) external view returns(uint);

    function CalculateCooperativeSavingsReward(uint totalCycleTimeInSeconds, uint amountDeposited) external view returns(uint);
    
    function CalculateEsusuReward(uint totalCycleTimeInSeconds, uint amountDeposited) external view returns(uint);
}