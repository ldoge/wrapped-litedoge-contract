const WLDOGE = artifacts.require("WLDOGE");

contract("WLDOGE", accounts => {
    it("should put 0 Wrapped LiteDoge in the first account", () =>
        WLDOGE.deployed()
            .then(instance => instance.getBalance.call(accounts[0]))
            .then(balance => {
                assert.equal(
                    balance.valueOf(),
                    0,
                    "0 wasn't in the first account"
                );
            }));

    it("should call a function that depends on a linked library", () => {
        let wldoge;
        let wldogeBalance;
        let wldogeBnbBalance;

        return WLDOGE.deployed()
            .then(instance => {
                wldoge = instance;
                return wldoge.getBalance.call(accounts[0]);
            })
            .then(outCoinBalance => {
                wldogeBalance = outCoinBalance.toNumber();
                return wldoge.getBalanceInEth.call(accounts[0]);
            })
            .then(outCoinBalanceEth => {
                wldogeBnbBalance = outCoinBalanceEth.toNumber();
            })
            .then(() => {
                assert.equal(
                    wldogeBnbBalance,
                    2 * wldogeBalance,
                    "Library function returned unexpected function, linkage may be broken"
                );
            });
    });

    it("should send coin correctly", () => {
        let wldoge;

        // Get initial balances of first and second account.
        const account_one = accounts[0];
        const account_two = accounts[1];

        let account_one_starting_balance;
        let account_two_starting_balance;
        let account_one_ending_balance;
        let account_two_ending_balance;

        const amount = 10;

        return WLDOGE.deployed()
            .then(instance => {
                wldoge = instance;
                return wldoge.getBalance.call(account_one);
            })
            .then(balance => {
                account_one_starting_balance = balance.toNumber();
                return wldoge.getBalance.call(account_two);
            })
            .then(balance => {
                account_two_starting_balance = balance.toNumber();
                return wldoge.sendCoin(account_two, amount, { from: account_one });
            })
            .then(() => wldoge.getBalance.call(account_one))
            .then(balance => {
                account_one_ending_balance = balance.toNumber();
                return wldoge.getBalance.call(account_two);
            })
            .then(balance => {
                account_two_ending_balance = balance.toNumber();

                assert.equal(
                    account_one_ending_balance,
                    account_one_starting_balance - amount,
                    "Amount wasn't correctly taken from the sender"
                );
                assert.equal(
                    account_two_ending_balance,
                    account_two_starting_balance + amount,
                    "Amount wasn't correctly sent to the receiver"
                );
            });
    });
});
