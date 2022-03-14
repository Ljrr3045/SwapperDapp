//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SwapperV1{

    ISwapRouter internal swapRouter;
    IPeripheryPayments internal peripheryPayments;
    address owner;
    bool internal init;

    using LowGasSafeMath for uint256;

//Modifiers

    modifier comfirmPorcentages(uint[] memory _porcentageForSwap){
        uint porcentage;

        for(uint i = 0; i < _porcentageForSwap.length; i++){
            porcentage+= _porcentageForSwap[i];
        }

        require(porcentage == 100, "Porcentages not 100");
        _;
    }

    modifier comfirmTokenAddressOut(address[] memory _tokenForSawap){
        address zeroAddress = 0x0000000000000000000000000000000000000000;

        for(uint i = 0; i < _tokenForSawap.length; i++){
            require(_tokenForSawap[i] != zeroAddress, "Zero addres");
        }
        _;
    }

//Public Funtions

    function conts() public virtual{
        require(init == false, "This contract are init");
        swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
        peripheryPayments = IPeripheryPayments(0xE592427A0AEce92De3Edee1F18E0157C05861564);
        owner = msg.sender;
        init = true;
    }

    function swapEthForToken(
        address[] memory _tokenForSawap, 
        uint[] memory _porcentageForSwap) 
        public 
        payable
        comfirmPorcentages(_porcentageForSwap)
        comfirmTokenAddressOut(_tokenForSawap)
        
        {

        require(msg.value > 0, "Need send ETH");
        require(
            _tokenForSawap.length == _porcentageForSwap.length, 
            "The number of changes must be equal to the number of percentages"
        );

        uint amountIn;
        uint totalAmountForSwap = msg.value.sub(msg.value/1000);

        payable(owner).transfer(msg.value.sub(totalAmountForSwap));

        for(uint i = 0; i < _tokenForSawap.length; i++){
            amountIn = totalAmountForSwap.mul(_porcentageForSwap[i])/100;
            _swapEthForToken(_tokenForSawap[i], amountIn);
        }

        if(address(this).balance > 0){
            (bool success,) = msg.sender.call{ value: address(this).balance }("");
            require(success, "refund failed");
        }
    }

    function swapTokenForToken(
        address _tokenForSawapIn ,
        uint _amountForSwap ,
        address[] memory _tokenForSawapOut, 
        uint[] memory _porcentageForSwap) 
        public
        comfirmPorcentages(_porcentageForSwap)
        comfirmTokenAddressOut(_tokenForSawapOut)
        {
        require(_amountForSwap > 0);
        require(_tokenForSawapIn != 0x0000000000000000000000000000000000000000, "Is a zero addres");
        require(
            _tokenForSawapOut.length == _porcentageForSwap.length, 
            "The number of changes must be equal to the number of percentages"
        );

        uint amountIn;

        TransferHelper.safeTransferFrom(_tokenForSawapIn, msg.sender, address(this), _amountForSwap);
        uint _totalAmountForSwap = _amountForSwap.sub(_amountForSwap/1000);
        uint _totalAmountForOwner = _amountForSwap.sub(_totalAmountForSwap);
        TransferHelper.safeTransferFrom(_tokenForSawapIn, address(this), owner, _totalAmountForOwner);
        TransferHelper.safeApprove(_tokenForSawapIn, address(swapRouter), _totalAmountForSwap);

        for(uint i = 0; i < _tokenForSawapOut.length; i++){
            amountIn = _totalAmountForSwap.mul(_porcentageForSwap[i])/100;
            _swapTokenForToken(_tokenForSawapIn, _tokenForSawapOut[i], amountIn);
        }

        uint balance = IERC20(_tokenForSawapIn).balanceOf(address(this));

        if(balance > 0){
            TransferHelper.safeTransferFrom(_tokenForSawapIn, address(this), msg.sender, balance);
        }
    }

//Private Functions

    function _swapEthForToken(address _tokenForSawap, uint amountIn) private{

        uint24 poolFee = 3000;

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
                tokenOut: _tokenForSawap,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp + 10,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            }
        );

        swapRouter.exactInputSingle{ value: amountIn }(params);
        peripheryPayments.refundETH();
    }

    function _swapTokenForToken(address _tokenForSawapIn, address _tokenForSawapOut, uint amountIn) private {

        uint24 poolFee = 3000;

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenForSawapIn,
                tokenOut: _tokenForSawapOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp + 10,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            }
        );

        swapRouter.exactInputSingle(params);
    }
}