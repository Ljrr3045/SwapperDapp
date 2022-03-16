//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol";
import "./SwapperV1.sol";

contract SwapperV2 is SwapperV1{

    bool internal initV2;
    address private tokenTransferProxy;
    address payable private augustusSwapper;

    using LowGasSafeMath for uint256;

//Public Funtions

    function constV2() public {
        require(initV2 == false, "This contract are init");
        tokenTransferProxy = 0x216B4B4Ba9F3e719726886d34a177484278Bfcae;
        augustusSwapper = payable(0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57);
        owner = msg.sender;
        initV2 = true;
    }

    function swapperEth(
        uint[] memory _porcentageForSwap, 
        bytes[] calldata _encodeDate) 
        public
        payable
        comfirmPorcentages(_porcentageForSwap)
        returns(uint[] memory){

        require(msg.value > 0, "Need send ETH");
        require(
            _encodeDate.length == _porcentageForSwap.length, 
            "The number of changes must be equal to the number of percentages"
        );

        uint amountIn;
        uint totalAmountForSwap;
        uint[] memory amountOut = new uint[](_porcentageForSwap.length);

        totalAmountForSwap = msg.value.sub(msg.value/1000);
        payable(owner).transfer(msg.value.sub(totalAmountForSwap));

        for(uint i = 0; i < _porcentageForSwap.length; i++){

            amountIn = totalAmountForSwap.mul(_porcentageForSwap[i])/100;
            
            (bool pass, bytes memory result) = augustusSwapper.call{ value: amountIn }(_encodeDate[i]);
            
            if(pass){
                amountOut[i] = abi.decode(result, (uint));
            }
        }

        if(address(this).balance > 0){

            (bool success,) = msg.sender.call{ value: address(this).balance }("");
            require(success, "refund failed");
        }

        return amountOut;
    }

    function swapperTokens(
        address _tokenForSawapIn, 
        uint _amountForSwap, 
        address[] memory _tokenForSawapOut, 
        uint[] memory _porcentageForSwap, 
        bytes[] memory _encodeDate) 
        public
        comfirmPorcentages(_porcentageForSwap)
        comfirmTokenAddressOut(_tokenForSawapOut) 
        returns(uint[] memory amountOut){

        require(_tokenForSawapIn != 0x0000000000000000000000000000000000000000, "Zero addres");
        require(
            _tokenForSawapOut.length == _porcentageForSwap.length && _encodeDate.length == _porcentageForSwap.length, 
            "The number of changes must be equal to the number of percentages"
        );

        uint amountIn;
        uint _totalAmountForSwap;
        uint _totalAmountForOwner;
        amountOut = new uint[](_tokenForSawapOut.length);

        TransferHelper.safeTransferFrom(_tokenForSawapIn, msg.sender, address(this), _amountForSwap);
        _totalAmountForSwap = _amountForSwap.sub(_amountForSwap/1000);
        _totalAmountForOwner = _amountForSwap.sub(_totalAmountForSwap);
        TransferHelper.safeTransferFrom(_tokenForSawapIn, address(this), owner, _totalAmountForOwner);
        TransferHelper.safeApprove(_tokenForSawapIn, address(tokenTransferProxy), _totalAmountForSwap);

        for(uint i = 0; i < _tokenForSawapOut.length; i++){

            amountIn = _totalAmountForSwap.mul(_porcentageForSwap[i])/100;
            (bool pass, bytes memory result) = augustusSwapper.call(_encodeDate[i]);
            
            if(pass){
                amountOut[i] = abi.decode(result, (uint));
                TransferHelper.safeTransferFrom(_tokenForSawapOut[i], address(this), msg.sender, amountOut[i]);
            }
        }

        uint balance = IERC20(_tokenForSawapIn).balanceOf(address(this));
        if(balance > 0){
            TransferHelper.safeTransferFrom(_tokenForSawapIn, address(this), msg.sender, balance);
        }

        return amountOut;
    }

    function upDate() public pure returns(bool){
        return true;
    }
}