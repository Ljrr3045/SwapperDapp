const {ethers} = require("hardhat");

async function main() {

    let SwapperV1 = await ethers.getContractFactory("SwapperV1");
    let SwapperV2 = await ethers.getContractFactory("SwapperV2");

    let swapperV1 = await upgrades.deployProxy(SwapperV1, {initializer: "conts"});
    let swapperV2 = await upgrades.upgradeProxy(swapperV1, SwapperV2, {initializer: "constV2"});

    console.log("Proxy address is: ", swapperV2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});