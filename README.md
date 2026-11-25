# SmartGuard

**Blockchain-Based Smart Contract Integrity Verification System**

SmartGuard helps developers register Solidity (`.sol`) smart contracts on an Ethereum-compatible blockchain (Ganache) using their SHA-256 cryptographic hash and verify source-code integrity at any time to detect unauthorized modifications or tampering.

---

## Features

- **Register Smart Contract**: Upload a `.sol` file with a unique Contract ID, compute its SHA-256 hash, and record the hash on-chain via the `SmartGuard` smart contract.
- **Verify Integrity**: Re-upload a `.sol` file for a registered Contract ID and compare its SHA-256 hash against the immutable blockchain record (`VERIFIED`, `TAMPERED`, or `NOT_FOUND`).
- **Activity Logs**: View and filter registration and verification history (`REGISTERED`, `VERIFIED`, `TAMPERED`, `NOT_FOUND`) recorded by the backend.
- **Live Status Monitoring**: Dashboard displays backend, Ganache blockchain, and smart contract connection status alongside summary statistics.

---

## Tech Stack

- **Smart Contract & Blockchain**: Solidity (`^0.8.28`), Hardhat, Ganache (Local Network, Chain ID `1337`, RPC `http://127.0.0.1:7545`)
- **Backend**: Python, Flask, `web3.py`, `flask-cors`, `python-dotenv`
- **Frontend**: React 19, Vite, Tailwind CSS v4, `lucide-react`

---

## Project Structure

```text
SmartGuard/
├── blockchain/
│   ├── contracts/
│   │   └── SmartGuard.sol        # Solidity contract storing & verifying code hashes
│   ├── scripts/
│   │   └── deploy.js             # Hardhat deployment script for SmartGuard
│   ├── hardhat.config.js         # Hardhat & Ganache network configuration
│   ├── package.json
│   └── .env.example              # Template for GANACHE_PRIVATE_KEY
├── backend/
│   ├── app.py                    # Flask API server (port 5001)
│   ├── SmartGuard.json           # Compiled contract ABI & artifact
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Template for GANACHE_RPC_URL & CONTRACT_ADDRESS
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main dashboard, register, verify & logs UI
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── test_contract.sol             # Sample Solidity contract for testing
├── test_contract_original.sol    # Sample Solidity contract for testing
├── test_ganache.py               # Quick script to test local Ganache RPC connection
├── .gitignore
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended) & `npm`
- [Python](https://www.python.org/) (3.10+ recommended) & `pip`
- [Ganache](https://archive.trufflesuite.com/ganache/) running locally on `http://127.0.0.1:7545` (Chain ID `1337`)

---

## Setup & Installation

### 1. Start Ganache

Launch Ganache on `127.0.0.1:7545` (Chain ID `1337`) and copy one of the test account private keys.

You can optionally verify the Ganache connection using:

```bash
python test_ganache.py
```

### 2. Deploy the Smart Contract (`blockchain/`)

```bash
cd blockchain
npm install
```

Create a `.env` file in `blockchain/` (see `blockchain/.env.example`):

```env
GANACHE_PRIVATE_KEY=your_ganache_account_private_key
```

Compile and deploy `SmartGuard.sol` to Ganache:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

Copy the deployed contract address printed in the terminal.

### 3. Configure & Run the Backend (`backend/`)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see `backend/.env.example`):

```env
GANACHE_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=your_deployed_smartguard_contract_address
```

Start the Flask server (runs on `http://127.0.0.1:5001`):

```bash
python app.py
```

### 4. Run the Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`) in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/` | Backend status and available API routes |
| `GET` | `/api/health` | Check backend, Ganache RPC, and smart contract connection |
| `POST` | `/api/register` | Form-data (`contract_id`, `file` `.sol`) — computes SHA-256 and registers on-chain |
| `POST` | `/api/verify` | Form-data (`contract_id`, `file` `.sol`) — verifies hash against on-chain record |
| `GET` | `/api/logs` | Returns recorded registration and verification activity logs |
