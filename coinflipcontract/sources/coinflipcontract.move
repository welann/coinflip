module coinflipcontract::coinflipcontract;

use std::option;
use std::string::{Self, String};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event::emit;
use sui::object::{Self, UID};
use sui::package;
use sui::random::{Self, Random, RandomGenerator};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
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
struct COINFLIPCONTRACT has drop {}

// 代币元数据
struct CoinFlipToken has key, store {
    id: UID,
    name: String,
    symbol: String,
    description: String,
    icon_url: Url,
    decimals: u8,
}

// 记录已经领取代币的地址
struct ClaimedAddresses has key {
    id: UID,
    addresses: vector<address>,
}

// 游戏结果事件
struct FlipResult has copy, drop {
    player: address,
    guess: u8,
    result: u8,
    amount: u64,
    won: bool,
}

// 领取代币事件
struct TokenClaimed has copy, drop {
    claimer: address,
    amount: u64,
}

// 代币铸造事件
struct TokenMinted has copy, drop {
    total_supply: u64,
    admin_amount: u64,
    contract_amount: u64,
}

// 初始化函数，在部署合约时调用
fun init(witness: COINFLIPCONTRACT, ctx: &mut TxContext) {
    // 创建代币
    let (treasury_cap, metadata) = coin::create_currency(
        witness,
        9, // 小数位数
        b"FLIP", // 符号
        b"CoinFlip Token", // 名称
        b"A token for the CoinFlip game on Sui", // 描述
        option::some(url::new_unsafe_from_bytes(b"https://example.com/flip-icon.png")), // 图标URL
        ctx,
    );

    // 铸造固定总量的代币
    let total_supply = 1_000_000_000_000_000; // 1,000,000 FLIP (考虑到9位小数)
    let admin_amount = total_supply / 2;
    let contract_amount = total_supply - admin_amount;

    // 给管理员一半的代币
    let admin_coins = coin::mint(&mut treasury_cap, admin_amount, ctx);
    transfer::public_transfer(admin_coins, tx_context::sender(ctx));

    // 保存合约中的一半代币
    let contract_coins = coin::mint(&mut treasury_cap, contract_amount, ctx);
    transfer::public_share_object(contract_coins);

    // 创建已领取地址表
    let claimed_addresses = ClaimedAddresses {
        id: object::new(ctx),
        addresses: table::new(ctx),
    };

    // 发送事件
    emit(TokenMinted {
        total_supply,
        admin_amount,
        contract_amount,
    });

    // 转移所有权
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    transfer::public_share_object(metadata);
    transfer::public_share_object(claimed_addresses);
}

// 领取免费代币
public entry fun claim(
    coin: &mut Coin<CoinFlipToken>,
    claimed_addresses: &mut ClaimedAddresses,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 检查是否已经领取过
    assert!(!table::contains(&claimed_addresses.addresses, sender), EAlreadyClaimed);

    // 标记为已领取
    table::add(&mut claimed_addresses.addresses, sender, true);

    // 领取金额
    let claim_amount = 10_000_000_000; // 10 FLIP (考虑到9位小数)

    // 检查合约余额
    assert!(coin::value(coin) >= claim_amount, EInsufficientBalance);

    // 转移代币给用户
    let user_coin = coin::split(coin, claim_amount, ctx);
    transfer::public_transfer(user_coin, sender);

    // 发送事件
    emit(TokenClaimed {
        claimer: sender,
        amount: claim_amount,
    });
}

// 翻转硬币函数，生成随机结果
public fun flip(r: &Random, ctx: &mut TxContext): u8 {
    // 创建随机数生成器
    let mut generator = random::new_generator(r, ctx);

    // 生成0或1的随机结果
    random::generate_u8_in_range(&mut generator, 0, 2)
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
    r: &Random,
    coin: &mut Coin<CoinFlipToken>,
    guess: u8,
    bet_amount: u64,
    ctx: &mut TxContext,
) {
    // 验证猜测是有效的
    assert!(guess == HEADS || guess == TAILS, EInvalidGuess);

    // 验证下注金额大于0
    assert!(bet_amount > 0, EInvalidAmount);

    // 获取用户地址
    let player = tx_context::sender(ctx);

    // 从用户钱包中分割出下注金额
    let bet_coin = coin::take(coin::balance_mut(coin), bet_amount, ctx);

    // 生成随机结果
    let result = flip(r, ctx);

    // 检查用户是否获胜
    let won = earn(guess, result);

    if (won) {
        // 用户赢了，返回双倍下注金额
        let reward_amount = bet_amount * 2;

        // 检查合约余额
        assert!(coin::value(coin) >= reward_amount, EInsufficientBalance);

        // 转移奖励给用户
        let reward_coin = coin::split(coin, reward_amount, ctx);
        transfer::public_transfer(reward_coin, player);
    } else {
        // 用户输了，下注金额归合约所有
        coin::join(coin, bet_coin);
    };
    emit(FlipResult {
        player,
        guess,
        result,
        amount: bet_amount,
        won,
    });
}
