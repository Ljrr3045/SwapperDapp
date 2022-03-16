const {ethers} = require("hardhat");

async function main() {

  let SwapperV1 = await ethers.getContractFactory("SwapperV1");

  let swapperV1 = await upgrades.deployProxy(SwapperV1, {initializer: "conts"});

  console.log("Proxy address is: ", swapperV1.address);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
