const CONTRACT_NAME = "SwapperV2";

module.exports = async ({ getNamedAccounts, deployments }) => {

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  
  const swapperV2 = await deploy("SwapperV1", {
    from: deployer,
    contract: "SwapperV2",
    proxy: {
      owner: deployer,
      execute: {
        init:"constV2",
      },
    },
  });

  console.log("Proxy address is: ", swapperV2.address);
};

module.exports.tags = [CONTRACT_NAME];