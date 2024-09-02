import { toNano, address, beginCell } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from './utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const collectionParams = {
        image: 'https://www.pngall.com/wp-content/uploads/15/Fire-Flame-PNG-Image-HD.png',
        name: 'Fire Lottery Ticket',
        description: 'This is description of Test NFT in Tact-lang',
        social_links: ['https://4irelabs.com/'],
        marketplace: 'getgems.io',
    };
    const contentNFT = buildOnchainMetadata(collectionParams);
    let owner = address('0QCo2Iu333eSAxgzuoIMnNmphweSo87oQVJDiVOevi0pvzwz');
    const operator = address('EQDeaZ1X1c0PZi4G68YHEzlV3i4GnbBu4RIZbesfnHFF3HRV');

    const nftCollection = provider.open(await NftCollection.fromInit(owner, contentNFT, operator));

    await nftCollection.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(nftCollection.address);

    // run methods on `nftCollection`
}
