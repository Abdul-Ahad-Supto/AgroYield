const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy ProjectFactory
  console.log("Deploying ProjectFactory...");
  const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
  const projectFactory = await ProjectFactory.deploy();
  await projectFactory.deployed();
  console.log("ProjectFactory deployed to:", projectFactory.address);

  // 2. Deploy IdentityRegistry
  console.log("Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.deployed();
  console.log("IdentityRegistry deployed to:", identityRegistry.address);

  // 3. Deploy InvestmentManager with ProjectFactory address
  console.log("Deploying InvestmentManager...");
  const InvestmentManager = await ethers.getContractFactory("InvestmentManager");
  const investmentManager = await InvestmentManager.deploy(projectFactory.address);
  await investmentManager.deployed();
  console.log("InvestmentManager deployed to:", investmentManager.address);

  // 4. Deploy OracleIntegration with ProjectFactory address
  console.log("Deploying OracleIntegration...");
  const OracleIntegration = await ethers.getContractFactory("OracleIntegration");
  const oracleIntegration = await OracleIntegration.deploy(projectFactory.address);
  await oracleIntegration.deployed();
  console.log("OracleIntegration deployed to:", oracleIntegration.address);

  // 5. Deploy YieldDistributor with ProjectFactory and InvestmentManager addresses
  console.log("Deploying YieldDistributor...");
  const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
  const yieldDistributor = await YieldDistributor.deploy(
    projectFactory.address,
    investmentManager.address
  );
  await yieldDistributor.deployed();
  console.log("YieldDistributor deployed to:", yieldDistributor.address);

  // 6. Deploy GovernanceModule
  console.log("Deploying GovernanceModule...");
  const GovernanceModule = await ethers.getContractFactory("GovernanceModule");
  const governanceModule = await GovernanceModule.deploy();
  await governanceModule.deployed();
  console.log("GovernanceModule deployed to:", governanceModule.address);

  // Save deployment addresses to a JSON file
  const deploymentInfo = {
    network: "mumbai",
    timestamp: new Date().toISOString(),
    contracts: {
      projectFactory: projectFactory.address,
      identityRegistry: identityRegistry.address,
      investmentManager: investmentManager.address,
      oracleIntegration: oracleIntegration.address,
      yieldDistributor: yieldDistributor.address,
      governanceModule: governanceModule.address
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `deployment-${Date.now()}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment complete!");
  console.log("Contract addresses have been saved to the deployments directory.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
