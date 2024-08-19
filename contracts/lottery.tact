import "@stdlib/deploy";
import "./wallet";
import "./nft_item";
import "./messages";

struct RoundData {
    first: Int as uint8;
    second: Int as uint8;
    third: Int as uint8; 
    match: Int as uint8;   
}

struct LotteryData {
    nftCollection: Address;
    paymentToken: Address;
}

contract Lottery with Deployable {
    const twoMatch: Int = ton("10");
    const threeMatch: Int = ton("15");
    const priceForToken: Int = ton("1.5");
    const priceForTicket: Int = ton("5");

    nftCollection: Address;
    paymentToken: Address;
    tokenBalance: Int = 0;
    ticketCounter: Int = 0;
   
    init() {
        self.nftCollection = myAddress();
        self.paymentToken = myAddress();
        self.tokenBalance = 0;
    }

    receive(msg: SetData) {
        self.nftCollection = msg.nftAddress;
        self.paymentToken = msg.jettonAddress;
    }

    receive(msg: BuyToken) {
        require(context().value >= self.priceForToken, "Only 1.5 TON payments are accepted");
        send(SendParameters{
            to: self.paymentToken,
            body: Transfer{
                query_id: msg.query_id, 
                amount: ton("100"), 
                destination: sender(), 
                response_destination: sender(),
                custom_payload: msg.custom_payload,
                forward_ton_amount: msg.forward_ton_amount
                }.toCell(),
            value: ton("0.5"),
            mode: SendIgnoreErrors
        });
    }

    receive(msg: BuyTicket) {
        dump(sender());
        let init: StateInit = initOf TokenWallet(sender(), self.paymentToken, myAddress());
        // require(msg.amount == ton("5"), "iSendParametersSendParametersncorrect token amount");
        self.tokenBalance = self.tokenBalance + msg.amount;
        dump(contractAddress(init));
        send(SendParameters{
            to: contractAddress(init),
            body: Transfer{
                query_id: msg.query_id, 
                amount: self.priceForTicket, 
                destination: myAddress(), 
                response_destination: myAddress(),
                custom_payload: msg.custom_payload,
                forward_ton_amount: msg.forward_ton_amount
                }.toCell(),
            value: ton("0.5"),
            mode: SendIgnoreErrors
        });
        let initNFT: StateInit = initOf NftItem(self.nftCollection, self.ticketCounter, myAddress());
        send(SendParameters{
            to: self.nftCollection,
            body: RequestNftDeploy{
                index: self.ticketCounter,
                amount: msg.value,
                owner: sender(),
                content: msg.contentNft
                }.toCell(),
            value: ton("0.5"),
            mode: SendIgnoreErrors
        });
        self.ticketCounter = self.ticketCounter + 1;
    }

    receive(msg: CheckTicket) {
        let initNFT: StateInit = initOf NftItem(self.nftCollection, msg.index, myAddress());
        send(SendParameters{
            to: contractAddress(initNFT),
            body: "ticketStatus".asComment(),
            value: ton("0.2"),
            mode: SendIgnoreErrors
        });
    }

    receive(msg: GetTicketStatus) {
        // dump(msg.status);
        if(!msg.status) {
            let data: RoundData = self.threeRandom();
            let initNFT: StateInit = initOf NftItem(self.nftCollection, msg.index, myAddress());

            send(SendParameters{
                to: contractAddress(initNFT),
                body: SetLotteryData{first: data.first, second: data.second, third: data.third}.toCell(),
                value: ton("0.2"),
                mode: SendIgnoreErrors
            });
            
            // if(data.match != 0) {    
            //     self.setReward(data.match, sender());
            // }
        }
        // require(msg.status, "ticket used");
    }

    get fun threeRandom(): RoundData {
        let one = random(0, 10);
        let two = random(0, 10);
        let three = random(0, 10);
        let match = self.amountMatch(one, two, three);
        return RoundData{first: one, second: two, third: three, match: match};
    }

    get fun random(): Int {
        return random(0, 10);
    }

    get fun amountMatch(a: Int, b: Int, c: Int): Int {
        let match = 0;
        match = (a == b ? 1 : 0) + (a == c ? 1 : 0) + (b == c ? 1 : 0);
        return match;
    
    }

    get fun lotteryData(): LotteryData {
        return LotteryData{nftCollection: self.nftCollection, paymentToken: self.paymentToken};
    }
}
