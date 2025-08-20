# AgroYield - Decentralized Agriculture Investment Platform

A blockchain-based platform connecting farmers with investors to fund agricultural projects in Bangladesh.

## 🌟 Features

- **Farmer Onboarding**: Farmers can create and manage agricultural projects
- **Investment Platform**: Investors can browse and fund projects with USDC
- **Oracle Verification**: Multi-source verification of project milestones
- **Yield Distribution**: Automated profit sharing between farmers and investors
- **Decentralized Identity**: Self-sovereign identity for all participants
- **DAO Governance**: Community-driven decision making

## 🏗️ Architecture

The project consists of 4 main smart contracts:

1. **ProjectFactory.sol**: Manages project creation and lifecycle
2. **InvestmentManager.sol**: Handles USDC investments and funding
3. **YieldDistributor.sol**: Manages profit distribution using Merkle trees
4. **GovernanceModule.sol**: DAO governance and voting system

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask browser extension
- Polygon Amoy testnet setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AgroYield.git
   cd AgroYield
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   ```
   
   Fill in your environment variables:
   - Get Pinata API keys from [pinata.cloud](https://pinata.cloud)
   - Add your wallet private key (for deployment)
   - Configure network settings

4. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

5. **Deploy contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network amoy
   ```

6. **Start frontend**
   ```bash
   cd frontend
   npm start
   ```

## 🧪 Testing

Run the test suite:
```bash
npx hardhat test
```

Run with coverage:
```bash
npx hardhat coverage
```

## 🌐 Deployment

### Amoy Testnet
```bash
npx hardhat run scripts/deploy.js --network amoy
```

### Verify contracts
```bash
npx hardhat verify --network amoy DEPLOYED_CONTRACT_ADDRESS
```

## 🔧 Configuration

### Environment Variables

#### Root `.env`
- `PRIVATE_KEY`: Your wallet private key (without 0x)
- `POLYGONSCAN_API_KEY`: For contract verification
- `AMOY_RPC_URL`: Polygon Amoy RPC endpoint

#### Frontend `.env.local`
- `REACT_APP_PINATA_API_KEY`: Pinata API key
- `REACT_APP_PINATA_SECRET_KEY`: Pinata secret key
- `REACT_APP_PINATA_JWT`: Pinata JWT token
- Contract addresses (auto-updated after deployment)

## 📊 Platform Features

### For Farmers
- Create agricultural projects with detailed information
- Upload project images and documents to IPFS
- Receive funding in USDC
- Distribute yields to investors

### For Investors
- Browse verified agricultural projects
- Invest with USDC (minimum 10 USDC)
- Earn returns on successful harvests
- Participate in platform governance

### For the Platform
- 1.5% platform fee on investments
- Decentralized governance via AGY tokens
- Automated yield distribution
- Oracle-based project verification

## 🔐 Security

- All contracts use OpenZeppelin's battle-tested libraries
- Comprehensive test coverage
- Formal verification through SMT checkers
- Multi-signature wallet support
- Regular security audits

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity with OpenZeppelin v5.4.0
- **Frontend**: React.js with Chakra UI
- **Development**: Hardhat framework
- **Blockchain**: Polygon (Amoy testnet)
- **Storage**: IPFS via Pinata
- **Authentication**: Web3 wallet integration

## 📈 Roadmap

- [x] Core smart contracts
- [x] Frontend application
- [x] IPFS integration
- [x] USDC payment system
- [ ] Oracle integration
- [ ] Mobile application
- [ ] Mainnet deployment
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 Email: ahadsupto43@gmail.com


## 🌱 Mission

Empowering farmers in Bangladesh through decentralized finance, creating sustainable agricultural investments that benefit both farmers and investors while contributing to food security and rural development.

---

Built with ❤️ for sustainable agriculture