// SPDX-License-Identifier: MIT

pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "./IClientRecordShema.sol";
import "./IGroupSchema.sol";
import "./SafeERC20.sol";
import "./ReentrancyGuard.sol";
import "./SafeMath.sol";
import "./Ownable.sol";
import "./IVenusLendingService.sol";
import "./IRewardConfig.sol";
import "./IClientRecord.sol";
import "./IERC20.sol";
import "./Address.sol";
import "./ISavingsConfig.sol";
import "./ISavingsConfigSchema.sol";
import "./ITreasury.sol";
import "./IRewardBridge.sol";
import "./IGroups.sol";
import "./IVBUSD.sol";

contract XendFinanceIndividual_Yearn_V1 is
    Ownable,
    IClientRecordSchema,
    ISavingsConfigSchema,
    ReentrancyGuard
{
    using SafeMath for uint256;

    using SafeERC20 for IERC20;

    using SafeERC20 for IVBUSD;

    using Address for address payable;
    using Address for address;


    event UnderlyingAssetDeposited(
        address payable user,
        uint256 underlyingAmount,
        uint256 derivativeAmount,
        uint256 balance
    );

    event DerivativeAssetWithdrawn(
        address payable user,
        uint256 underlyingAmount,
        uint256 derivativeAmount,
        uint256 balance
    );

    event XendTokenReward(
        uint256 date,
        address payable recipient,
        uint256 amount
    );

    IVenusLendingService lendingService;
    IERC20 _busd;
    IClientRecord clientRecordStorage;
    IGroups groupStorage;
    IRewardConfig rewardConfig;
    ISavingsConfig savingsConfig;
    IVBUSD derivativeToken;
    ITreasury treasury;
    IRewardBridge rewardBridge;

    bool isDeprecated;

    uint256 minLockPeriod = 7890000; //minimum lock period is three months by default

    mapping(address => uint256) MemberToXendTokenRewardMapping; //  This tracks the total amount of xend token rewards a member has received

    uint256 _totalTokenReward; //  This tracks the total number of token rewards distributed on the individual savings

    address LendingAdapterAddress;
    address TokenAddress;

    string constant XEND_FINANCE_COMMISION_DIVISOR =
        "XEND_FINANCE_COMMISION_DIVISOR";
    string constant XEND_FINANCE_COMMISION_DIVIDEND =
        "XEND_FINANCE_COMMISION_DIVIDEND";

    constructor(
        address lendingServiceAddress,
        address tokenAddress,
        address clientRecordStorageAddress,
        address groupStorageAddress,
        address savingsConfigAddress,
        address derivativeTokenAddress,
        address rewardConfigAddress,
        address rewardBridgeAddress,
        address treasuryAddress
    ) public {
        lendingService = IVenusLendingService(lendingServiceAddress);
        TokenAddress = tokenAddress;
        _busd = IERC20(tokenAddress);
        clientRecordStorage = IClientRecord(clientRecordStorageAddress);
        groupStorage = IGroups(groupStorageAddress);
        savingsConfig = ISavingsConfig(savingsConfigAddress);
        rewardConfig = IRewardConfig(rewardConfigAddress);
        derivativeToken = IVBUSD(derivativeTokenAddress);
        treasury = ITreasury(treasuryAddress);
        rewardBridge = IRewardBridge(rewardBridgeAddress);
    }

    function setAdapterAddress() external onlyOwner {
        LendingAdapterAddress = lendingService.GetVenusLendingAdapterAddress();
    }
    function updateRewardBridgeAddress(address newRewardBridgeAddress) external onlyOwner{
        require(newRewardBridgeAddress!=address(0x0),"Invalid address");
        require(newRewardBridgeAddress.isContract(),"Invalid contract address");
        rewardBridge = IRewardBridge(newRewardBridgeAddress);
    }


    function setMinimumLockPeriod(uint256 minimumLockPeriod)
        external
        onlyNonDeprecatedCalls
        onlyOwner
    {
        minLockPeriod = minimumLockPeriod;
    }

    function GetTotalTokenRewardDistributed() external view returns (uint256) {
        return _totalTokenReward;
    }

    function deprecateContract(address newServiceAddress)
        external
        onlyOwner
        onlyNonDeprecatedCalls
    {
        isDeprecated = true;
        clientRecordStorage.reAssignStorageOracle(newServiceAddress);
        uint256 derivativeTokenBalance =
            derivativeToken.balanceOf(address(this));
        derivativeToken.safeTransfer(newServiceAddress, derivativeTokenBalance);
    }

    function _UpdateMemberToXendTokeRewardMapping(
        address member,
        uint256 rewardAmount
    ) internal onlyNonDeprecatedCalls {
        MemberToXendTokenRewardMapping[member] = MemberToXendTokenRewardMapping[
            member
        ]
            .add(rewardAmount);
    }

    function GetMemberXendTokenReward(address member)
        external
        view
        returns (uint256)
    {
        return MemberToXendTokenRewardMapping[member];
    }

    function doesClientRecordExist(address depositor)
        external
        view
        onlyNonDeprecatedCalls
        returns (bool)
    {
        return clientRecordStorage.doesClientRecordExist(depositor);
    }

    function getClientRecord(address depositor)
        external
        onlyNonDeprecatedCalls
        returns (
            address payable _address,
            uint256 underlyingTotalDeposits,
            uint256 underlyingTotalWithdrawn,
            uint256 derivativeBalance,
            uint256 derivativeTotalDeposits,
            uint256 derivativeTotalWithdrawn
        )
    {
        ClientRecord memory clientRecord = _getClientRecordByAddress(depositor);
        return (
            clientRecord._address,
            clientRecord.underlyingTotalDeposits,
            clientRecord.underlyingTotalWithdrawn,
            clientRecord.derivativeBalance,
            clientRecord.derivativeTotalDeposits,
            clientRecord.derivativeTotalWithdrawn
        );
    }

    function getClientRecord()
        external
        onlyNonDeprecatedCalls
        returns (
            address payable _address,
            uint256 underlyingTotalDeposits,
            uint256 underlyingTotalWithdrawn,
            uint256 derivativeBalance,
            uint256 derivativeTotalDeposits,
            uint256 derivativeTotalWithdrawn
        )
    {
        ClientRecord memory clientRecord =
            _getClientRecordByAddress(msg.sender);

        return (
            clientRecord._address,
            clientRecord.underlyingTotalDeposits,
            clientRecord.underlyingTotalWithdrawn,
            clientRecord.derivativeBalance,
            clientRecord.derivativeTotalDeposits,
            clientRecord.derivativeTotalWithdrawn
        );
    }

    function getClientRecordByIndex(uint256 index)
        external
        onlyNonDeprecatedCalls
        returns (
            address payable _address,
            uint256 underlyingTotalDeposits,
            uint256 underlyingTotalWithdrawn,
            uint256 derivativeBalance,
            uint256 derivativeTotalDeposits,
            uint256 derivativeTotalWithdrawn
        )
    {
        ClientRecord memory clientRecord = _getClientRecordByIndex(index);
        return (
            clientRecord._address,
            clientRecord.underlyingTotalDeposits,
            clientRecord.underlyingTotalWithdrawn,
            clientRecord.derivativeBalance,
            clientRecord.derivativeTotalDeposits,
            clientRecord.derivativeTotalWithdrawn
        );
    }

    function _getClientRecordByIndex(uint256 index)
        internal
        returns (ClientRecord memory)
    {
        (
            address payable _address,
            uint256 underlyingTotalDeposits,
            uint256 underlyingTotalWithdrawn,
            uint256 derivativeBalance,
            uint256 derivativeTotalDeposits,
            uint256 derivativeTotalWithdrawn
        ) = clientRecordStorage.getClientRecordByIndex(index);
        return
            ClientRecord(
                true,
                _address,
                underlyingTotalDeposits,
                underlyingTotalWithdrawn,
                derivativeBalance,
                derivativeTotalDeposits,
                derivativeTotalWithdrawn
            );
    }

    function _getClientRecordByAddress(address member)
        internal
        view
        returns (ClientRecord memory)
    {
        (
            address payable _address,
            uint256 underlyingTotalDeposits,
            uint256 underlyingTotalWithdrawn,
            uint256 derivativeBalance,
            uint256 derivativeTotalDeposits,
            uint256 derivativeTotalWithdrawn
        ) = clientRecordStorage.getClientRecordByAddress(member);

        return
            ClientRecord(
                true,
                _address,
                underlyingTotalDeposits,
                underlyingTotalWithdrawn,
                derivativeBalance,
                derivativeTotalDeposits,
                derivativeTotalWithdrawn
            );
    }

    function withdraw(uint256 derivativeAmount)
        external
        onlyNonDeprecatedCalls
    {
        address payable recipient = msg.sender;
        _withdraw(recipient, derivativeAmount);
    }

    function withdrawDelegate(
        address payable recipient,
        uint256 derivativeAmount
    ) external onlyNonDeprecatedCalls onlyOwner {
        _withdraw(recipient, derivativeAmount);
    }

    function getFixedDepositRecord(uint256 recordId)
        external
        view
        returns (FixedDepositRecord memory)
    {
        return _getFixedDepositRecordById(recordId);
    }

    function WithdrawFromFixedDeposit(uint256 recordId)
        external
        onlyNonDeprecatedCalls
    {
        address payable recipient = msg.sender;

        FixedDepositRecord memory depositRecord =
            _getFixedDepositRecordById(recordId);

        // uint256 derivativeAmount = 100;

        uint256 derivativeAmount = depositRecord.derivativeBalance;

        require(derivativeAmount > 0, "Cannot withdraw 0 shares");

        require(
            depositRecord.depositorId == recipient,
            "Withdraw can only be called by depositor"
        );

        uint256 depositDate = depositRecord.depositDateInSeconds;

        uint256 lockPeriod = depositRecord.lockPeriodInSeconds;

        _validateLockTimeHasElapsedAndHasNotWithdrawn(recordId);

        uint256 balanceBeforeWithdraw =
            lendingService.UserBUSDBalance(address(this));

        LendingAdapterAddress = lendingService.GetVenusLendingAdapterAddress();

        bool isApprovalSuccessful =
            derivativeToken.approve(LendingAdapterAddress, derivativeAmount);

        require(
            isApprovalSuccessful == true,
            "could not approve busd token for adapter contract"
        );

        lendingService.WithdrawBySharesOnly(derivativeAmount);

        uint256 balanceAfterWithdraw =
            lendingService.UserBUSDBalance(address(this));

        require(
            balanceAfterWithdraw > balanceBeforeWithdraw,
            "Balance after needs to be greater than balance before"
        );

        uint256 amountOfUnderlyingAssetWithdrawn =
            balanceAfterWithdraw.sub(balanceBeforeWithdraw);

        uint256 commissionFees =
            _computeXendFinanceCommisions(amountOfUnderlyingAssetWithdrawn);

        uint256 amountToSendToDepositor =
            amountOfUnderlyingAssetWithdrawn.sub(commissionFees);

        _busd.safeTransfer(recipient, amountToSendToDepositor);

        if (commissionFees > 0) {
            _busd.approve(address(treasury), commissionFees);
            treasury.depositToken(address(_busd));
        }

        clientRecordStorage.UpdateDepositRecordMapping(
            recordId,
            depositRecord.amount,
            0,
            lockPeriod,
            depositDate,
            msg.sender,
            true
        );
        clientRecordStorage.CreateDepositorAddressToDepositRecordMapping(
            recipient,
            depositRecord.recordId,
            depositRecord.amount,
            0,
            lockPeriod,
            depositDate,
            true
        );

        uint secondsElapsed = 0;
        if(lockPeriod>depositDate){
            secondsElapsed = lockPeriod.sub(depositDate);
        }

        _rewardUserWithTokens(secondsElapsed, depositRecord.amount, recipient);

        emit DerivativeAssetWithdrawn(
            recipient,
            amountOfUnderlyingAssetWithdrawn,
            derivativeAmount,
            derivativeAmount
        );
    }

    function _withdraw(address payable recipient, uint256 derivativeAmount)
        internal
        nonReentrant
    {
        _validateUserBalanceIsSufficient(recipient, derivativeAmount);

        uint256 balanceBeforeWithdraw =
            lendingService.UserBUSDBalance(address(this));

        LendingAdapterAddress = lendingService.GetVenusLendingAdapterAddress();

        bool isApprovalSuccessful =
            derivativeToken.approve(LendingAdapterAddress, derivativeAmount);

        require(
            isApprovalSuccessful == true,
            "could not approve idusd token for adapter contract"
        );

        lendingService.WithdrawBySharesOnly(derivativeAmount);

        uint256 balanceAfterWithdraw =
            lendingService.UserBUSDBalance(address(this));

        require(
            balanceAfterWithdraw > balanceBeforeWithdraw,
            "Balance before needs to be greater than balance after"
        );

        uint256 amountOfUnderlyingAssetWithdrawn =
            balanceAfterWithdraw.sub(balanceBeforeWithdraw);

        uint256 commissionFees =
            _computeXendFinanceCommisions(amountOfUnderlyingAssetWithdrawn);

        uint256 amountToSendToDepositor =
            amountOfUnderlyingAssetWithdrawn.sub(commissionFees);

        _busd.safeTransfer(recipient, amountToSendToDepositor);

        if (commissionFees > 0) {
            _busd.approve(address(treasury), commissionFees);
            treasury.depositToken(address(_busd));
        }

        ClientRecord memory clientRecord =
            _updateClientRecordAfterWithdrawal(
                recipient,
                amountOfUnderlyingAssetWithdrawn,
                derivativeAmount
            );
        _updateClientRecord(clientRecord);

        emit DerivativeAssetWithdrawn(
            recipient,
            amountOfUnderlyingAssetWithdrawn,
            derivativeAmount,
            clientRecord.derivativeBalance
        );
    }

    function _validateUserBalanceIsSufficient(
        address payable recipient,
        uint256 derivativeAmount
    ) internal {
        ClientRecord memory clientRecord = _getClientRecordByAddress(recipient);

        uint256 derivativeBalance = clientRecord.derivativeBalance;

        require(
            derivativeBalance >= derivativeAmount,
            "Withdrawal cannot be processes, reason: Insufficient Balance"
        );
    }

    function _computeXendFinanceCommisions(uint256 worthOfMemberDepositNow)
        internal
        returns (uint256)
    {
        uint256 dividend = _getDividend();
        uint256 divisor = _getDivisor();

        require(
            worthOfMemberDepositNow > 0,
            "member deposit really isn't worth much"
        );

        return worthOfMemberDepositNow.mul(dividend).div(divisor).div(100);
    }
    function currentTimeStamp() external view returns (uint256) {
        return now;
    }
    function _validateLockTimeHasElapsedAndHasNotWithdrawn(uint256 recordId)
        internal
    {
        FixedDepositRecord memory depositRecord =
            _getFixedDepositRecordById(recordId);

        uint256 lockPeriod = depositRecord.lockPeriodInSeconds;
        uint256 maturityDate = depositRecord.lockPeriodInSeconds;

        bool hasWithdrawn = depositRecord.hasWithdrawn;

        require(!hasWithdrawn, "Individual has already withdrawn");

        uint256 currentTimeStamp = now;

        require(
            currentTimeStamp >= maturityDate,
            "Funds are still locked, wait until lock period expires"
        );
    }

    function _getDivisor() internal returns (uint256) {
        (
            uint256 minimumDivisor,
            uint256 maximumDivisor,
            uint256 exactDivisor,
            bool appliesDivisor,
            RuleDefinition ruleDefinitionDivisor
        ) = savingsConfig.getRuleSet(XEND_FINANCE_COMMISION_DIVISOR);

        require(appliesDivisor, "unsupported rule defintion for rule set");

        require(
            ruleDefinitionDivisor == RuleDefinition.VALUE,
            "unsupported rule defintion for penalty percentage rule set"
        );
        return exactDivisor;
    }

    function _getDividend() internal returns (uint256) {
        (
            uint256 minimumDividend,
            uint256 maximumDividend,
            uint256 exactDividend,
            bool appliesDividend,
            RuleDefinition ruleDefinitionDividend
        ) = savingsConfig.getRuleSet(XEND_FINANCE_COMMISION_DIVIDEND);

        require(appliesDividend, "unsupported rule defintion for rule set");

        require(
            ruleDefinitionDividend == RuleDefinition.VALUE,
            "unsupported rule defintion for penalty percentage rule set"
        );
        return exactDividend;
    }

    function deposit() external onlyNonDeprecatedCalls {
        _deposit(msg.sender);
    }

    function depositDelegate(address payable depositorAddress)
        external
        onlyNonDeprecatedCalls
        onlyOwner
    {
        _deposit(depositorAddress);
    }

    function _getFixedDepositRecordById(uint256 recordId)
        internal
        view
        returns (FixedDepositRecord memory)

    {
       
        (
            uint256 recordId,
            address payable depositorId,
            uint256 amount,
            uint256 amountOfVBUSD,
            uint256 depositDateInSeconds,
            uint256 lockPeriodInSeconds,
            bool hasWithdrawn
        ) = clientRecordStorage.GetRecordById(recordId);
        FixedDepositRecord memory fixedDepositRecord =
            FixedDepositRecord(
                recordId,
                depositorId,
                hasWithdrawn,
                amount,
                depositDateInSeconds,
                lockPeriodInSeconds,
                amountOfVBUSD
            );
        return fixedDepositRecord;
    }

    function FixedDeposit(
        uint256 lockPeriodInSeconds
    ) external onlyNonDeprecatedCalls {
        address recipient = address(this);

        uint256 depositDateInSeconds = now;

        uint256 amountTransferrable = _busd.allowance(msg.sender, recipient);

        require(
            lockPeriodInSeconds >= minLockPeriod,
            "Minimum lock period must be 3 months"
        );

        require(
            amountTransferrable > 0,
            "Approve an amount > 0 for token before proceeding"
        );

        _busd.safeTransferFrom(msg.sender, recipient, amountTransferrable);

        LendingAdapterAddress = lendingService.GetVenusLendingAdapterAddress();

        _busd.approve(LendingAdapterAddress, amountTransferrable);

        uint256 balanceBeforeDeposit = lendingService.UserShares(recipient);

        lendingService.Save(amountTransferrable);

        uint256 balanceAfterDeposit = lendingService.UserShares(recipient);

        uint256 amountOfVBUSD = balanceAfterDeposit.sub(balanceBeforeDeposit);

        uint256 recordId =
            clientRecordStorage.CreateDepositRecordMapping(
                amountTransferrable,
                amountOfVBUSD,
                lockPeriodInSeconds,
                depositDateInSeconds,
                msg.sender,
                false
            );

        clientRecordStorage
            .CreateDepositorToDepositRecordIndexToRecordIDMapping(
            msg.sender,
            recordId
        );

        clientRecordStorage.CreateDepositorAddressToDepositRecordMapping(
            msg.sender,
            recordId,
            amountTransferrable,
            amountOfVBUSD,
            lockPeriodInSeconds,
            depositDateInSeconds,
            false
        );

        _updateTotalTokenDepositAmount(amountTransferrable);

        emit UnderlyingAssetDeposited(
            msg.sender,
            amountTransferrable,
            amountOfVBUSD,
            amountTransferrable
        );
    }

    function _deposit(address payable depositorAddress) internal {
        address recipient = address(this);
        uint256 amountTransferrable =
            _busd.allowance(depositorAddress, recipient);

        require(
            amountTransferrable > 0,
            "Approve an amount > 0 for token before proceeding"
        );
        _busd.safeTransferFrom(depositorAddress,recipient,amountTransferrable);

        LendingAdapterAddress = lendingService.GetVenusLendingAdapterAddress();

        _busd.approve(LendingAdapterAddress, amountTransferrable);

        uint256 balanceBeforeDeposit = lendingService.UserShares(recipient);

        lendingService.Save(amountTransferrable);

        uint256 balanceAfterDeposit = lendingService.UserShares(recipient);

        uint256 amountOfVBUSD = balanceAfterDeposit.sub(balanceBeforeDeposit);
        ClientRecord memory clientRecord =
            _updateClientRecordAfterDeposit(
                depositorAddress,
                amountTransferrable,
                amountOfVBUSD
            );

        bool exists =
            clientRecordStorage.doesClientRecordExist(depositorAddress);

        if (exists) _updateClientRecord(clientRecord);
        else {
            clientRecordStorage.createClientRecord(
                clientRecord._address,
                clientRecord.underlyingTotalDeposits,
                clientRecord.underlyingTotalWithdrawn,
                clientRecord.derivativeBalance,
                clientRecord.derivativeTotalDeposits,
                clientRecord.derivativeTotalWithdrawn
            );
        }

        _updateTotalTokenDepositAmount(amountTransferrable);

        emit UnderlyingAssetDeposited(
            depositorAddress,
            amountTransferrable,
            amountOfVBUSD,
            clientRecord.derivativeBalance
        );
    }

    function _updateTotalTokenDepositAmount(uint256 amount) internal {
        groupStorage.incrementTokenDeposit(TokenAddress, amount);
    }

    function _updateClientRecordAfterDeposit(
        address payable client,
        uint256 underlyingAmountDeposited,
        uint256 derivativeAmountDeposited
    ) internal returns (ClientRecord memory) {
        bool exists = clientRecordStorage.doesClientRecordExist(client);
        if (!exists) {
            ClientRecord memory record =
                ClientRecord(
                    true,
                    client,
                    underlyingAmountDeposited,
                    0,
                    derivativeAmountDeposited,
                    derivativeAmountDeposited,
                    0
                );

            return record;
        } else {
            ClientRecord memory record = _getClientRecordByAddress(client);

            record.underlyingTotalDeposits = record.underlyingTotalDeposits.add(
                underlyingAmountDeposited
            );
            record.derivativeTotalDeposits = record.derivativeTotalDeposits.add(
                derivativeAmountDeposited
            );
            record.derivativeBalance = record.derivativeBalance.add(
                derivativeAmountDeposited
            );

            return record;
        }
    }

    function _updateClientRecordAfterWithdrawal(
        address payable client,
        uint256 underlyingAmountWithdrawn,
        uint256 derivativeAmountWithdrawn
    ) internal returns (ClientRecord memory) {
        ClientRecord memory record = _getClientRecordByAddress(client);

        record.underlyingTotalWithdrawn = record.underlyingTotalWithdrawn.add(
            underlyingAmountWithdrawn
        );

        record.derivativeTotalWithdrawn = record.derivativeTotalWithdrawn.add(
            derivativeAmountWithdrawn
        );

        record.derivativeBalance = record.derivativeBalance.sub(
            derivativeAmountWithdrawn
        );

        return record;
    }

    function _updateClientRecord(ClientRecord memory clientRecord) internal {
        clientRecordStorage.updateClientRecord(
            clientRecord._address,
            clientRecord.underlyingTotalDeposits,
            clientRecord.underlyingTotalWithdrawn,
            clientRecord.derivativeBalance,
            clientRecord.derivativeTotalDeposits,
            clientRecord.derivativeTotalWithdrawn
        );
    }

    function _emitXendTokenReward(address payable member, uint256 amount)
        internal
    {
        emit XendTokenReward(now, member, amount);
    }

    function _rewardUserWithTokens(
        uint256 totalLockPeriod,
        uint256 amountDeposited,
        address payable recipient
    ) internal {
        uint256 numberOfRewardTokens =
            rewardConfig.CalculateIndividualSavingsReward(
                totalLockPeriod,
                amountDeposited
            );

        if (numberOfRewardTokens > 0) {
            rewardBridge.rewardUser(numberOfRewardTokens,recipient);

            _UpdateMemberToXendTokeRewardMapping(
                recipient,
                numberOfRewardTokens
            );
            //  increase the total number of xend token rewards distributed
            _totalTokenReward = _totalTokenReward.add(numberOfRewardTokens);
            _emitXendTokenReward(recipient, numberOfRewardTokens);
        }
    }

    function withdrawTokens(address tokenAddress) external onlyOwner{
        IERC20 token = IERC20(tokenAddress);
        uint256 balance =  token.balanceOf(address(this));
        token.transfer(owner,balance);        
    }

    modifier onlyNonDeprecatedCalls() {
        require(!isDeprecated, "Service contract has been deprecated");
        _;
    }
}
