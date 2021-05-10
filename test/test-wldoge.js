const WLDOGE = artifacts.require("WLDOGE");

contract("WLDOGE", accounts => {
    it("should put 0 Wrapped LiteDoge in the first account", async () => {
        const instance = await WLDOGE.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.valueOf(), 0);
    });

    it("should mint Wrapped LiteDoge in the first account", async () => {
        const wldoge = await WLDOGE.deployed();
        const mintAmount = 1000000;
        const minted = await wldoge.mint.call(mintAmount);
        assert.equal(minted.valueOf(), true);

        const newBalance = await wldoge.balanceOf.call(accounts[0]);
        assert.equal(newBalance.valueOf(), mintAmount);
    });

    it("should call a function that depends on a linked library", async () => {
        const wldoge = await WLDOGE.deployed();
        const outCoinBalance = await wldoge.balanceOf.call(accounts[0]);
        const wldogeCoinBalance = outCoinBalance.toNumber();
        const outCoinBalanceEth = await wldoge.getBalanceInEth.call(accounts[0]);
        const wldogeCoinEthBalance = outCoinBalanceEth.toNumber();
        assert.equal(wldogeCoinEthBalance, 2 * wldogeCoinBalance);
    });

    it("should send coin correctly", async () => {
        // Get initial balances of first and second account.
        const account_one = accounts[0];
        const account_two = accounts[1];

        const amount = 10;

        const wldoge = await WLDOGE.deployed();

        let balance = await wldoge.balanceOf.call(account_one);
        const account_one_starting_balance = balance.toNumber();

        balance = await wldoge.balanceOf.call(account_two);
        const account_two_starting_balance = balance.toNumber();
        await wldoge.transfer(account_two, amount, { from: account_one });

        balance = await wldoge.balanceOf.call(account_one);
        const account_one_ending_balance = balance.toNumber();

        balance = await wldoge.balanceOf.call(account_two);
        const account_two_ending_balance = balance.toNumber();

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
