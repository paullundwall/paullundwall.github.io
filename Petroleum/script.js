// Game State
let gameState = {
    currentTurn: 1,
    maxTurns: 10,
    currentPhase: 'Purchase',
    phases: ['Purchase', 'Drilling', 'Production', 'Trade', 'Negotiation'],
    currentPhaseIndex: 0,
    gameStarted: false,
    gameEnded: false,
    selectedTerritory: null,
    selectedConsumer: null,
    collusionActive: false,
    collusionSuccess: false,
    playerChoice: null, // 'collude', 'compete', or null
    rivalChoice: null,
    startYear: 1955,
    territoriesPurchasedThisTurn: 0,
    negotiationUsedThisTurn: false,
    isRivalTurn: false,
    negotiations: {
        active: false,
        offer: null,
        response: null
    },
    // Data tracking for end-game overview
    history: {
        playerMoney: [10000], // Starting money
        rivalMoney: [10000],
        playerOil: [0],
        rivalOil: [0],
        negotiations: [], // {turn, playerChoice, rivalChoice, outcome}
        consumerPrices: [], // {turn, consumer, basePrice, playerPrice, rivalPrice}
        playerAveragePrices: [], // {turn, averagePrice}
        rivalAveragePrices: [] // {turn, averagePrice}
    }
};

// Player Data
let player = {
    name: "Petroleum & Sons",
    money: 10000,
    oil: 0,
    drillingSites: 0,
    territories: [],
    contracts: []
};

// Rival AI Data
let rival = {
    name: "Standard Oil Corp",
    money: 10000,
    oil: 0,
    drillingSites: 0,
    territories: [],
    contracts: [],
    strategy: 'competitive' // 'competitive', 'cooperative', 'aggressive'
};

// Territories Data (will be randomized on game start)
let territories = [
    {
        id: 1,
        name: "Saudi Arabia",
        cost: 4000,
        oilReserves: 1000,
        productionRate: 80,
        upgradeLevel: 0,
        owner: null,
        drilled: false,
        exhausted: false
    },
    {
        id: 2,
        name: "Kuwait",
        cost: 3500,
        oilReserves: 700,
        productionRate: 70,
        upgradeLevel: 0,
        owner: null,
        drilled: false,
        exhausted: false
    },
    {
        id: 3,
        name: "Iran",
        cost: 5000,
        oilReserves: 900,
        productionRate: 60,
        upgradeLevel: 0,
        owner: null,
        drilled: false,
        exhausted: false
    },
    {
        id: 4,
        name: "Iraq",
        cost: 3000,
        oilReserves: 600,
        productionRate: 65,
        upgradeLevel: 0,
        owner: null,
        drilled: false,
        exhausted: false
    },
    {
        id: 5,
        name: "UAE",
        cost: 2500,
        oilReserves: 500,
        productionRate: 55,
        upgradeLevel: 0,
        owner: null,
        drilled: false,
        exhausted: false
    },
    {
        id: 6,
        name: "Qatar",
        cost: 2000,
        oilReserves: 400,
        productionRate: 50,
        upgradeLevel: 0,
        owner: null,
        drilled: false,
        exhausted: false
    }
];

// Randomization function for new games
function randomizeGameData() {
    // Randomize territories
    territories.forEach(territory => {
        territory.oilReserves = Math.floor(Math.random() * 600) + 400; // 400-1000
        territory.productionRate = Math.floor(Math.random() * 40) + 40; // 40-80
        
        // Calculate cost based on reserves and production rate
        const baseValue = (territory.oilReserves * 3) + (territory.productionRate * 50);
        territory.cost = Math.floor(baseValue * (0.8 + Math.random() * 0.4)); // ±20% variation
        
        territory.upgradeLevel = 0;
        territory.owner = null;
        territory.drilled = false;
        territory.exhausted = false;
    });
    
    // Randomize consumers
    consumers.forEach(consumer => {
        consumer.demand = Math.floor(Math.random() * 80) + 60; // 60-140
        consumer.pricePerBarrel = Math.floor(Math.random() * 15) + 25; // 25-40
        consumer.relationship = 'neutral';
        consumer.contract = null;
    });
}

// Consumer Countries Data (will be randomized on game start)
let consumers = [
    {
        id: 1,
        name: "United States",
        demand: 200,
        pricePerBarrel: 28,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 2,
        name: "West Germany",
        demand: 90,
        pricePerBarrel: 30,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 3,
        name: "France",
        demand: 70,
        pricePerBarrel: 32,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 4,
        name: "Japan",
        demand: 60,
        pricePerBarrel: 35,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 5,
        name: "Canada",
        demand: 80,
        pricePerBarrel: 29,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 6,
        name: "United Kingdom",
        demand: 100,
        pricePerBarrel: 31,
        relationship: 'neutral',
        contract: null
    }
];

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    showRulesModal();
    setupEventListeners();
});

function showRulesModal() {
    document.getElementById('rulesModal').style.display = 'block';
    
    // Show appropriate button based on game state
    if (gameState.gameStarted) {
        // Game is running, show close button
        document.getElementById('startGame').style.display = 'none';
        document.getElementById('closeRules').style.display = 'inline-block';
    } else {
        // Game hasn't started, show start game button
        document.getElementById('startGame').style.display = 'inline-block';
        document.getElementById('closeRules').style.display = 'none';
    }
}

function closeRulesModal() {
    document.getElementById('rulesModal').style.display = 'none';
}

