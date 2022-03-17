# Swapper Dapp

------------------------------------------------
Note: <br>

If at the time of testing you encounter the error that the api calls are not correct, remember to update the "paraswap.js" file located in the paraswap folder of node_modules (which is installed when installing the dependencies) and in the function "buildTx", replace the api call with the following code "`${this.apiURL}/transactions/${this.network}/?ignoreChecks=true${query}`"

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
