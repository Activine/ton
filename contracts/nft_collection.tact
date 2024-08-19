import "@stdlib/deploy";
import "@stdlib/ownable";
import "./nft_item";

struct CollectionData {
    next_index: Int;
    content: Cell;
    owner: Address;
}

contract NftCollection with Ownable, Deployable {
    owner: Address;
    operator: Address;
    next_index: Int as uint256 = 100;
    content: Cell;

    init(owner: Address, content: Cell, operator: Address) {
        self.owner = owner;
        self.content = content;
        self.operator = operator;
    }

    receive(msg: RequestNftDeploy) {
        dump(1);
        // self.requireOwner();
        require(self.owner == sender() || self.operator == sender(), "Invalid sender");

        require(msg.index <= self.next_index, "Invalid Index");
        let nft_init: StateInit = initOf NftItem(myAddress(), msg.index, self.operator);
        let nft_address: Address = contractAddress(nft_init);
        dump(1);

        send(SendParameters{
            to: nft_address,
            value: msg.amount,
            mode: SendPayGasSeparately,
            bounce: false,
            data: nft_init.data,
            code: nft_init.code,
            body: NftDeploy{
                index: msg.index,
                owner: msg.owner,
                content: msg.content,
                operator: self.operator
            }.toCell()
        });
        if(msg.index == self.next_index) {
            self.next_index = self.next_index + 1;
        }
    }

    get fun get_collection_data(): CollectionData {
        return CollectionData{next_index: self.next_index, content: self.content, owner: self.owner};
    }
    get fun get_nft_address_by_index(index: Int): Address {
        return contractAddress(initOf NftItem(myAddress(), index, self.operator));
    }
    get fun get_nft_content(index: Int, individual_content: Cell): Cell {
        return individual_content;
    }
}