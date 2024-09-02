import { toNano, address, beginCell } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const lotteryAddress = address('EQDeaZ1X1c0PZi4G68YHEzlV3i4GnbBu4RIZbesfnHFF3HRV');

    const lottery = provider.open(Lottery.fromAddress(lotteryAddress));
    const jetton = address('EQD6cf_tfwgbt6sFX3fbv7C0z3dEtSyIvVrlCl7opl8JaGd_');
    const nft = address('EQBEhEoq9QIrN7ELLoaYu7Vbbcm18Y78E3U-r5rvQiSV4vyc');
    // const lottery = provider.open(await Lottery.fromInit());

    await lottery.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'SetData',
            nftAddress: nft,
            jettonAddress: jetton,
        },
    );

    // await provider.waitForDeploy(lottery.address);

    // run methods on `lottery`
}
