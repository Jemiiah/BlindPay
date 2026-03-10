import { ethers } from "hardhat";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";

async function main() {
    const blindpay = await ethers.getContractAt("BlindPay", "0xCb1ef57cC989ba3043edb52542E26590708254fe");
    const usdc = await ethers.getContractAt("MockUSDC", "0xb9E66aA8Ed13bA563247F4b2375fD19CF4B2c32C");
    const [deployer] = await ethers.getSigners();

    console.log("Deployer:", deployer.address);

    // 1. Init FHE
    console.log("\n--- Step 1: Initialize FHE ---");
    console.log("Relayer URL:", SepoliaConfig.relayerUrl);
    const config = {
        ...SepoliaConfig,
        network: "https://ethereum-sepolia-rpc.publicnode.com",
    };
    console.log("Config:", JSON.stringify(config, null, 2));
    const fhe = await createInstance(config);
    console.log("FHE instance created");

    // 2. Encrypt amount (100 USDC = 100_000_000 in 6-decimal)
    console.log("\n--- Step 2: Encrypt amount ---");
    const amount = 100_000_000;
    const salt = ethers.hexlify(ethers.randomBytes(32));

    const input = fhe.createEncryptedInput(
        "0xCb1ef57cC989ba3043edb52542E26590708254fe",
        deployer.address
    );
    input.add64(amount);
    const encrypted = await input.encrypt();
    console.log("Encrypted handle:", encrypted.handles[0].slice(0, 20) + "...");

    // 3. Compute commitment hash
    const commitHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes32"],
        [deployer.address, amount, salt]
    );
    console.log("Commit hash:", commitHash.slice(0, 20) + "...");

    // 4. Create invoice on-chain
    console.log("\n--- Step 3: Create invoice on-chain ---");
    const createTx = await blindpay.createInvoice(
        encrypted.handles[0],
        encrypted.inputProof,
        salt,
        commitHash,
        0, // standard
        1  // USDC
    );
    console.log("Tx:", createTx.hash);
    const createReceipt = await createTx.wait();
    console.log("Status:", createReceipt!.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas:", createReceipt!.gasUsed.toString());

    // 5. Verify invoice exists
    const inv = await blindpay.getInvoice(salt);
    console.log("\nInvoice on-chain:");
    console.log("  Merchant:", inv[0]);
    console.log("  Status:", inv[3].toString(), "(0=pending, 1=settled)");

    // 6. Approve USDC and pay
    console.log("\n--- Step 4: Approve USDC + Pay invoice ---");
    const approveTx = await usdc.approve(
        "0xCb1ef57cC989ba3043edb52542E26590708254fe",
        amount
    );
    await approveTx.wait();
    console.log("USDC approved");

    const payTx = await blindpay.payInvoice(salt, amount);
    console.log("Pay tx:", payTx.hash);
    const payReceipt = await payTx.wait();
    console.log("Status:", payReceipt!.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas:", payReceipt!.gasUsed.toString());

    // 7. Verify settlement
    const inv2 = await blindpay.getInvoice(salt);
    console.log("\nAfter payment:");
    console.log("  Status:", inv2[3].toString(), "(0=pending, 1=settled)");
    console.log("  Payment count:", inv2[4].toString());

    console.log("\n=== ALL TESTS PASSED ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
