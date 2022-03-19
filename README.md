# Swapper Dapp
------------------------------------------------
*Note 1: <br>

- To test Swapper V1 make sure you are on the Ethereum network and configure your hardhat.config to: <br>

networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_URL,
        blockNumber: 14379882, 
      }
    }
  },
<br>

And unlock the contract test:<br>

xdescribe("SwapperV1",   ---->   describe("SwapperV1",<br>

- To test Swapper V2 make sure you are on the Polygon network and set your hardhat.config to: <br>

networks: {
    hardhat: {
      forking: {
        url: process.env.POLY_MAINNET, 
        blockNumber: 26086048,
      }
    }
  }
<br>

xdescribe("SwapperV2_Poly",   ---->   describe("SwapperV2_Poly",<br>

*Note 2:<br>

If your Swapper version 2 test has problems matching the test results, please try again as this is due to communication with the API. The test data is correct.
------------------------------------------------

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
