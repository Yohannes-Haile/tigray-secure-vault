# 🛡️ Tigray Secure Vault

### Resilient, Zero-Knowledge Cloud Storage for Post-Conflict Infrastructure

![React](https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react) ![Node](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=nodedotjs) ![AWS](https://img.shields.io/badge/Deployment-AWS_EC2-orange?style=for-the-badge&logo=amazonaws) ![Security](https://img.shields.io/badge/Security-AES--256-red?style=for-the-badge&logo=security)

> **🔴 Live Demo:** [http://16.16.185.193](http://16.16.185.193)  
> *(Currently hosted on AWS Free Tier)*

---

##  The Problem
In post-conflict zones like Tigray, digital infrastructure is often compromised. Citizens and institutions face two major challenges:
1.  **Network Instability:** Standard file uploads fail frequently due to power outages, packet loss, and 2G/intermittent internet connectivity.
2.  **Data Privacy:** Storing sensitive documents (degrees, land deeds, medical records) on central servers is risky if the physical infrastructure is seized or compromised.

##  The Solution
**Tigray Secure Vault** is a specialized cloud storage application engineered for low-resource environments. It prioritizes **Data Persistence** (uploads resume after failure) and **Zero-Trust Security** (the server cannot read the files).

---

##  Key Technical Features

### 1. Network Resilience (The "Unstoppable Upload")
*   **Protocol:** Implemented the **Tus Resumable Upload Protocol** to handle unstable connections.
*   **Custom Fingerprinting:** Engineered a deterministic fingerprinting algorithm (`filename + size + user`) to allow uploads to auto-resume even after a browser crash or total network disconnection.
*   **Chunking:** Data is split into **512KB chunks**, ensuring success even on high-latency GPRS/2G networks.

### 2. Zero-Knowledge Architecture (E2EE)
*   **Client-Side Encryption:** Files are encrypted inside the browser using **AES-256** before they ever touch the network.
*   **Blind Server:** The AWS server stores only encrypted blobs (`.enc`). Without the user's unique passphrase, the data is mathematically indecipherable to the server administrator or any intruder.

### 3. Multi-Tenancy & Isolation
*   **Metadata Filtering:** Implemented a lightweight identity system that filters file retrieval based on User ID tags attached to the encrypted metadata.
*   **Access Control:** Ensures User A cannot list or access User B's encrypted archives.

---

##  Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Uppy (Customized) |
| **Backend** | Node.js, Express, @tus/server |
| **Storage** | Local Block Storage (EBS) with Linux Permission Management |
| **Security** | CryptoJS (AES-256), Client-Side Hashing |
| **DevOps** | AWS EC2 (Ubuntu), PM2 Process Manager, Nginx-style Static Serving |

---

##  How It Works

1.  **User Login:** User enters a `Username` and a private `Vault Key`.
2.  **Encryption:** When a file is dropped, the browser converts it to Base64 and encrypts it using the Vault Key.
3.  **Resumable Upload:** The encrypted blob is uploaded in small chunks. If the network fails, the system waits and resumes the specific chunk where it left off.
4.  **Decryption:** On download, the browser fetches the encrypted blob and uses the Vault Key to reconstruct the original file in memory.

---

##  Local Setup Instructions

If you wish to run this repository locally for testing:

```bash
# 1. Clone the repository
git clone https://github.com/Yohannes-Haile/tigray-secure-vault.git
cd tigray-secure-vault

# 2. Install & Build Frontend
cd client
npm install
npm run build

# 3. Install & Start Backend
cd ../server
npm install
node server.js


 Project Status
Current Version: v1.0 (Production Ready)
Deployment: Active on AWS EC2 t2.micro.
Future Roadmap: Migration to AWS S3 for infinite scalability and Offline-First PWA implementation.
 
 
  Author
Yohannes Haile
Network Engineer & Full Stack Developer
Scholarship Applicant