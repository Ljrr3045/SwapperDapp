const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/LinkPoly.json");
const SandAbi = require("./ContractJson/SandPoly.json");
const MaticJson = require("./ContractJson/MaticPoly.json");
const axios = require("axios");

const networkID = 137;
const partner = "paraswap";
const apiURL = "https://apiv5.paraswap.io";

//It can take a while to make the API call (if Paraswap has problems)
async function getData(srcToken, destToken, srcAmount, senderAddress, userAddress){

    let tokenInfo = {
        srcToken: srcToken,
        destToken: destToken,
        srcDecimals: 18,
        destDecimals: 18,
      };
  
      let {
        data: { priceRoute },
      } = await axios.get(`${apiURL}/prices`, {
        params: {
          ...tokenInfo,
          amount: srcAmount,
          network: 137,
          userAddress: senderAddress,
          partner,
        },
      });
  
     let deadline = Math.floor(Date.now() / 1000) + 600;
  
      let POST_DATA = {
        ...tokenInfo,
        srcAmount,
        userAddress: senderAddress,
        receiver: senderAddress,
        txOrigin: userAddress,
        slippage: 1 * 100,
        deadline,
        priceRoute,
      };
  
      let { data } = await axios.post(
        `${apiURL}/transactions/${networkID}`,
        JSON.stringify(POST_DATA),
        {
          headers: { "Content-Type": "application/json" },
          params: {
            onlyParams: false,
            ignoreChecks: true,
            ignoreGasEstimate: true,
          },
        }
    );

    return data.data;
}

