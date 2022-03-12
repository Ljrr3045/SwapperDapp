//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Interfaces/ITokenTransferProxy.sol";
import "./Interfaces/IAugustusSwapper.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract SwapperV2 {

    ITokenTransferProxy private tokenTransferProxy;
    IAugustusSwapper private augustusSwapper;
    address owner;
    bool internal initV2;

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

        require(msg.value > 0);
        require(_encodeDate.length == _porcentageForSwap.length);

        uint amountIn;
        uint[] memory amountOut = new uint[](_porcentageForSwap.length);
        uint totalAmountForSwap = msg.value - (msg.value/100);
        payable(owner).transfer(msg.value - totalAmountForSwap);

        for(uint i = 0; i < _porcentageForSwap.length; i++){
            amountIn = (totalAmountForSwap*_porcentageForSwap[i])/100;
            (bool pass, bytes memory result) = address(augustusSwapper).call{ value: amountIn }(_encodeDate[i]);
            if(pass){
                amountOut[i] = abi.decode(result, (uint));
            }
        }

        (bool success,) = msg.sender.call{ value: address(this).balance }("");
        require(success, "refund failed");

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
        returns(uint[] memory){

        require(_tokenForSawapIn != 0x0000000000000000000000000000000000000000, "Zero addres");
        require(_tokenForSawapOut.length == _porcentageForSwap.length && _encodeDate.length == _porcentageForSwap.length);
        uint amountIn;
        uint[] memory amountOut = new uint[](_tokenForSawapOut.length);

        tokenTransferProxy.transferFrom(_tokenForSawapIn, msg.sender, address(this), _amountForSwap);
        uint _totalAmountForSwap = _amountForSwap - (_amountForSwap/100);
        uint _totalAmountForOwner = _amountForSwap - _totalAmountForSwap;
        tokenTransferProxy.transferFrom(_tokenForSawapIn, address(this), owner, _totalAmountForOwner);
        TransferHelper.safeApprove(_tokenForSawapIn, address(tokenTransferProxy), _totalAmountForSwap);

        for(uint i = 0; i < _tokenForSawapOut.length; i++){
            amountIn = (_totalAmountForSwap*_porcentageForSwap[i])/100;
            (bool pass, bytes memory result) = address(augustusSwapper).call(_encodeDate[i]);
            if(pass){
                amountOut[i] = abi.decode(result, (uint));
            }
        }

        return amountOut;
    }
}