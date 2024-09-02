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
            { value: toNano('1.5') },
            {
                $$type: 'BuyToken',
                query_id: 0n,
                amount: toNano('0.4'),
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.3'),
            },
        );

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
        console.log('user token balance', userWalletData.balance);

        expect(userWalletData.owner.equals(user.address)).toBeTruthy();
        expect(userWalletData.master.equals(jettonMaster.address)).toBeTruthy();
        expect(userWalletData.balance).toEqual(toNano('100'));

        const buyLotteryTicket = await lottery.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                amount: toNano('5'),
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.1'),
                contentNft: contentNFT,
                value: toNano('0.1'),
            },
        );

        console.log('eventseventseventseventseventseventseventsevents', buyLotteryTicket.events);

        const buyLotteryTicket1 = await lottery.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                amount: toNano('5'),
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.1'),
                contentNft: contentNFT,
                value: toNano('0.1'),
            },
        );

        const buyLotteryTicket2 = await lottery.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                amount: toNano('5'),
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.1'),
                contentNft: contentNFT,
                value: toNano('0.1'),
            },
        );

        const buyLotteryTicket3 = await lottery.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                amount: toNano('5'),
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.1'),
                contentNft: contentNFT,
                value: toNano('0.1'),
            },
        );

        const buyLotteryTicket4 = await lottery.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                amount: toNano('5'),
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.1'),
                contentNft: contentNFT,
                value: toNano('0.1'),
            },
        );

        const buyLotteryTicket5 = await lottery.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'BuyTicket',
                query_id: 0n,
                amount: toNano('5'),
                destination: user.address,
                response_destination: user.address,
                custom_payload: beginCell().endCell(),
                forward_ton_amount: toNano('0.1'),
                contentNft: contentNFT,
                value: toNano('0.1'),
            },
        );
        console.log(buyLotteryTicket.events);

        userWalletData = await userWallet.getGetWalletData();
        let lotteryWalletData = await lotteryWallet.getGetWalletData();

        const nft0Address = await nftCollection.getGetNftAddressByIndex(0n);
        const nft0 = blockchain.openContract(NftItem.fromAddress(nft0Address));
        let nftData0 = await nft0.getGetNftData();

        const nft1Address = await nftCollection.getGetNftAddressByIndex(1n);
        const nft1 = blockchain.openContract(NftItem.fromAddress(nft1Address));
        let nftData1 = await nft1.getGetNftData();

        console.log('nftData0', nftData0);
        console.log('nftData1', nftData1);

        console.log('lottery status', await nft0.getLotteryData());

        console.log('userWalletData.balance', userWalletData.balance);
        console.log('lotteryWalletData.balance', lotteryWalletData.balance);

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

        console.log(checkTicket.events);
        console.log('lottery status nft0', await nft0.getLotteryData());

        console.log('userWalletData.balance', userWalletData.balance);
        console.log('lotteryWalletData.balance', lotteryWalletData.balance);

        const claimReward = await lottery.send(
            user.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'ClaimReward',
                query_id: 0n,
                index: 0n,
            },
        );
        // console.log(claimReward.events);

        const claimReward2 = await lottery.send(
            user.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'ClaimReward',
                query_id: 0n,
                index: 0n,
            },
        );
        // console.log(claimReward2.events);

        userWalletData = await userWallet.getGetWalletData();
        lotteryWalletData = await lotteryWallet.getGetWalletData();
        console.log('lottery status nft0', await nft0.getLotteryData());
        console.log('userWalletData.balance', userWalletData.balance);
        console.log('lotteryWalletData.balance', lotteryWalletData.balance);
    });
});
