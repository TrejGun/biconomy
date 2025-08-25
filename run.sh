# install and setup foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# run anvil
nohup anvil --fork-url https://mainnet.infura.io/v3/{YOUR_KEY_HERE} > anvil.log 2>&1 &

# setup accounts
cast send 0x69a9d2b786aA6Cdce2e7090DEB996fCba3224775 \
--from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
--value 1000000000000000000 \
--unlocked

cast rpc anvil_impersonateAccount 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341

cast send 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 \
--from 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341 \
"transfer(address,uint256)(bool)" \
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
1000000000000000 \
--unlocked

## setup environment
cp .env.example .env

# install dependencies
npm i

# build and run the code
npm run build
npm start
