import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy BlindPay
  const BlindPay = await ethers.getContractFactory("BlindPay");
  const blindpay = await BlindPay.deploy(usdcAddress);
  await blindpay.waitForDeployment();
  const blindpayAddress = await blindpay.getAddress();
  console.log("BlindPay deployed to:", blindpayAddress);

  // Mint test USDC to deployer (1M USDC = 1_000_000 * 1e6)
  const mintTx = await usdc.mint(deployer.address, 1_000_000_000_000n);
  await mintTx.wait();
  console.log("Minted 1M USDC to deployer");

  console.log("\n--- Copy to frontend/.env ---");
  console.log(`VITE_CONTRACT_ADDRESS=${blindpayAddress}`);
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