function closeOverviewModal() {
    document.getElementById('overviewModal').style.display = 'none';
}

function trackTurnData() {
    // Track money and oil at end of each turn
    gameState.history.playerMoney.push(player.money);
    gameState.history.rivalMoney.push(rival.money);
    gameState.history.playerOil.push(player.oil);
    gameState.history.rivalOil.push(rival.oil);
    
    // Track company-specific average prices
    let playerTotalPrice = 0;
    let rivalTotalPrice = 0;
    
    consumers.forEach(consumer => {
        const playerPrice = consumer.playerPricePerBarrel || consumer.pricePerBarrel;
        const rivalPrice = consumer.rivalPricePerBarrel || consumer.pricePerBarrel;
        
        playerTotalPrice += playerPrice;
        rivalTotalPrice += rivalPrice;
    });
    
    const playerAveragePrice = Math.round(playerTotalPrice / consumers.length);
    const rivalAveragePrice = Math.round(rivalTotalPrice / consumers.length);
    
    gameState.history.playerAveragePrices.push({
        turn: gameState.currentTurn,
        averagePrice: playerAveragePrice
    });
    
    gameState.history.rivalAveragePrices.push({
        turn: gameState.currentTurn,
        averagePrice: rivalAveragePrice
    });
}

function trackNegotiation() {
    if (gameState.playerChoice || gameState.rivalChoice) {
        let outcome = 'none';
        if (gameState.playerChoice === 'collude' && gameState.rivalChoice === 'collude') {
            outcome = 'both_collude';
        } else if (gameState.playerChoice === 'compete' && gameState.rivalChoice === 'compete') {
            outcome = 'both_compete';
        } else if (gameState.playerChoice && gameState.rivalChoice) {
            outcome = 'mixed';
        }
        
        gameState.history.negotiations.push({
            turn: gameState.currentTurn,
            playerChoice: gameState.playerChoice || 'none',
            rivalChoice: gameState.rivalChoice || 'none',
            outcome: outcome
        });
    }
}

function generateGameOverview(playerScore, rivalScore, winner) {
    // Generate profit chart
    generateProfitChart();
    
    // Generate price chart
    generatePriceChart();
    
    // Generate negotiation history
    generateNegotiationHistory();
    
    // Generate final statistics
    generateFinalStats(playerScore, rivalScore, winner);
}

