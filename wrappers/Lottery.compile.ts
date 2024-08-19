import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/lottery.tact',
    options: {
        debug: true,
    },
};