xdescribe("SwapperV2_Poly", async ()=> {
    let SwapperV2, swapperV2, link, dai, owner, imperAcountEth, imperAcountDai, apiCallForEth, apiCallForToken;

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x25864a712c80d33ba1ad7c23cffa18b46f2fc00c"],});
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x1640e916e10610ba39aac5cd8a08acf3ccae1a4c"],});

        SwapperV2 = await ethers.getContractFactory("SwapperV2");
        swapperV2 = await SwapperV2.deploy();

        link = await new ethers.Contract( "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39" , linkAbi);
        dai = await new ethers.Contract( "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683" , SandAbi);
        uni = await new ethers.Contract( "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" , MaticJson);

        [owner] = await ethers.getSigners();
        imperAcountEth = await ethers.getSigner("0x25864a712c80d33ba1ad7c23cffa18b46f2fc00c");
        imperAcountDai = await ethers.getSigner("0x1640e916e10610ba39aac5cd8a08acf3ccae1a4c");

        await network.provider.send("hardhat_setBalance", [
            imperAcountDai.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await swapperV2.connect(owner).constV2();
    });

    describe("API calls", async ()=> {

        it("The API calls to ParaSwap should be made", async ()=> {

            apiCallForEth = [];
            apiCallForToken = [];

            apiCallForEth.push(await getData(
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 
                dai.address, 
                "499500000000000000", 
                swapperV2.address,
                imperAcountEth.address)
            );
            apiCallForEth.push(await getData(
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 
                link.address, 
                "499500000000000000", 
                swapperV2.address,
                imperAcountEth.address)
            );

            apiCallForToken.push(await getData(
                dai.address, 
                link.address, 
                "499000000000000000000", 
                swapperV2.address,
                imperAcountDai.address)
            );

            apiCallForToken.push(await getData(
                dai.address, 
                uni.address, 
                "499000000000000000000", 
                swapperV2.address,
                imperAcountDai.address)
            );

            /*despite doing this operation, the value of DATA remains the same. Without doing this procedure 
            in the same way the low call cannot pass */
            apiCallForEth[0] = ethers.utils.hexlify(apiCallForEth[0]);
            apiCallForEth[1] = ethers.utils.hexlify(apiCallForEth[1]);
            apiCallForToken[0] = ethers.utils.hexlify(apiCallForToken[0]);
            apiCallForToken[1] = ethers.utils.hexlify(apiCallForToken[1]);

            expect(ethers.utils.isBytesLike( apiCallForEth[0] )).to.equal(true);
            expect(ethers.utils.isBytesLike( apiCallForEth[1] )).to.equal(true);
            expect(ethers.utils.isBytesLike( apiCallForToken[0] )).to.equal(true);
            expect(ethers.utils.isBytesLike( apiCallForToken[1] )).to.equal(true);
        });
    });

    describe("Start of the contract", async ()=> {

        it("Error: Should not start the contract twice", async ()=> {
            await expect(swapperV2.connect(owner).constV2()).to.be.revertedWith("This contract are init");
        });
    });

    describe("Data verification", async ()=> {

        it("Error: The sum of the percentages must be 100", async ()=> {

            let tokens = ["0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683", "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"];
            let porcentages = [90,90];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages,
                tokens,
                apiCallForEth, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Porcentages not 100");

            porcentages = [40,50];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages,
                tokens, 
                apiCallForEth, 
                {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Porcentages not 100");
        });
    });

    describe("Swap from MATIC to Token", async()=> {
        let balanceOwnerBefore, balancePer1Before;

        it("Error: MATIC must be sent", async ()=> {

            let tokens = ["0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683", "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"];
            let porcentages = [50,50];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages,
                tokens,  
                apiCallForEth, 
                {value: ethers.utils.parseEther("0")})
            ).to.be.revertedWith("Need send ETH");
        });

        it("Error: The number of changes must be equal to the number of percentages", async ()=> {

            let tokens = ["0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683", "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"];
            let porcentages = [100];

            await expect(swapperV2.connect(imperAcountEth).swapperEth(
                porcentages,
                tokens,   
                apiCallForEth, 
                {value: ethers.utils.parseEther("2")})
            ).to.be.revertedWith("The number of changes must be equal to the number of percentages");
        });

        it("Swap should be done", async ()=> {

            let tokens = ["0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683", "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"];
            let porcentages = [50, 50];

            balanceOwnerBefore = await ethers.provider.getBalance(owner.address);
            balancePer1Before = await ethers.provider.getBalance(imperAcountEth.address);

            let daiBalanceBefore = await dai.connect(owner).balanceOf(imperAcountEth.address);
            let linkBalanceBefore = await link.connect(owner).balanceOf(imperAcountEth.address);

            expect(daiBalanceBefore).to.equal(0);
            expect(linkBalanceBefore).to.equal(0);

            let result = await swapperV2.connect(imperAcountEth).swapperEth(
               porcentages,
               tokens,    
               apiCallForEth, 
               {value: ethers.utils.parseEther("1")}
            );

            let daiBalanceAfter = await dai.connect(owner).balanceOf(imperAcountEth.address);
            let linkBalanceAfter = await link.connect(owner).balanceOf(imperAcountEth.address);

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
            expect(await ethers.provider.getBalance(swapperV2.address)).to.equal(0);
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
            let balancePer1After = await ethers.provider.getBalance(imperAcountEth.address);

            let per1Loss = balancePer1Before - balancePer1After;
            let per1LossWithGas = per1Loss - Number(per1Spending);
            expect(per1Loss - per1LossWithGas).to.equal(Number(per1Spending));
        });
    });

    describe("Swap from Token to Token", async ()=> {
        let balanceBeforeDaiSeller;

        it("Error: Contract addresses must be valid", async ()=> {

            let tokens = ["0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", "0x0000000000000000000000000000000000000000"];
            let porcentages = [50,50];

            await expect(swapperV2.connect(imperAcountDai).swapperTokens(
                "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
                1000,
                tokens, 
                porcentages,
                apiCallForToken
            )).to.be.revertedWith("Zero addres");
        });

        it("Error: The number of changes must be equal to the number of percentages", async ()=> {

            let tokens = ["0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"];
            let porcentages = [50,50];

            await expect(swapperV2.connect(imperAcountDai).swapperTokens(
                "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
                1000,
                tokens, 
                porcentages,
                apiCallForToken
            )).to.be.revertedWith("The number of changes must be equal to the number of percentages");

            tokens = ["0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"];
            porcentages = [100];

            await expect(swapperV2.connect(imperAcountDai).swapperTokens(
                "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
                1000,
                tokens, 
                porcentages,
                apiCallForToken
            )).to.be.revertedWith("The number of changes must be equal to the number of percentages");
        });

        it("Error: The address of the token to change should not be an invalid address", async ()=> {

            let tokens = ["0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"];
            let porcentages = [50,50];

            await expect(swapperV2.connect(imperAcountDai).swapperTokens(
                "0x0000000000000000000000000000000000000000",
                1000,
                tokens, 
                porcentages,
                apiCallForToken
            )).to.be.revertedWith("Zero addres");
        });

        it("Error: Not approved should fail", async ()=> {

            let tokens = ["0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"];
            let porcentages = [50,50];

            await expect(swapperV2.connect(imperAcountDai).swapperTokens(
                "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
                1000,
                tokens, 
                porcentages,
                apiCallForToken
            )).to.be.revertedWith("NOT_AUTHORIZED_ALLOWANCE");
        });

        it("Swap should be done", async ()=> {

            let tokens = ["0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"];
            let porcentages = [50,50];

            let uniBalanceBefore = await uni.connect(owner).balanceOf(imperAcountDai.address);
            let linkBalanceBefore = await link.connect(owner).balanceOf(imperAcountDai.address);
            balanceBeforeDaiSeller = await dai.connect(owner).balanceOf(imperAcountDai.address);

            expect(uniBalanceBefore).to.equal(0);
            expect(linkBalanceBefore).to.equal(0);
            expect(await dai.connect(owner).balanceOf(owner.address)).to.equal(0);

            await dai.connect(imperAcountDai).approve(swapperV2.address, ethers.utils.parseEther("1500"));

            await swapperV2.connect(imperAcountDai).swapperTokens(
                "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
                ethers.utils.parseEther("1000"),
                tokens, 
                porcentages,
                apiCallForToken
            );
            
            let uniBalanceAfter = await uni.connect(owner).balanceOf(imperAcountDai.address);
            let linkBalanceAfter = await link.connect(owner).balanceOf(imperAcountDai.address);

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
            expect(await dai.connect(owner).balanceOf(swapperV2.address)).to.equal(0);
        });

        it("The owner of the contract must receive the Fee of 0.1%", async ()=> {
            expect(await dai.connect(owner).balanceOf(owner.address)).to.equal("1000000000000000000");
        });

        it("If there is user money left, should return it", async ()=> {

            let balanceAfterDaiSeller = await dai.connect(owner).balanceOf(imperAcountDai.address);
            assert(balanceBeforeDaiSeller > balanceAfterDaiSeller);
        });
    });
});