const WLDOGE = artifacts.require("WLDOGE");
const BN = require("bn.js");

contract("WLDOGE", accounts => {
    const NOT_OWNER_ERROR_MSG = 'Returned error: VM Exception while processing transaction: revert Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.';

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

    it("should not mint coin using non-owner", async () => {
        const mintAmount = new BN(1000000);
        const ownerAddress = accounts[0];
        const otherAddress = accounts[1];

        const wldoge = await WLDOGE.deployed();

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

        const wldoge = await WLDOGE.deployed();
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

        const wldoge = await WLDOGE.deployed();

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

    it("should burn coin correctly using owner to burn self", async () => {
        const burnAmt = 100;
        const ownerAddress = accounts[0];

        const wldoge = await WLDOGE.deployed();

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

        const wldoge = await WLDOGE.deployed();

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

        const wldoge = await WLDOGE.deployed();

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
});
