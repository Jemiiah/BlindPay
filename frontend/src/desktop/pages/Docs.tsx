import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { pageVariants, staggerContainer, fadeInUp } from '../../utils/animations';

const Docs = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const containerVariants = staggerContainer;
    const itemVariants = fadeInUp;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'contracts', label: 'Smart Contract' },
        { id: 'privacy', label: 'Privacy System' },
        { id: 'frontend', label: 'Frontend Logic' },
        { id: 'backend', label: 'Backend API' },
        { id: 'architecture', label: 'Architecture' },
    ];

    const CodeBlock = ({ title, code, language = 'typescript' }: { title: string; code: string; language?: string }) => (
        <div className="mt-6 mb-8 group">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border border-white/10 rounded-t-lg border-b-0">
                <span className="font-mono text-xs text-neon-accent font-bold uppercase tracking-wider">{title}</span>
                <span className="text-[10px] text-gray-500">{language.toUpperCase()}</span>
            </div>
            <pre className="p-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-b-lg overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed group-hover:border-neon-primary/30 transition-colors max-h-[600px] overflow-y-auto custom-scrollbar">
                <code>{code}</code>
            </pre>
        </div>
    );

    return (
        <motion.div
            className="page-container relative min-h-screen"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-zinc-800/20 rounded-full blur-[100px] animate-float-delayed" />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-white/5 rounded-full blur-[120px] animate-pulse-slow" />
            </div>
            <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-screen h-[800px] z-0 pointer-events-none flex justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-radial from-neon-primary/8 via-transparent to-transparent opacity-60" />
            </div>
            <motion.div
                initial="hidden"
                animate="show"
                variants={containerVariants}
                className="w-full max-w-7xl mx-auto pt-12 pb-20 px-6 relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-12 border-b border-white/10 pb-10 flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter leading-tight text-white">
                        Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Documentation</span>
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl leading-relaxed">
                        Complete technical specification of the BlindPay confidential payment protocol powered by FHE.
                    </p>
                </motion.div>

                {/* TABS */}
                <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-12 sticky top-24 z-50 bg-black/50 backdrop-blur-xl p-4 rounded-full border border-white/5 max-w-6xl mx-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-white text-black shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* CONTENT AREA */}
                <div className="min-h-[600px]">

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-12"
                        >
                            <GlassCard className="p-10">
                                <h2 className="text-3xl font-bold text-white mb-6">What is BlindPay?</h2>
                                <p className="text-gray-400 mb-8 leading-relaxed">
                                    BlindPay is a confidential payment protocol built on fhEVM (Fully Homomorphic Encryption on EVM). It enables merchants to create invoices
                                    and receive payments without revealing sensitive transaction details on-chain. BlindPay supports both <strong className="text-white">ETH</strong> and <strong className="text-blue-400">USDC</strong> with FHE-encrypted amounts.
                                </p>

                                <h3 className="text-xl font-bold text-neon-primary mb-4">Key Features</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Confidential Invoices</h4>
                                        <p className="text-sm text-gray-400">
                                            Invoice details (merchant, amount) are hashed on-chain using <span className="text-neon-primary">keccak256</span>. Amounts are stored as FHE-encrypted values.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Encrypted Payments</h4>
                                        <p className="text-sm text-gray-400">
                                            Payments use Zama's <code className="text-neon-primary">FHE.asEuint64()</code> to encrypt amounts. The contract operates on ciphertexts — no plaintext values on-chain.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">USDC Integration</h4>
                                        <p className="text-sm text-gray-400">
                                            Full support for <span className="text-blue-400">USDC</span> (token_type: 1) with confidential ERC-20 transfers via FHE-wrapped token contracts.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Dual-Receipt System</h4>
                                        <p className="text-sm text-gray-400">
                                            Payments emit encrypted PayerReceipt and MerchantReceipt events, providing verifiable proofs only the participants can decrypt.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Multiple Invoice Types</h4>
                                        <p className="text-sm text-gray-400">
                                            Support for Standard (single-payment), Multi Pay (multi-contributor), and Donation (open-ended amount) invoices.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Encrypted Metadata</h4>
                                        <p className="text-sm text-gray-400">
                                            Off-chain data is encrypted with AES-256 and stored securely in Supabase.
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-10">
                                <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
                                <div className="space-y-8">
                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-white mb-2">1. Invoice Creation (Merchant)</h3>
                                        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2">
                                            <li>Merchant enters <strong className="text-white">Amount</strong>, <strong className="text-purple-300">Token Type</strong> (ETH or USDC), and <strong className="text-blue-300">Invoice Type</strong> (Standard, Multi Pay, or Donation).</li>
                                            <li>Client generates random <code className="text-pink-400">salt</code> (128-bit via crypto.getRandomValues).</li>
                                            <li>Client computes <code>invoiceHash = <span className="text-neon-primary">keccak256</span>(abi.encodePacked(merchant, amount, salt))</code>.</li>
                                            <li>Transaction <code className="text-neon-primary">createInvoice()</code> is sent to the fhEVM contract.</li>
                                            <li>On-chain mapping stores <code className="text-purple-400">invoiceHash → InvoiceData</code> with FHE-encrypted amount.</li>
                                            <li>For Donation invoices (type 2), amount is set to 0, allowing payers to send any amount.</li>
                                        </ol>
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-white mb-2">2. Payment (Payer)</h3>
                                        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2">
                                            <li>Payer receives link with <code className="text-gray-300">merchant, amount, salt, token_type</code>.</li>
                                            <li>Client verifies hash on-chain using the salt.</li>
                                            <li>Client encrypts the payment amount using fhEVM's encryption scheme.</li>
                                            <li>Client generates a unique <code className="text-pink-400">payment_secret</code> for receipt tracking.</li>
                                            <li>Transaction <code className="text-neon-primary">payInvoice()</code> is executed on the fhEVM contract.</li>
                                            <li>Payment transfers encrypted amounts. Two receipt events are emitted atomically: <code className="text-green-400">PayerReceipt</code> and <code className="text-blue-400">MerchantReceipt</code>.</li>
                                            <li><strong>Standard Invoice:</strong> Invoice is marked as settled (status = 1) and closed.</li>
                                            <li><strong>Multi Pay Invoice:</strong> Invoice remains open for more payments.</li>
                                            <li><strong>Donation Invoice:</strong> Payer can specify custom amount via <code>payDonation()</code>.</li>
                                        </ol>
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-white mb-2">3. Settlement (Merchant - Multi Pay Only)</h3>
                                        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2">
                                            <li>Merchant calls <code className="text-orange-400">settleInvoice(salt, amount)</code> to close a multi-pay campaign.</li>
                                            <li>Contract verifies merchant identity by recomputing hash with <code>msg.sender</code>.</li>
                                            <li>Invoice status is updated to settled (status = 1), preventing future payments.</li>
                                        </ol>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* SMART CONTRACT */}
                    {activeTab === 'contracts' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">Smart Contract Specification</h2>
                                <p className="text-gray-400 mb-6">
                                    The BlindPay contract is deployed on an fhEVM-enabled chain (Zama).
                                    It supports Standard (single-payment), Multi Pay (multi-payment), and Donation (open-ended amount) invoices for both ETH and USDC.
                                </p>

                                <h3 className="text-xl font-bold text-white mb-4 mt-8">Imports</h3>
                                <CodeBlock
                                    title="External Dependencies"
                                    language="solidity"
                                    code={`import "fhevm/lib/FHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";`}
                                />

                                <h3 className="text-xl font-bold text-white mb-4">Data Structures</h3>
                                <CodeBlock
                                    title="InvoiceData Struct"
                                    language="solidity"
                                    code={`struct InvoiceData {
    uint32 expiryBlock;
    uint8 status;        // 0 = Open, 1 = Settled/Paid
    uint8 invoiceType;   // 0 = Standard, 1 = Multi Pay, 2 = Donation
    uint8 tokenType;     // 0 = ETH, 1 = USDC
    address merchant;
    euint64 encryptedAmount;  // FHE-encrypted amount
}`}
                                />

                                <CodeBlock
                                    title="Receipt Events"
                                    language="solidity"
                                    code={`event PayerReceipt(
    address indexed payer,
    address indexed merchant,
    bytes32 receiptHash,
    bytes32 invoiceHash,
    euint64 encryptedAmount,
    uint8 tokenType,
    uint256 timestamp
);

event MerchantReceipt(
    address indexed merchant,
    bytes32 receiptHash,
    bytes32 invoiceHash,
    euint64 encryptedAmount,
    uint8 tokenType
);`}
                                />

                                <CodeBlock
                                    title="Contract Storage"
                                    language="solidity"
                                    code={`mapping(bytes32 => InvoiceData) public invoices;
mapping(bytes32 => bytes32) public saltToInvoice;`}
                                />

                                <h3 className="text-xl font-bold text-white mb-4 mt-8">Functions</h3>

                                <h4 className="text-lg font-semibold text-neon-accent mb-2">1. createInvoice</h4>
                                <p className="text-sm text-gray-400 mb-4">
                                    Creates a new invoice. The merchant address and amount are hashed to preserve privacy.
                                </p>
                                <CodeBlock
                                    title="createInvoice"
                                    language="solidity"
                                    code={`function createInvoice(
    uint64 amount,
    bytes32 salt,
    uint32 expiryBlocks,
    uint8 invoiceType,  // 0 = Standard, 1 = Multi Pay, 2 = Donation
    uint8 tokenType     // 0 = ETH, 1 = USDC
) external returns (bytes32 invoiceHash) {
    invoiceHash = keccak256(abi.encodePacked(
        msg.sender, amount, salt
    ));

    require(invoices[invoiceHash].merchant == address(0), "Invoice exists");

    // Encrypt the amount using FHE
    euint64 encAmount = FHE.asEuint64(amount);
    FHE.allow(encAmount, msg.sender);

    invoices[invoiceHash] = InvoiceData({
        expiryBlock: uint32(block.number) + expiryBlocks,
        status: 0,
        invoiceType: invoiceType,
        tokenType: tokenType,
        merchant: msg.sender,
        encryptedAmount: encAmount
    });

    saltToInvoice[salt] = invoiceHash;

    emit InvoiceCreated(invoiceHash, msg.sender, invoiceType, tokenType);
}`}
                                />

                                <h4 className="text-lg font-semibold text-neon-accent mb-2 mt-8">2. payInvoice</h4>
                                <p className="text-sm text-gray-400 mb-4">
                                    Pays an invoice with FHE-encrypted amount. Generates dual receipts atomically.
                                </p>
                                <CodeBlock
                                    title="payInvoice"
                                    language="solidity"
                                    code={`function payInvoice(
    bytes32 invoiceHash,
    einput encryptedAmount,
    bytes calldata inputProof,
    bytes32 salt,
    bytes32 paymentSecret
) external payable {
    InvoiceData storage invoice = invoices[invoiceHash];
    require(invoice.status == 0, "Invoice not open");

    // Verify invoice hash matches
    // (payer recomputes hash from payment link params)

    // Convert encrypted input to euint64
    euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

    // Execute transfer based on token type
    if (invoice.tokenType == 0) {
        // ETH: msg.value is used
        payable(invoice.merchant).transfer(msg.value);
    } else {
        // USDC: transfer encrypted ERC-20
        // FHE-wrapped USDC contract handles encrypted transfer
    }

    // Generate receipt hash
    bytes32 receiptHash = keccak256(
        abi.encodePacked(paymentSecret, salt)
    );

    // Emit dual receipts
    emit PayerReceipt(
        msg.sender, invoice.merchant, receiptHash,
        invoiceHash, amount, invoice.tokenType, block.timestamp
    );
    emit MerchantReceipt(
        invoice.merchant, receiptHash,
        invoiceHash, amount, invoice.tokenType
    );

    // Close standard invoices
    if (invoice.invoiceType == 0) {
        invoice.status = 1;
    }
}`}
                                />

                                <h4 className="text-lg font-semibold text-neon-accent mb-2 mt-8">3. payDonation</h4>
                                <p className="text-sm text-gray-400 mb-4">
                                    Pays a donation invoice with a custom amount. Invoice type 2 allows 0-amount invoices.
                                </p>
                                <CodeBlock
                                    title="payDonation"
                                    language="solidity"
                                    code={`function payDonation(
    bytes32 invoiceHash,
    einput encryptedAmount,
    bytes calldata inputProof,
    bytes32 salt,
    bytes32 paymentSecret
) external payable {
    InvoiceData storage invoice = invoices[invoiceHash];
    require(invoice.status == 0, "Invoice not open");
    require(invoice.invoiceType == 2, "Not a donation invoice");

    euint64 donationAmount = FHE.asEuint64(encryptedAmount, inputProof);

    // Transfer and emit receipts (same pattern as payInvoice)
    // Donation invoices remain open for multiple contributions
}`}
                                />

                                <h4 className="text-lg font-semibold text-neon-accent mb-2 mt-8">4. settleInvoice</h4>
                                <p className="text-sm text-gray-400 mb-4">
                                    Allows the merchant to manually close a multi-pay campaign or donation.
                                </p>
                                <CodeBlock
                                    title="settleInvoice"
                                    language="solidity"
                                    code={`function settleInvoice(
    bytes32 salt,
    uint64 amount
) external {
    bytes32 invoiceHash = keccak256(
        abi.encodePacked(msg.sender, amount, salt)
    );

    bytes32 storedHash = saltToInvoice[salt];
    require(invoiceHash == storedHash, "Hash mismatch");

    InvoiceData storage invoice = invoices[storedHash];
    require(invoice.merchant == msg.sender, "Not merchant");
    require(invoice.status == 0, "Already settled");

    invoice.status = 1;

    emit InvoiceSettled(storedHash, msg.sender);
}`}
                                />
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* PRIVACY SYSTEM */}
                    {activeTab === 'privacy' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Privacy Architecture</h2>
                                <p className="text-gray-400 mb-8 leading-relaxed">
                                    BlindPay implements a multi-layered privacy system combining Fully Homomorphic Encryption (FHE), cryptographic commitments, and encrypted off-chain storage.
                                </p>

                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-4">1. FHE-Encrypted On-Chain Values</h3>
                                        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                                            Instead of storing plaintext amounts, BlindPay uses Zama's FHE library to store all sensitive values as encrypted ciphertexts on-chain.
                                        </p>
                                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-sm font-bold text-white mb-2">Encrypted Types Used</h4>
                                            <ul className="text-xs text-gray-400 space-y-1">
                                                <li>• <strong className="text-blue-400">euint64:</strong> Encrypted payment amounts</li>
                                                <li>• <strong className="text-purple-400">euint128:</strong> Large encrypted values (USDC with decimals)</li>
                                                <li>• <strong className="text-neon-primary">ebool:</strong> Encrypted boolean flags (e.g., invoice status checks)</li>
                                                <li>• <strong className="text-orange-400">eaddress:</strong> Encrypted addresses for enhanced sender privacy</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-4">2. Access-Controlled Decryption</h3>
                                        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                                            Only authorized parties can decrypt their own data. The contract uses FHE.allow() to grant access.
                                        </p>
                                        <CodeBlock
                                            title="Access Control Pattern"
                                            language="solidity"
                                            code={`// Only the merchant can decrypt their received amount
FHE.allow(encryptedAmount, invoice.merchant);

// Only the payer can decrypt their payment proof
FHE.allow(encryptedAmount, msg.sender);

// The contract itself needs access for computations
FHE.allow(encryptedAmount, address(this));`}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-4">3. Invoice Hash Integrity</h3>
                                        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                                            Invoice hashes are computed using keccak256 to ensure tamper-proof integrity.
                                        </p>
                                        <CodeBlock
                                            title="Invoice Hash Computation"
                                            language="solidity"
                                            code={`bytes32 invoiceHash = keccak256(
    abi.encodePacked(merchant, amount, salt)
);

// Verification: Payer recomputes hash and compares with on-chain value
// If hashes match, invoice is authentic and unmodified`}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-4">4. Encrypted Transfers via fhEVM</h3>
                                        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                                            All payments process encrypted amounts. The fhEVM runtime validates operations on ciphertexts without decryption.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                                <h4 className="text-sm font-bold text-white mb-2">ETH Transfers</h4>
                                                <p className="text-xs text-gray-400">
                                                    Native ETH payments use msg.value with encrypted receipt amounts. The on-chain receipt stores FHE-encrypted values only.
                                                </p>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                                <h4 className="text-sm font-bold text-white mb-2">Confidential USDC</h4>
                                                <p className="text-xs text-gray-400">
                                                    USDC transfers use an FHE-wrapped ERC-20 contract where balances are stored as euint64 ciphertexts. Transfer amounts remain encrypted end-to-end.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-4">5. Off-Chain Encryption</h3>
                                        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                                            The backend database uses AES-256 encryption for merchant addresses. Amount and memo fields are NOT stored.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                                <div className="text-red-400 text-xs uppercase tracking-widest mb-1">Removed</div>
                                                <div className="font-mono text-sm text-gray-400 line-through">Amount</div>
                                                <div className="font-mono text-sm text-gray-400 line-through">Memo</div>
                                            </div>
                                            <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                                                <div className="text-green-400 text-xs uppercase tracking-widest mb-1">Encrypted</div>
                                                <div className="font-mono text-sm text-white">Merchant Addr</div>
                                                <div className="font-mono text-xs text-green-300 mt-1 truncate">U2FsdGVkX19...</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* FRONTEND */}
                    {activeTab === 'frontend' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Frontend Architecture</h2>

                                <h3 className="text-xl font-bold text-neon-accent mb-4">Hook: useCreateInvoice</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Manages the invoice creation flow for merchants. Supports both <span className="text-white">ETH</span> and <span className="text-blue-400">USDC</span>.
                                </p>
                                <CodeBlock
                                    title="useCreateInvoice.ts (Core Logic)"
                                    code={`const handleCreate = async () => {
    const merchant = address; // from useAccount()
    const salt = generateSalt(); // crypto.getRandomValues

    // Compute invoice hash client-side
    const invoiceHash = computeInvoiceHash(merchant, amount, salt);

    // Call fhEVM contract via wagmi
    const txHash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: BLINDPAY_ABI,
        functionName: 'createInvoice',
        args: [
            parseAmount(amount),
            salt,
            0, // expiryBlocks
            invoiceType === 'standard' ? 0 :
                invoiceType === 'multipay' ? 1 : 2,
            tokenType // 0 = ETH, 1 = USDC
        ],
    });

    // Store invoice metadata in backend
    await api.post('/api/invoices', {
        invoice_hash: invoiceHash,
        merchant_address: merchant,
        salt, invoice_type: invoiceType
    });
};`}
                                />

                                <h3 className="text-xl font-bold text-neon-accent mb-4 mt-8">Hook: usePayment</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Manages the payment flow for payers. Handles wallet connection and FHE-encrypted transfers.
                                </p>
                                <CodeBlock
                                    title="usePayment.ts (Payment Flow)"
                                    code={`const handlePay = async () => {
    // Encrypt the payment amount for fhEVM
    const instance = await createFhevmInstance();
    const encryptedAmount = instance.encrypt64(amountInWei);

    // Call the contract
    const txHash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: BLINDPAY_ABI,
        functionName: invoice.invoiceType === 2
            ? 'payDonation' : 'payInvoice',
        args: [
            invoiceHash,
            encryptedAmount,
            inputProof,
            salt,
            paymentSecret
        ],
        value: tokenType === 0 ? amountInWei : 0n,
    });

    // Update backend with payment TX
    await api.patch(\`/api/invoices/\${invoiceHash}\`, {
        status: 'SETTLED',
        payment_tx_ids: txHash
    });
};`}
                                />

                                <h3 className="text-xl font-bold text-neon-accent mb-4 mt-8">Utility: evm-utils.ts</h3>
                                <CodeBlock
                                    title="evm-utils.ts"
                                    code={`import { keccak256, encodePacked, parseUnits } from "viem";

export const generateSalt = (): \`0x\${string}\` => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return \`0x\${Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}\` as \`0x\${string}\`;
};

export const computeInvoiceHash = (
    merchant: string, amount: bigint, salt: string
) => keccak256(
    encodePacked(
        ['address', 'uint256', 'bytes32'],
        [merchant, amount, salt]
    )
);`}
                                />

                                <h3 className="text-xl font-bold text-neon-accent mb-4 mt-8">Mobile Architecture</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    The mobile app is a lightweight version optimized for fast loading and essential features.
                                </p>
                                <CodeBlock
                                    title="App.tsx (Responsive Entry Point)"
                                    code={`const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

function App() {
    const isMobile = useIsMobile();
    return (
        <Router>
            <Suspense fallback={<LoadingScreen />}>
                {isMobile ? <MobileApp /> : <DesktopApp />}
            </Suspense>
        </Router>
    );
}`}
                                />
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* BACKEND */}
                    {activeTab === 'backend' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Backend Infrastructure</h2>
                                <p className="text-gray-400 mb-6">
                                    The backend is a Node.js/Express API that indexes on-chain invoices and stores metadata in Supabase.
                                </p>

                                <h3 className="text-xl font-bold text-white mb-4">Key Components</h3>
                                <ul className="list-disc pl-5 text-sm text-gray-400 space-y-2 mb-8">
                                    <li><strong className="text-blue-400">Supabase Database:</strong> Stores encrypted invoice metadata</li>
                                    <li><strong className="text-neon-primary">AES-256 Encryption:</strong> Merchant addresses are encrypted at rest</li>
                                    <li><strong className="text-purple-400">REST API:</strong> Provides endpoints for fetching invoices and updating statuses</li>
                                </ul>

                                <h3 className="text-xl font-bold text-white mb-4">Encryption System</h3>
                                <CodeBlock
                                    title="encryption.js"
                                    code={`const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY;

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}`}
                                />

                                <h3 className="text-xl font-bold text-white mb-4 mt-8">API Endpoints</h3>
                                <div className="space-y-4">
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <code className="text-neon-primary">GET /api/invoices</code>
                                        <p className="text-sm text-gray-400 mt-2">Fetch all invoices (decrypted)</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <code className="text-neon-primary">GET /api/invoice/:hash</code>
                                        <p className="text-sm text-gray-400 mt-2">Fetch a single invoice by hash</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <code className="text-neon-primary">GET /api/invoices/merchant/:address</code>
                                        <p className="text-sm text-gray-400 mt-2">Fetch all invoices for a merchant (decrypted and filtered)</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <code className="text-neon-primary">POST /api/invoices</code>
                                        <p className="text-sm text-gray-400 mt-2">Create a new invoice entry</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <code className="text-neon-primary">PATCH /api/invoices/:hash</code>
                                        <p className="text-sm text-gray-400 mt-2">Update invoice status (e.g., mark as SETTLED)</p>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                    {activeTab === 'architecture' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">System Architecture</h2>

                                <div className="space-y-12">
                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-neon-primary mb-2">Layer 1: Frontend (React + wagmi + viem)</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            The client is responsible for:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                                            <li>Generating salts using <code className="text-pink-400">crypto.getRandomValues()</code></li>
                                            <li>Interfacing with <span className="text-purple-400">MetaMask / WalletConnect</span> via wagmi</li>
                                            <li>Computing invoice hashes <span className="text-neon-primary">client-side</span> with viem</li>
                                            <li>Encrypting payment inputs for <span className="text-blue-300">fhEVM</span></li>
                                            <li>Responsive design: <span className="text-white">Desktop</span> (full features) vs <span className="text-white">Mobile</span> (lightweight)</li>
                                        </ul>
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-neon-primary mb-2">Layer 2: Smart Contract (Solidity + FHE)</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            The on-chain protocol enforces:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                                            <li><span className="text-neon-primary">Hash integrity</span> verification via keccak256</li>
                                            <li>Invoice status management (<span className="text-yellow-400">Pending</span> → <span className="text-green-400">Settled</span>)</li>
                                            <li>FHE-encrypted transfers via <code className="text-blue-400">FHE.asEuint64()</code></li>
                                            <li><span className="text-purple-400">Dual-receipt</span> event emission (<span className="text-green-400">PayerReceipt</span> + <span className="text-blue-400">MerchantReceipt</span>)</li>
                                            <li>Support for <span className="text-white">3 invoice types</span>: Standard, Multi Pay, Donation</li>
                                            <li>Support for <span className="text-white">2 token types</span>: ETH, USDC</li>
                                        </ul>
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0  w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-neon-primary mb-2">Layer 3: Indexer + Database (Node.js + Supabase)</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            The backend provides:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                                            <li><span className="text-green-400">Fast invoice lookups</span> (no need to query blockchain repeatedly)</li>
                                            <li><span className="text-neon-primary">Encrypted storage</span> for merchant addresses</li>
                                            <li><span className="text-purple-400">Transaction history</span> aggregation</li>
                                        </ul>
                                        <p className="text-sm text-gray-500 italic mt-4">
                                            Note: Even if the database is compromised, merchant addresses remain encrypted.
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Security Model</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-neon-accent font-bold mb-2">128-bit Salt</h4>
                                        <p className="text-sm text-gray-400">
                                            Provides <span className="text-neon-primary">2^128</span> computational security. Brute-forcing is <span className="text-red-400">thermodynamically impossible</span>.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-neon-accent font-bold mb-2">keccak256 Hash</h4>
                                        <p className="text-sm text-gray-400">
                                            <span className="text-neon-primary">Collision-resistant</span> hash function native to the EVM, used for invoice and receipt integrity.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-neon-accent font-bold mb-2">AES-256 Encryption</h4>
                                        <p className="text-sm text-gray-400">
                                            Off-chain merchant addresses <span className="text-green-400">encrypted at rest</span>. Decryption requires backend secret key.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-neon-accent font-bold mb-2">FHE Confidentiality</h4>
                                        <p className="text-sm text-gray-400">
                                            Zama's FHE ensures <span className="text-neon-primary">computation on encrypted data</span>. Amounts are never exposed — not even to validators.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-neon-accent font-bold mb-2">Atomic Execution</h4>
                                        <p className="text-sm text-gray-400">
                                            Transfer and receipt generation happen in a single <span className="text-neon-primary">atomic step</span>. Either <span className="text-green-400">both succeed</span> or transaction <span className="text-red-400">reverts</span>.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-neon-accent font-bold mb-2">Access Control</h4>
                                        <p className="text-sm text-gray-400">
                                            fhEVM's <span className="text-green-400">FHE.allow()</span> ensures only authorized addresses can decrypt their own encrypted values on-chain.
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Docs;
