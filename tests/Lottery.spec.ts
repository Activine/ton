import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, address, beginCell, Cell } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import { TokenMaster } from '../wrappers/Master';
import { TokenWallet } from '../wrappers/Wallet';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { buildOnchainMetadata } from '../scripts/utils/jetton-helpers';
import '@ton/test-utils';

describe('Lottery', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let lottery: SandboxContract<Lottery>;
    let nftCollection: SandboxContract<NftCollection>;
    let jettonMaster: SandboxContract<TokenMaster>;
    let contentNFT: Cell;
    const amountOfToken = toNano('100');
    const priceForTicket = toNano('5');

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        // deploy lottery
        lottery = blockchain.openContract(await Lottery.fromInit());
        const deployLottery = await lottery.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployLottery.transactions).toHaveTransaction({
            from: deployer.address,
            to: lottery.address,
            deploy: true,
            success: true,
        });

        // deploy nft collectioin
        const collectionParams = {
            image: 'https://www.pngall.com/wp-content/uploads/15/Fire-Flame-PNG-Image-HD.png',
            name: 'Fire Lottery Ticket',
            description: 'This is description of Test NFT in Tact-lang',
            social_links: ['https://4irelabs.com/'],
            marketplace: 'getgems.io',
        };
        contentNFT = buildOnchainMetadata(collectionParams);
        nftCollection = blockchain.openContract(
            await NftCollection.fromInit(deployer.address, contentNFT, lottery.address),
        );
        const deployNftCollection = await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployNftCollection.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });

        // deploy jettonMaster
        const jettonParams = {
            name: 'Fire Token',
            description: 'This is description of Test Jetton Token in Tact-lang',
            symbol: 'Fire',
            image: 'https://www.pngall.com/wp-content/uploads/15/Fire-Flame-PNG-Image-HD.png',
        };
        let contentJetton = buildOnchainMetadata(jettonParams);
        jettonMaster = blockchain.openContract(
            await TokenMaster.fromInit(deployer.address, contentJetton, lottery.address),
        );
        const deployMasterJetton = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployMasterJetton.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('general test', async () => {
        // set nftCollection and jettonMaster on lottery
        const setData = await lottery.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'SetData',
                nftAddress: nftCollection.address,
                jettonAddress: jettonMaster.address,
            },
        );

        expect(setData.transactions).toHaveTransaction({
            from: deployer.address,
            to: lottery.address,
            success: true,
        });

        const lotteryData = await lottery.getLotteryData();

        expect(lotteryData.nftCollection.equals(nftCollection.address)).toBeTruthy();
        expect(lotteryData.paymentToken.equals(jettonMaster.address)).toBeTruthy();

        // buy lottery token
        const buyLotteryToken = await lottery.send(
            user.getSender(),
            { value: toNano('1.56') },
            {
                $$type: 'BuyToken',
                query_id: 0n,
                amount: 0n,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
            },
        );

        // console.log('List of transactions for buy token: ', buyLotteryToken.events);

        const userJettonAddress = await jettonMaster.getGetWalletAddress(user.address);
        const userWallet = blockchain.openContract(TokenWallet.fromAddress(userJettonAddress));
        const lotteryJettonAddress = await jettonMaster.getGetWalletAddress(lottery.address);
        const lotteryWallet = blockchain.openContract(TokenWallet.fromAddress(lotteryJettonAddress));
        console.log(
            'lottery:',
            lottery.address,
            '\n',
            'nftCollection:',
            nftCollection.address,
            '\n',
            'jettonMaster:',
            jettonMaster.address,
            '\n',
            'user:',
            user.address,
            '\n',
            'deployer:',
            deployer.address,
            '\n',
            'userWallet:',
            userWallet.address,
            '\n',
            'lotteryWallet:',
            lotteryWallet.address,
            '\n',
        );

        let userWalletData = await userWallet.getGetWalletData();
        console.log('User token balance', userWalletData.balance);
        console.log('Lottery balance (TON) after buying token', await lottery.getBalance());

        expect(userWalletData.owner.equals(user.address)).toBeTruthy();
        expect(userWalletData.master.equals(jettonMaster.address)).toBeTruthy();
        expect(userWalletData.balance).toEqual(toNano('100'));

        // buy lottery ticket
        const buyLotteryTicket = await lottery.send(
            user.getSender(),
            { value: toNano('0.31') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
                contentNft: contentNFT,
                value: 0n,
            },
        );
        const nft0Address = await nftCollection.getGetNftAddressByIndex(0n);
        const nft0 = blockchain.openContract(NftItem.fromAddress(nft0Address));
        let nftData0 = await nft0.getGetNftData();

        console.log('Data of ticket 0: ', nftData0);

        expect(nftData0.deployed).toEqual(true);
        expect(nftData0.owner.toString()).toEqual(user.address.toString());
        expect((await lotteryWallet.getGetWalletData()).balance).toEqual(priceForTicket);

        // console.log('List of transactions for buy ticket: ', buyLotteryTicket.events);
        const buyLotteryTicket1 = await lottery.send(
            user.getSender(),
            { value: toNano('0.31') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
                contentNft: contentNFT,
                value: 0n,
            },
        );
        const buyLotteryTicket2 = await lottery.send(
            user.getSender(),
            { value: toNano('0.31') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
                contentNft: contentNFT,
                value: 0n,
            },
        );
        const buyLotteryTicket3 = await lottery.send(
            user.getSender(),
            { value: toNano('0.31') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
                contentNft: contentNFT,
                value: 0n,
            },
        );
        const buyLotteryTicket4 = await lottery.send(
            user.getSender(),
            { value: toNano('0.31') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
                contentNft: contentNFT,
                value: 0n,
            },
        );
        const buyLotteryTicket5 = await lottery.send(
            user.getSender(),
            { value: toNano('0.31') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: 0n,
                forward_payload: beginCell().endCell().asSlice(),
                contentNft: contentNFT,
                value: 0n,
            },
        );

        console.log('Lottery balance (Jetton) after buying tickets', (await lotteryWallet.getGetWalletData()).balance);
        console.log('User balance (Jetton) after buying tickets', (await userWallet.getGetWalletData()).balance);

        // check ticket
        const checkTicket = await lottery.send(
            user.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'CheckTicket',
                query_id: 0n,
                index: 0n,
            },
        );
        const checkTicket1 = await lottery.send(
            user.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'CheckTicket',
                query_id: 0n,
                index: 1n,
            },
        );
        // console.log('List of transactions for check ticket: ', checkTicket.events);
        console.log('lottery status nft0', await nft0.getLotteryData());

        const claimReward = await lottery.send(
            user.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'ClaimReward',
                query_id: 0n,
                index: 0n,
            },
        );
        // console.log('List of transactions for claim rewards: ', checkTicket.events);

        userWalletData = await userWallet.getGetWalletData();
        let lotteryWalletData = await lotteryWallet.getGetWalletData();
        console.log('lottery status nft0', await nft0.getLotteryData());
        console.log('userWalletData.balance', userWalletData.balance);
        console.log('lotteryWalletData.balance', lotteryWalletData.balance);
        console.log('deployer', await deployer.getBalance());

        let withdraw = await lottery.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Withdraw',
                amount: toNano('5'),
            },
        );

        // console.log('List of transactions for withdraw (TON) from the lottery contract: ', withdraw.events);

        console.log('lottery.getBalance', await lottery.getBalance());
        console.log('deployer', await deployer.getBalance());
    });
});
