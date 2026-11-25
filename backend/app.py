
import hashlib
import os
import json
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from web3 import Web3
from flask_cors import CORS


# --------------------------------------------------
# Initialize Flask Application
# --------------------------------------------------

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent


# --------------------------------------------------
# Activity Log Configuration
# --------------------------------------------------

ACTIVITY_LOG_FILE = BASE_DIR / "activity_logs.json"


def save_activity_log(contract_id, activity, result, message):
    """Save activity history in a JSON file."""

    try:
        logs = []

        if ACTIVITY_LOG_FILE.exists():
            with open(ACTIVITY_LOG_FILE, "r", encoding="utf-8") as file:
                logs = json.load(file)

            if not isinstance(logs, list):
                logs = []

        log_entry = {
            "contract_id": contract_id,
            "activity": activity,
            "result": result,
            "message": message,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        logs.insert(0, log_entry)

        with open(ACTIVITY_LOG_FILE, "w", encoding="utf-8") as file:
            json.dump(logs, file, indent=4)

        print("Activity logged:", activity, result)

    except Exception as error:
        print("Activity log error:", error)


# --------------------------------------------------
# Project Configuration
# --------------------------------------------------

load_dotenv(BASE_DIR / ".env")

RPC_URL = os.getenv("GANACHE_RPC_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")


# --------------------------------------------------
# Connect to Ganache Blockchain
# --------------------------------------------------

web3 = Web3(Web3.HTTPProvider(RPC_URL))

print("Connecting to Ganache...")

if web3.is_connected():
    print("Ganache Blockchain Connected Successfully!")
else:
    print("Warning: Ganache Blockchain Not Connected!")


# --------------------------------------------------
# Load Smart Contract ABI
# --------------------------------------------------

with open(BASE_DIR / "SmartGuard.json", "r", encoding="utf-8") as file:
    artifact = json.load(file)

contract_abi = artifact["abi"]


# --------------------------------------------------
# Connect to Deployed Smart Contract
# --------------------------------------------------

smartguard = None

if web3.is_connected() and CONTRACT_ADDRESS:
    contract_address = Web3.to_checksum_address(CONTRACT_ADDRESS)

    smartguard = web3.eth.contract(
        address=contract_address,
        abi=contract_abi
    )

    print("SmartGuard Smart Contract Connected!")
else:
    print("SmartGuard Smart Contract Connection Pending!")


# --------------------------------------------------
# Calculate SHA-256 Hash
# --------------------------------------------------

def calculate_hash(file_data):
    """Calculate SHA-256 hash of uploaded Solidity file."""
    return hashlib.sha256(file_data).digest()


# --------------------------------------------------
# Home Route
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    blockchain_status = (
        "Connected" if web3.is_connected() else "Disconnected"
    )

    return jsonify({
        "status": "success",
        "project": "SmartGuard",
        "message": "Welcome to SmartGuard - Blockchain-Based Smart Contract Integrity Verification System",
        "backend": "Running",
        "blockchain": blockchain_status,
        "health_check": "/api/health",
        "register_api": "/api/register",
        "verify_api": "/api/verify",
        "logs_api": "/api/logs"
    })


# --------------------------------------------------
# Backend Health Check
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "SmartGuard Backend is Running",
        "backend_connected": True,
        "blockchain_connected": web3.is_connected(),
        "contract_connected": smartguard is not None
    })


# --------------------------------------------------
# Register Smart Contract
# --------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register_contract():

    contract_id = request.form.get("contract_id", "").strip()

    try:
        if smartguard is None:
            return jsonify({
                "status": "error",
                "message": "Smart contract is not connected. Check Ganache and contract configuration."
            }), 503

        uploaded_file = request.files.get("file")

        if not contract_id or not uploaded_file:
            return jsonify({
                "status": "error",
                "message": "Contract ID and Solidity file are required"
            }), 400

        if not uploaded_file.filename.lower().endswith(".sol"):
            return jsonify({
                "status": "error",
                "message": "Only Solidity (.sol) files are allowed"
            }), 400

        file_data = uploaded_file.read()

        if not file_data:
            return jsonify({
                "status": "error",
                "message": "Uploaded file is empty"
            }), 400

        # Calculate SHA-256 hash
        code_hash = calculate_hash(file_data)

        # Use Ganache's first unlocked test account
        account = web3.eth.accounts[0]

        # Register hash on blockchain
        transaction = smartguard.functions.registerContract(
            contract_id,
            code_hash
        ).transact({
            "from": account
        })

        receipt = web3.eth.wait_for_transaction_receipt(transaction)

        if receipt.status != 1:
            raise Exception("Blockchain transaction failed")

        # Save successful registration activity
        save_activity_log(
            contract_id,
            "Registration",
            "REGISTERED",
            "Contract registered successfully on blockchain"
        )

        return jsonify({
            "status": "success",
            "message": "Contract registered successfully",
            "contract_id": contract_id,
            "sha256_hash": code_hash.hex(),
            "transaction_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------------------------
# Verify Smart Contract Integrity
# --------------------------------------------------

@app.route("/api/verify", methods=["POST"])
def verify_contract():

    contract_id = request.form.get("contract_id", "").strip()

    try:
        if smartguard is None:
            return jsonify({
                "status": "error",
                "message": "Smart contract is not connected. Check Ganache and contract configuration."
            }), 503

        uploaded_file = request.files.get("file")

        if not contract_id or not uploaded_file:
            return jsonify({
                "status": "error",
                "message": "Contract ID and Solidity file are required"
            }), 400

        if not uploaded_file.filename.lower().endswith(".sol"):
            return jsonify({
                "status": "error",
                "message": "Only Solidity (.sol) files are allowed"
            }), 400

        file_data = uploaded_file.read()

        if not file_data:
            return jsonify({
                "status": "error",
                "message": "Uploaded file is empty"
            }), 400

        # Calculate uploaded file hash
        new_hash = calculate_hash(file_data)

        # Read registered contract record
        record = smartguard.functions.contracts(contract_id).call()

        if not record[3]:

            save_activity_log(
                contract_id,
                "Verification",
                "NOT_FOUND",
                "Contract is not registered on blockchain"
            )

            return jsonify({
                "status": "NOT_FOUND",
                "message": "Contract is not registered on blockchain"
            }), 404

        # Compare uploaded hash with blockchain hash
        is_verified = smartguard.functions.verifyContract(
            contract_id,
            new_hash
        ).call()

        result = "VERIFIED" if is_verified else "TAMPERED"

        message = (
            "Contract integrity verified successfully"
            if is_verified
            else "Contract has been modified"
        )

        # Save verification activity
        save_activity_log(
            contract_id,
            "Verification",
            result,
            message
        )

        return jsonify({
            "status": result,
            "message": message,
            "contract_id": contract_id,
            "uploaded_hash": new_hash.hex(),
            "registered_hash": record[0].hex()
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------------------------
# Get Activity Logs
# --------------------------------------------------

@app.route("/api/logs", methods=["GET"])
def get_activity_logs():

    try:
        if ACTIVITY_LOG_FILE.exists():

            with open(ACTIVITY_LOG_FILE, "r", encoding="utf-8") as file:
                logs = json.load(file)

            if not isinstance(logs, list):
                logs = []

        else:
            logs = []

        return jsonify({
            "status": "success",
            "total_logs": len(logs),
            "logs": logs
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# --------------------------------------------------
# Run Flask Backend
# --------------------------------------------------

if __name__ == "__main__":

    print("----------------------------------------")
    print("       SMARTGUARD BACKEND SERVER")
    print("----------------------------------------")

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False
    )
