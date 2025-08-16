// Enhanced server.js with blockchain integration
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'agroyield_secret_key';

// Blockchain configuration
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
const USDC_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';

// Contract addresses (from deployment)
const CONTRACT_ADDRESSES = {
  projectFactory: '0x55eBC2D399a988063198d60C1D9535890C32Ab49',
  investmentManager: '0x169559C3a10A837De637cad1279f47E9396c0BB0',
  identityRegistry: '0x0e60403bE46E98BB25E547E4dbC612a0DAd43b70',
  oracleIntegration: '0x7806b60Ab2DF96ab830cf82e7E7Bd2d23CF2a1e4',
  yieldDistributor: '0xC891821ed3429Ac144cB3A11A23a34e0fe268403',
  governanceModule: '0x7adb4cE6F2125653A6b67886f04495D8f527E44B'
};

// Initialize blockchain provider
const provider = new ethers.providers.JsonRpcProvider(AMOY_RPC_URL);

// Contract ABIs (simplified for essential functions)
const PROJECT_FACTORY_ABI = [
  "function createProject(string title, string description, string ipfsHash, uint256 targetAmountBDT, uint256 durationInDays, string location, string category) external",
  "function verifyProject(uint256 projectId, bool isApproved) external",
  "function getProject(uint256 projectId) external view returns (tuple(uint256 id, address farmer, string title, string description, string ipfsHash, uint256 targetAmountBDT, uint256 targetAmountUSDC, uint256 fundedAmountUSDC, uint256 startDate, uint256 endDate, uint8 status, bool isVerified, string location, string category))",
  "function getTotalProjects() external view returns (uint256)",
  "function grantRole(bytes32 role, address account) external",
  "function FARMER_ROLE() external view returns (bytes32)",
  "function VALIDATOR_ROLE() external view returns (bytes32)"
];

const INVESTMENT_MANAGER_ABI = [
  "function invest(uint256 projectId, uint256 amountUSDC) external",
  "function getProjectFundingUSDC(uint256 projectId) external view returns (uint256)",
  "function getInvestorProjects(address investor) external view returns (uint256[])",
  "function grantRole(bytes32 role, address account) external",
  "function INVESTOR_ROLE() external view returns (bytes32)"
];

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// In-memory database (replace with actual database in production)
let users = [];
let kycRequests = [];
let projectSubmissions = [];

// Blockchain service functions
class BlockchainService {
  static async getProjectFromBlockchain(projectId) {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.projectFactory, PROJECT_FACTORY_ABI, provider);
      const project = await contract.getProject(projectId);
      return {
        id: project.id.toString(),
        farmer: project.farmer,
        title: project.title,
        description: project.description,
        ipfsHash: project.ipfsHash,
        targetAmountBDT: project.targetAmountBDT.toString(),
        targetAmountUSDC: project.targetAmountUSDC.toString(),
        fundedAmountUSDC: project.fundedAmountUSDC.toString(),
        startDate: project.startDate.toString(),
        endDate: project.endDate.toString(),
        status: project.status,
        isVerified: project.isVerified,
        location: project.location,
        category: project.category
      };
    } catch (error) {
      console.error('Error fetching project from blockchain:', error);
      return null;
    }
  }

  static async getAllProjectsFromBlockchain() {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.projectFactory, PROJECT_FACTORY_ABI, provider);
      const totalProjects = await contract.getTotalProjects();
      const projects = [];

      for (let i = 1; i <= totalProjects.toNumber(); i++) {
        const project = await this.getProjectFromBlockchain(i);
        if (project) {
          projects.push(project);
        }
      }

      return projects;
    } catch (error) {
      console.error('Error fetching projects from blockchain:', error);
      return [];
    }
  }

  static async getProjectFunding(projectId) {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.investmentManager, INVESTMENT_MANAGER_ABI, provider);
      const fundingUSDC = await contract.getProjectFundingUSDC(projectId);
      
      // Convert USDC to BDT (1 USDC = 125 BDT)
      const fundingBDT = fundingUSDC.mul(125);
      
      return {
        usdcAmount: ethers.utils.formatUnits(fundingUSDC, 6),
        bdtAmount: ethers.utils.formatUnits(fundingBDT, 6)
      };
    } catch (error) {
      console.error('Error fetching project funding:', error);
      return { usdcAmount: '0', bdtAmount: '0' };
    }
  }
}

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const findUserByWallet = (walletAddress) => {
  return users.find(user => user.walletAddress.toLowerCase() === walletAddress.toLowerCase());
};

