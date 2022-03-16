const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UpDate Proxy", async()=> {
    let SwapperV1, SwapperV2, swapperV1, swapperV2;

    before(async ()=> {

        SwapperV1 = await ethers.getContractFactory("SwapperV1");
        SwapperV2 = await ethers.getContractFactory("SwapperV2");

        swapperV1 = await upgrades.deployProxy(SwapperV1, {initializer: "conts"});
        swapperV2 = await upgrades.upgradeProxy(swapperV1, SwapperV2, {initializer: "constV2"});
    });

    it("Should update", async ()=> {

        expect(await swapperV2.upDate()).to.equal(true);
    });
});