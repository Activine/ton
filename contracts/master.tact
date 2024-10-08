import "./wallet";
import "@stdlib/ownable";
import "@stdlib/deploy";

struct MasterData {
    total_supply: Int;
    mintable: Bool;
    owner: Address;
    jetton_content: Cell;
    jetton_wallet_code: Cell;
}

contract TokenMaster with OwnableTransferable, Deployable {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    operator: Address;

    init(owner: Address, jetton_content: Cell, operator: Address) {
        self.owner = owner;
        self.jetton_content = jetton_content;
        self.operator = operator;
    }

    receive(msg: ChangeContent) {
        self.requireOwner();
        self.jetton_content = msg.jetton_content;
    }

    receive(msg: Transfer) {
        let ctx: Context = context();
        require(sender() == self.owner || sender() == self.operator, "Invalid sender");
        require(self.mintable, "Mint stopped");
        require(ctx.readForwardFee() * 2 + 2 * gasConsumption + minTons + msg.forward_ton_amount < ctx.value, "Invalid ton amount");
        self.total_supply = self.total_supply + msg.amount;
        let init: StateInit = initOf TokenWallet(msg.destination, myAddress(), self.operator);
        let to: Address = contractAddress(init);

        send(SendParameters {
            to: to,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: InternalTransfer{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: emptySlice()
                }.toCell(),
            data: init.data,
            code: init.code
        });
    }

    receive(msg: ProvideWalletAddress) {
        let ctx: Context = context();
        let wallet: Address = contractAddress(initOf TokenWallet(msg.owner_address, myAddress(), self.operator));
        let owner_address: Address? = null;
        if (msg.include_address) {
            owner_address = msg.owner_address;
        }
        send(SendParameters {
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue,
            body: TakeWalletAddress{
                query_id: msg.query_id,
                wallet_address: wallet,
                owner_address: owner_address
            }.toCell()
        });
    }

    receive("Stop Mint") {
        self.requireOwner();
        self.mintable = false;
    }

    receive(msg: BurnNotification) {
        let init: StateInit = initOf TokenWallet(msg.sender, myAddress(), self.operator);
        require(contractAddress(init) == sender(), "Invalid sender");

        self.total_supply = self.total_supply - msg.amount;
        send(SendParameters{
            to: msg.response_destination,
            value: 0,
            mode: SendRemainingValue,
            body: Excesses{query_id: msg.query_id}.toCell()
        });
    }

    get fun get_jetton_data(): MasterData {
        return MasterData{total_supply: self.total_supply, mintable: self.mintable, owner: self.owner, jetton_content: self.jetton_content, jetton_wallet_code: (initOf TokenWallet(self.owner, myAddress(), self.operator)).code};
    }

    get fun get_wallet_address(owner_address: Address): Address {
        dump(owner_address);
        dump(myAddress());
        dump(self.operator);
        let init: StateInit = initOf TokenWallet(owner_address, myAddress(), self.operator);
        return contractAddress(init);
    }
}