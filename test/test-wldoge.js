const WLDOGE = artifacts.require("WLDOGE");
const BN = require('bn.js');

contract("WLDOGE", accounts => {
    it("should have first address as owner", async () => {
        const instance = await WLDOGE.deployed();
        const owner = await instance.getOwner.call();
        assert.equal(owner.valueOf(), accounts[0]);
    });

    it("should put 0 Wrapped LiteDoge in the first account", async () => {
        const instance = await WLDOGE.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.valueOf(), 0);
    });

    it("should mint Wrapped LiteDoge in the first account", async () => {
        const wldoge = await WLDOGE.deployed();
        const initialSupply = await wldoge.totalSupply.call();
        assert.equal(initialSupply.valueOf().toJSON(), (new BN(0)).toJSON());
        const mintAmount = new BN(1000000);
        const canMint = await wldoge.mint.call(mintAmount);
        assert.equal(canMint.valueOf(), true);

        // Carry out actual mint event
        await wldoge.mint(mintAmount);

        // Check if total supply increase
        const newSupply = await wldoge.totalSupply.call();
        assert.equal(newSupply.valueOf().toJSON(), mintAmount.toJSON());

        // Check if first account HODLer has received it
        const balance = await wldoge.balanceOf.call(accounts[0]);
        assert.equal(balance.valueOf().toJSON(), mintAmount.toJSON());
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
        await wldoge.transfer(account_two, amount, {from: account_one});

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
