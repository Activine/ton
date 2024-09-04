# Lottery

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

# Project Description

## Overview

This project involves a sophisticated smart contract system on the TON blockchain that supports token management, NFT issuance, and a lottery mechanism. The system comprises several interconnected contracts, each fulfilling specific roles, including a master contract for token management, a wallet contract for token handling, and contracts dedicated to NFT collections, items, and a lottery mechanism.

## Contract System

The smart contract system consists of several key contracts:

### TokenMaster Contract

-   **Role:** Acts as the central authority for managing the token ecosystem. It handles minting, burning, and transferring tokens while ensuring proper authorization through owner and operator roles.
-   **Functions:** Manages total supply, allows for updating token content, and provides wallet addresses for token holders.

### TokenWallet Contract

-   **Role:** Manages individual token balances and facilitates transfers between addresses. It ensures security and correctness in token movements by checking sender authorization and balance validity.
-   **Functions:** Handles token transfers, burning, and sending excess tokens back to the sender or other specified addresses.

### NftCollection Contract

-   **Role:** Manages the issuance of NFTs, acting as the central repository for NFT items within a collection. It allows authorized users to deploy new NFTs based on a predefined index.
-   **Functions:** Issues NFTs, keeps track of the next available index for new items, and retrieves NFT addresses and content based on index.

### NftItem Contract

-   **Role:** Represents individual NFT items within a collection. It tracks ownership, content, and can participate in the platform’s lottery mechanism.
-   **Functions:** Manages NFT transfers, destruction, and interaction with the lottery system. It stores and provides information about the NFT’s lottery status and reward claims.

### Lottery Contract

-   **Role:** Facilitates the lottery mechanism within the platform. It enables users to purchase lottery tickets using platform tokens and participate in randomized draws, with the potential to win rewards.
-   **Functions:** Manages ticket sales, conducts random draws, determines winners, and distributes rewards. It also interacts with NftItem contracts to update and track the lottery status of NFTs, including the recording of winning numbers and reward claims.

---

This description includes the Lottery contract and highlights its role and functions within the overall contract system.

## How to use

### Install node_modules

