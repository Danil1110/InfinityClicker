
document.addEventListener('DOMContentLoaded', async function () {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const telegram_id = new URLSearchParams(window.location.search).get('user_id');
    let walletAddress = '';

    async function updateWalletAddress(address) {
        await fetch('https://danil1110.github.io/InfinityClicker/update_wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id, address })
        });
    }

    async function getUserData() {
        const response = await fetch(`https://danil1110.github.io/InfinityClicker/get_user_data?telegram_id=${telegram_id}`);
        const data = await response.json();
        if (data) {
            walletAddress = data.address;
            // Load other game data and initialize game state
        } else {
            console.error('User not found');
        }
    }

    await getUserData();

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
                    closeWalletModal(); // Закрытие окна при успешном подключении
                    initializeGameForWallet(_address);
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

    let score = parseInt(localStorage.getItem('score') || '0'); // Загружаем состояние из localStorage
    let charge = parseInt(localStorage.getItem('charge') || '1000');
    let clickUpgradeLevel = parseInt(localStorage.getItem('clickUpgradeLevel') || '1');
    let clickUpgradeCost = parseInt(localStorage.getItem('clickUpgradeCost') || '100');
    let clickUpgrade = parseInt(localStorage.getItem('clickUpgrade') || '1');
    let chargeSpeedLevel = parseInt(localStorage.getItem('chargeSpeedLevel') || '1');
    let chargeSpeedCost = parseInt(localStorage.getItem('chargeSpeedCost') || '750');
    let chargeCapacityLevel = parseInt(localStorage.getItem('chargeCapacityLevel') || '1');
    let chargeCapacityCost = parseInt(localStorage.getItem('chargeCapacityCost') || '500');
    let chargeSpeed = parseInt(localStorage.getItem('chargeSpeed') || '2000');
    let chargeCapacity = parseInt(localStorage.getItem('chargeCapacity') || '1000');
    let chargeIncrement = parseInt(localStorage.getItem('chargeIncrement') || '7');

    function initializeGameForWallet(walletAddress) {
        // Инициализация игры для данного кошелька
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
        }
    });

    async function checkWalletConnection() {
        let address = await getAddressWallet();
        if (!address) {
            walletConnected = false;
            showWalletModal();
        } else {
            walletConnected = true;
            closeWalletModal();
        }
    }

    function updateGame() {
        // Обновляем игру и сохраняем текущее состояние
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

    setInterval(function () {
        if (walletConnected && charge < chargeCapacity) {
            charge += chargeIncrement;
            if (charge > chargeCapacity) charge = chargeCapacity;
            updateGame();
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
        const costContainerId = buttonId.replace('buy', '') + 'CostContainer'; // Получаем ID контейнера стоимости
        const costContainer = document.getElementById(costContainerId);

        if (level >= 10) {
            button.innerHTML = 'Max';
            button.style.background = 'linear-gradient(to right, yellow, orange)';
            button.disabled = true;
            if (costContainer) costContainer.classList.add('hidden'); // Скрываем контейнер цены
        } else {
            button.innerHTML = 'Buy';
            button.style.background = '';
            button.disabled = false;
            if (costContainer) costContainer.classList.remove('hidden'); // Показываем контейнер цены
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
            clickUpgrade++; // Увеличиваем количество увеличения клика
            clickUpgradeCost *= 2;
            updateGame();
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
            chargeIncrement += 5; // Увеличиваем скорость зарядки
            chargeSpeedCost *= 2;
            updateGame();
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
            chargeCapacity += 250; // Увеличиваем емкость зарядки
            chargeCapacityCost *= 2;
            updateGame();
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

    updateGame();
});
