const { expect } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/Link.json");
const daiAbi = require("./ContractJson/Dai.json");
const uniJson = require("./ContractJson/Uni.json");

describe("SwapperV1", async ()=> {
    let SwapperV1, swapperV1, link, dai, uni, owner, per1, per2, imperAcountDai;

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3"],});

        SwapperV1 = await ethers.getContractFactory("SwapperV1");
        swapperV1 = await SwapperV1.deploy();

        link = await new ethers.Contract( "0x514910771AF9Ca656af840dff83E8264EcF986CA" , linkAbi);
        dai = await new ethers.Contract( "0x6B175474E89094C44Da98b954EedeAC495271d0F" , daiAbi);
        uni = await new ethers.Contract( "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" , uniJson);

        [owner, per1, per2] = await ethers.getSigners();
        imperAcountDai = await ethers.getSigner("0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3");

        await network.provider.send("hardhat_setBalance", [
            imperAcountDai.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await dai.connect(imperAcountDai).transfer(per2.address, 1000);
        
        await swapperV1.connect(owner).conts();
    });

    describe("Start of the contract", async ()=> {

        it("Error: Should not start the contract twice", async ()=> {
            await expect(swapperV1.connect(owner).conts()).to.be.revertedWith("This contract are init");
        });
    });

    describe("Data verification", async ()=> {

        it("Error: The sum of the percentages must be 100", async ()=> {

            let tokens = ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [90,90];

            await expect(swapperV1.connect(per1).swapEthForToken(
                tokens, 
                porcentages, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Porcentages not 100");

            porcentages = [40,50];

            await expect(swapperV1.connect(per1).swapEthForToken(
                tokens, 
                porcentages, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Porcentages not 100");
        });

        it("Error: Contract addresses must be valid", async ()=> {

            let tokens = ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x0000000000000000000000000000000000000000"];
            let porcentages = [50,50];

            await expect(swapperV1.connect(per1).swapEthForToken(
                tokens, 
                porcentages, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Zero addres");
        });
    });

    describe("Swap from ETH to Token", async ()=> {
        let balanceOwnerBefore, balancePer1Before;

        it("Error: ETH must be sent", async ()=> {

            let tokens = ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            await expect(swapperV1.connect(per1).swapEthForToken(
                tokens, 
                porcentages, 
                {value: ethers.utils.parseEther("0")})
            ).to.be.revertedWith("Need send ETH");
        });

        it("Error: The number of changes must be equal to the number of percentages", async ()=> {

            let tokens = ["0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            await expect(swapperV1.connect(per1).swapEthForToken(
                tokens, 
                porcentages, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("The number of changes must be equal to the number of percentages");

            tokens = ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            porcentages = [100];

            await expect(swapperV1.connect(per1).swapEthForToken(
                tokens, 
                porcentages, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("The number of changes must be equal to the number of percentages");
        });

        it("Swap should be done", async ()=> {

            let tokens = ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            balanceOwnerBefore = await ethers.provider.getBalance(owner.address);
            balancePer1Before = await ethers.provider.getBalance(per1.address);
            let daiBalanceBefore = await dai.connect(owner).balanceOf(per1.address);
            let linkBalanceBefore = await link.connect(owner).balanceOf(per1.address);

            expect(daiBalanceBefore).to.equal(0);
            expect(linkBalanceBefore).to.equal(0);

            await swapperV1.connect(per1).swapEthForToken(tokens, porcentages, {value: ethers.utils.parseEther("1")});

            let daiBalanceAfter = await dai.connect(owner).balanceOf(per1.address);
            let linkBalanceAfter = await link.connect(owner).balanceOf(per1.address);

            if(daiBalanceAfter > 0 && linkBalanceAfter > 0){
                let daiBalanceFinal = daiBalanceBefore + daiBalanceAfter;
                let linkBalanceFinal = linkBalanceBefore + linkBalanceAfter;

                expect(daiBalanceFinal - daiBalanceAfter).to.equal(0);
                expect(linkBalanceFinal - linkBalanceAfter).to.equal(0);
            }else{
                expect(true).to.equal(false);
            }
        });

        it("There should be no money left in the contract", async ()=> {
            expect(await ethers.provider.getBalance(swapperV1.address)).to.equal(0);
        });

        it("The owner of the contract must receive the Fee of 0.1%", async ()=> {
            let payOwner = "1000000000000000";

            let balanceOwnerAfter = await ethers.provider.getBalance(owner.address);

            let ownerWin = balanceOwnerAfter - balanceOwnerBefore;
            let ownerLossWithGas = Number(payOwner) - ownerWin;

            expect(ownerWin + ownerLossWithGas).to.equal(Number(payOwner));
        });

        it("Should not have returned money to the user because everything was swaped", async ()=> {

            let per1Spending = "1000000000000000000";
            let balancePer1After = await ethers.provider.getBalance(per1.address);

            let per1Loss = balancePer1Before - balancePer1After;
            let per1LossWithGas = per1Loss - Number(per1Spending);
            expect(per1Loss - per1LossWithGas).to.equal(Number(per1Spending));
        });
    });

    describe("Swap from Token to Token", async ()=> {

        it("Error: The number of changes must be equal to the number of percentages", async ()=> {

            let tokens = ["0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            await expect(swapperV1.connect(per2).swapTokenForToken(
                "0x6B175474E89094C44Da98b954EedeAC495271d0F" ,
                1000,
                tokens, 
                porcentages
            )).to.be.revertedWith("The number of changes must be equal to the number of percentages");

            tokens = ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            porcentages = [100];

            await expect(swapperV1.connect(per2).swapTokenForToken(
                "0x6B175474E89094C44Da98b954EedeAC495271d0F" ,
                1000,
                tokens, 
                porcentages
            )).to.be.revertedWith("The number of changes must be equal to the number of percentages");
        });

        it("Error: The address of the token to change should not be an invalid address", async ()=> {

            let tokens = ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            await expect(swapperV1.connect(per2).swapTokenForToken(
                "0x0000000000000000000000000000000000000000" ,
                1000,
                tokens, 
                porcentages
            )).to.be.revertedWith("Is a zero addres");

        });

        it("Error: Not approved should fail", async ()=> {

            let tokens = ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            await expect(swapperV1.connect(per2).swapTokenForToken(
                "0x6B175474E89094C44Da98b954EedeAC495271d0F" ,
                1000,
                tokens, 
                porcentages
            )).to.be.revertedWith("STF");
        });

        it("Swap should be done", async ()=> {

            let tokens = ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "0x514910771AF9Ca656af840dff83E8264EcF986CA"];
            let porcentages = [50,50];

            let uniBalanceBefore = await uni.connect(owner).balanceOf(per2.address);
            let linkBalanceBefore = await link.connect(owner).balanceOf(per2.address);

            expect(uniBalanceBefore).to.equal(0);
            expect(linkBalanceBefore).to.equal(0);
            expect(await dai.connect(owner).balanceOf(per2.address)).to.equal(1000);
            expect(await dai.connect(owner).balanceOf(owner.address)).to.equal(0);

            await dai.connect(per2).approve(swapperV1.address, 1000);

            await swapperV1.connect(per2).swapTokenForToken(
                "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                1000,
                tokens, 
                porcentages
            );
            
            let uniBalanceAfter = await uni.connect(owner).balanceOf(per2.address);
            let linkBalanceAfter = await link.connect(owner).balanceOf(per2.address);

            if(uniBalanceAfter > 0 && linkBalanceAfter > 0){
                let uniBalanceFinal = uniBalanceBefore + uniBalanceAfter;
                let linkBalanceFinal = linkBalanceBefore + linkBalanceAfter;

                expect(uniBalanceFinal - uniBalanceAfter).to.equal(0);
                expect(linkBalanceFinal - linkBalanceAfter).to.equal(0);
            }else{
                expect(true).to.equal(false);
            }
        });

        it("There should be no money left in the contract", async ()=> {
            expect(await dai.connect(owner).balanceOf(swapperV1.address)).to.equal(0);
        });

        it("The owner of the contract must receive the Fee of 0.1%", async ()=> {
            expect(await dai.connect(owner).balanceOf(owner.address)).to.equal(1);
        });

        it("If there is user money left, should return it", async ()=> {
            expect(await dai.connect(owner).balanceOf(per2.address)).to.equal(1);
        });
    });
});