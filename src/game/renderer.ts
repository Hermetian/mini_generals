import { GameState, Unit, Resource, UnitType, ResourceType, Position } from './types';

// Unit sprite dimensions
const UNIT_SIZE = {
  [UnitType.SOLDIER]: { width: 20, height: 20 },
  [UnitType.TANK]: { width: 30, height: 30 },
  [UnitType.HELICOPTER]: { width: 25, height: 25 },
};

// Resource sprite dimensions
const RESOURCE_SIZE = {
  [ResourceType.MONEY]: { width: 20, height: 20 },
  [ResourceType.SUPPLIES]: { width: 20, height: 20 },
};

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private unitImages: Map<UnitType, HTMLImageElement> = new Map();
  private resourceImages: Map<ResourceType, HTMLImageElement> = new Map();
  private baseImage: HTMLImageElement;
  private debugMode: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;
    
    // Load unit images
    this.loadUnitImages();
    
    // Load resource images
    this.loadResourceImages();
    
    // Load base image
    this.baseImage = new Image();
    this.baseImage.src = '/mini_generals/assets/images/base.svg';
  }

  // Load unit images
  private loadUnitImages(): void {
    Object.values(UnitType).forEach(unitType => {
      const img = new Image();
      img.src = `/mini_generals/assets/images/${unitType.toLowerCase()}.svg`;
      this.unitImages.set(unitType, img);
    });
  }

  // Load resource images
  private loadResourceImages(): void {
    Object.values(ResourceType).forEach(resourceType => {
      const img = new Image();
      img.src = `/mini_generals/assets/images/${resourceType.toLowerCase()}.svg`;
      this.resourceImages.set(resourceType, img);
    });
  }

  // Set debug mode
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // Render the game state
  public render(state: GameState): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set canvas to match map dimensions
    this.canvas.width = state.mapSize.width;
    this.canvas.height = state.mapSize.height;
    
    // Draw background
    this.drawBackground(state);
    
    // Draw resources
    this.drawResources(state);
    
    // Draw player bases
    this.drawBases(state);
    
    // Draw units
    this.drawUnits(state);
    
    // Draw debug info if enabled
    if (this.debugMode) {
      this.drawDebugInfo(state);
    }
  }

  // Draw the background
  private drawBackground(state: GameState): void {
    // Draw grass background
    this.ctx.fillStyle = '#4a7c59'; // Green grass color
    this.ctx.fillRect(0, 0, state.mapSize.width, state.mapSize.height);
    
    // Draw some random details to make the map more interesting
    const details = 50;
    this.ctx.fillStyle = '#3d6549'; // Darker grass patches
    
    for (let i = 0; i < details; i++) {
      const x = Math.random() * state.mapSize.width;
      const y = Math.random() * state.mapSize.height;
      const size = Math.random() * 30 + 10;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Draw all resources
  private drawResources(state: GameState): void {
    Object.values(state.resources).forEach(resource => {
      if (resource.isCollected) return; // Don't draw collected resources
      
      const img = this.resourceImages.get(resource.type);
      if (!img) return;
      
      const size = RESOURCE_SIZE[resource.type];
      
      // Draw resource icon
      this.ctx.drawImage(
        img,
        resource.position.x - size.width / 2,
        resource.position.y - size.height / 2,
        size.width,
        size.height
      );
      
      // Draw resource type indicator
      this.ctx.font = '10px Arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        resource.type === ResourceType.MONEY ? '$' : 'S',
        resource.position.x,
        resource.position.y - size.height
      );
    });
  }

  // Draw player bases
  private drawBases(state: GameState): void {
    Object.values(state.players).forEach(player => {
      // Draw base
      this.ctx.drawImage(
        this.baseImage,
        player.basePosition.x - 40,
        player.basePosition.y - 40,
        80,
        80
      );
      
      // Draw player name
      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = player.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        player.name,
        player.basePosition.x,
        player.basePosition.y - 50
      );
      
      // Draw faction
      this.ctx.font = '10px Arial';
      this.ctx.fillText(
        player.faction,
        player.basePosition.x,
        player.basePosition.y - 35
      );
    });
  }

  // Draw all units
  private drawUnits(state: GameState): void {
    // First draw attack lines
    this.drawAttackLines(state);
    
    Object.values(state.units).forEach(unit => {
      if (unit.isDead) return; // Don't draw dead units
      
      const player = state.players[unit.playerId];
      if (!player) return;
      
      const unitImg = this.unitImages.get(unit.type);
      if (!unitImg) return;
      
      const size = UNIT_SIZE[unit.type];
      
      // Draw unit
      this.ctx.save();
      
      // Calculate rotation if unit is moving or attacking
      if (unit.isMoving && unit.path && unit.path.length > 0) {
        const targetPos = unit.path[0];
        const angle = Math.atan2(
          targetPos.y - unit.position.y,
          targetPos.x - unit.position.x
        );
        
        // Rotate around unit center
        this.ctx.translate(unit.position.x, unit.position.y);
        this.ctx.rotate(angle);
        this.ctx.translate(-unit.position.x, -unit.position.y);
      } else if (unit.isAttacking && unit.targetId) {
        const target = state.units[unit.targetId];
        if (target) {
          const angle = Math.atan2(
            target.position.y - unit.position.y,
            target.position.x - unit.position.x
          );
          
          // Rotate around unit center
          this.ctx.translate(unit.position.x, unit.position.y);
          this.ctx.rotate(angle);
          this.ctx.translate(-unit.position.x, -unit.position.y);
        }
      }
      
      // Draw unit image
      this.ctx.drawImage(
        unitImg,
        unit.position.x - size.width / 2,
        unit.position.y - size.height / 2,
        size.width,
        size.height
      );
      
      this.ctx.restore();
      
      // Draw health bar
      const healthBarWidth = size.width;
      const healthBarHeight = 4;
      const healthPercent = unit.health / unit.maxHealth;
      
      // Health bar background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(
        unit.position.x - healthBarWidth / 2,
        unit.position.y - size.height / 2 - 8,
        healthBarWidth,
        healthBarHeight
      );
      
      // Health bar fill
      this.ctx.fillStyle = healthPercent > 0.5 ? 'green' : healthPercent > 0.25 ? 'yellow' : 'red';
      this.ctx.fillRect(
        unit.position.x - healthBarWidth / 2,
        unit.position.y - size.height / 2 - 8,
        healthBarWidth * healthPercent,
        healthBarHeight
      );
      
      // Draw player color indicator
      this.ctx.strokeStyle = player.color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(
        unit.position.x,
        unit.position.y,
        size.width / 2 + 2,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
      
      // Draw unit state indicators
      if (unit.isAttacking) {
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(
          unit.position.x + size.width / 2,
          unit.position.y - size.height / 2,
          3,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      } else if (unit.isMoving) {
        this.ctx.fillStyle = 'blue';
        this.ctx.beginPath();
        this.ctx.arc(
          unit.position.x + size.width / 2,
          unit.position.y - size.height / 2,
          3,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    });
  }

  // Draw attack lines between units and their targets
  private drawAttackLines(state: GameState): void {
    Object.values(state.units).forEach(unit => {
      if (unit.isDead || !unit.isAttacking || !unit.targetId) return;
      
      const target = state.units[unit.targetId];
      if (!target || target.isDead) return;
      
      // Draw attack line
      this.ctx.beginPath();
      this.ctx.moveTo(unit.position.x, unit.position.y);
      this.ctx.lineTo(target.position.x, target.position.y);
      
      // Set line style based on unit type
      if (unit.type === UnitType.SOLDIER) {
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow for soldiers
        this.ctx.lineWidth = 1;
      } else if (unit.type === UnitType.TANK) {
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red for tanks
        this.ctx.lineWidth = 2;
      } else if (unit.type === UnitType.HELICOPTER) {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan for helicopters
        this.ctx.lineWidth = 1.5;
      }
      
      this.ctx.stroke();
      
      // Draw an impact effect at the target for visual feedback
      if (Math.random() < 0.2) { // Only show the effect occasionally for better visuals
        this.ctx.beginPath();
        this.ctx.arc(target.position.x, target.position.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
        this.ctx.fill();
      }
    });
  }

  // Draw debug information
  private drawDebugInfo(state: GameState): void {
    // Draw FPS and game time
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Game Time: ${state.gameTime.toFixed(2)}s`, 10, 20);
    
    // Draw unit counts
    let y = 40;
    Object.values(state.players).forEach(player => {
      this.ctx.fillStyle = player.color;
      this.ctx.fillText(
        `${player.name}: ${player.units.length} units`,
        10,
        y
      );
      y += 15;
      
      // Count unit types
      const unitCounts = player.units.reduce<Record<UnitType, number>>(
        (counts, unit) => {
          counts[unit.type] = (counts[unit.type] || 0) + 1;
          return counts;
        },
        {} as Record<UnitType, number>
      );
      
      Object.entries(unitCounts).forEach(([type, count]) => {
        this.ctx.fillText(`  ${type}: ${count}`, 20, y);
        y += 15;
      });
      
      // Show resources
      this.ctx.fillText(
        `  Money: ${player.resources[ResourceType.MONEY]}`,
        20,
        y
      );
      y += 15;
      this.ctx.fillText(
        `  Supplies: ${player.resources[ResourceType.SUPPLIES]}`,
        20,
        y
      );
      y += 25;
    });
  }

  // Draw selection box
  public drawSelectionBox(startPos: Position, endPos: Position): void {
    const width = endPos.x - startPos.x;
    const height = endPos.y - startPos.y;
    
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 3]);
    this.ctx.strokeRect(startPos.x, startPos.y, width, height);
    this.ctx.setLineDash([]);
  }

  // Highlight selected units
  public highlightSelectedUnits(units: Unit[]): void {
    units.forEach(unit => {
      if (unit.isDead) return;
      
      const size = UNIT_SIZE[unit.type];
      
      // Draw selection circle
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([3, 2]);
      this.ctx.beginPath();
      this.ctx.arc(
        unit.position.x,
        unit.position.y,
        size.width / 2 + 5,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    });
  }

  // Draw game over screen
  public drawGameOver(winner: string): void {
    // Darken the screen
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw game over text
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    // Draw winner text
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `${winner} wins!`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    
    // Draw restart instructions
    this.ctx.font = '18px Arial';
    this.ctx.fillText(
      'Click to play again',
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    );
  }
} 