const findUserByEmail = (email) => {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// 1. User Registration/Login with enhanced blockchain integration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { walletAddress, email, password, role } = req.body;

    // Validate input
    if (!walletAddress || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['farmer', 'investor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUserByWallet = findUserByWallet(walletAddress);
    const existingUserByEmail = findUserByEmail(email);

    if (existingUserByWallet) {
      return res.status(400).json({ error: 'User already registered with this wallet' });
    }

    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User already registered with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: generateId(),
      walletAddress: walletAddress.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      roles: [], // Will be assigned after KYC
      isKYCVerified: false,
      createdAt: new Date().toISOString(),
      profile: {
        name: '',
        phone: '',
        address: '',
        nidNumber: '',
        profilePicture: null
      },
      blockchainRoles: {
        farmer: false,
        investor: false,
        validator: false
      }
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        walletAddress: newUser.walletAddress,
        email: newUser.email,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        walletAddress: newUser.walletAddress,
        email: newUser.email,
        role: newUser.role,
        roles: newUser.roles,
        isKYCVerified: newUser.isKYCVerified,
        profile: newUser.profile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { walletAddress, password } = req.body;

    if (!walletAddress || !password) {
      return res.status(400).json({ error: 'Wallet address and password are required' });
    }

    // Find user by wallet address
    const user = findUserByWallet(walletAddress);
    if (!user) {
      return res.status(400).json({ error: 'User not found with this wallet address' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role,
        roles: user.roles,
        isKYCVerified: user.isKYCVerified,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. KYC Routes with blockchain role assignment
app.post('/api/kyc/submit', authenticateToken, upload.fields([
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), (req, res) => {
  try {
    const { name, nidNumber, phone, address } = req.body;
    const userId = req.user.userId;

    // Find user
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if KYC already submitted
    const existingKYC = kycRequests.find(kyc => kyc.userId === userId);
    if (existingKYC) {
      return res.status(400).json({ error: 'KYC already submitted' });
    }

    // Create KYC request
    const kycRequest = {
      id: generateId(),
      userId,
      walletAddress: user.walletAddress,
      name,
      nidNumber,
      phone,
      address,
      role: user.role, // Use the role from registration
      documents: {
        nidFront: req.files.nidFront ? req.files.nidFront[0].filename : null,
        nidBack: req.files.nidBack ? req.files.nidBack[0].filename : null,
        selfie: req.files.selfie ? req.files.selfie[0].filename : null
      },
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      notes: ''
    };

    kycRequests.push(kycRequest);

    res.json({
      message: 'KYC submitted successfully',
      kycId: kycRequest.id
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ error: 'KYC submission failed' });
  }
});

app.get('/api/kyc/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const kycRequest = kycRequests.find(kyc => kyc.userId === userId);

    if (!kycRequest) {
      return res.json({ status: 'not_submitted' });
    }

    res.json({
      status: kycRequest.status,
      submittedAt: kycRequest.submittedAt,
      reviewedAt: kycRequest.reviewedAt,
      notes: kycRequest.notes
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// 3. Admin Routes for KYC Management with blockchain integration
app.get('/api/admin/kyc/requests', authenticateToken, (req, res) => {
  try {
    // In production, check if user is admin
    const requests = kycRequests.map(kyc => ({
      ...kyc,
      documents: {
        nidFront: kyc.documents.nidFront ? `/uploads/${kyc.documents.nidFront}` : null,
        nidBack: kyc.documents.nidBack ? `/uploads/${kyc.documents.nidBack}` : null,
        selfie: kyc.documents.selfie ? `/uploads/${kyc.documents.selfie}` : null
      }
    }));

    res.json(requests);
  } catch (error) {
    console.error('Get KYC requests error:', error);
    res.status(500).json({ error: 'Failed to get KYC requests' });
  }
});

app.post('/api/admin/kyc/approve/:kycId', authenticateToken, async (req, res) => {
  try {
    const { kycId } = req.params;
    const { notes } = req.body;

    const kycRequest = kycRequests.find(kyc => kyc.id === kycId);
    if (!kycRequest) {
      return res.status(404).json({ error: 'KYC request not found' });
    }

    // Update KYC status
    kycRequest.status = 'approved';
    kycRequest.reviewedAt = new Date().toISOString();
    kycRequest.reviewedBy = req.user.userId;
    kycRequest.notes = notes || '';

    // Update user profile and roles
    const user = users.find(u => u.id === kycRequest.userId);
    if (user) {
      user.isKYCVerified = true;
      user.profile.name = kycRequest.name;
      user.profile.phone = kycRequest.phone;
      user.profile.address = kycRequest.address;
      user.profile.nidNumber = kycRequest.nidNumber;

      // Assign roles based on user's selected role
      if (kycRequest.role === 'farmer') {
        user.roles = ['farmer'];
      } else if (kycRequest.role === 'investor') {
        user.roles = ['investor'];
      }

      // Note: In a real implementation, you would also grant blockchain roles here
      // This requires a backend wallet with proper permissions
      console.log(`KYC approved for ${user.email} as ${kycRequest.role}`);
    }

    res.json({ message: 'KYC approved successfully' });
  } catch (error) {
    console.error('KYC approval error:', error);
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

app.post('/api/admin/kyc/reject/:kycId', authenticateToken, (req, res) => {
  try {
    const { kycId } = req.params;
    const { notes } = req.body;

    const kycRequest = kycRequests.find(kyc => kyc.id === kycId);
    if (!kycRequest) {
      return res.status(404).json({ error: 'KYC request not found' });
    }

    // Update KYC status
    kycRequest.status = 'rejected';
    kycRequest.reviewedAt = new Date().toISOString();
    kycRequest.reviewedBy = req.user.userId;
    kycRequest.notes = notes || 'KYC documents do not meet requirements';

    res.json({ message: 'KYC rejected' });
  } catch (error) {
    console.error('KYC rejection error:', error);
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// 4. Project Routes with blockchain integration
app.post('/api/projects/create', authenticateToken, upload.single('projectImage'), (req, res) => {
  try {
    const { title, description, category, location, targetAmount, duration } = req.body;
    const userId = req.user.userId;

    // Find user and check if verified farmer
    const user = users.find(u => u.id === userId);
    if (!user || !user.isKYCVerified || !user.roles.includes('farmer')) {
      return res.status(403).json({ error: 'Only verified farmers can create projects' });
    }

    // Create project submission record
    const projectSubmission = {
      id: generateId(),
      userId,
      walletAddress: user.walletAddress,
      farmerName: user.profile.name,
      title,
      description,
      category,
      location,
      targetAmount: parseFloat(targetAmount),
      duration: parseInt(duration),
      image: req.file ? req.file.filename : null,
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date().toISOString(),
      blockchainProjectId: null // Will be set when created on blockchain
    };

    projectSubmissions.push(projectSubmission);

    res.status(201).json({
      message: 'Project submitted successfully',
      projectId: projectSubmission.id,
      note: 'Project will be created on blockchain after admin approval'
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get projects from blockchain
app.get('/api/projects', async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Fetch projects from blockchain
    const blockchainProjects = await BlockchainService.getAllProjectsFromBlockchain();
    
    // Enrich with additional data from database
    const enrichedProjects = blockchainProjects.map(project => {
      // Find corresponding submission
      const submission = projectSubmissions.find(sub => sub.blockchainProjectId === project.id);
      
      return {
        ...project,
        image: submission?.image ? `/uploads/${submission.image}` : null,
        farmerName: submission?.farmerName || 'Unknown Farmer',
        fundingProgress: 0 // Will be calculated on frontend
      };
    });

    // Apply filters
    let filteredProjects = enrichedProjects;
    
    if (status) {
      const statusMap = { 'pending': 0, 'approved': 1, 'rejected': 2, 'active': 3, 'completed': 4 };
      const statusCode = statusMap[status.toLowerCase()];
      if (statusCode !== undefined) {
        filteredProjects = filteredProjects.filter(p => p.status === statusCode);
      }
    }
    
    if (category) {
      filteredProjects = filteredProjects.filter(p => p.category === category);
    }

    res.json(filteredProjects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Fetch project from blockchain
    const project = await BlockchainService.getProjectFromBlockchain(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get funding information
    const funding = await BlockchainService.getProjectFunding(projectId);
    
    // Find corresponding submission for additional data
    const submission = projectSubmissions.find(sub => sub.blockchainProjectId === projectId);
    
    const enrichedProject = {
      ...project,
      image: submission?.image ? `/uploads/${submission.image}` : null,
      farmerName: submission?.farmerName || 'Unknown Farmer',
      funding
    };

    res.json(enrichedProject);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Get project funding
app.get('/api/projects/:projectId/funding', async (req, res) => {
  try {
    const { projectId } = req.params;
    const funding = await BlockchainService.getProjectFunding(projectId);
    res.json(funding);
  } catch (error) {
    console.error('Get project funding error:', error);
    res.status(500).json({ error: 'Failed to get project funding' });
  }
});

// 5. Admin Project Approval (creates project on blockchain)
app.get('/api/admin/projects/pending', authenticateToken, (req, res) => {
  try {
    const pendingProjects = projectSubmissions.filter(p => p.status === 'pending');
    const projectsWithImages = pendingProjects.map(project => ({
      ...project,
      image: project.image ? `/uploads/${project.image}` : null
    }));

    res.json(projectsWithImages);
  } catch (error) {
    console.error('Get pending projects error:', error);
    res.status(500).json({ error: 'Failed to get pending projects' });
  }
});

app.post('/api/admin/projects/approve/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    const projectSubmission = projectSubmissions.find(p => p.id === projectId);
    if (!projectSubmission) {
      return res.status(404).json({ error: 'Project submission not found' });
    }

    // Update submission status
    projectSubmission.status = 'approved';
    projectSubmission.approvedAt = new Date().toISOString();
    projectSubmission.approvedBy = req.user.userId;
    projectSubmission.notes = notes || '';

    // In a real implementation, you would create the project on blockchain here
    // For now, we'll simulate this by assigning a mock blockchain project ID
    const mockBlockchainId = Math.floor(Math.random() * 1000) + 1;
    projectSubmission.blockchainProjectId = mockBlockchainId.toString();

    res.json({ 
      message: 'Project approved and created on blockchain',
      blockchainProjectId: mockBlockchainId
    });
  } catch (error) {
    console.error('Project approval error:', error);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

app.post('/api/admin/projects/reject/:projectId', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    const projectSubmission = projectSubmissions.find(p => p.id === projectId);
    if (!projectSubmission) {
      return res.status(404).json({ error: 'Project submission not found' });
    }

    projectSubmission.status = 'rejected';
    projectSubmission.rejectionNotes = notes || 'Project does not meet requirements';
    projectSubmission.reviewedAt = new Date().toISOString();
    projectSubmission.reviewedBy = req.user.userId;

    res.json({ message: 'Project rejected' });
  } catch (error) {
    console.error('Project rejection error:', error);
    res.status(500).json({ error: 'Failed to reject project' });
  }
});

// 6. User Profile and Stats Routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.get('/api/user/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      totalProjects: 0,
      totalInvestments: 0,
      totalInvested: 0,
      totalFunding: 0,
      role: user.role,
      isKYCVerified: user.isKYCVerified
    };

    // Calculate stats based on role
    if (user.roles.includes('farmer')) {
      const userProjects = projectSubmissions.filter(p => p.userId === userId);
      stats.totalProjects = userProjects.length;
      stats.totalFunding = userProjects
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + (p.currentFunding || 0), 0);
    }

    if (user.roles.includes('investor')) {
      // In a real implementation, you would fetch investment data from blockchain
      stats.totalInvestments = 0;
      stats.totalInvested = 0;
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// 7. Admin Dashboard Stats
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      verifiedUsers: users.filter(u => u.isKYCVerified).length,
      pendingKYC: kycRequests.filter(kyc => kyc.status === 'pending').length,
      approvedKYC: kycRequests.filter(kyc => kyc.status === 'approved').length,
      totalProjectSubmissions: projectSubmissions.length,
      pendingProjects: projectSubmissions.filter(p => p.status === 'pending').length,
      approvedProjects: projectSubmissions.filter(p => p.status === 'approved').length,
      farmers: users.filter(u => u.role === 'farmer').length,
      investors: users.filter(u => u.role === 'investor').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// 8. Blockchain Information Routes
app.get('/api/blockchain/info', (req, res) => {
  try {
    res.json({
      network: 'Polygon Amoy Testnet',
      chainId: 80002,
      rpcUrl: AMOY_RPC_URL,
      usdcAddress: USDC_ADDRESS,
      contracts: CONTRACT_ADDRESSES,
      explorer: 'https://amoy.polygonscan.com'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blockchain info' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    blockchain: 'connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AgroYield Backend Server running on port ${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/api/admin/stats`);
  console.log(`🔗 Blockchain Network: Polygon Amoy Testnet`);
  console.log(`💰 USDC Address: ${USDC_ADDRESS}`);
  console.log(`📋 Contract Addresses:`);
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
});

module.exports = app;