# Typescript Engineer (MEE) Task

## Local Blockchain Setup

1. Install foundry

```shell
curl -L https://foundry.paradigm.xyz | bash
```

2. Run foundry

```shell
foundryup
```

3. Fork mainnet

Go to any service that provides access to blockchain nodes, such as alchemy or infura and register an account to get RPC url

```shell
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/{YOUR_KEY_HERE}
```

Remember to copy a test account with ETH for the next step

```
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

4. Test connection

```shell
curl -X POST http://127.0.0.1:8545 \
-H "Content-Type: application/json" \
-d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Local MEE Node Deployment

1. Clone GH repo

```shell
git clone https://github.com/bcnmy/mee-node-deployment
cd mee-node-deployment
```

2. Create a new configuration folder

```shell
mkdir chains-local
cp chains-prod/1.json chains-local/1.json
```

3. Set http://host.docker.internal:8545 as RPC url in chains-local/1.json

4. Set chains-local as volume in docker-compose.yml

5. Set private key obtained from anvil as KEY variable in docker-compose.yml

6. Start the node

```shell
docker compose up -d
```

7. Test connection

```shell
curl http://localhost:3000/v3/info
```

## Fund a Test EOA

1. Go to [etherscan](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48#balances) to get an address with a significant amount of USDC

```
0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341
```

2. Check the balance of this address using local setup. The cast utility was installed as part of the foundry

```shell
cast call 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 \
  "balanceOf(address)(uint256)" \
  0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341
```

3. Fund whale address with ETH using an account obtained from anvil in the previous step. This account has to have ETH to pay for the gas fee in the next step

```shell
cast send 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341 \
--from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
--value 1000000000000000000 \
--unlocked
```

3. Transfer tokens from whale address to test EOA

```shell
cast rpc anvil_impersonateAccount 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341

cast send 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 \
--from 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341 \
  "transfer(address,uint256)(bool)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  1000000000000000 \
  --unlocked
```

4. Verify the transfer

```shell
cast call 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 \
  "balanceOf(address)(uint256)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## Initialize Biconomy abstract.js SDK

1. Setup environment

```shell
nano .env
```

2. Install dependencies

```shell
npm i
```

2. Run the code in dev mode

```shell
npm run dev
```

## Execute a Fusion Supertransaction

See the code.
