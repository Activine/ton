import { toNano, address, beginCell } from '@ton/core';
import { TokenMaster } from '../wrappers/Master';
import { TokenWallet } from '../wrappers/Wallet';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from './utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: 'Fire Token',
        description: 'This is description of Test Jetton Token in Tact-lang',
        symbol: 'Fire',
        image: 'https://www.pngall.com/wp-content/uploads/15/Fire-Flame-PNG-Image-HD.png',
    };
    let content = buildOnchainMetadata(jettonParams);
    let owner = address('0QAxMBACnTtF5DUG3jwpEw5gxLF7giTsZIDwI5ue58JkCG0o');

    console.log('sender', provider.sender());
    console.log('owner', owner);
    const master = provider.open(await TokenMaster.fromInit(owner, content, owner));

    await master.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(master.address);

    await master.send(
        provider.sender(),
        { value: toNano('1.2') },
        {
            $$type: 'Transfer',
            query_id: 5n,
            amount: toNano(20),
            destination: owner,
            response_destination: owner,
            custom_payload: beginCell().endCell(),
            forward_ton_amount: toNano(1),
            // forward_payload: beginCell().storeUint(0, 32).storeStringTail('hello owner1').endCell(),
        },
    );

    const owner_wallet = provider.open(await TokenWallet.fromInit(owner, master.address, owner));
    console.log('owner_wallet', owner_wallet);

    console.log((await owner_wallet.getGetWalletData()).balance);

    // run methods on `master`
}
