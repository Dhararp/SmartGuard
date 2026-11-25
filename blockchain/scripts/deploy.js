
const hre = require("hardhat");

async function main() {
    console.log("Deploying SmartGuard...");

    const SmartGuard = await hre.ethers.getContractFactory("SmartGuard");

    const smartGuard = await SmartGuard.deploy();

    await smartGuard.waitForDeployment();

    const contractAddress = await smartGuard.getAddress();

    console.log("SmartGuard deployed successfully!");
    console.log("Contract Address:", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
