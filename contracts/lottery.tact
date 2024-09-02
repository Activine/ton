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
        send(SendParameters{
            to: sender(),
            body: emptyCell(), 
            value: 0,
            mode: SendRemainingValue
        });
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
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
                }.toCell(),
            value: context().value - self.priceForToken,
            mode: SendIgnoreErrors
        });
    }

    receive(msg: BuyTicket) {
        let init: StateInit = initOf TokenWallet(sender(), self.paymentToken, myAddress());
        // require(msg.amount == ton("5"), "iSendParametersSendParametersncorrect token amount");
        self.tokenBalance = self.tokenBalance + self.priceForTicket;
        send(SendParameters{
            to: contractAddress(init),
            body: Transfer{
                query_id: msg.query_id, 
                amount: self.priceForTicket, 
                destination: myAddress(), 
                response_destination: sender(),
                custom_payload: msg.custom_payload,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
                }.toCell(),
            value: ton("0.06"),
            mode: SendIgnoreErrors
        });
        let initNFT: StateInit = initOf NftItem(self.nftCollection, self.ticketCounter, myAddress());
        send(SendParameters{
            to: self.nftCollection,
            body: RequestNftDeploy{
                index: self.ticketCounter,
                owner: sender(),
                content: msg.contentNft
                }.toCell(),
            value: ton("0.06"),
            mode: SendIgnoreErrors
        });
        self.ticketCounter = self.ticketCounter + 1;
    }

    receive(msg: CheckTicket) {
        let initNFT: StateInit = initOf NftItem(self.nftCollection, msg.index, myAddress());
        send(SendParameters{
            to: contractAddress(initNFT),
            body: TicketStatus{
                query_id: msg.query_id,
                getRewards: false
            }.toCell(),
            value: 0,
            mode: SendRemainingValue
        });
    }

    receive(msg: GetTicketStatus) {
        // require(msg.status, "ticket used");
        if(!msg.status) {
            let data: RoundData = self.threeRandom();
            let initNFT: StateInit = initOf NftItem(self.nftCollection, msg.index, myAddress());

            send(SendParameters{
                to: contractAddress(initNFT),
                body: SetLotteryData{first: data.first, second: data.second, third: data.third, match: data.match}.toCell(),
                value: 0,
                mode: SendRemainingValue
            });
        }
    }

    receive(msg: ClaimReward) {
        let initNFT: StateInit = initOf NftItem(self.nftCollection, msg.index, myAddress());
        send(SendParameters{
            to: contractAddress(initNFT),
            body: TicketStatus{
                query_id: msg.query_id,
                getRewards: true
            }.toCell(),
            value: 0,
            mode: SendRemainingValue
        });
    }

    receive(msg: ClaimResponse) {
        self.setReward(msg.match, msg.winner, msg.query_id);
    }

    fun setReward(match: Int, winner: Address, queryId: Int) {
        let init: StateInit = initOf TokenWallet(myAddress(), self.paymentToken, myAddress());
        dump(1);
        dump(1);
        dump(1);
        if(match == 1) {
            send(SendParameters{
                to: contractAddress(init),
                body: Transfer{
                    query_id: queryId, 
                    amount: self.twoMatch, 
                    destination: winner, 
                    response_destination: winner,
                    custom_payload: null,
                    forward_ton_amount: 0,
                    forward_payload: emptyCell().asSlice()
                }.toCell(),
                value: ton("0.1"),
                mode: SendIgnoreErrors
            });
        } else if(match == 3) {
            send(SendParameters{
                to: contractAddress(init),
                body: Transfer{
                    query_id: queryId, 
                    amount: self.threeMatch, 
                    destination: winner, 
                    response_destination: winner,
                    custom_payload: null,
                    forward_ton_amount: 0,
                    forward_payload: emptyCell().asSlice()
                }.toCell(),
                value: ton("0.1"),
                mode: SendIgnoreErrors
            });
        }
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

    get fun paymentToken(): Address {
        return self.paymentToken;
    }

    get fun nftCollection(): Address {
        return self.nftCollection;
    }

    get fun balance(): Int {
        return myBalance();
    }
}
