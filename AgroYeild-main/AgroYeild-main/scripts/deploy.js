const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🌱 Deploying AgroYield on Amoy Testnet...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "MATIC");

  // Amoy testnet USDC address
  const AMOY_USDC = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  
  console.log("Using USDC:", AMOY_USDC);
  console.log("Network: Amoy (Chain ID: 80002)");

  const contracts = {};

  // 1. Deploy ProjectFactory with USDC support
  console.log("\n📋 Deploying ProjectFactory...");
  const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
  contracts.projectFactory = await ProjectFactory.deploy(AMOY_USDC);
  await contracts.projectFactory.deployed();
  console.log("✅ ProjectFactory:", contracts.projectFactory.address);

  // 2. Deploy IdentityRegistry
  console.log("\n🆔 Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  contracts.identityRegistry = await IdentityRegistry.deploy();
  await contracts.identityRegistry.deployed();
  console.log("✅ IdentityRegistry:", contracts.identityRegistry.address);

  // 3. Deploy InvestmentManager with USDC support
  console.log("\n💰 Deploying InvestmentManager...");
  const InvestmentManager = await ethers.getContractFactory("InvestmentManager");
  contracts.investmentManager = await InvestmentManager.deploy(
    contracts.projectFactory.address,
    AMOY_USDC
  );
  await contracts.investmentManager.deployed();
  console.log("✅ InvestmentManager:", contracts.investmentManager.address);

  // 4. Deploy OracleIntegration
  console.log("\n🔮 Deploying OracleIntegration...");
  const OracleIntegration = await ethers.getContractFactory("OracleIntegration");
  contracts.oracleIntegration = await OracleIntegration.deploy(contracts.projectFactory.address);
  await contracts.oracleIntegration.deployed();
  console.log("✅ OracleIntegration:", contracts.oracleIntegration.address);

  // 5. Deploy YieldDistributor
  console.log("\n📈 Deploying YieldDistributor...");
  const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
  contracts.yieldDistributor = await YieldDistributor.deploy(
    contracts.projectFactory.address,
    contracts.investmentManager.address
  );
  await contracts.yieldDistributor.deployed();
  console.log("✅ YieldDistributor:", contracts.yieldDistributor.address);

  // 6. Deploy GovernanceModule
  console.log("\n🏛️ Deploying GovernanceModule...");
  const GovernanceModule = await ethers.getContractFactory("GovernanceModule");
  contracts.governanceModule = await GovernanceModule.deploy();
  await contracts.governanceModule.deployed();
  console.log("✅ GovernanceModule:", contracts.governanceModule.address);

  // Setup roles and permissions
  console.log("\n⚙️ Setting up roles...");
  
  const FARMER_ROLE = await contracts.projectFactory.FARMER_ROLE();
  const VALIDATOR_ROLE = await contracts.projectFactory.VALIDATOR_ROLE();
  const INVESTOR_ROLE = await contracts.investmentManager.INVESTOR_ROLE();
  const PROJECT_MANAGER_ROLE = await contracts.investmentManager.PROJECT_MANAGER_ROLE();
  const ORACLE_NODE = await contracts.oracleIntegration.ORACLE_NODE();

  await contracts.projectFactory.grantRole(FARMER_ROLE, deployer.address);
  await contracts.projectFactory.grantRole(VALIDATOR_ROLE, deployer.address);
  await contracts.investmentManager.grantRole(INVESTOR_ROLE, deployer.address);
  await contracts.investmentManager.grantRole(PROJECT_MANAGER_ROLE, deployer.address);
  await contracts.oracleIntegration.grantRole(ORACLE_NODE, deployer.address);

  console.log("✅ Roles configured");

  // Create demo projects
  console.log("\n🌾 Creating demo projects...");
  
  // Project 1: 1 Lakh BDT (100,000 BDT = 800 USDC)
  const project1BDT = 10000000; // 100,000 BDT scaled by 100
  const tx1 = await contracts.projectFactory.createProject(
    "Organic Rice Farming - Rangpur",
    "Sustainable rice cultivation using organic methods. Target yield: 8 tons per acre with 15% profit margin.",
    "QmRiceDemo2024Amoy",
    project1BDT,
    90, // 90 days
    "Rangpur Division, Bangladesh",
    "Rice Cultivation"
  );
  await tx1.wait();

  // Project 2: 75,000 BDT (600 USDC)
  const project2BDT = 7500000; // 75,000 BDT scaled by 100
  const tx2 = await contracts.projectFactory.createProject(
    "Mango Orchard with Drip Irrigation",
    "Modern mango cultivation with water-efficient drip irrigation system for premium export quality mangoes.",
    "QmMangoDemo2024Amoy",
    project2BDT,
    120, // 120 days
    "Rajshahi Division, Bangladesh",
    "Fruit Cultivation"
  );
  await tx2.wait();

  // Project 3: 50,000 BDT (400 USDC) - For live demo
  const project3BDT = 5000000; // 50,000 BDT scaled by 100
  const tx3 = await contracts.projectFactory.createProject(
    "Smart Vegetable Greenhouse",
    "Temperature-controlled greenhouse for year-round vegetable production with IoT monitoring.",
    "QmVeggieDemo2024Amoy",
    project3BDT,
    100, // 100 days
    "Bogura District, Bangladesh",
    "Vegetable Cultivation"
  );
  await tx3.wait();

  // Verify the demo projects
  await contracts.projectFactory.verifyProject(1, true);
  await contracts.projectFactory.verifyProject(2, true);
  await contracts.projectFactory.verifyProject(3, true);

  console.log("✅ 3 demo projects created and verified");

  // Test conversions and get project details
  console.log("\n🔄 Project details:");
  
  for (let i = 1; i <= 3; i++) {
    const project = await contracts.projectFactory.getProject(i);
    console.log(`Project ${i}: ${project.targetAmountBDT / 100} BDT = ${ethers.utils.formatUnits(project.targetAmountUSDC, 6)} USDC`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "amoy",
    chainId: 80002,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    usdcAddress: AMOY_USDC,
    conversionRate: "1 BDT = 125 USDC (scaled)",
    contracts: {
      projectFactory: contracts.projectFactory.address,
      identityRegistry: contracts.identityRegistry.address,
      investmentManager: contracts.investmentManager.address,
      oracleIntegration: contracts.oracleIntegration.address,
      yieldDistributor: contracts.yieldDistributor.address,
      governanceModule: contracts.governanceModule.address
    },
    demoProjects: [
      {
        id: 1,
        title: "Organic Rice Farming - Rangpur",
        targetBDT: "100,000 BDT",
        targetUSDC: "800 USDC",
        category: "Rice Cultivation"
      },
      {
        id: 2,
        title: "Mango Orchard with Drip Irrigation",
        targetBDT: "75,000 BDT", 
        targetUSDC: "600 USDC",
        category: "Fruit Cultivation"
      },
      {
        id: 3,
        title: "Smart Vegetable Greenhouse",
        targetBDT: "50,000 BDT",
        targetUSDC: "400 USDC", 
        category: "Vegetable Cultivation"
      }
    ],
    amoyConfig: {
      rpcUrl: "https://rpc-amoy.polygon.technology",
      explorerUrl: "https://amoy.polygonscan.com",
      faucetUrl: "https://faucet.polygon.technology/",
      usdcAddress: AMOY_USDC
    }
  };

  // Save to files
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const frontendDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  [deploymentsDir, frontendDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  fs.writeFileSync(
    path.join(deploymentsDir, "amoy-deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Frontend config
  const frontendConfig = {
    ...deploymentInfo.contracts,
    network: "amoy",
    chainId: 80002,
    usdcAddress: AMOY_USDC,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com"
  };

  fs.writeFileSync(
    path.join(frontendDir, "amoy-addresses.json"),
    JSON.stringify(frontendConfig, null, 2)
  );

  console.log("\n🎉 Amoy Deployment Complete!");
  console.log("📋 Contract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  console.log("\n💰 USDC Integration:");
  console.log(`   USDC Address: ${AMOY_USDC}`);
  console.log(`   Network: Amoy (Chain ID: 80002)`);
  console.log(`   Min Investment: 10 USDC`);
  
  console.log("\n🌾 Demo Projects Ready:");
  deploymentInfo.demoProjects.forEach((project, index) => {
    console.log(`   ${index + 1}. ${project.title}`);
    console.log(`      Target: ${project.targetBDT} (${project.targetUSDC})`);
  });
  
  console.log("\n🔗 Verification Links:");
  console.log(`   ProjectFactory: https://amoy.polygonscan.com/address/${contracts.projectFactory.address}`);
  console.log(`   InvestmentManager: https://amoy.polygonscan.com/address/${contracts.investmentManager.address}`);
  console.log(`   USDC Contract: https://amoy.polygonscan.com/address/${AMOY_USDC}`);
  
  console.log("\n📝 Next Steps:");
  console.log("   1. Get Amoy MATIC: https://faucet.polygon.technology/");
  console.log("   2. Get Amoy USDC: Bridge from mainnet or use testnet faucet");
  console.log("   3. Update frontend: npm run start-frontend");
  console.log("   4. Test investment: npm run test-amoy");
  
  console.log("\n💡 For Competition Demo:");
  console.log("   • Use MetaMask with Amoy network");
  console.log("   • Fund demo accounts with MATIC + USDC"); 
  console.log("   • Practice complete workflow");
  console.log("   • Verify all contracts on Polygonscan");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Amoy deployment failed:", error);
    process.exit(1);
  });