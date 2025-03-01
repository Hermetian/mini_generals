import { GameController } from './controller';
import { ResourceType } from './types';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get the canvas element
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Set canvas initial size (will be adjusted by renderer)
  canvas.width = 900;
  canvas.height = 600;

  // Initialize game controller with canvas and map dimensions
  const gameController = new GameController(canvas, 900, 600);

  // Set up unit creation buttons
  const soldierBtn = document.getElementById('soldier-btn');
  const tankBtn = document.getElementById('tank-btn');
  const helicopterBtn = document.getElementById('helicopter-btn');

  if (soldierBtn) {
    soldierBtn.addEventListener('click', () => {
      gameController.createUnit(0); // 0 = SOLDIER
    });
  }

  if (tankBtn) {
    tankBtn.addEventListener('click', () => {
      gameController.createUnit(1); // 1 = TANK
    });
  }

  if (helicopterBtn) {
    helicopterBtn.addEventListener('click', () => {
      gameController.createUnit(2); // 2 = HELICOPTER
    });
  }

  // Update the resource display
  setInterval(() => {
    const gameState = gameController.getState();
    if (!gameState || !gameState.players) return;
    
    const player = Object.values(gameState.players).find(p => p.id === gameController.getPlayerId());
    if (!player) return;
    
    // Update money display
    const moneyElement = document.getElementById('money');
    if (moneyElement) {
      moneyElement.textContent = player.resources[ResourceType.MONEY].toString();
    }
    
    // Update supplies display
    const suppliesElement = document.getElementById('supplies');
    if (suppliesElement) {
      suppliesElement.textContent = player.resources[ResourceType.SUPPLIES].toString();
    }
    
    // Update unit costs based on player's unit count
    const unitCount = player.units.length;
    const soldierCostElement = document.getElementById('soldier-cost');
    const tankCostElement = document.getElementById('tank-cost');
    const helicopterCostElement = document.getElementById('helicopter-cost');
    
    if (soldierCostElement) {
      const baseCost = 100;
      const scaledCost = Math.floor(baseCost * (1 + unitCount * 0.05));
      soldierCostElement.textContent = scaledCost.toString();
    }
    
    if (tankCostElement) {
      const baseCost = 300;
      const scaledCost = Math.floor(baseCost * (1 + unitCount * 0.05));
      tankCostElement.textContent = scaledCost.toString();
    }
    
    if (helicopterCostElement) {
      const baseCost = 500;
      const scaledCost = Math.floor(baseCost * (1 + unitCount * 0.05));
      helicopterCostElement.textContent = scaledCost.toString();
    }
  }, 1000);
}); 