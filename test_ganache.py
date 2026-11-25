
from web3 import Web3

ganache_url = "http://127.0.0.1:7545"

w3 = Web3(Web3.HTTPProvider(ganache_url))

if w3.is_connected():
    print("Ganache Connected Successfully!")
    print("Chain ID:", w3.eth.chain_id)
    print("Latest Block:", w3.eth.block_number)

    print("\nAvailable Ganache Accounts:")
    for account in w3.eth.accounts:
        print(account)
else:
    print("Ganache Connection Failed!")
    print("Please check whether Ganache is running.")
