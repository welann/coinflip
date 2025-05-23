module coinflipcontract::coinflipcontract;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event::emit;
use sui::random::{Self, Random};
use sui::url::{Self, Url};

// 错误代码
const EAlreadyClaimed: u64 = 1;
const EInsufficientBalance: u64 = 2;
const EInvalidGuess: u64 = 3;
const EInvalidAmount: u64 = 4;

// 常量
const HEADS: u8 = 0;
const TAILS: u8 = 1;

// 一次性见证类型，用于创建代币
public struct COINFLIPCONTRACT has drop {}

// 代币存储结构体 - 使用 Balance 替代 Coin 以提高效率
public struct GameTreasury has key {
    id: UID,
    balance: Balance<COINFLIPCONTRACT>,
}

// coin权限控制结构体
public struct GameCap has key, store {
    id: UID,
}

// 记录已经领取代币的地址
public struct ClaimedAddresses has key {
    id: UID,
    addresses: vector<address>,
}

// 游戏结果事件
public struct FlipResult has copy, drop {
    player: address,
    guess: u8,
    result: u8,
    amount: u64,
    won: bool,
}

// 领取代币事件
public struct TokenClaimed has copy, drop {
    claimer: address,
    amount: u64,
}

// 代币铸造事件
public struct TokenMinted has copy, drop {
    total_supply: u64,
    admin_amount: u64,
    contract_amount: u64,
}

// 初始化函数，在部署合约时调用
fun init(witness: COINFLIPCONTRACT, ctx: &mut TxContext) {
    // 创建代币
    let (mut treasury_cap, metadata) = coin::create_currency(
        witness,
        1, // 小数位数
        b"CatFlip", // 符号
        b"CoinFlip Token", // 名称
        b"A token for the CoinFlip game on Sui", // 描述
        option::some(
            url::new_unsafe_from_bytes(
                b"https://github.com/welann/coinflip/blob/main/public/project.png",
            ),
        ), // 图标URL
        ctx,
    );

    // 铸造固定总量的代币
    let total_supply = 1_000_000_000; // 1,000,000 FLIP (考虑到9位小数)
    let admin_amount = total_supply / 2;
    let contract_amount = total_supply - admin_amount;

    // 给管理员一半的代币
    let admin_coins = coin::mint(&mut treasury_cap, admin_amount, ctx);
    transfer::public_transfer(admin_coins, tx_context::sender(ctx));

    let game_treasury = GameTreasury {
        id: object::new(ctx),
        balance: coin::into_balance(coin::mint(&mut treasury_cap, contract_amount, ctx)),
    };

    // 共享游戏金库
    transfer::share_object(game_treasury);

    // 创建已领取地址表
    let claimed_addresses = ClaimedAddresses {
        id: object::new(ctx),
        addresses: vector::empty(),
    };

    // 发送事件
    emit(TokenMinted {
        total_supply,
        admin_amount,
        contract_amount,
    });

    // 转移所有权
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    transfer::public_freeze_object(metadata);
    transfer::share_object(claimed_addresses);
}

// 领取免费代币
public entry fun claim(
    treasury: &mut GameTreasury,
    claimed_addresses: &mut ClaimedAddresses,
    ctx: &mut TxContext,
) {
    // 检查是否已经领取过
    assert!(!vector::contains(&claimed_addresses.addresses, &ctx.sender()), EAlreadyClaimed);

    // 标记为已领取
    vector::push_back(&mut claimed_addresses.addresses, ctx.sender());

    // 领取金额
    let claim_amount = 100; // 10 FLIP (考虑到9位小数)

    // 检查合约余额
    assert!(treasury.balance.value() >= claim_amount, EInsufficientBalance);

    // 转移代币给用户
    let user_coin = treasury.balance.split(claim_amount);
    let user_new_coin = coin::from_balance(user_coin, ctx);
    transfer::public_transfer(user_new_coin, ctx.sender());

    // 发送事件
    emit(TokenClaimed {
        claimer: ctx.sender(),
        amount: claim_amount,
    });
}

// 翻转硬币函数，生成随机结果
public fun flip(r: &Random, ctx: &mut TxContext): u8 {
    // 创建随机数生成器
    let mut generator = random::new_generator(r, ctx);

    // 生成0或1的随机结果
    random::generate_u8_in_range(&mut generator, 0, 1)
}

// 验证用户猜测结果
public fun earn(guess: u8, result: u8): bool {
    // 验证猜测是有效的（0或1）
    assert!(guess == HEADS || guess == TAILS, EInvalidGuess);

    // 返回猜测是否正确
    guess == result
}

// 游戏主函数
public entry fun play(
    treasury: &mut GameTreasury,
    r: &Random,
    guess: u8,
    player_coin: &mut Coin<COINFLIPCONTRACT>, // 添加玩家的代币参数
    ctx: &mut TxContext,
) {
    // 验证猜测是有效的
    assert!(guess == HEADS || guess == TAILS, EInvalidGuess);
    // 验证下注金额大于0
    assert!(bet_amount > 0, EInvalidAmount);
    // 检查玩家余额
    assert!(coin::value(player_coin) >= bet_amount, EInsufficientBalance);

    let bet_coin = player_coin.split(bet_amount, ctx).into_balance();

    let result = flip(r, ctx);

    let won = earn(guess, result);

    if (won) {
        let reward_amount = bet_amount * 2;

        // 检查合约余额
        assert!(treasury.balance.value() >= reward_amount, EInsufficientBalance);

        // 将下注金额加入合约
        treasury.balance.join(bet_coin);

        // 从合约转出奖励
        let reward_coin = treasury.balance.split(reward_amount);
        let reward_new_coin = coin::from_balance(reward_coin, ctx);
        transfer::public_transfer(reward_new_coin, ctx.sender());
    } else {
        // 用户输了，下注金额归合约所有
        treasury.balance.join(bet_coin);
    };

    emit(FlipResult {
        player: ctx.sender(),
        guess,
        result,
        amount: bet_amount,
        won,
    });
}

#[test_only]
use sui::test_scenario as ts;

#[test]
fun test_init() {
    // 创建测试场景并设置测试账户
    let admin = @0xABCD; // 测试管理员地址
    let mut ts = ts::begin(@0xA);
    let ctx = ts.ctx();

    // 第一个交易：初始化合约
    {
        init(COINFLIPCONTRACT {}, ctx);
    };

    // 验证初始化结果
    ts.next_tx(admin);
    {};

    ts.end();
}

sui client call --package 0xe2f847c0eda9ee97ff50d5c95d75ca02772f9b1f570b6f185ef360803dcded1e \
    --module coinflipcontract \
    --function claim \
    --args \
        0xc149b3f9e32d13cdfadc5818d52613bbe3e8d5222e2a248d0c93a03796812fd4 \
        0x841e23d2dfa20e58bea45ee33e2e5de1d7a0514ac91b1496bdc52b3793f045d6 



sui client call --package 0xe2f847c0eda9ee97ff50d5c95d75ca02772f9b1f570b6f185ef360803dcded1e \
    --module coinflipcontract \
    --function play \
    --args \
        0xc149b3f9e32d13cdfadc5818d52613bbe3e8d5222e2a248d0c93a03796812fd4 \
        0x8 \
        1 \
        10 \
        0xe61280f521313eafdc8c09585516557a278393dbc5389dfa2ddb6d4bd4916499