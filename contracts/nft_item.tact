import "@stdlib/deploy";
import "./messages";

const min_balance: Int = ton("0.05");
const gas_consumption: Int = ton("0.02");

struct NftData {
    deployed: Bool;
    index: Int;
    collection: Address;
    owner: Address;
    content: Cell;
}

struct Numbers {
    first: Int;
    second: Int;
    third: Int;
    match: Int;
}

struct ItemLotteryData {
    status: Bool;
    numbers: Numbers;
}

trait NftStandart {
    deployed: Bool;
    collection: Address;
    owner: Address;
    index: Int;
    content: Cell;

    receive(msg: NftTransfer) {
        let ctx: Context = context();
        require(self.deployed, "Not Deployed");
        require(ctx.sender == self.owner, "Invalid Owner");
        let min: Int = min_balance - min(min_balance, myBalance());
        let required: Int = gas_consumption + msg.forward_amount + min;
        if (msg.forward_amount != 0) {
            required = required + ctx.readForwardFee();
        }
        require(ctx.value >= required, "Invalid Amount");
        let cashback: Int = ctx.value - gas_consumption - msg.forward_amount - min;
        if (msg.forward_amount != 0) {
            cashback = cashback - ctx.readForwardFee();
            send(SendParameters{
                to: msg.new_owner,
                value: msg.forward_amount,
                mode: SendPayGasSeparately,
                body: NftOwnershipAssigned{
                    query_id: msg.query_id,
                    prev_owner: self.owner,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }
        self.owner = msg.new_owner;
        if (cashback > 0) {
            send(SendParameters{
                to: msg.response_destination,
                value: cashback,
                body: NftExcesses{
                    query_id: msg.query_id
                }.toCell()
            });
        }
    }
    receive(msg: NftGetStaticData) {
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: NftReportStaticData{
                query_id: msg.query_id,
                index: self.index,
                collection: self.collection
            }.toCell()
        });
    }

    get fun get_nft_data(): NftData {
        return NftData{deployed: self.deployed, index: self.index, collection: self.collection, owner: self.owner, content: self.content};
    }
}

contract NftItem with NftStandart {
    deployed: Bool = false;
    collection: Address;
    owner: Address;
    index: Int as uint256;
    content: Cell;
    operator: Address;
    ticketStatus: Bool = false;
    numbers: Numbers = Numbers{first: 0, second: 0, third: 0, match: 0};
    rewards: Bool = false;

    init(collection: Address, index: Int, operator: Address) {
        self.collection = collection;
        self.index = index;

        self.owner = self.collection;
        self.content = emptyCell();
        self.operator = self.collection;
    }

    receive(msg: NftDeploy) {
        require(sender() == self.collection, "Invalid Sender");
        require(self.index == msg.index, "Invalid Index");
        require(!self.deployed, "Already Deployed");

        self.owner = msg.owner;
        self.content = msg.content;
        self.deployed = true;
        self.operator = msg.operator;
    }

    receive(msg: NftDestroy) {
        require(sender() == self.owner, "Invalid Owner");
        self.owner = myAddress();
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingBalance,
            body: NftExcesses{
                query_id: msg.query_id
            }.toCell()
        });
    }

    receive(msg: SetLotteryData) {
        require(sender() == self.operator, "Operator only");
        if(!self.ticketStatus) {
            self.ticketStatus = true;
            self.numbers = Numbers{first: msg.first, second: msg.second, third: msg.third, match: msg.match};
        }
    }

    receive(msg: TicketStatus) {
        if(msg.getRewards) {
            if(self.numbers.match != 0 && !self.rewards) {
                self.rewards = true;
                self.reply(ClaimResponse{winner: self.owner, match: self.numbers.match, query_id: msg.query_id}.toCell());
            }
        } else {
            self.reply(GetTicketStatus{status: self.ticketStatus, index: self.index, query_id: msg.query_id}.toCell());
        }
    }

    get fun lottery_data(): ItemLotteryData {
        return ItemLotteryData{status: self.ticketStatus, numbers: self.numbers};
    }
}