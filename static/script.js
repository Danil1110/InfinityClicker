document.addEventListener('DOMContentLoaded', async function () {
    let walletConnected = false;
    let telegram_id = null;
    let address = '';

    // Проверка на запуск через Telegram Web App
    if (window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        telegram_id = tg.initDataUnsafe.user.id;
    } else {
        alert("This app must be opened via Telegram Web App.");
        return;
    }

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://danil1110.github.io/InfinityClicker/tonconnect-manifest.json',
        buttonRootId: 'connect-button-root'
    });

    async function getAddressWallet() {
        if (tonConnectUI) {
            let res = await tonConnectUI.connectionRestored;
            if (res || tonConnectUI?.account?.address) {
                if (tonConnectUI?.account?.address) {
                    address = TON_CONNECT_UI.toUserFriendlyAddress(tonConnectUI.account.address);
                    console.log(address);
                    walletConnected = true;
                    closeWalletModal();
                    initializeGameForWallet(address);
                    connectWallet(telegram_id, address);
                }
            }
        }
        return address;
    }

    async function initializeGameForWallet(walletAddress) {
        let walletData = await fetch('/get_wallet_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id: telegram_id })
        });
        walletData = await walletData.json();
        if (walletData.status !== 'error') {
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
            updateGame();
        }
    }

    async function updateWalletData() {
        await fetch('/update_wallet_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: address,
                telegram_id: telegram_id,
                score: score,
                charge: charge,
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
    }

    getAddressWallet().then(addr => {
        if (addr)
            document.getElementById('wallet-info').innerHTML = `Connected wallet: ${addr}`;
        else
            tonConnectUI.openModal();
    });

    tonConnectUI.uiOptions = {
        uiPreferences: {
            colorsSet: {
                [TON_CONNECT_UI.THEME.DARK]: {
                    connectButton: {
                        background: 'violet'
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
            await updateWalletData();
        }
    });

    async function checkWalletConnection() {
        let addr = await getAddressWallet();
        if (!addr) {
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
        saveGame();
    }

    function updateProgressBar() {
        const progressPercentage = Math.min((charge / chargeCapacity) * 100, 100);
        progressBar.style.width = `${progressPercentage}%`;
        document.getElementById('progress-container').style.display = 'block';
    }

    function saveGame() {
        localStorage.setItem('score', score.toString());
        localStorage.setItem('charge', charge.toString());
        localStorage.setItem('clickUpgradeLevel', clickUpgradeLevel.toString());
        localStorage.setItem('clickUpgradeCost', clickUpgradeCost.toString());
        localStorage.setItem('clickUpgrade', clickUpgrade.toString());
        localStorage.setItem('chargeSpeedLevel', chargeSpeedLevel.toString());
        localStorage.setItem('chargeSpeedCost', chargeSpeedCost.toString());
        localStorage.setItem('chargeCapacityLevel', chargeCapacityLevel.toString());
        localStorage.setItem('chargeCapacityCost', chargeCapacityCost.toString());
        localStorage.setItem('chargeSpeed', chargeSpeed.toString());
        localStorage.setItem('chargeCapacity', chargeCapacity.toString());
        localStorage.setItem('chargeIncrement', chargeIncrement.toString());
    }

    setInterval(async function () {
        if (walletConnected && charge < chargeCapacity) {
            charge += chargeIncrement;
            if (charge > chargeCapacity) charge = chargeCapacity;
            updateGame();
            await updateWalletData();
        }
    }, chargeSpeed);

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

    function checkMaxLevel(buttonId, level) {
        const button = document.getElementById(buttonId);
        const costContainerId = buttonId.replace('buy', '') + 'CostContainer';
        const costContainer = document.getElementById(costContainerId);

        if (level >= 10) {
            button.innerHTML = 'Max';
            button.style.background = 'linear-gradient(to right, yellow, orange)';
            button.disabled = true;
            if (costContainer) costContainer.classList.add('hidden');
        } else {
            button.innerHTML = 'Buy';
            button.style.background = '';
            button.disabled = false;
            if (costContainer) costContainer.classList.remove('hidden');
        }
    }

    window.buyClickUpgrade = async function () {
        await checkWalletConnection();
        if (!walletConnected) {
            showWalletModal();
            return;
        }
        if (score >= clickUpgradeCost && clickUpgradeLevel < 10) {
            score -= clickUpgradeCost;
            clickUpgradeLevel++;
            clickUpgrade++;
            clickUpgradeCost *= 2;
            updateGame();
            await updateWalletData();
        }
    }

    window.buyChargeSpeedUpgrade = async function () {
        await checkWalletConnection();
        if (!walletConnected) {
            showWalletModal();
            return;
        }
        if (score >= chargeSpeedCost && chargeSpeedLevel < 10) {
            score -= chargeSpeedCost;
            chargeSpeedLevel++;
            chargeIncrement += 5;
            chargeSpeedCost *= 2;
            updateGame();
            await updateWalletData();
        }
    }

    window.buyChargeCapacityUpgrade = async function () {
        await checkWalletConnection();
        if (!walletConnected) {
            showWalletModal();
            return;
        }
        if (score >= chargeCapacityCost && chargeCapacityLevel < 10) {
            score -= chargeCapacityCost;
            chargeCapacityLevel++;
            chargeCapacity += 250;
            chargeCapacityCost *= 2;
            updateGame();
            await updateWalletData();
        }
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

    async function connectWallet(telegram_id, address) {
        try {
            let response = await fetch('/connect_wallet', {
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
            let response = await fetch('/disconnect_wallet', {
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
});
