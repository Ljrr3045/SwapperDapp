//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Interfaces/ITokenTransferProxy.sol";
import "./Interfaces/IAugustusSwapper.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SwapperV2 {

    ITokenTransferProxy private tokenTransferProxy;
    IAugustusSwapper private augustusSwapper;
    address owner;
    bool internal initV2;

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

    function constV2 () public {
        require(initV2 == false, "This contract are init");
        tokenTransferProxy = ITokenTransferProxy(0x216B4B4Ba9F3e719726886d34a177484278Bfcae);
        augustusSwapper = IAugustusSwapper(0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57);
        initV2 = true;
    }

    function swapperEth(
        uint[] memory _porcentageForSwap, 
        bytes[] memory _encodeDate) 
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
            (bool pass, bytes memory result) = address(augustusSwapper).call{ value: amountIn }(_encodeDate[i]);
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

    // function swapperTokens(
    //     address _tokenForSawapIn, 
    //     uint _amountForSwap, 
    //     address[] memory _tokenForSawapOut, 
    //     uint[] memory _porcentageForSwap, 
    //     bytes[] memory _encodeDate) 
    //     public
    //     comfirmPorcentages(_porcentageForSwap)
    //     comfirmTokenAddressOut(_tokenForSawapOut) 
    //     returns(uint[] memory amountOut){

    //     require(_tokenForSawapIn != 0x0000000000000000000000000000000000000000, "Zero addres");
    //     require(
    //         _tokenForSawapOut.length == _porcentageForSwap.length && _encodeDate.length == _porcentageForSwap.length, 
    //         "The number of changes must be equal to the number of percentages"
    //     );

    //     uint amountIn;
    //     uint _totalAmountForSwap;
    //     uint _totalAmountForOwner;
    //     amountOut = new uint[](_tokenForSawapOut.length);

    //     tokenTransferProxy.transferFrom(_tokenForSawapIn, msg.sender, address(this), _amountForSwap);
    //     _totalAmountForSwap = _amountForSwap.sub(_amountForSwap/1000);
    //     _totalAmountForOwner = _amountForSwap.sub(_totalAmountForSwap);
    //     tokenTransferProxy.transferFrom(_tokenForSawapIn, address(this), owner, _totalAmountForOwner);
    //     TransferHelper.safeApprove(_tokenForSawapIn, address(tokenTransferProxy), _totalAmountForSwap);

    //     for(uint i = 0; i < _tokenForSawapOut.length; i++){

    //         amountIn = _totalAmountForSwap.mul(_porcentageForSwap[i])/100;
    //         (bool pass, bytes memory result) = address(augustusSwapper).call(_encodeDate[i]);
            
    //         if(pass){
    //             amountOut[i] = abi.decode(result, (uint));
    //             tokenTransferProxy.transferFrom(_tokenForSawapOut[i], address(this), msg.sender, amountOut[i]);
    //         }
    //     }

    //     uint balance = IERC20(_tokenForSawapIn).balanceOf(address(this));
    //     if(balance > 0){
    //         TransferHelper.safeTransferFrom(_tokenForSawapIn, address(this), msg.sender, balance);
    //     }

    //     return amountOut;
    // }
}