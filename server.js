const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Mock database
const users = {
  students: [
    { id: 1, username: 'student1', password: 'student123', name: 'John Doe' }
  ],
  teachers: [
    { id: 1, username: 'teacher1', password: 'teacher123', name: 'Prof. Williams' }
  ]
};

// Mock PPT data
let pptData = [
  {
    id: 1,
    studentId: 1,
    studentName: 'John Doe',
    rollNumber: 'S001',
    department: 'Computer Science',
    fileName: 'presentation1.pptx',
    uploadDate: new Date('2023-05-15'),
    mlAccuracy: 85.5,
    mlAnalysis: {
      keywords: ['machine learning', 'neural networks', 'data analysis'],
      summary: 'This presentation covers machine learning concepts with a focus on neural networks and data analysis techniques.',
      suggestions: ['Add more visual examples', 'Include real-world case studies']
    }
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Jane Smith',
    rollNumber: 'S002',
    department: 'Electrical Engineering',
    fileName: 'presentation2.pptx',
    uploadDate: new Date('2023-05-18'),
    mlAccuracy: 92.3,
    mlAnalysis: {
      keywords: ['circuit design', 'power systems', 'renewable energy'],
      summary: 'Presentation on modern circuit design techniques and their application in power systems and renewable energy.',
      suggestions: ['Add more technical diagrams', 'Include cost analysis']
    }
  }
];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'ppt-system-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login routes
app.get('/login/:type', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', `${req.params.type}-login.html`));
});

app.post('/login/student', async (req, res) => {
  const { username, password } = req.body;
  const user = users.students.find(u => u.username === username);
  
  // Simple check for demo: plain-text password
  if (user && password === user.password) {
    req.session.userId = user.id;
    req.session.userType = 'student';
    req.session.userName = user.name;
    return res.redirect('/student/dashboard');
  }
  
  res.redirect('/login/student?error=1');
});

app.post('/login/teacher', async (req, res) => {
  const { username, password } = req.body;
  const user = users.teachers.find(u => u.username === username);
  
  // Simple check for demo: plain-text password
  if (user && password === user.password) {
    req.session.userId = user.id;
    req.session.userType = 'teacher';
    req.session.userName = user.name;
    return res.redirect('/teacher/dashboard');
  }
  
  res.redirect('/login/teacher?error=1');
});

// Student routes
app.get('/student/dashboard', (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.redirect('/login/student');
  }
  
  res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

app.post('/student/upload', upload.single('pptFile'), (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.redirect('/login/student');
  }
  
  const { name, rollNumber, department } = req.body;
  
  // Mock ML processing
  const mlAccuracy = Math.floor(Math.random() * 40) + 60; // Random accuracy between 60-100
  const newPpt = {
    id: pptData.length + 1,
    studentId: req.session.userId,
    studentName: req.session.userName,
    rollNumber,
    department,
    fileName: req.file.filename,
    uploadDate: new Date(),
    mlAccuracy,
    mlAnalysis: {
      keywords: ['sample', 'presentation', 'topic'],
      summary: 'This is a sample analysis of the presentation content.',
      suggestions: ['Improve content structure', 'Add more visuals']
    }
  };
  
  pptData.push(newPpt);
  
  res.redirect('/student/dashboard?upload=success');
});

// Teacher routes
app.get('/teacher/dashboard', (req, res) => {
  if (!req.session.userId || req.session.userType !== 'teacher') {
    return res.redirect('/login/teacher');
  }
  
  res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});

app.get('/api/ppts', (req, res) => {
  if (!req.session.userId || req.session.userType !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json(pptData);
});

app.get('/api/ppt/:id', (req, res) => {
  if (!req.session.userId || req.session.userType !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const ppt = pptData.find(p => p.id == req.params.id);
  if (!ppt) {
    return res.status(404).json({ error: 'PPT not found' });
  }
  
  res.json(ppt);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
