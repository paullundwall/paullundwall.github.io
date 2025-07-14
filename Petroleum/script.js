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
    negotiations: {
        active: false,
        offer: null,
        response: null
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
}

function setupEventListeners() {
    // Start game button
    document.getElementById('startGame').addEventListener('click', startGame);
    
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
        
        rivalTurn();
    } else {
        gameState.currentPhase = gameState.phases[gameState.currentPhaseIndex];
    }
    
    updateUI();
    updatePhaseButtons();
    animatePhase();
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
                            updateUI();
                            
                            // Reset negotiation choices for next turn
                            gameState.playerChoice = null;
                            gameState.rivalChoice = null;
                            
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
} 