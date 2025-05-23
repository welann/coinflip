// #[test_only] // 这个标注表明这个模块只在测试时使用
// module coinflipcontract::coinflipcontract_tests;

// use coinflipcontract::coinflipcontract::{Self, COINFLIPCONTRACT};
// use sui::test_scenario;

// #[test]
// fun test_init() {
//     // 创建测试场景并设置测试账户
//     let admin = @0xABCD; // 测试管理员地址
//     let scenario = test_scenario::begin(admin);

//     // 第一个交易：初始化合约
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         coinflipcontract::init(COINFLIPCONTRACT {}, ctx);
//     };

//     // 验证初始化结果
//     test_scenario::next_tx(&mut scenario, admin);
//     {};

//     test_scenario::end(scenario);
// }
