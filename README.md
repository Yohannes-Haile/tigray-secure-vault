  Tigray Secure Vault
Resilient, Zero-Knowledge Cloud Storage for Post-Conflict Infrastructure
![alt text](https://img.shields.io/badge/Frontend-React-blue)
![alt text](https://img.shields.io/badge/Backend-Node.js-green)
![alt text](https://img.shields.io/badge/Deployment-AWS_EC2-orange)
![alt text](https://img.shields.io/badge/Security-AES--256-red)
Live Demo: http://16.16.185.193 (Note: Hosted on AWS Free Tier)
  The Problem
In post-conflict zones like Tigray, digital infrastructure is often compromised. Citizens face two major challenges:
Network Instability: Standard file uploads fail frequently due to power outages and 2G/intermittent internet connectivity.
Data Privacy: Storing sensitive documents (degrees, land deeds, medical records) on central servers is risky if the infrastructure is seized or compromised.
  The Solution
Tigray Secure Vault is a specialized cloud storage application engineered for low-resource environments. It prioritizes Data Persistence (uploads resume after failure) and Zero-Trust Security (the server cannot read the files).
  Key Technical Features
1. Network Resilience (The "Unstoppable Upload")
Protocol: Implemented the Tus Resumable Upload Protocol to handle unstable connections.
Custom Fingerprinting: Engineered a deterministic fingerprinting algorithm (filename + size + user) to allow uploads to auto-resume even after a browser crash or total network disconnection.
Chunking: Data is split into 512KB chunks, ensuring success even on high-latency GPRS/2G networks.
2. Zero-Knowledge Architecture (E2EE)
Client-Side Encryption: Files are encrypted inside the browser using AES-256 before they ever touch the network.
Blind Server: The AWS server stores only encrypted blobs (.enc). Without the user's unique passphrase, the data is mathematically indecipherable to the server administrator or any intruder.
3. Multi-Tenancy & Isolation
Metadata Filtering: Implemented a lightweight identity system that filters file retrieval based on User ID tags attached to the encrypted metadata.
Access Control: Ensures User A cannot list or access User B's encrypted archives.
  Tech Stack
Frontend: React.js, Uppy (Heavily Customized), Tailwind CSS logic.
Backend: Node.js, Express, @tus/server.
Storage: Local Block Storage (EBS) with Linux Permission Management.
Encryption: CryptoJS (AES-256).
DevOps: AWS EC2 (Ubuntu), PM2 Process Manager, Nginx-style Static Serving.
  How It Works
User Login: User enters a Username and a private Vault Key.
Encryption: When a file is dropped, the browser converts it to Base64 and encrypts it using the Vault Key.
Resumable Upload: The encrypted blob is uploaded in small chunks. If the network fails, the system waits and resumes the specific chunk where it left off.
Decryption: On download, the browser fetches the encrypted blob and uses the Vault Key to reconstruct the original file in memory.
  Local Setup Instructions
If you wish to run this repository locally:
Clone the repository
code
Bash
git clone https://github.com/Yohannes-Haile/tigray-secure-vault.git
cd tigray-secure-vault
Install & Build Frontend
code
Bash
cd client
npm install
npm run build
Install & Start Backend
code
Bash
cd ../server
npm install
node server.js
Access: Open http://localhost:3000 (The server serves the React build automatically).
  Project Status
Current Version: v1.0 (Production Ready)
Deployment: Active on AWS EC2 t2.micro.
Future Roadmap: Migration to AWS S3 for infinite scalability and Offline-First PWA implementation.
  Author
Yohannes Haile
Network Engineer & Full Stack Developer
Scholarship Applicant