`npm i` or `yarn install`

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`

## Lottery Smart Contract

This contract facilitates the buying of lottery tickets using a custom token, the random generation of winning numbers, and the payout of rewards to winning participants, all managed on the TON blockchain.

### Capabilities:

-   **Purchase tokens:** Users can purchase tokens used in the lottery using TON cryptocurrency.
-   **Buy lottery tickets:** Users can purchase lottery tickets (NFTs) using the tokens.
-   **Check ticket status:** Users can check the status of their lottery tickets.
-   **Claim rewards:** Users can claim rewards if their tickets win.
-   **Withdraw funds:** The contract owner can withdraw the accumulated funds from the contract.

### Contract Methods:

-   **`receive(msg: SetData)`** - Sets the NFT collection and payment token addresses.
-   **`receive(msg: BuyToken)`** - Allows users to buy tokens with TON. The payment is transferred to the payment token address.
-   **`receive(msg: BuyTicket)`** - Allows users to buy lottery tickets (NFTs) using tokens. The ticket is deployed as an NFT, and the ticket counter is incremented.
-   **`receive(msg: CheckTicket)`** - Checks the status of a specific ticket by interacting with the corresponding NFT contract.
-   **`receive(msg: GetTicketStatus)`** - Generates random numbers and sets lottery data for the ticket if it hasn’t been used yet.
-   **`receive(msg: ClaimReward)`** - Initiates the reward claim process by checking the ticket status.
-   **`receive(msg: ClaimResponse)`** - Sends the reward to the winner based on the match result.
-   **`receive(msg: Withdraw)`** - Allows the contract owner to withdraw funds from the contract.

### Internal Functions:

-   **`fun setReward(match: Int, winner: Address, queryId: Int)`** - Sets the reward for a winning ticket based on the number of matches.
-   **`fun threeRandom(): RoundData`** - Generates three random numbers and calculates the match count.
-   **`fun amountMatch(a: Int, b: Int, c: Int): Int`** - Calculates the number of matching numbers among the three generated.

### Getters:

-   **`fun lotteryData(): LotteryData`** - Returns the addresses of the NFT collection and payment token.
-   **`fun paymentToken(): Address`** - Returns the address of the payment token.
-   **`fun nftCollection(): Address`** - Returns the address of the NFT collection.
-   **`fun balance(): Int`** - Returns the contract's current balance.

### Contract Constants:

-   **`twoMatch`: 10 TON** - Reward for two matching numbers.
-   **`threeMatch`: 15 TON** - Reward for three matching numbers.
-   **`priceForToken`: 1.5 TON** - Price to purchase tokens.
-   **`priceForTicket`: 5 TON** - Price to purchase a lottery ticket.
-   **`MinTonForStorage`: 0.01 TON** - Minimum TON balance required to maintain contract storage.

---

## TokenMaster Smart Contract

This contract serves as the master contract for a token on the TON blockchain, allowing controlled minting, burning, and management of token-related metadata.

### Capabilities:

-   **Mint tokens:** Allows the contract owner or operator to mint new tokens until minting is stopped.
-   **Change token content:** The owner can update the token content, such as metadata or code.
-   **Stop minting:** The owner can permanently stop the minting of new tokens.
-   **Provide wallet address:** Generates and provides the wallet address for a given owner.
-   **Burn tokens:** Handles token burn notifications, reducing the total supply accordingly.

### Contract Methods:

-   **`receive(msg: ChangeContent)`** - Allows the owner to update the content associated with the token.
-   **`receive(msg: Transfer)`** - Mints tokens and transfers them to a specified wallet address. The transfer can be initiated by the owner or operator, provided minting is allowed.
-   **`receive(msg: ProvideWalletAddress)`** - Generates and provides the wallet address for a specified owner, optionally including the owner's address in the response.
-   **`receive("Stop Mint")`** - Stops the minting process, preventing any further token minting.
-   **`receive(msg: BurnNotification)`** - Handles notifications of burned tokens, adjusting the total supply and sending a confirmation to the response destination.

### Getters:

-   **`fun get_jetton_data(): MasterData`** - Returns detailed information about the token, including total supply, minting status, owner, content, and wallet code.
-   **`fun get_wallet_address(owner_address: Address): Address`** - Returns the wallet address for a specified owner.
-   **`fun ownerMaster(): Address`** - Returns the owner's address.
-   **`fun operator(): Address`** - Returns the operator's address.

### Contract Constants:

-   **`total_supply`: Int** - The total number of tokens in circulation.
-   **`mintable`: Bool** - A flag indicating whether minting is still allowed.
-   **`owner`: Address** - The address of the contract owner.
-   **`jetton_content`: Cell** - The content or metadata associated with the token.
-   **`operator`: Address** - The address authorized to perform certain operations on behalf of the owner.

---

## TokenWallet Smart Contract

This contract serves as a token wallet on the TON blockchain, allowing controlled transfers, burns, and management of tokens associated with the master contract.

### Capabilities:

-   **Token Transfers:** Allows the owner or operator to transfer tokens to other wallets.
-   **Internal Transfers:** Handles internal transfers, including fee calculations and forwarding.
-   **Token Burning:** Allows the owner to burn tokens, notifying the master contract of the burn.
-   **Bounce Handling:** Automatically refunds tokens in case of a failed transfer or burn notification.

### Contract Methods:

-   **`receive(msg: Transfer)`** - Transfers tokens from the current wallet to another wallet, deducting the balance and handling associated fees.
-   **`receive(msg: InternalTransfer)`** - Processes internal transfers, including forwarding tokens and notifications to the appropriate addresses.
-   **`receive(msg: Burn)`** - Burns a specified amount of tokens and notifies the master contract. Only the owner can initiate this action.
-   **`bounced(src: bounced<InternalTransfer>)`** - Handles the return of tokens in the event of a failed internal transfer.
-   **`bounced(src: bounced<BurnNotification>)`** - Handles the return of tokens in the event of a failed burn notification.

### Getters:

-   **`fun get_wallet_data(): WalletData`** - Returns detailed information about the wallet, including the balance, owner, master address, and contract code.
-   **`fun owner(): Address`** - Returns the owner's address.
-   **`fun operator(): Address`** - Returns the operator's address.

### Contract Constants:

-   **`balance`: Int** - The current balance of tokens in the wallet.
-   **`owner`: Address** - The address of the wallet owner.
-   **`master`: Address** - The address of the master contract that governs this wallet.
-   **`operator`: Address** - The address authorized to perform certain operations on behalf of the owner.

---

## NftCollection Smart Contract

This contract manages the deployment and organization of NFTs in a collection on the TON blockchain. It ensures proper index tracking and authorizes only specific addresses to deploy new NFTs.

### Capabilities:

-   **NFT Deployment:** Allows the deployment of new NFT items with specified content and ownership.
-   **NFT Index Management:** Keeps track of the next available NFT index for new deployments.
-   **Ownership and Operation:** Managed by the owner or an authorized operator.

### Contract Methods:

-   **`receive(msg: RequestNftDeploy)`** - Deploys a new NFT item with the specified index, owner, and content. The method checks that the sender is authorized and the index is valid.
-   **`get fun get_collection_data(): CollectionData`** - Returns detailed information about the collection, including the next NFT index, content, and owner.
-   **`get fun get_nft_address_by_index(index: Int): Address`** - Returns the address of the NFT contract associated with the specified index.
-   **`get fun get_nft_content(index: Int, individual_content: Cell): Cell`** - Returns the content of an NFT at a specific index. This method can handle individual content customization.

### Getters:

-   **`fun ownerCollection(): Address`** - Returns the owner's address of the NFT collection.
-   **`fun operator(): Address`** - Returns the operator's address authorized to manage the collection.
-   **`fun balance(): Int`** - Returns the current balance of the contract.

### Contract Constants:

-   **`owner`: Address** - The address of the collection's owner.
-   **`operator`: Address** - The address authorized to perform operations on behalf of the owner.
-   **`next_index`: Int** - The index for the next NFT to be deployed in the collection.
-   **`content`: Cell** - The content or metadata associated with the NFT collection.

---

## NftItem Smart Contract

This contract extends the standard NFT functionality by introducing lottery features, allowing NFTs to participate in lotteries and potentially claim rewards based on the outcome.

### Capabilities:

-   **NFT Deployment:** Handles the deployment of an NFT item, including setting the owner, content, and other attributes.
-   **Ownership Transfer:** Manages the transfer of NFT ownership, ensuring proper validation and transaction handling.
-   **Lottery Participation:** Allows the NFT to participate in a lottery, with the ability to set lottery data and claim rewards.

### Contract Methods:

-   **`receive(msg: NftDeploy)`** - Deploys the NFT item by setting the owner, content, and operator. Ensures that the contract is not already deployed.
-   **`receive(msg: NftDestroy)`** - Destroys the NFT by transferring ownership to the contract itself and returning any remaining balance to the sender.
-   **`receive(msg: NftTransfer)`** - Handles the transfer of NFT ownership, ensuring sufficient balance for transaction fees and validating the sender's ownership.
-   **`receive(msg: NftGetStaticData)`** - Returns static data about the NFT, including the index and collection address.
-   **`receive(msg: SetLotteryData)`** - Sets the lottery data for the NFT, including the ticket status and numbers.
-   **`receive(msg: TicketStatus)`** - Checks the status of the lottery ticket or claims rewards if the ticket is a winner.

### Getters:

-   **`fun get_nft_data(): NftData`** - Returns detailed information about the NFT, including whether it's deployed, its index, collection, owner, and content.
-   **`fun lottery_data(): ItemLotteryData`** - Returns the current lottery status and associated numbers.
-   **`fun owner(): Address`** - Returns the current owner's address of the NFT.
-   **`fun operator(): Address`** - Returns the operator's address authorized to manage the NFT.
-   **`fun balance(): Int`** - Returns the current balance of the contract.

### Contract Constants:

-   **`deployed`: Bool** - Indicates whether the NFT has been deployed.
-   **`collection`: Address** - The address of the collection to which this NFT belongs.
-   **`owner`: Address** - The current owner of the NFT.
-   **`index`: Int** - The index of the NFT within its collection.
-   **`content`: Cell** - The content or metadata associated with the NFT.
-   **`operator`: Address** - The address authorized to perform operations on behalf of the owner.
-   **`ticketStatus`: Bool** - Indicates whether the NFT is participating in a lottery.
-   **`numbers`: Numbers** - The lottery numbers associated with the NFT.
-   **`rewards`: Bool** - Indicates whether the rewards for the lottery have been claimed.

---
