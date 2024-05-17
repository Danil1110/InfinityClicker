document.addEventListener('DOMContentLoaded', async function () {
    let walletConnected = false;
    let telegram_id = null;

    const tg = window.Telegram.WebApp;

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegram_id = tg.initDataUnsafe.user.id;
    }

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://danil1110.github.io/InfinityClicker/tonconnect-manifest.json',
        buttonRootId: 'connect-button-root'
    });

    async function getAddressWallet() {
        let _address = '';
        if (tonConnectUI) {
            let res = await tonConnectUI.connectionRestored;
            if (res || tonConnectUI?.account?.address) {
                if (tonConnectUI?.account?.address) {
                    _address = TON_CONNECT_UI.toUserFriendlyAddress(tonConnectUI.account.address);
                    console.log(_address);
                    walletConnected = true;
                    closeWalletModal();
                    initializeGameForWallet(_address);
                    connectWallet(telegram_id, _address);
                }
            }
        }
        return _address;
    }

    getAddressWallet().then(address => {
        if (address)
            document.getElementById('wallet-info').innerHTML = `Connected wallet: ${address}`;
        else
            tonConnectUI.openModal();
    });

    tonConnectUI.uiOptions = {
        uiPreferences: {
            colorsSet: {
                [TON_CONNECT_UI.THEME.DARK]: {
                    connectButton: {
                        background: 'purple'
                    }
                }
            }
        }
    };

    let score = 0;
    let charge = 1000;
    let clickUpgradeLevel = 1;
    let clickUpgradeCost = 100;
    let clickUpgrade = 1;
    let chargeSpeedLevel = 1;
    let chargeSpeedCost = 750;
    let chargeCapacityLevel = 1;
    let chargeCapacityCost = 500;
    let chargeSpeed = 2000;
    let chargeCapacity = 1000;
    let chargeIncrement = 7;

    async function initializeGameForWallet(walletAddress) {
        const walletData = await fetchWalletData(telegram_id);
        if (walletData) {
            score = walletData.score;
            charge = walletData.charge;
            clickUpgradeLevel = walletData.click_upgrade_level;
            clickUpgradeCost = walletData.click_upgrade_cost;
            clickUpgrade = walletData.click_upgrade;
            chargeSpeedLevel = walletData.charge_speed_level;
            chargeSpeedCost = walletData.charge_speed_cost;
            chargeCapacityLevel = walletData.charge_capacity_level;
            chargeCapacityCost = walletData.charge_capacity_cost;
            chargeSpeed = walletData.charge_speed;
            chargeCapacity = walletData.charge_capacity;
            chargeIncrement = walletData.charge_increment;
        }
        updateGame();
    }

    const scoreDisplay = document.getElementById('score');
    const progressBar = document.getElementById('progress-value');
    const chargeLabel = document.getElementById('charge-label');
    const coinWrapper = document.getElementById('coin');

    coinWrapper.addEventListener('click', async function () {
        await checkWalletConnection();
        if (!walletConnected) {
            showWalletModal();
            return;
        }
        let costPerClick = clickUpgrade;
        if (charge >= costPerClick) {
            score += clickUpgrade;
            charge -= costPerClick;
            updateGame();
            await updateWalletData(telegram_id);
        }
    });

    async function checkWalletConnection() {
        let address = await getAddressWallet();
        if (!address) {
            walletConnected = false;
            showWalletModal();
            disconnectWallet(telegram_id);
        } else {
            walletConnected = true;
            closeWalletModal();
        }
    }

    function updateGame() {
        scoreDisplay.textContent = `${score}`;
        chargeLabel.textContent = `⚡️ ${charge}/${chargeCapacity}`;
        document.getElementById('clickUpgradeCost').textContent = clickUpgradeCost;
        document.getElementById('clickUpgradeLevel').textContent = clickUpgradeLevel;
        document.getElementById('chargeSpeedCost').textContent = chargeSpeedCost;
        document.getElementById('chargeSpeedLevel').textContent = chargeSpeedLevel;
        document.getElementById('chargeCapacityCost').textContent = chargeCapacityCost;
        document.getElementById('chargeCapacityLevel').textContent = chargeCapacityLevel;

        updateProgressBar();
    }

    function updateProgressBar() {
        const progressPercentage = Math.min((charge / chargeCapacity) * 100, 100);
        progressBar.style.width = `${progressPercentage}%`;
        document.getElementById('progress-container').style.display = 'block';
    }

    async function updateWalletData(telegram_id) {
        try {
            let response = await fetch('https://danil1110.github.io/InfinityClicker/update_wallet_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegram_id,
                    score,
                    charge,
                    click_upgrade_level: clickUpgradeLevel,
                    click_upgrade_cost: clickUpgradeCost,
                    click_upgrade: clickUpgrade,
                    charge_speed_level: chargeSpeedLevel,
                    charge_speed_cost: chargeSpeedCost,
                    charge_capacity_level: chargeCapacityLevel,
                    charge_capacity_cost: chargeCapacityCost,
                    charge_speed: chargeSpeed,
                    charge_capacity: chargeCapacity,
                    charge_increment: chargeIncrement
                })
            });
            let data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function fetchWalletData(telegram_id) {
        try {
            let response = await fetch('https://danil1110.github.io/InfinityClicker/get_wallet_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegram_id })
            });
            let data = await response.json();
            return data.status === 'success' ? data : null;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    async function connectWallet(telegram_id, address) {
        try {
            let response = await fetch('https://danil1110.github.io/InfinityClicker/connect_wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegram_id, address })
            });
            let data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function disconnectWallet(telegram_id) {
        try {
            let response = await fetch('https://danil1110.github.io/InfinityClicker/disconnect_wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegram_id })
            });
            let data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    window.resetGame = function () {
        localStorage.clear();
        window.location.reload();
    }

    window.openShop = async function () {
        await checkWalletConnection();
        if (!walletConnected) {
            showWalletModal();
            return;
        }
        document.getElementById('shop-modal').style.display = 'block';
    }

    window.closeShop = function () {
        document.getElementById('shop-modal').style.display = 'none';
    }

    function showWalletModal() {
        document.getElementById('wallet-modal').classList.remove('hidden');
        document.getElementById('wallet-modal').style.display = 'block';
    }

    function closeWalletModal() {
        document.getElementById('wallet-modal').classList.add('hidden');
        document.getElementById('wallet-modal').style.display = 'none';
    }

    document.querySelector('.close-button').addEventListener('click', closeWalletModal);

    initializeGameForWallet();
});
