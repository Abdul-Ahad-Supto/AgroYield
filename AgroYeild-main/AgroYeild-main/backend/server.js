// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'agroyield_secret_key';

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

// In-memory database (replace with actual database)
let users = [];
let kycRequests = [];
let projects = [];
let investments = [];
let notifications = [];

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const findUserByWallet = (walletAddress) => {
  return users.find(user => user.walletAddress.toLowerCase() === walletAddress.toLowerCase());
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

// 1. User Registration/Login
app.post('/api/auth/register', async (req, res) => {
  try {
    const { walletAddress, email, password } = req.body;

    // Check if user already exists
    const existingUser = findUserByWallet(walletAddress);
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered with this wallet' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: generateId(),
      walletAddress: walletAddress.toLowerCase(),
      email,
      password: hashedPassword,
      roles: [], // Will be assigned after KYC
      isKYCVerified: false,
      createdAt: new Date().toISOString(),
      profile: {
        name: '',
        phone: '',
        address: '',
        nidNumber: '',
        profilePicture: null
      }
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, walletAddress: newUser.walletAddress },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        walletAddress: newUser.walletAddress,
        email: newUser.email,
        roles: newUser.roles,
        isKYCVerified: newUser.isKYCVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { walletAddress, password } = req.body;

    // Find user
    const user = findUserByWallet(walletAddress);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        roles: user.roles,
        isKYCVerified: user.isKYCVerified,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. KYC Routes
app.post('/api/kyc/submit', authenticateToken, upload.fields([
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), (req, res) => {
  try {
    const { name, nidNumber, phone, address, desiredRole } = req.body;
    const userId = req.user.userId;

    // Check if KYC already submitted
    const existingKYC = kycRequests.find(kyc => kyc.userId === userId);
    if (existingKYC) {
      return res.status(400).json({ error: 'KYC already submitted' });
    }

    // Create KYC request
    const kycRequest = {
      id: generateId(),
      userId,
      walletAddress: req.user.walletAddress,
      name,
      nidNumber,
      phone,
      address,
      desiredRole, // 'farmer', 'investor', or 'both'
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
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// 3. Admin Routes for KYC Management
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
    res.status(500).json({ error: 'Failed to get KYC requests' });
  }
});

app.post('/api/admin/kyc/approve/:kycId', authenticateToken, (req, res) => {
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

      // Assign roles based on desired role
      if (kycRequest.desiredRole === 'farmer') {
        user.roles = ['farmer'];
      } else if (kycRequest.desiredRole === 'investor') {
        user.roles = ['investor'];
      } else if (kycRequest.desiredRole === 'both') {
        user.roles = ['farmer', 'investor'];
      }
    }

    res.json({ message: 'KYC approved successfully' });
  } catch (error) {
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
    kycRequest.notes = notes || '';

    res.json({ message: 'KYC rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// 4. Project Routes
app.post('/api/projects/create', authenticateToken, upload.single('projectImage'), (req, res) => {
  try {
    const { title, description, category, location, targetAmount, duration } = req.body;
    const userId = req.user.userId;

    // Check if user is verified and has farmer role
    const user = users.find(u => u.id === userId);
    if (!user || !user.isKYCVerified || !user.roles.includes('farmer')) {
      return res.status(403).json({ error: 'Only verified farmers can create projects' });
    }

    const project = {
      id: generateId(),
      farmerId: userId,
      farmerWallet: req.user.walletAddress,
      farmerName: user.profile.name,
      title,
      description,
      category,
      location,
      targetAmount: parseFloat(targetAmount),
      duration: parseInt(duration),
      image: req.file ? req.file.filename : null,
      status: 'pending', // pending, approved, rejected, active, completed
      currentFunding: 0,
      investors: [],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null
    };

    projects.push(project);

    res.status(201).json({
      message: 'Project created successfully',
      projectId: project.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects', (req, res) => {
  try {
    const { status, category } = req.query;
    
    let filteredProjects = projects;
    
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    
    if (category) {
      filteredProjects = filteredProjects.filter(p => p.category === category);
    }

    const projectsWithImages = filteredProjects.map(project => ({
      ...project,
      image: project.image ? `/uploads/${project.image}` : null,
      fundingProgress: project.targetAmount > 0 ? (project.currentFunding / project.targetAmount) * 100 : 0
    }));

    res.json(projectsWithImages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.get('/api/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectWithImage = {
      ...project,
      image: project.image ? `/uploads/${project.image}` : null,
      fundingProgress: project.targetAmount > 0 ? (project.currentFunding / project.targetAmount) * 100 : 0
    };

    res.json(projectWithImage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// 5. Admin Project Approval
app.get('/api/admin/projects/pending', authenticateToken, (req, res) => {
  try {
    const pendingProjects = projects.filter(p => p.status === 'pending');
    const projectsWithImages = pendingProjects.map(project => ({
      ...project,
      image: project.image ? `/uploads/${project.image}` : null
    }));

    res.json(projectsWithImages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending projects' });
  }
});

app.post('/api/admin/projects/approve/:projectId', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.status = 'approved';
    project.approvedAt = new Date().toISOString();
    project.approvedBy = req.user.userId;

    res.json({ message: 'Project approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

app.post('/api/admin/projects/reject/:projectId', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.status = 'rejected';
    project.rejectionNotes = notes;
    project.reviewedAt = new Date().toISOString();
    project.reviewedBy = req.user.userId;

    res.json({ message: 'Project rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject project' });
  }
});

// 6. Investment Routes
app.post('/api/investments/invest', authenticateToken, (req, res) => {
  try {
    const { projectId, amount } = req.body;
    const userId = req.user.userId;

    // Check if user is verified and has investor role
    const user = users.find(u => u.id === userId);
    if (!user || !user.isKYCVerified || !user.roles.includes('investor')) {
      return res.status(403).json({ error: 'Only verified investors can invest' });
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({ error: 'Project is not available for investment' });
    }

    const investmentAmount = parseFloat(amount);
    if (investmentAmount <= 0) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    // Create investment record
    const investment = {
      id: generateId(),
      investorId: userId,
      investorWallet: req.user.walletAddress,
      investorName: user.profile.name,
      projectId,
      amount: investmentAmount,
      investedAt: new Date().toISOString(),
      status: 'active'
    };

    investments.push(investment);

    // Update project funding
    project.currentFunding += investmentAmount;
    project.investors.push({
      investorId: userId,
      investorName: user.profile.name,
      amount: investmentAmount,
      investedAt: investment.investedAt
    });

    res.json({
      message: 'Investment successful',
      investmentId: investment.id,
      newFundingTotal: project.currentFunding
    });
  } catch (error) {
    res.status(500).json({ error: 'Investment failed' });
  }
});

app.get('/api/investments/my-investments', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userInvestments = investments.filter(inv => inv.investorId === userId);

    const investmentsWithProjects = userInvestments.map(investment => {
      const project = projects.find(p => p.id === investment.projectId);
      return {
        ...investment,
        project: project ? {
          id: project.id,
          title: project.title,
          status: project.status,
          targetAmount: project.targetAmount,
          currentFunding: project.currentFunding
        } : null
      };
    });

    res.json(investmentsWithProjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get investments' });
  }
});

// 7. User Profile Routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      roles: user.roles,
      isKYCVerified: user.isKYCVerified,
      profile: user.profile
    });
  } catch (error) {
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
      totalInvestments: 0,
      totalInvested: 0,
      totalProjects: 0,
      totalFunding: 0
    };

    // Calculate investment stats
    if (user.roles.includes('investor')) {
      const userInvestments = investments.filter(inv => inv.investorId === userId);
      stats.totalInvestments = userInvestments.length;
      stats.totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    }

    // Calculate project stats
    if (user.roles.includes('farmer')) {
      const userProjects = projects.filter(p => p.farmerId === userId);
      stats.totalProjects = userProjects.length;
      stats.totalFunding = userProjects.reduce((sum, p) => sum + p.currentFunding, 0);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// 8. Dashboard Routes
app.get('/api/dashboard/admin', authenticateToken, (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      pendingKYC: kycRequests.filter(kyc => kyc.status === 'pending').length,
      approvedKYC: kycRequests.filter(kyc => kyc.status === 'approved').length,
      totalProjects: projects.length,
      pendingProjects: projects.filter(p => p.status === 'pending').length,
      approvedProjects: projects.filter(p => p.status === 'approved').length,
      totalInvestments: investments.length,
      totalInvestmentAmount: investments.reduce((sum, inv) => sum + inv.amount, 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin can access KYC requests at: http://localhost:${PORT}/api/admin/kyc/requests`);
});

module.exports = app;