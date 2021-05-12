const WLDOGE = artifacts.require("WLDOGE");
const BN = require("bn.js");

contract("WLDOGE", accounts => {
    const NOT_OWNER_ERROR_MSG = 'Returned error: VM Exception while processing transaction: revert Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.';
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

    it("should mint Wrapped LiteDoge in the first account", async () => {
        const initialSupply = await wldoge.totalSupply.call();
        const mintAmount = new BN(1000000);
        const canMint = await wldoge.mint.call(mintAmount);
        assert.equal(canMint.valueOf(), true);

        // Carry out actual mint event
        await wldoge.mint(mintAmount);

        // Check if total supply increase
        const newSupply = await wldoge.totalSupply.call();
        assert.equal(newSupply.toNumber(), initialSupply.toNumber() + mintAmount.toNumber());

        // Check if first account HODLer has received it
        const balance = await wldoge.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), mintAmount.toNumber());
    });

    it("should not mint coin using non-owner", async () => {
        const mintAmount = new BN(1000000);
        const ownerAddress = accounts[0];
        const otherAddress = accounts[1];

        // Get initial balances of owner address
        let balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_starting_balance = balance.toNumber();

        (await wldoge.mint(mintAmount, {from: otherAddress})
            .catch((err) => {
                expect(err).to.have.property('message', NOT_OWNER_ERROR_MSG);
            }));

        balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance,
            "Amount was minted using non-owner address"
        );
    });

    it("should mint coin directly to other account", async () => {
        const otherAddress = accounts[1];

        const initialSupply = await wldoge.totalSupply.call();
        const mintAmount = new BN(1000000);
        const canMint = await wldoge.mintToAddress.call(otherAddress, mintAmount);
        assert.equal(canMint.valueOf(), true);

        // Carry out actual mint event
        await wldoge.mintToAddress(otherAddress, mintAmount);

        // Check if total supply increase
        const newSupply = await wldoge.totalSupply.call();
        assert.equal(newSupply.toNumber(), initialSupply.toNumber() + mintAmount.toNumber());

        // Check if HODLer has received it
        const balance = await wldoge.balanceOf.call(otherAddress);
        assert.equal(balance.toNumber(), mintAmount.toNumber());
    });

    it("should not mint coin directly to other account using non-owner", async () => {
        const mintAmount = new BN(1000000);
        const otherAddress = accounts[1];

        // Get initial balances of other address
        let balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_starting_balance = balance.toNumber();

        (await wldoge.mintToAddress(otherAddress, mintAmount, {from: otherAddress})
            .catch((err) => {
                expect(err).to.have.property('message', NOT_OWNER_ERROR_MSG);
            }));

        balance = await wldoge.balanceOf.call(otherAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance,
            "Amount was minted using non-owner address"
        );
    });

    it("should send coin correctly", async () => {
        // Get initial balances of first and second account.
        const account_one = accounts[0];
        const account_two = accounts[1];

        const amount = 100;

        // give first account the money first
        await wldoge.mintToAddress(account_one, amount);

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

    it("should burn coin correctly using owner to burn self", async () => {
        const burnAmt = 100;
        const ownerAddress = accounts[0];

        // give owner the money first
        await wldoge.mintToAddress(ownerAddress, burnAmt);

        // Get initial balances of owner account.
        let balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_starting_balance = balance.toNumber();

        await wldoge.burn(ownerAddress, burnAmt);

        balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance - burnAmt,
            "Amount wasn't correctly burnt from the owner"
        );
    });

    it("should burn coin correctly using owner to burn others", async () => {
        const burnAmt = 100;
        const addressToBurn = accounts[1];

        // give address the money first
        await wldoge.mintToAddress(addressToBurn, burnAmt);

        // Get initial balances of addressToBurn account.
        let balance = await wldoge.balanceOf.call(addressToBurn);
        const account_one_starting_balance = balance.toNumber();

        await wldoge.burn(addressToBurn, burnAmt);

        balance = await wldoge.balanceOf.call(addressToBurn);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance - burnAmt,
            "Amount wasn't correctly burnt from the target address"
        );
    });

    it("should not burn coin using non-owner to burn others", async () => {
        const burnAmt = 100;
        const ownerAddress = accounts[0];
        const otherAddress = accounts[1];

        // give owner the money first
        await wldoge.mintToAddress(ownerAddress, burnAmt);

        // Get initial balances of addressToBurn account.
        let balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_starting_balance = balance.toNumber();

        (await wldoge.burn(ownerAddress, burnAmt, {from: otherAddress})
            .catch((err) => {
                expect(err).to.have.property('message', NOT_OWNER_ERROR_MSG);
            }));

        balance = await wldoge.balanceOf.call(ownerAddress);
        const account_one_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance,
            "Amount was burnt from the target address using non-owner address"
        );
    });

    it("should bridge wrap coin directly to other account", async () => {
        const otherAddress = accounts[1];

        const initialSupply = await wldoge.totalSupply.call();
        const bridgeWrapAmount = new BN(1000000);
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
        const bridgeWrapAmount = new BN(1000000);
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

    it("should bridge unwrap coin correctly using owner", async () => {
        const bridgeUnwrapAmount = new BN(1000000000);
        const liteDogeAddress = 'dcdGuzwAjRH8DwpvyzKyLPdvuArfzXcxtN';
        const ownerAddress = accounts[0];

        // give owner the money first
        await wldoge.mintToAddress(ownerAddress, bridgeUnwrapAmount);

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

        // give sender the money first
        await wldoge.mintToAddress(otherAddress, bridgeUnwrapAmount);

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
});
