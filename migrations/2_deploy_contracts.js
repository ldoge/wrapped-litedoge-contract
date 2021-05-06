const WLDOGE = artifacts.require("./WLDOGE");

module.exports = function(deployer) {
    deployer.deploy(WLDOGE);
};
