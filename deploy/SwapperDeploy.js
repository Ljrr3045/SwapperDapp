const CONTRACT_NAME = "SwapperV1";

module.exports = async ({ getNamedAccounts, deployments }) => {

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  
  const swapperV1 = await deploy("SwapperV1", {
    from: deployer,
    proxy: {
      owner: deployer,
      execute: {
        init:"conts",
      },
    },
  });

  console.log("Proxy address is: ", swapperV1.address);
};

module.exports.tags = [CONTRACT_NAME];
