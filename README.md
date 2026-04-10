# BlockCred – Blockchain-Based Skill Credential Verification System

A premium, full-stack blockchain platform for secure certificate issuance and verification.

## Tech Stack
- **Frontend**: HTML, Vanilla CSS, JavaScript, Bootstrap (Icons via FontAwesome)
- **API Gateway**: Node.js & Express.js (Handles QR generation, PDF uploads, and Blockchain Logic)
- **Core Service**: Java Spring Boot (Handles Authentication, JPA Metadata Storage, and Business Logic)
- **Database**: H2 (In-memory for demo) / MySQL compatible
- **Blockchain**: Solidity Smart Contract (Ethereum/Polygon compliant)

## Design System
- **Theme**: Pastel Blue & Navy Blue
- **Aesthetics**: Glassmorphism cards, Hover glow effects, Rounded corners (16px), Subtle animations.
- **Typography**: Inter & Poppins (Google Fonts)

## Features
1. **Multi-Role Login**: Admin, Institution, Student.
2. **Dashboard**: Live stats tracking and recent activity logs.
3. **Smart Issuance**: Upload PDF certificate, generate SHA256 hash, and anchor to blockchain.
4. **Instant Verification**: QR Code scanning or ID-based verification against the blockchain ledger.
5. **PDF Integrity**: Verify original file hashes to prevent tampering (SHA256).
6. **Security**: Multi-layered architecture (Frontend -> Node Gateway -> Java Spring Boot).

## Setup Instructions

### 1. Prerequisite
- Node.js (v16+)
- Java JDK 17+ or 21+
- Maven (or use provided `mvnw`)

### 2. Run Java Core Service
```bash
cd core-service
./mvnw spring-boot:run
```
*Note: Service runs on Port 8080*

### 3. Run Node.js Gateway
```bash
cd gateway
npm install
npm start
```
*Note: Gateway runs on Port 5000*

### 4. Troubleshooting
If you see **"❌ Java Core Service is not running"** in the UI:
1. Close all terminal windows.
2. Run `RESTART_SERVICES.bat` in the root folder.
3. This will kill any ghost processes on Port 8080 or 5000 and restart everything fresh.

### 5. Access the App
Open [http://localhost:5000](http://localhost:5000) in your browser.

**Demo Credentials:**
- Email: `john.doe@example.com`
- Password: `password`
- Role: `Admin`

## Architecture Flow
1. **User Login**: Frontend -> Node.js Gateway -> Java Core (Spring Boot) -> Database.
2. **Issuance**: 
   - Node.js uploads certificate PDF.
   - SHA256 Hash generated.
   - Java Core saves metadata (Student name, course, etc.).
   - Smart Contract `issueCertificate(id, hash)` is called (simulated/ethers).
   - QR Code generated with verification URL.
3. **Verification**: 
   - User inputs ID or scans QR.
   - Node.js fetches hash from Blockchain.
   - Compares with Database/File hash.
   - Returns result to Frontend.
