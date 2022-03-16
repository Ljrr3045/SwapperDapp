// @ ts-check
const { expect } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/Link.json");
const daiAbi = require("./ContractJson/Dai.json");
const { ParaSwap } = require('paraswap');
const axios = require("axios");

describe("SwapperV2", async ()=> {
    let SwapperV2, swapperV2, link, dai, owner, imperAcountEth, apiCallForEth;
    const paraSwap = new ParaSwap();

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0xb29380ffc20696729b7ab8d093fa1e2ec14dfe2b"],});

        SwapperV2 = await ethers.getContractFactory("SwapperV2");
        swapperV2 = await SwapperV2.deploy();

        link = await new ethers.Contract( "0x514910771AF9Ca656af840dff83E8264EcF986CA" , linkAbi);
        dai = await new ethers.Contract( "0x6B175474E89094C44Da98b954EedeAC495271d0F" , daiAbi);

        [owner] = await ethers.getSigners();
        imperAcountEth = await ethers.getSigner("0xb29380ffc20696729b7ab8d093fa1e2ec14dfe2b");

        await swapperV2.connect(owner).constV2();
    });

    describe("API calls", async ()=> {

        it("The API calls to ParaSwap should be made", async ()=> {

            async function getData(srcToken, destToken, srcAmount, senderAddress){
        
                let pricesURL = `https://apiv5.paraswap.io/prices/?srcToken=${srcToken}&destToken=${destToken}&amount=${srcAmount}&side=SELL&network=1`;
                let dataResult  = await axios.get(pricesURL);
                
                let destAmount = dataResult.data.priceRoute.destAmount;
                let priceRoute = dataResult.data.priceRoute;
                
                let txParams = await paraSwap.buildTx(srcToken, destToken, srcAmount, destAmount, priceRoute, senderAddress);
        
                return txParams.data;
            }

            apiCallForEth = [];

            apiCallForEth.push(await getData(
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 
                dai.address, 
                "499500000000000000", 
                imperAcountEth.address)
            );
            apiCallForEth.push(await getData(
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 
                link.address, 
                "499500000000000000", 
                imperAcountEth.address)
            );

            apiCallForEth[0] = ethers.utils.hexlify(apiCallForEth[0]);
            apiCallForEth[1] = ethers.utils.hexlify(apiCallForEth[1]);

            expect(ethers.utils.isBytesLike( apiCallForEth[0] )).to.equal(true);
            expect(ethers.utils.isBytesLike( apiCallForEth[1] )).to.equal(true);
        });
    });

    describe("Start of the contract", async ()=> {

        it("Error: Should not start the contract twice", async ()=> {
            await expect(swapperV2.connect(owner).constV2()).to.be.revertedWith("This contract are init");
        });
    });

    describe("Data verification", async ()=> {

        it("Error: The sum of the percentages must be 100", async ()=> {

            let porcentages = [90,90];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages, 
                apiCallForEth, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Porcentages not 100");

            porcentages = [40,50];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages, 
                apiCallForEth, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Porcentages not 100");
        });
    });

    describe("Swap from ETH to Token", async ()=> {
        let balanceOwnerBefore, balancePer1Before;

        it("Error: ETH must be sent", async ()=> {

            let porcentages = [50,50];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages, 
                apiCallForEth, 
                {value: ethers.utils.parseEther("0")})
            ).to.be.revertedWith("Need send ETH");
        });

        it("Error: The number of changes must be equal to the number of percentages", async ()=> {

            let porcentages = [100];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages, 
                apiCallForEth, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("The number of changes must be equal to the number of percentages");
        });

        // it("Swap should be done", async ()=> {

        //     let porcentages = [50,50];

        //     balanceOwnerBefore = await ethers.provider.getBalance(owner.address);
        //     balancePer1Before = await ethers.provider.getBalance(imperAcountEth.address);

        //     let daiBalanceBefore = await dai.connect(owner).balanceOf(imperAcountEth.address);
        //     let linkBalanceBefore = await link.connect(owner).balanceOf(imperAcountEth.address);

        //     expect(daiBalanceBefore).to.equal(0);
        //     expect(linkBalanceBefore).to.equal(0);

        //     let result = await swapperV2.connect(imperAcountEth).swapperEth(
        //        porcentages, 
        //        apiCallForEth, 
        //        {value: ethers.utils.parseEther("5")}
        //     );

        //     let daiBalanceAfter = await dai.connect(owner).balanceOf(imperAcountEth.address);
        //     let linkBalanceAfter = await link.connect(owner).balanceOf(imperAcountEth.address);

        //     if(daiBalanceAfter > 0 && linkBalanceAfter > 0){
        //         let daiBalanceFinal = daiBalanceBefore + daiBalanceAfter;
        //         let linkBalanceFinal = linkBalanceBefore + linkBalanceAfter;

        //         expect(daiBalanceFinal - daiBalanceAfter).to.equal(0);
        //         expect(linkBalanceFinal - linkBalanceAfter).to.equal(0);
        //     }else{
        //         expect(true).to.equal(false);
        //     }
        // });

        // it("There should be no money left in the contract", async ()=> {
        //     expect(await ethers.provider.getBalance(swapperV2.address)).to.equal(0);
        // });

        // it("The owner of the contract must receive the Fee of 0.1%", async ()=> {
        //     let payOwner = "1000000000000000";

        //     let balanceOwnerAfter = await ethers.provider.getBalance(owner.address);

        //     let ownerWin = balanceOwnerAfter - balanceOwnerBefore;
        //     let ownerLossWithGas = Number(payOwner) - ownerWin;

        //     expect(ownerWin + ownerLossWithGas).to.equal(Number(payOwner));
        // });

        // it("Should not have returned money to the user because everything was swaped", async ()=> {

        //     let per1Spending = "1000000000000000000";
        //     let balancePer1After = await ethers.provider.getBalance(imperAcountEth.address);

        //     let per1Loss = balancePer1Before - balancePer1After;
        //     let per1LossWithGas = per1Loss - Number(per1Spending);
        //     expect(per1Loss - per1LossWithGas).to.equal(Number(per1Spending));
        // });
    });
});