function generateProfitChart() {
    const canvas = document.getElementById('profitChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 50;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find max value for scaling
    const allValues = [...gameState.history.playerMoney, ...gameState.history.rivalMoney];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const valueRange = maxValue - minValue;
    
    // Set up styling
    ctx.strokeStyle = '#f5f5f5';
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '12px Arial';
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw grid lines and labels
    const turns = gameState.history.playerMoney.length;
    for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        const y = canvas.height - padding - (i / 10) * chartHeight;
        
        // Vertical grid lines (turns)
        if (i <= turns - 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(245, 245, 245, 0.2)';
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvas.height - padding);
            ctx.stroke();
            
            // Turn labels
            ctx.fillStyle = '#f5f5f5';
            ctx.textAlign = 'center';
            ctx.fillText('T' + i, x, canvas.height - padding + 15);
        }
        
        // Horizontal grid lines (money)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245, 245, 245, 0.2)';
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        // Money labels
        const value = Math.round(minValue + (i / 10) * valueRange);
        ctx.fillStyle = '#f5f5f5';
        ctx.textAlign = 'right';
        ctx.fillText('$' + (value / 1000).toFixed(0) + 'K', padding - 5, y + 4);
    }
    
    // Draw player money line
    ctx.beginPath();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    for (let i = 0; i < gameState.history.playerMoney.length; i++) {
        const x = padding + (i / (turns - 1)) * chartWidth;
        const y = canvas.height - padding - ((gameState.history.playerMoney[i] - minValue) / valueRange) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw rival money line
    ctx.beginPath();
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 3;
    for (let i = 0; i < gameState.history.rivalMoney.length; i++) {
        const x = padding + (i / (turns - 1)) * chartWidth;
        const y = canvas.height - padding - ((gameState.history.rivalMoney[i] - minValue) / valueRange) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw legend
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(canvas.width - 150, 20, 15, 15);
    ctx.fillStyle = '#f5f5f5';
    ctx.textAlign = 'left';
    ctx.fillText('Petroleum & Sons', canvas.width - 130, 32);
    
    ctx.fillStyle = '#f44336';
    ctx.fillRect(canvas.width - 150, 40, 15, 15);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillText('Standard Oil Corp', canvas.width - 130, 52);
}

function generatePriceChart() {
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.history.playerAveragePrices.length === 0) {
        ctx.fillStyle = '#f5f5f5';
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText('No price data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const padding = 50;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find price range across both companies
    const playerPrices = gameState.history.playerAveragePrices.map(p => p.averagePrice);
    const rivalPrices = gameState.history.rivalAveragePrices.map(p => p.averagePrice);
    const allPrices = [...playerPrices, ...rivalPrices];
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1;
    
    // Set up styling
    ctx.strokeStyle = '#f5f5f5';
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '12px Arial';
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw grid lines and labels
    const turns = gameState.history.playerAveragePrices.length;
    for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        const y = canvas.height - padding - (i / 10) * chartHeight;
        
        // Vertical grid lines (turns)
        if (i <= turns - 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(245, 245, 245, 0.2)';
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvas.height - padding);
            ctx.stroke();
            
            // Turn labels
            ctx.fillStyle = '#f5f5f5';
            ctx.textAlign = 'center';
            ctx.fillText('T' + i, x, canvas.height - padding + 15);
        }
        
        // Horizontal grid lines (prices)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245, 245, 245, 0.2)';
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        // Price labels
        const value = Math.round(minPrice + (i / 10) * priceRange);
        ctx.fillStyle = '#f5f5f5';
        ctx.textAlign = 'right';
        ctx.fillText('$' + value, padding - 5, y + 4);
    }
    
    // Draw player price line
    ctx.beginPath();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    for (let i = 0; i < gameState.history.playerAveragePrices.length; i++) {
        const priceData = gameState.history.playerAveragePrices[i];
        const x = padding + (i / (turns - 1)) * chartWidth;
        const y = canvas.height - padding - ((priceData.averagePrice - minPrice) / priceRange) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw rival price line
    ctx.beginPath();
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 3;
    for (let i = 0; i < gameState.history.rivalAveragePrices.length; i++) {
        const priceData = gameState.history.rivalAveragePrices[i];
        const x = padding + (i / (turns - 1)) * chartWidth;
        const y = canvas.height - padding - ((priceData.averagePrice - minPrice) / priceRange) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw legend
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(canvas.width - 180, 20, 15, 15);
    ctx.fillStyle = '#f5f5f5';
    ctx.textAlign = 'left';
    ctx.fillText('Petroleum & Sons Prices', canvas.width - 160, 32);
    
    ctx.fillStyle = '#f44336';
    ctx.fillRect(canvas.width - 180, 40, 15, 15);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillText('Standard Oil Corp Prices', canvas.width - 160, 52);
}

function generateNegotiationHistory() {
    const container = document.getElementById('negotiationHistory');
    container.innerHTML = '';
    
    if (gameState.history.negotiations.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #ccc; font-style: italic;">No negotiations occurred during the game</div>';
        return;
    }
    
    gameState.history.negotiations.forEach(negotiation => {
        const item = document.createElement('div');
        item.className = 'negotiation-item';
        
        let outcomeText = '';
        let outcomeClass = '';
        
        switch (negotiation.outcome) {
            case 'both_collude':
                outcomeText = 'Both Colluded';
                outcomeClass = 'negotiation-collude';
                break;
            case 'both_compete':
                outcomeText = 'Both Competed';
                outcomeClass = 'negotiation-compete';
                break;
            case 'mixed':
                outcomeText = 'Mixed Strategy';
                outcomeClass = 'negotiation-mixed';
                break;
            default:
                outcomeText = 'No Action';
        }
        
        item.classList.add(outcomeClass);
        item.innerHTML = `
            <div style="font-weight: bold;">Turn ${negotiation.turn - 1}</div>
            <div style="font-size: 12px;">${outcomeText}</div>
            <div style="font-size: 10px; margin-top: 5px;">
                You: ${negotiation.playerChoice}<br>
                Rival: ${negotiation.rivalChoice}
            </div>
        `;
        
        container.appendChild(item);
    });
}

function generateFinalStats(playerScore, rivalScore, winner) {
    const container = document.getElementById('finalStats');
    
    const playerTerritoriesOwned = gameState.history.playerMoney.length > 1 ? player.territories.length : 0;
    const rivalTerritoriesOwned = gameState.history.rivalMoney.length > 1 ? rival.territories.length : 0;
    const totalNegotiations = gameState.history.negotiations.length;
    const collusionCount = gameState.history.negotiations.filter(n => n.outcome === 'both_collude').length;
    
    container.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">$${playerScore.toLocaleString()}</div>
            <div class="stat-label">Your Final Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">$${rivalScore.toLocaleString()}</div>
            <div class="stat-label">Rival Final Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${playerTerritoriesOwned}</div>
            <div class="stat-label">Your Territories</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${rivalTerritoriesOwned}</div>
            <div class="stat-label">Rival Territories</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${totalNegotiations}</div>
            <div class="stat-label">Total Negotiations</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${collusionCount}</div>
            <div class="stat-label">Successful Collusions</div>
        </div>
        <div class="stat-item" style="grid-column: 1 / -1; background: ${winner === 'Petroleum & Sons' ? 'rgba(76, 175, 80, 0.3)' : winner === 'Standard Oil Corporation' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 152, 0, 0.3)'};">
            <div class="stat-value">${winner}</div>
            <div class="stat-label">Winner</div>
        </div>
    `;
}

function setupEventListeners() {
    // Start game button
    document.getElementById('startGame').addEventListener('click', startGame);
    
    // Close rules button
    document.getElementById('closeRules').addEventListener('click', closeRulesModal);
    
    // Overview modal buttons
    document.getElementById('closeOverview').addEventListener('click', closeOverviewModal);
    document.getElementById('playAgain').addEventListener('click', startGame);
    
    // Action buttons
    document.getElementById('buyLandBtn').addEventListener('click', handleBuyLand);
    document.getElementById('drillOilBtn').addEventListener('click', handleDrillOil);
    document.getElementById('upgradeBtn').addEventListener('click', handleUpgrade);
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    document.getElementById('negotiateBtn').addEventListener('click', handleNegotiate);
    document.getElementById('sabotageBtn').addEventListener('click', handleSabotage);
    document.getElementById('endTurnBtn').addEventListener('click', endTurn);
    
    // Menu buttons
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('rulesBtn').addEventListener('click', showRulesModal);
    
    // Toggle log button
    document.getElementById('toggleLogBtn').addEventListener('click', toggleMessageLog);
}

function toggleMessageLog() {
    const messageLog = document.getElementById('messageLog');
    const toggleBtn = document.getElementById('toggleLogBtn');
    
    if (messageLog.classList.contains('expanded')) {
        messageLog.classList.remove('expanded');
        messageLog.classList.add('collapsed');
        toggleBtn.textContent = '+';
    } else {
        messageLog.classList.remove('collapsed');
        messageLog.classList.add('expanded');
        toggleBtn.textContent = '−';
    }
}

function startGame() {
    document.getElementById('rulesModal').style.display = 'none';
    document.getElementById('overviewModal').style.display = 'none';
    gameState.gameStarted = true;
    
    // Reset game state
    gameState.currentTurn = 1;
    gameState.currentPhase = 'Purchase';
    gameState.currentPhaseIndex = 0;
    gameState.gameEnded = false;
    gameState.territoriesPurchasedThisTurn = 0;
    gameState.negotiationUsedThisTurn = false;
    gameState.collusionActive = false;
    gameState.collusionSuccess = false;
    gameState.playerChoice = null;
    gameState.rivalChoice = null;
    gameState.isRivalTurn = false;
    
    // Reset history tracking
    gameState.history = {
        playerMoney: [10000],
        rivalMoney: [10000],
        playerOil: [0],
        rivalOil: [0],
        negotiations: [],
        consumerPrices: [],
        playerAveragePrices: [],
        rivalAveragePrices: []
    };
    
    // Reset player data
    player.money = 10000;
    player.oil = 0;
    player.drillingSites = 0;
    player.territories = [];
    player.contracts = [];
    
    // Reset rival data
    rival.money = 10000;
    rival.oil = 0;
    rival.drillingSites = 0;
    rival.territories = [];
    rival.contracts = [];
    rival.strategy = 'competitive';
    
    // Randomize game data
    randomizeGameData();
    
    // Re-enable all buttons that might have been disabled from previous game
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    document.getElementById('endTurnBtn').disabled = false;
    document.getElementById('endTurnBtn').style.opacity = '1';
    
    initializeGame();
    updateUI();
    addMessage("Game started! Petroleum & Sons begins operations in " + getCurrentDate() + ".", 'system');
    animatePhase();
}

function getCurrentDate() {
    const currentYear = gameState.startYear + gameState.currentTurn - 1;
    return "01/01/" + currentYear;
}

function resetGame() {
    startGame();
}

function goHome() {
    window.location.href = '../index.html';
}

function initializeGame() {
    renderTerritories();
    renderConsumers();
    updatePhaseButtons();
    animatePhase();
}

function renderTerritories() {
    const territoriesContainer = document.getElementById('territories');
    territoriesContainer.innerHTML = '';
    
    territories.forEach(territory => {
        const territoryDiv = document.createElement('div');
        territoryDiv.className = 'territory';
        territoryDiv.setAttribute('data-territory-id', territory.id);
        
        if (territory.owner === 'player') {
            territoryDiv.classList.add('owned-player');
            if (territory.drilled) {
                territoryDiv.classList.add('drilled-player');
            }
        } else if (territory.owner === 'rival') {
            territoryDiv.classList.add('owned-rival');
            if (territory.drilled) {
                territoryDiv.classList.add('drilled-rival');
            }
        }
        
        const currentProduction = territory.productionRate * (1 + territory.upgradeLevel * 0.25);
        territoryDiv.innerHTML = `
            <div class="territory-name">${territory.name}</div>
            <div class="territory-info">
                Cost: $${territory.cost.toLocaleString()}<br>
                Reserves: ${territory.oilReserves} barrels<br>
                Production: ${Math.round(currentProduction)}/turn
                ${territory.owner ? `<br>Owner: ${territory.owner === 'player' ? 'You' : 'Rival'}` : ''}
                ${territory.drilled ? '<br>🏭 Drilled' : ''}
                ${territory.upgradeLevel > 0 ? `<br>⚡ Upgrade Lv.${territory.upgradeLevel}` : ''}
            </div>
        `;
        
        territoryDiv.addEventListener('click', () => selectTerritory(territory.id));
        territoriesContainer.appendChild(territoryDiv);
    });
}

function renderConsumers() {
    const consumersContainer = document.getElementById('consumers');
    consumersContainer.innerHTML = '';
    
    consumers.forEach(consumer => {
        const consumerDiv = document.createElement('div');
        consumerDiv.className = 'consumer';
        consumerDiv.setAttribute('data-consumer-id', consumer.id);
        
        const playerPrice = consumer.playerPricePerBarrel || consumer.pricePerBarrel;
        const rivalPrice = consumer.rivalPricePerBarrel || consumer.pricePerBarrel;
        
        let priceDisplay;
        if (consumer.playerPricePerBarrel || consumer.rivalPricePerBarrel) {
            priceDisplay = `Your Price: $${playerPrice}/barrel<br>Rival Price: $${rivalPrice}/barrel`;
        } else {
            priceDisplay = `Price: $${consumer.pricePerBarrel}/barrel`;
        }
        
        consumerDiv.innerHTML = `
            <div class="consumer-name">${consumer.name}</div>
            <div class="consumer-demand">
                Demand: ${consumer.demand} barrels<br>
                ${priceDisplay}<br>
                Relationship: ${consumer.relationship}
                ${consumer.contract ? `<br>Contract: ${consumer.contract}` : ''}
            </div>
        `;
        
        consumerDiv.addEventListener('click', () => selectConsumer(consumer.id));
        consumersContainer.appendChild(consumerDiv);
    });
}

function selectTerritory(territoryId) {
    // Remove previous selection
    document.querySelectorAll('.territory').forEach(t => t.classList.remove('selected'));
    
    // Select new territory
    const territoryDiv = document.querySelector(`[data-territory-id="${territoryId}"]`);
    territoryDiv.classList.add('selected');
    
    gameState.selectedTerritory = territoryId;
    updatePhaseButtons();
}

function selectConsumer(consumerId) {
    // Remove previous selection
    document.querySelectorAll('.consumer').forEach(c => c.classList.remove('selected'));
    
    // Select new consumer
    const consumerDiv = document.querySelector(`[data-consumer-id="${consumerId}"]`);
    consumerDiv.classList.add('selected');
    
    gameState.selectedConsumer = consumerId;
    updatePhaseButtons();
}

function updatePhaseButtons() {
    const buyBtn = document.getElementById('buyLandBtn');
    const drillBtn = document.getElementById('drillOilBtn');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const negotiateBtn = document.getElementById('negotiateBtn');
    const sabotageBtn = document.getElementById('sabotageBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    
    // If it's rival's turn, keep all buttons disabled
    if (gameState.isRivalTurn) {
        [buyBtn, drillBtn, upgradeBtn, exportBtn, negotiateBtn, sabotageBtn, endTurnBtn].forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.3';
        });
        return;
    }
    
    // Reset all buttons
    [buyBtn, drillBtn, upgradeBtn, exportBtn, negotiateBtn, sabotageBtn].forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Update end turn button text based on phase
    if (gameState.currentPhase === 'Negotiation') {
        endTurnBtn.textContent = 'End Turn';
    } else {
        endTurnBtn.textContent = 'End Phase';
    }
    
    // Check if all territories are owned and drilled
    const allTerritoriesOwned = territories.every(t => t.owner !== null);
    const allTerritoriesDrilled = territories.every(t => t.drilled);
    
    // Enable/disable based on current phase and selections
    if (gameState.currentPhase === 'Purchase') {
        drillBtn.disabled = true;
        upgradeBtn.disabled = true;
        exportBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
        
        // Auto-advance to drilling phase if all territories are owned
        if (allTerritoriesOwned) {
            buyBtn.disabled = true;
            buyBtn.style.opacity = '0.3';
            
            // Automatically advance to drilling phase
            setTimeout(() => {
                gameState.currentPhaseIndex++;
                gameState.currentPhase = gameState.phases[gameState.currentPhaseIndex];
                addMessage("Purchase phase skipped - all territories owned. Moving to drilling phase.", 'system');
                updateUI();
                updatePhaseButtons();
                animatePhase();
            }, 500);
            return;
        }
    } else if (gameState.currentPhase === 'Drilling') {
        buyBtn.disabled = true;
        exportBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Production') {
        buyBtn.disabled = true;
        drillBtn.disabled = true;
        upgradeBtn.disabled = true;
        exportBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Trade') {
        buyBtn.disabled = true;
        drillBtn.disabled = true;
        upgradeBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Negotiation') {
        buyBtn.disabled = true;
        drillBtn.disabled = true;
        upgradeBtn.disabled = true;
        exportBtn.disabled = true;
        
        // Disable both collude and compete buttons if negotiation already used this turn
        if (gameState.negotiationUsedThisTurn) {
            negotiateBtn.disabled = true;
            sabotageBtn.disabled = true;
        }
    }
    
    // Update disabled button styles
    [buyBtn, drillBtn, upgradeBtn, exportBtn, negotiateBtn, sabotageBtn].forEach(btn => {
        if (btn.disabled) {
            btn.style.opacity = '0.5';
        }
    });
}

function handleBuyLand() {
    if (gameState.selectedTerritory === null) {
        addMessage("Please select a territory first!", 'system');
        return;
    }
    
    if (gameState.territoriesPurchasedThisTurn >= 1) {
        addMessage("You can only purchase one territory per turn!", 'system');
        return;
    }
    
    const territory = territories.find(t => t.id === gameState.selectedTerritory);
    
    if (territory.owner !== null) {
        addMessage(`${territory.name} is already owned!`, 'system');
        return;
    }
    
    if (player.money < territory.cost) {
        addMessage("Insufficient funds to purchase this territory!", 'system');
        return;
    }
    
    // Purchase territory
    player.money -= territory.cost;
    territory.owner = 'player';
    player.territories.push(territory.id);
    gameState.territoriesPurchasedThisTurn++;
    
    addMessage(`Successfully purchased land in ${territory.name} for $${territory.cost.toLocaleString()}`, 'player');
    updateUI();
    renderTerritories();
}

function handleDrillOil() {
    if (gameState.selectedTerritory === null) {
        addMessage("Please select a territory first!", 'system');
        return;
    }
    
    const territory = territories.find(t => t.id === gameState.selectedTerritory);
    
    if (territory.owner !== 'player') {
        addMessage("You don't own this territory!", 'system');
        return;
    }
    
    if (territory.drilled) {
        addMessage("This territory is already drilled!", 'system');
        return;
    }
    
    const drillCost = 1000;
    if (player.money < drillCost) {
        addMessage("Insufficient funds for drilling operation!", 'system');
        return;
    }
    
    // Drill oil
    player.money -= drillCost;
    territory.drilled = true;
    player.drillingSites++;
    
    addMessage(`Successfully drilled ${territory.name} for $${drillCost.toLocaleString()}`, 'player');
    updateUI();
    renderTerritories();
}

function handleUpgrade() {
    if (gameState.selectedTerritory === null) {
        addMessage("Please select a territory first!", 'system');
        return;
    }
    
    const territory = territories.find(t => t.id === gameState.selectedTerritory);
    
    if (territory.owner !== 'player') {
        addMessage("You don't own this territory!", 'system');
        return;
    }
    
    if (!territory.drilled) {
        addMessage("You must drill this territory first!", 'system');
        return;
    }
    
    if (territory.upgradeLevel >= 3) {
        addMessage("This territory has reached maximum upgrade level!", 'system');
        return;
    }
    
    const upgradeCost = 1500 * (territory.upgradeLevel + 1);
    if (player.money < upgradeCost) {
        addMessage("Insufficient funds for upgrade!", 'system');
        return;
    }
    
    // Upgrade drill
    player.money -= upgradeCost;
    territory.upgradeLevel++;
    
    addMessage(`Successfully upgraded ${territory.name} to level ${territory.upgradeLevel} for $${upgradeCost.toLocaleString()}`, 'player');
    updateUI();
    renderTerritories();
}

function handleExport() {
    if (gameState.selectedConsumer === null) {
        addMessage("Please select a consumer country first!", 'system');
        return;
    }
    
    const consumer = consumers.find(c => c.id === gameState.selectedConsumer);
    
    if (player.oil < consumer.demand) {
        addMessage(`Insufficient oil reserves! Need ${consumer.demand} barrels, have ${player.oil}`, 'system');
        return;
    }
    
    // Export oil - use player-specific price if available
    const pricePerBarrel = consumer.playerPricePerBarrel || consumer.pricePerBarrel;
    const revenue = consumer.demand * pricePerBarrel;
    player.oil -= consumer.demand;
    player.money += revenue;
    
    // Improve relationship
    if (consumer.relationship === 'neutral') {
        consumer.relationship = 'friendly';
    } else if (consumer.relationship === 'friendly') {
        consumer.relationship = 'allied';
    }
    
    addMessage(`Exported ${consumer.demand} barrels to ${consumer.name} for $${revenue.toLocaleString()}`, 'player');
    updateUI();
    renderConsumers();
}

function handleNegotiate() {
    if (gameState.negotiationUsedThisTurn) {
        addMessage("You can only use one negotiation action per turn!", 'system');
        return;
    }
    
    // Player chooses to collude
    gameState.playerChoice = 'collude';
    gameState.negotiationUsedThisTurn = true;
    
    addMessage("You proposed collusion with Standard Oil.", 'player');
    
    updateUI();
    updatePhaseButtons();
}

function handleSabotage() {
    if (gameState.negotiationUsedThisTurn) {
        addMessage("You can only use one negotiation action per turn!", 'system');
        return;
    }
    
    // Player chooses to compete
    gameState.playerChoice = 'compete';
    gameState.negotiationUsedThisTurn = true;
    
    addMessage("You chose aggressive competition against Standard Oil.", 'player');
    
    updateUI();
    updatePhaseButtons();
}

function endTurn() {
    // Production phase - generate oil (automatically triggered, no user action needed)
    if (gameState.currentPhase === 'Drilling') {
        let totalProduction = 0;
        territories.forEach(territory => {
            if (territory.owner === 'player' && territory.drilled && !territory.exhausted) {
                const actualProduction = Math.round(territory.productionRate * (1 + territory.upgradeLevel * 0.25));
                const availableOil = Math.min(actualProduction, territory.oilReserves);
                totalProduction += availableOil;
                territory.oilReserves -= availableOil;
                
                if (territory.oilReserves <= 0) {
                    territory.oilReserves = 0;
                    territory.exhausted = true;
                    addMessage(`${territory.name} has been exhausted!`, 'system');
                }
            }
        });
        
        player.oil += totalProduction;
        
        if (totalProduction > 0) {
            addMessage(`Produced ${totalProduction} barrels of oil this turn`, 'player');
        }
        
        // Skip Production phase and go directly to Trade
        gameState.currentPhaseIndex += 2;
    } else {
        // Move to next phase normally
        gameState.currentPhaseIndex++;
    }
    
    if (gameState.currentPhaseIndex >= gameState.phases.length) {
        // End of player turn, rival's turn
        gameState.currentPhaseIndex = 0;
        gameState.currentPhase = gameState.phases[0];
        
        // Reset territory purchase count and negotiation flag for new turn
        gameState.territoriesPurchasedThisTurn = 0;
        gameState.negotiationUsedThisTurn = false;
        
        // Set rival turn flag and disable all action buttons
        gameState.isRivalTurn = true;
        disableAllActionButtons();
        
        rivalTurn();
    } else {
        gameState.currentPhase = gameState.phases[gameState.currentPhaseIndex];
    }
    
    updateUI();
    updatePhaseButtons();
    animatePhase();
}

function disableAllActionButtons() {
    const actionButtons = [
        'buyLandBtn', 'drillOilBtn', 'upgradeBtn', 
        'exportBtn', 'negotiateBtn', 'sabotageBtn', 'endTurnBtn'
    ];
    
    actionButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        button.disabled = true;
        button.style.opacity = '0.3';
    });
}

function enableAllActionButtons() {
    const actionButtons = [
        'buyLandBtn', 'drillOilBtn', 'upgradeBtn', 
        'exportBtn', 'negotiateBtn', 'sabotageBtn', 'endTurnBtn'
    ];
    
    actionButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        button.disabled = false;
        button.style.opacity = '1';
    });
}

function rivalTurn() {
    addMessage("Standard Oil Corporation's turn begins...", 'rival');
    
    // Rival AI logic
    setTimeout(() => {
        rivalBuyLand();
        
        setTimeout(() => {
            rivalDrillOil();
            
            setTimeout(() => {
                rivalUpgrade();
                
                setTimeout(() => {
                    rivalProduction();
                    
                    setTimeout(() => {
                        rivalExport();
                        
                        setTimeout(() => {
                            rivalNegotiation();
                            addMessage("Standard Oil Corporation's turn ends", 'rival');
                            
                            // Re-enable action buttons after rival's turn
                            gameState.isRivalTurn = false;
                            enableAllActionButtons();
                            
                            updateUI();
                            updatePhaseButtons();
                            
                            // Reset negotiation choices for next turn
                            gameState.playerChoice = null;
                            gameState.rivalChoice = null;
                            
                            // Track data for this turn
                            trackTurnData();
                            
                            // Check if game should end after rival's turn
                            gameState.currentTurn++;
                            if (gameState.currentTurn > gameState.maxTurns) {
                                endGame();
                                return;
                            }
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
}

function rivalBuyLand() {
    const availableTerritories = territories.filter(t => t.owner === null);
    
    if (availableTerritories.length > 0 && rival.money >= 2000) {
        // AI prefers high-production territories
        const bestTerritory = availableTerritories.sort((a, b) => 
            (b.productionRate / b.cost) - (a.productionRate / a.cost)
        )[0];
        
        if (rival.money >= bestTerritory.cost) {
            rival.money -= bestTerritory.cost;
            bestTerritory.owner = 'rival';
            rival.territories.push(bestTerritory.id);
            
            addMessage(`Standard Oil purchased land in ${bestTerritory.name}`, 'rival');
            renderTerritories();
        }
    }
}

function rivalDrillOil() {
    const ownedTerritories = territories.filter(t => t.owner === 'rival' && !t.drilled);
    
    if (ownedTerritories.length > 0 && rival.money >= 1000) {
        const territory = ownedTerritories[0];
        rival.money -= 1000;
        territory.drilled = true;
        rival.drillingSites++;
        
        addMessage(`Standard Oil drilled ${territory.name}`, 'rival');
        renderTerritories();
    }
}

function rivalUpgrade() {
    // Find drilled territories that can be upgraded
    const upgradeableTerritories = territories.filter(t => 
        t.owner === 'rival' && 
        t.drilled && 
        !t.exhausted && 
        t.upgradeLevel < 3
    );
    
    if (upgradeableTerritories.length > 0) {
        // Sort by production potential (considers current production and upgrade benefit)
        upgradeableTerritories.sort((a, b) => {
            const aProductionGain = a.productionRate * 0.25; // 25% increase per upgrade
            const bProductionGain = b.productionRate * 0.25;
            return bProductionGain - aProductionGain;
        });
        
        const bestTerritory = upgradeableTerritories[0];
        const upgradeCost = 1500 * (bestTerritory.upgradeLevel + 1);
        
        // AI will upgrade if it has enough money and the upgrade is cost-effective
        if (rival.money >= upgradeCost && upgradeCost <= rival.money * 0.3) {
            rival.money -= upgradeCost;
            bestTerritory.upgradeLevel++;
            
            addMessage(`Standard Oil upgraded ${bestTerritory.name} to level ${bestTerritory.upgradeLevel}`, 'rival');
            renderTerritories();
        }
    }
}

function rivalProduction() {
    let totalProduction = 0;
    territories.forEach(territory => {
        if (territory.owner === 'rival' && territory.drilled && !territory.exhausted) {
            const actualProduction = Math.round(territory.productionRate * (1 + territory.upgradeLevel * 0.25));
            const availableOil = Math.min(actualProduction, territory.oilReserves);
            totalProduction += availableOil;
            territory.oilReserves -= availableOil;
            
            if (territory.oilReserves <= 0) {
                territory.oilReserves = 0;
                territory.exhausted = true;
                addMessage(`${territory.name} has been exhausted!`, 'system');
            }
        }
    });
    
    rival.oil += totalProduction;
    
    if (totalProduction > 0) {
        addMessage(`Standard Oil produced ${totalProduction} barrels`, 'rival');
    }
}

function rivalExport() {
    const availableConsumers = consumers.filter(c => c.contract === null);
    
    availableConsumers.forEach(consumer => {
        if (rival.oil >= consumer.demand) {
            const pricePerBarrel = consumer.rivalPricePerBarrel || consumer.pricePerBarrel;
            const revenue = consumer.demand * pricePerBarrel;
            rival.oil -= consumer.demand;
            rival.money += revenue;
            
            addMessage(`Standard Oil exported to ${consumer.name}`, 'rival');
        }
    });
}

function rivalNegotiation() {
    // Rival AI chooses strategy - always 50/50
    const rivalChoice = Math.random() > 0.5 ? 'compete' : 'collude';
    
    gameState.rivalChoice = rivalChoice;
    
    if (rivalChoice === 'compete') {
        addMessage("Standard Oil chose aggressive competition.", 'rival');
    } else if (rivalChoice === 'collude') {
        addMessage("Standard Oil proposed collusion.", 'rival');
    }
    
    // Apply negotiation effects immediately after both companies have chosen
    if (gameState.playerChoice || gameState.rivalChoice) {
        applyCollusionEffects();
        trackNegotiation();
    }
}

function applyCollusionEffects() {
    const playerChoice = gameState.playerChoice;
    const rivalChoice = gameState.rivalChoice;
    
    // Reset any existing special pricing
    consumers.forEach(consumer => {
        delete consumer.playerPricePerBarrel;
        delete consumer.rivalPricePerBarrel;
    });
    
    if (playerChoice === 'collude' && rivalChoice === 'collude') {
        // Both collude: prices increase for both companies
        consumers.forEach(consumer => {
            consumer.pricePerBarrel = Math.round(consumer.pricePerBarrel * 1.20); // 20% increase for both
        });
        addMessage("Both companies colluded! Oil prices increased for everyone.", 'system');
        
    } else if (playerChoice === 'collude' && rivalChoice === 'compete') {
        // Player colludes, rival competes: rival gets high prices, player gets low prices
        consumers.forEach(consumer => {
            consumer.playerPricePerBarrel = Math.round(consumer.pricePerBarrel * 0.7); // Player gets 70% of base price
            consumer.rivalPricePerBarrel = Math.round(consumer.pricePerBarrel * 1.4); // Rival gets 140% of base price
        });
        addMessage("You colluded while Standard Oil competed! They get higher prices, you get lower prices.", 'system');
        
    } else if (playerChoice === 'compete' && rivalChoice === 'collude') {
        // Player competes, rival colludes: player gets high prices, rival gets low prices
        consumers.forEach(consumer => {
            consumer.playerPricePerBarrel = Math.round(consumer.pricePerBarrel * 1.4); // Player gets 140% of base price
            consumer.rivalPricePerBarrel = Math.round(consumer.pricePerBarrel * 0.7); // Rival gets 70% of base price
        });
        addMessage("You competed while Standard Oil colluded! You get higher prices, they get lower prices.", 'system');
        
    } else if (playerChoice === 'compete' && rivalChoice === 'compete') {
        // Both compete: prices are low for everyone
        consumers.forEach(consumer => {
            consumer.pricePerBarrel = Math.round(consumer.pricePerBarrel * 0.8); // 20% decrease for both
        });
        addMessage("Both companies competed aggressively! Oil prices dropped for everyone.", 'system');
        
    } else {
        // No negotiation actions were taken
        addMessage("No market manipulation occurred this turn.", 'system');
    }
    
    // Update rival strategy based on outcomes
    if (rivalChoice === 'collude') {
        rival.strategy = 'cooperative';
    } else if (rivalChoice === 'compete') {
        rival.strategy = 'aggressive';
    }
    
    renderConsumers();
}

function animatePhase() {
    const phaseAnimation = document.getElementById('phaseAnimation');
    
    if (!phaseAnimation) return;
    
    // Always show the oil pump, just restart the animation
    phaseAnimation.classList.remove('phase-animate');
    
    setTimeout(() => {
        phaseAnimation.classList.add('phase-animate');
    }, 100);
}

function updateUI() {
    // Update player stats
    document.getElementById('playerMoney').textContent = player.money.toLocaleString();
    document.getElementById('playerOil').textContent = player.oil.toLocaleString();
    document.getElementById('playerDrills').textContent = player.drillingSites;
    document.getElementById('playerLand').textContent = player.territories.length;
    
    // Update rival stats
    document.getElementById('rivalMoney').textContent = rival.money.toLocaleString();
    document.getElementById('rivalOil').textContent = rival.oil.toLocaleString();
    document.getElementById('rivalDrills').textContent = rival.drillingSites;
    document.getElementById('rivalLand').textContent = rival.territories.length;
    
    // Update turn info
    document.getElementById('currentTurn').textContent = gameState.currentTurn;
    document.getElementById('currentPhase').textContent = gameState.currentPhase;
    document.getElementById('currentDate').textContent = getCurrentDate();
}

function addMessage(message, type) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function endGame() {
    gameState.gameEnded = true;
    
    // Track final turn data
    trackTurnData();
    
    const playerScore = player.money + (player.oil * 20);
    const rivalScore = rival.money + (rival.oil * 20);
    
    let winner, message;
    
    if (playerScore > rivalScore) {
        winner = "Petroleum & Sons";
        message = `Congratulations! You built the dominant oil empire!`;
    } else if (rivalScore > playerScore) {
        winner = "Standard Oil Corporation";
        message = `Standard Oil Corporation dominated the market!`;
    } else {
        winner = "Tie";
        message = `It's a tie! Both companies achieved equal dominance.`;
    }
    
    addMessage(`GAME OVER! ${message}`, 'system');
    addMessage(`Final Score - You: ${playerScore.toLocaleString()}, Rival: ${rivalScore.toLocaleString()}`, 'system');
    
    // Disable all action buttons
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
    
    document.getElementById('endTurnBtn').disabled = true;
    document.getElementById('endTurnBtn').style.opacity = '0.5';
    
    // Show overview modal after a brief delay
    setTimeout(() => {
        generateGameOverview(playerScore, rivalScore, winner);
        document.getElementById('overviewModal').style.display = 'block';
    }, 2000);
} 