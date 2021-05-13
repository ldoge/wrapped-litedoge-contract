const WLDOGE = artifacts.require("WLDOGE");
const BN = require("bn.js");

contract("WLDOGE", accounts => {
    const NOT_OWNER_ERROR_MSG = 'Returned error: VM Exception while processing transaction: revert Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.';
    const MINIMUM_NOT_MET_ERROR_MSG = 'Returned error: VM Exception while processing transaction: revert BEP20: bridge swap must be at least 10 Wrapped LiteDoges -- Reason given: BEP20: bridge swap must be at least 10 Wrapped LiteDoges.';
    const INSUFFICIENT_UNWRAP_BALANCE_ERROR_MSG = 'Returned error: VM Exception while processing transaction: revert BEP20: bridge swap amount exceeds balance -- Reason given: BEP20: bridge swap amount exceeds balance.';
    let wldoge;

    before('setup contract for test', async () => {
        wldoge = await WLDOGE.deployed();
    });

    it("should have first address as owner", async () => {
        const owner = await wldoge.getOwner.call();
        assert.equal(owner.valueOf(), accounts[0]);
    });

    it("should put 0 Wrapped LiteDoge in the first account", async () => {
        const balance = await wldoge.balanceOf.call(accounts[0]);
        assert.equal(balance.valueOf(), 0);
    });

    it("should bridge wrap coin to owner account using owner", async () => {
        const ownerAddress = accounts[0];

        const initialSupply = await wldoge.totalSupply.call();
        const bridgeWrapAmount = new BN(10000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const liteDogeTxID = '4f7dcc2de1b7051d42cbbe7a74f11e966457b9fa9effb949759a67bf1c20950f';
        const canBridgeWrap = await wldoge.bridgeWrap.call(liteDogeAddress, ownerAddress, bridgeWrapAmount, liteDogeTxID);
        assert.equal(canBridgeWrap.valueOf(), true);

        const initialBalance = await wldoge.balanceOf.call(ownerAddress);

        // Carry out actual bridgeWrap event
        await wldoge.bridgeWrap(liteDogeAddress, ownerAddress, bridgeWrapAmount, liteDogeTxID);

        // Check if total supply increase
        const newSupply = await wldoge.totalSupply.call();
        assert.equal(newSupply.toNumber(), initialSupply.toNumber() + bridgeWrapAmount.toNumber());

        // Check if HODLer has received it
        const balance = await wldoge.balanceOf.call(ownerAddress);
        assert.equal(balance.toNumber(), initialBalance.toNumber() + bridgeWrapAmount.toNumber());
    });

    it("should bridge wrap coin directly to other account using owner", async () => {
        const otherAddress = accounts[1];

        const initialSupply = await wldoge.totalSupply.call();
        const bridgeWrapAmount = new BN(10000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const liteDogeTxID = '4f7dcc2de1b7051d42cbbe7a74f11e966457b9fa9effb949759a67bf1c20950f';
        const canBridgeWrap = await wldoge.bridgeWrap.call(liteDogeAddress, otherAddress, bridgeWrapAmount, liteDogeTxID);
        assert.equal(canBridgeWrap.valueOf(), true);

        const initialBalance = await wldoge.balanceOf.call(otherAddress);

        // Carry out actual bridgeWrap event
        await wldoge.bridgeWrap(liteDogeAddress, otherAddress, bridgeWrapAmount, liteDogeTxID);

        // Check if total supply increase
        const newSupply = await wldoge.totalSupply.call();
        assert.equal(newSupply.toNumber(), initialSupply.toNumber() + bridgeWrapAmount.toNumber());

        // Check if HODLer has received it
        const balance = await wldoge.balanceOf.call(otherAddress);
        assert.equal(balance.toNumber(), initialBalance.toNumber() + bridgeWrapAmount.toNumber());
    });

    it("should not bridge wrap directly to other account using non-owner", async () => {
        const bridgeWrapAmount = new BN(10000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const liteDogeTxID = '4f7dcc2de1b7051d42cbbe7a74f11e966457b9fa9effb949759a67bf1c20950f';
        const otherAddress = accounts[1];

        // Get initial balances of other address
        let balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_starting_balance = balance.toNumber();

        (await wldoge.bridgeWrap(liteDogeAddress, otherAddress, bridgeWrapAmount, liteDogeTxID, {from: otherAddress})
            .catch((err) => {
                expect(err).to.have.property('message', NOT_OWNER_ERROR_MSG);
            }));

        balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance,
            "Amount was bridge wrapped using non-owner address"
        );
    });

    it("should send coin correctly", async () => {
        // Get initial balances of first and second account.
        const account_one = accounts[0];
        const account_two = accounts[1];

        const amount = 100;

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

    it("should bridge unwrap coin correctly using owner", async () => {
        const bridgeUnwrapAmount = new BN(1000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const ownerAddress = accounts[0];

        // Get initial balances of owner account.
        let balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_starting_balance = balance.toNumber();

        await wldoge.bridgeUnwrap(liteDogeAddress, bridgeUnwrapAmount.toNumber());

        balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance - bridgeUnwrapAmount,
            "Amount wasn't correctly bridge unwrapped from the owner"
        );
    });

    it("should bridge unwrap coin correctly using non-owner", async () => {
        const bridgeUnwrapAmount = new BN(1000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const otherAddress = accounts[1];

        // Get initial balances of other account.
        let balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_starting_balance = balance.toNumber();

        await wldoge.bridgeUnwrap(liteDogeAddress, bridgeUnwrapAmount.toNumber(), {from: otherAddress});

        balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance - bridgeUnwrapAmount,
            "Amount wasn't correctly bridge unwrapped from the non-owner"
        );
    });

    it("should not bridge unwrap coin with lesser than 10 LiteDoges using non-owner", async () => {
        const bridgeUnwrapAmount = new BN(100000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const otherAddress = accounts[1];

        // Get initial balances of other account.
        let balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_starting_balance = balance.toNumber();

        (await wldoge.bridgeUnwrap(liteDogeAddress, bridgeUnwrapAmount.toNumber(), {from: otherAddress})
            .catch((err) => {
                expect(err).to.have.property('message', MINIMUM_NOT_MET_ERROR_MSG);
            }));

        balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance,
            "Amount was bridge unwrapped using an amount below 10 LiteDoges"
        );
    });

    it("should not bridge unwrap coin with insufficient balance of LiteDoges using non-owner", async () => {
        const bridgeUnwrapAmount = new BN(1000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const otherAddress = accounts[3];

        // Get initial balances of other account.
        let balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_starting_balance = balance.toNumber();

        (await wldoge.bridgeUnwrap(liteDogeAddress, bridgeUnwrapAmount.toNumber(), {from: otherAddress})
            .catch((err) => {
                expect(err).to.have.property('message', INSUFFICIENT_UNWRAP_BALANCE_ERROR_MSG);
            }));

        balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance,
            "Amount was bridge unwrapped using insufficient balance of LiteDoges"
        );
    });
});
