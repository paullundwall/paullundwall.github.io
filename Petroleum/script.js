// Game State
let gameState = {
    currentTurn: 1,
    maxTurns: 20,
    currentPhase: 'Purchase',
    phases: ['Purchase', 'Drilling', 'Production', 'Trade', 'Negotiation'],
    currentPhaseIndex: 0,
    gameStarted: false,
    gameEnded: false,
    selectedTerritory: null,
    selectedConsumer: null,
    collusionActive: false,
    collusionSuccess: false,
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

// Territories Data
let territories = [
    {
        id: 1,
        name: "Saudi Arabia",
        cost: 4000,
        oilReserves: 1000,
        productionRate: 80,
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
        owner: null,
        drilled: false,
        exhausted: false
    }
];

// Consumer Countries Data
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
        name: "Netherlands",
        demand: 90,
        pricePerBarrel: 30,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 3,
        name: "Belgium",
        demand: 70,
        pricePerBarrel: 32,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 4,
        name: "Switzerland",
        demand: 60,
        pricePerBarrel: 35,
        relationship: 'neutral',
        contract: null
    },
    {
        id: 5,
        name: "Sweden",
        demand: 80,
        pricePerBarrel: 29,
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
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    document.getElementById('negotiateBtn').addEventListener('click', handleNegotiate);
    document.getElementById('sabotageBtn').addEventListener('click', handleSabotage);
    document.getElementById('endTurnBtn').addEventListener('click', endTurn);
    
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
    
    initializeGame();
    updateUI();
    addMessage("Game started! Petroleum & Sons begins operations.", 'system');
    animatePhase();
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
        
        territoryDiv.innerHTML = `
            <div class="territory-name">${territory.name}</div>
            <div class="territory-info">
                Cost: $${territory.cost.toLocaleString()}<br>
                Reserves: ${territory.oilReserves} barrels<br>
                Production: ${territory.productionRate}/turn
                ${territory.owner ? `<br>Owner: ${territory.owner === 'player' ? 'You' : 'Rival'}` : ''}
                ${territory.drilled ? '<br>🏭 Drilled' : ''}
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
        
        consumerDiv.innerHTML = `
            <div class="consumer-name">${consumer.name}</div>
            <div class="consumer-demand">
                Demand: ${consumer.demand} barrels<br>
                Price: $${consumer.pricePerBarrel}/barrel<br>
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
    const exportBtn = document.getElementById('exportBtn');
    const negotiateBtn = document.getElementById('negotiateBtn');
    const sabotageBtn = document.getElementById('sabotageBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    
    // Reset all buttons
    [buyBtn, drillBtn, exportBtn, negotiateBtn, sabotageBtn].forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Update end turn button text based on phase
    if (gameState.currentPhase === 'Negotiation') {
        endTurnBtn.textContent = 'End Turn';
    } else {
        endTurnBtn.textContent = 'End Phase';
    }
    
    // Enable/disable based on current phase and selections
    if (gameState.currentPhase === 'Purchase') {
        drillBtn.disabled = true;
        exportBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Drilling') {
        buyBtn.disabled = true;
        exportBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Production') {
        buyBtn.disabled = true;
        drillBtn.disabled = true;
        exportBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Trade') {
        buyBtn.disabled = true;
        drillBtn.disabled = true;
        negotiateBtn.disabled = true;
        sabotageBtn.disabled = true;
    } else if (gameState.currentPhase === 'Negotiation') {
        buyBtn.disabled = true;
        drillBtn.disabled = true;
        exportBtn.disabled = true;
        // Both collude and compete buttons stay enabled
    }
    
    // Update disabled button styles
    [buyBtn, drillBtn, exportBtn, negotiateBtn, sabotageBtn].forEach(btn => {
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
    
    addMessage(`Successfully purchased ${territory.name} for $${territory.cost.toLocaleString()}`, 'player');
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
    
    // Export oil
    const revenue = consumer.demand * consumer.pricePerBarrel;
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
    const collusionTypes = ['price_fixing', 'market_division', 'supply_control', 'export_quotas'];
    const randomType = collusionTypes[Math.floor(Math.random() * collusionTypes.length)];
    
    let offer, response;
    
    switch (randomType) {
        case 'price_fixing':
            offer = "Standard Oil proposes coordinating oil prices to maximize profits";
            response = Math.random() > 0.5 ? 'accept' : 'reject';
            break;
        case 'market_division':
            offer = "Standard Oil suggests dividing consumer markets between companies";
            response = Math.random() > 0.4 ? 'accept' : 'reject';
            break;
        case 'supply_control':
            offer = "Standard Oil proposes limiting oil production to increase prices";
            response = Math.random() > 0.6 ? 'accept' : 'reject';
            break;
        case 'export_quotas':
            offer = "Standard Oil offers to coordinate export quotas";
            response = Math.random() > 0.5 ? 'accept' : 'reject';
            break;
    }
    
    addMessage(offer, 'rival');
    
    if (response === 'accept') {
        addMessage("Collusion successful! Oil prices will increase next turn.", 'system');
        gameState.collusionActive = true;
        gameState.collusionSuccess = true;
        rival.strategy = 'cooperative';
    } else {
        addMessage("Standard Oil rejected the collusion. Price war begins!", 'system');
        gameState.collusionActive = true;
        gameState.collusionSuccess = false;
        rival.strategy = 'aggressive';
    }
    
    updateUI();
}

function handleSabotage() {
    const competitionCost = 1500;
    if (player.money < competitionCost) {
        addMessage("Insufficient funds for competitive action!", 'system');
        return;
    }
    
    const competitionTypes = ['price_war', 'market_aggression', 'supply_dumping', 'exclusive_deals'];
    const randomType = competitionTypes[Math.floor(Math.random() * competitionTypes.length)];
    
    let action, success;
    
    switch (randomType) {
        case 'price_war':
            action = "Initiated aggressive price competition";
            success = Math.random() > 0.4; // 60% success rate
            break;
        case 'market_aggression':
            action = "Launched aggressive marketing campaign";
            success = Math.random() > 0.3; // 70% success rate
            break;
        case 'supply_dumping':
            action = "Flooded market with cheap oil";
            success = Math.random() > 0.5; // 50% success rate
            break;
        case 'exclusive_deals':
            action = "Negotiated exclusive consumer contracts";
            success = Math.random() > 0.6; // 40% success rate
            break;
    }
    
    player.money -= competitionCost;
    
    if (success) {
        addMessage(`${action} - Competition successful!`, 'player');
        player.money += 2500; // Net gain of 1000
        rival.money -= 1000;
        
        // Rival becomes aggressive
        rival.strategy = 'aggressive';
        
        // Worsen relationships with consumers (competitive behavior)
        consumers.forEach(consumer => {
            if (consumer.relationship === 'allied') {
                consumer.relationship = 'friendly';
            } else if (consumer.relationship === 'friendly') {
                consumer.relationship = 'neutral';
            } else if (consumer.relationship === 'neutral') {
                consumer.relationship = 'hostile';
            }
        });
    } else {
        addMessage(`${action} - Competition failed! Market backlash.`, 'system');
        rival.strategy = 'aggressive';
        
        // Worse relationships due to failed aggressive tactics
        consumers.forEach(consumer => {
            if (consumer.relationship === 'friendly') {
                consumer.relationship = 'neutral';
            } else if (consumer.relationship === 'neutral') {
                consumer.relationship = 'hostile';
            }
        });
    }
    
    updateUI();
    renderConsumers();
}

function endTurn() {
    // Production phase - generate oil (automatically triggered, no user action needed)
    if (gameState.currentPhase === 'Drilling') {
        let totalProduction = 0;
        territories.forEach(territory => {
            if (territory.owner === 'player' && territory.drilled && !territory.exhausted) {
                totalProduction += territory.productionRate;
                territory.oilReserves -= territory.productionRate;
                
                if (territory.oilReserves <= 0) {
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
        
        rivalTurn();
        
        // Check if game should end
        gameState.currentTurn++;
        if (gameState.currentTurn > gameState.maxTurns) {
            endGame();
            return;
        }
    } else {
        gameState.currentPhase = gameState.phases[gameState.currentPhaseIndex];
    }
    
    updateUI();
    updatePhaseButtons();
    animatePhase();
}

function rivalTurn() {
    addMessage("Standard Oil Corporation's turn begins...", 'rival');
    
    // Apply collusion effects at start of new turn
    if (gameState.collusionActive) {
        applyCollusionEffects();
        gameState.collusionActive = false;
    }
    
    // Rival AI logic
    setTimeout(() => {
        rivalBuyLand();
        
        setTimeout(() => {
            rivalDrillOil();
            
            setTimeout(() => {
                rivalProduction();
                
                setTimeout(() => {
                    rivalExport();
                    
                    setTimeout(() => {
                        rivalNegotiation();
                        addMessage("Standard Oil Corporation's turn ends", 'rival');
                        updateUI();
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
            
            addMessage(`Standard Oil purchased ${bestTerritory.name}`, 'rival');
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

function rivalProduction() {
    let totalProduction = 0;
    territories.forEach(territory => {
        if (territory.owner === 'rival' && territory.drilled && !territory.exhausted) {
            totalProduction += territory.productionRate;
            territory.oilReserves -= territory.productionRate;
            
            if (territory.oilReserves <= 0) {
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
            const revenue = consumer.demand * consumer.pricePerBarrel;
            rival.oil -= consumer.demand;
            rival.money += revenue;
            
            addMessage(`Standard Oil exported to ${consumer.name}`, 'rival');
        }
    });
}

function rivalNegotiation() {
    if (rival.strategy === 'aggressive' && Math.random() > 0.5) {
        // Attempt competitive action
        if (rival.money >= 1500) {
            const success = Math.random() > 0.4; // 60% success rate
            
            if (success) {
                rival.money -= 1500;
                rival.money += 2500; // Net gain of 1000
                player.money -= 1000;
                
                addMessage(`Standard Oil launched aggressive competition against you!`, 'rival');
            } else {
                rival.money -= 1500;
                addMessage("Standard Oil's competitive action failed!", 'system');
            }
        }
    }
}

function applyCollusionEffects() {
    if (gameState.collusionSuccess) {
        // Successful collusion - increase all consumer prices
        consumers.forEach(consumer => {
            consumer.pricePerBarrel = Math.round(consumer.pricePerBarrel * 1.15); // 15% increase
        });
        addMessage("Collusion successful! Consumer prices increased across the board.", 'system');
    } else {
        // Failed collusion - decrease all consumer prices
        consumers.forEach(consumer => {
            consumer.pricePerBarrel = Math.round(consumer.pricePerBarrel * 0.9); // 10% decrease
        });
        addMessage("Collusion failed! Price war caused consumer prices to drop.", 'system');
    }
    renderConsumers();
}

function animatePhase() {
    const phaseIcon = document.getElementById('phaseIcon');
    const phaseAnimation = document.getElementById('phaseAnimation');
    
    if (!phaseIcon || !phaseAnimation) return;
    
    let icon = '';
    switch (gameState.currentPhase) {
        case 'Purchase':
            icon = '🏞️';
            break;
        case 'Drilling':
            icon = '🏭';
            break;
        case 'Production':
            icon = '⚙️';
            break;
        case 'Trade':
            icon = '🚢';
            break;
        case 'Negotiation':
            icon = '🤝';
            break;
    }
    
    phaseIcon.textContent = icon;
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