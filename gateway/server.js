require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const axios = require('axios');
const cors = require('cors');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js');

const app = express();
const PORT = process.env.PORT || 5000;
const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || 'http://localhost:8080/api';

// CORS setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/**
 * 0. HEALTH CHECK
 */
app.get('/api/health', async (req, res) => {
    try {
        await axios.get(`http://localhost:8080/api/auth/ping`, { timeout: 3000 });
        res.json({ gateway: 'UP', coreService: 'UP' });
    } catch (e) {
        // Even a 404/405 means Java IS running; only ECONNREFUSED means it's down
        if (e.code === 'ECONNREFUSED') {
            return res.status(503).json({ gateway: 'UP', coreService: 'DOWN', error: 'Java core service is not running on port 8080.' });
        }
        res.json({ gateway: 'UP', coreService: 'UP' });
    }
});

/**
 * 1. AUTH PROXY (Node.js -> Java)
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const response = await axios.post(`${JAVA_BACKEND_URL}/auth/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            return res.status(503).json({ message: '❌ Java Core Service is not running. Please start it on port 8080.' });
        }
        res.status(error.response.status).json(error.response.data || { message: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const response = await axios.post(`${JAVA_BACKEND_URL}/auth/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            return res.status(503).json({ message: '❌ Java Core Service is not running. Please start it on port 8080.' });
        }
        res.status(error.response.status).json(error.response.data || { message: 'Registration failed' });
    }
});

/**
 * 2. ISSUE CERTIFICATE (Hybrid Flow)
 * Step 1: Upload (Node.js)
 * Step 2: Hashing (Node.js/Java - Here Node)
 * Step 3: Call Java for metadata storage
 * Step 4: Blockchain issuance
 * Step 5: QR Code generation
 */
app.post('/api/certificates/issue', upload.single('certFile'), async (req, res) => {
    try {
        const { studentName, courseName, institutionName } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Certificate file is required' });
        }

        // --- Step 2: SHA256 Hash ---
        const fileBuffer = fs.readFileSync(file.path);
        const fileHash = CryptoJS.SHA256(fileBuffer.toString('base64')).toString();
        const certId = `CERT-${Date.now()}`;

        // --- Step 3: Store in Java Service ---
        const javaResponse = await axios.post(`${JAVA_BACKEND_URL}/certificates`, {
            id: certId,
            studentName,
            courseName,
            institutionName,
            hash: fileHash,
            filePath: file.path
        });

        // --- Step 4: Call Blockchain (Mock / Ethers) ---
        // For demonstration, we simulate successful blockchain transaction.
        // real: const tx = await contract.issueCertificate(certId, fileHash);
        const txHash = `0x${CryptoJS.SHA256(certId + fileHash).toString().substring(0, 64)}`;

        // --- Step 5: QR Code Generation ---
        const verificationUrl = `${req.headers.origin}/verify?id=${certId}`;
        const qrCodeDataUrl = await qrcode.toDataURL(verificationUrl);

        res.json({
            message: 'Certificate issued successfully',
            certId,
            txHash,
            qrCode: qrCodeDataUrl,
            metadata: javaResponse.data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Certificate issuance failed', error: error.message });
    }
});

/**
 * 2.5 LIST ALL CERTIFICATES
 */
app.get('/api/certificates', async (req, res) => {
    try {
        const response = await axios.get(`${JAVA_BACKEND_URL}/certificates`);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Certificate service down' });
    }
});

/**
 * 3. VERIFY CERTIFICATE
 */
app.get('/api/certificates/verify/:id', async (req, res) => {
    try {
        const certId = req.params.id;
        // real: fetch from blockchain
        const springResponse = await axios.get(`${JAVA_BACKEND_URL}/certificates/${certId}`);
        res.json({
            verified: true,
            certificate: springResponse.data
        });
    } catch (error) {
        res.status(404).json({ verified: false, message: 'Invalid or expired certificate' });
    }
});

/**
 * 4. VERIFY FILE INTEGRITY
 */
app.post('/api/certificates/verify-pdf', upload.single('certFile'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'File is required' });

        const fileBuffer = fs.readFileSync(file.path);
        const fileHash = CryptoJS.SHA256(fileBuffer.toString('base64')).toString();

        // Search Java service for this hash
        try {
            const springResponse = await axios.get(`${JAVA_BACKEND_URL}/certificates/verify/${fileHash}`);
            res.json({
                verified: true,
                certificate: springResponse.data
            });
        } catch (err) {
            res.status(404).json({ verified: false, message: 'Certificate match not found on Blockchain' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Verification failed', error: error.message });
    } finally {
        // Cleanup uploaded file
        if (req.file) fs.unlinkSync(req.file.path);
    }
});


// Serve frontend routing (for client-side routing if any)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`BlockCred Gateway running at http://localhost:${PORT}`);
});
