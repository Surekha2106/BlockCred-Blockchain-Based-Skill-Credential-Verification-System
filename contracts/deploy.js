const hre = require("hardhat");

async function main() {
  const BlockCred = await hre.ethers.getContractFactory("BlockCred");
  const blockCred = await BlockCred.deploy();

  await blockCred.waitForDeployment();

  console.log(
    `BlockCred contract deployed to: ${await blockCred.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
