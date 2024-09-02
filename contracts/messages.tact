// wallet 

message(0x0f817ea5) Transfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x178d4519) InternalTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x7362d09c) TransferNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}

message(0xd53276db) Excesses {
    query_id: Int as uint64;
}

message(0x595f07bc) Burn {
    query_id: Int as uint64;
    amount: Int as coins;
    response_destination: Address;
    custom_payload: Cell?;
}

message(0x7bdd97de) BurnNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    response_destination: Address;
}

// master

message ChangeContent {
    jetton_content: Cell;
}

message(0x2c76b973) ProvideWalletAddress {
    query_id: Int as uint64;
    owner_address: Address;
    include_address: Bool;
}
message(0xd1735400) TakeWalletAddress {
    query_id: Int as uint64;
    wallet_address: Address;
    owner_address: Address?;
}

// nft

message(0x5fcc3d14) NftTransfer {
    query_id: Int as uint64;
    new_owner: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x05138d91) NftOwnershipAssigned {
    query_id: Int as uint64;
    prev_owner: Address;
    forward_payload: Slice as remaining;
}

message(0x6f89f5e3) NftExcesses {
    query_id: Int as uint64;
}

message(0x2fcb26a2) NftGetStaticData {
    query_id: Int as uint64;
}

message(0x8b771735) NftReportStaticData {
    query_id: Int as uint64;
    index: Int as uint256;
    collection: Address;
}

message(0x693d3950) NftGetRoyaltyParams {
    query_id: Int as uint64;
}

message(0xa8cb00ad) NftReportRoyaltyParams {
    query_id: Int as uint64;
    numerator: Int as uint16;
    denominator: Int as uint16;
    destination: Address;
}

message(0x1f04537a) NftDestroy {
    query_id: Int as uint64;
}

message NftDeploy {
    index: Int as uint256;
    owner: Address;
    content: Cell;
    operator: Address;
}

message RequestNftDeploy {
    index: Int as uint256;
    // amount: Int as coins;
    owner: Address;
    content: Cell;
}

message SetLotteryData{
    first: Int as uint8;
    second: Int as uint8;
    third: Int as uint8;
    match: Int as uint8;
}

// lottery

message SetData {
    nftAddress: Address;
    jettonAddress: Address;
}

message BuyToken {
    query_id: Int as uint64;
    amount: Int as coins;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message BuyTicket {
    query_id: Int as uint64;
    // amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
    contentNft: Cell;
    value: Int as coins;
}

message CheckTicket {
    query_id: Int as uint64;
    index: Int as uint256;
}

message GetTicketStatus {
    query_id: Int as uint64;
    status: Bool;
    index: Int as uint256;
}

message TicketStatus {
    getRewards: Bool;
    query_id: Int as uint64;
}

message ClaimReward {
    query_id: Int as uint64;
    index: Int as uint256;
}

message ClaimResponse {
    query_id: Int as uint64;
    winner: Address;
    match: Int as uint8;
}