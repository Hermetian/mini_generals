import { GameEngine } from './engine';
import { GameRenderer } from './renderer';
import { Position, Unit, UnitType, FactionType, ResourceType, GameState } from './types';

export class GameController {
  private engine: GameEngine;
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;
  private playerId: string;
  private isMouseDown: boolean = false;
  private selectionStart: Position | null = null;
  private selectedUnits: Unit[] = [];
  private gameRunning: boolean = true;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, mapWidth: number, mapHeight: number) {
    this.canvas = canvas;
    this.engine = new GameEngine(mapWidth, mapHeight);
    this.renderer = new GameRenderer(canvas);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize player
    this.playerId = this.engine.addPlayer('Player', FactionType.USA);
    
    // Add AI opponents
    this.engine.addPlayer('AI 1', FactionType.CHINA);
    this.engine.addPlayer('AI 2', FactionType.GLA);
    
    // Start game loop
    this.startGameLoop();
  }

  // Exposed methods for main.ts
  public getState(): GameState {
    return this.engine.getState();
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public createUnit(typeIndex: number): void {
    if (!this.gameRunning) return;
    
    let unitType: UnitType;
    
    switch (typeIndex) {
      case 0:
        unitType = UnitType.SOLDIER;
        break;
      case 1:
        unitType = UnitType.TANK;
        break;
      case 2:
        unitType = UnitType.HELICOPTER;
        break;
      default:
        return;
    }
    
    const state = this.engine.getState();
    const player = state.players[this.playerId];
    
    if (!player) return;
    
    // Get player base position
    const basePosition = player.basePosition;
    
    // Create unit slightly offset from base
    const randomOffset = () => Math.random() * 60 - 30;
    const position = {
      x: basePosition.x + randomOffset(),
      y: basePosition.y + randomOffset(),
    };
    
    // Create the unit
    this.engine.createUnit(this.playerId, unitType, position);
  }

  // Set up event listeners for user input
  private setupEventListeners(): void {
    // Mouse down event for selection
    this.canvas.addEventListener('mousedown', (event) => {
      if (!this.gameRunning) return;
      
      // Prevent default browser scrolling behavior
      event.preventDefault();
      
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.isMouseDown = true;
      this.selectionStart = { x, y };
      
      // If not holding shift, clear selection
      if (!event.shiftKey) {
        this.selectedUnits = [];
      }
    });
    
    // Mouse move event for selection box
    this.canvas.addEventListener('mousemove', (event) => {
      if (!this.gameRunning || !this.isMouseDown || !this.selectionStart) return;
      
      // Prevent default browser scrolling behavior
      event.preventDefault();
      
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Redraw the scene with selection box
      this.renderGameWithSelectionBox({ x, y });
    });
    
    // Mouse up event for finishing selection or issuing commands
    this.canvas.addEventListener('mouseup', (event) => {
      if (!this.gameRunning) {
        // If game is over, restart on click
        this.restartGame();
        return;
      }
      
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      if (this.isMouseDown && this.selectionStart) {
        // Selection mode
        if (
          Math.abs(x - this.selectionStart.x) > 5 ||
          Math.abs(y - this.selectionStart.y) > 5
        ) {
          // Selection box drag
          this.selectUnitsInBox(this.selectionStart, { x, y });
        } else {
          // Single click
          this.handleSingleClick({ x, y }, event.shiftKey);
        }
      }
      
      this.isMouseDown = false;
      this.selectionStart = null;
    });
    
    // Right click for unit movement/attack
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      
      if (!this.gameRunning || this.selectedUnits.length === 0) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.issueCommand({ x, y });
    });
    
    // Keyboard shortcuts
    window.addEventListener('keydown', (event) => {
      if (!this.gameRunning) return;
      
      switch (event.key) {
        case 'Escape':
          // Clear selection
          this.selectedUnits = [];
          break;
          
        case '1':
        case '2':
        case '3':
          // Create units at base
          this.createUnit(parseInt(event.key) - 1);
          break;
          
        case 'd':
          // Toggle debug mode
          this.renderer.setDebugMode(true);
          break;
      }
    });
    
    window.addEventListener('keyup', (event) => {
      if (event.key === 'd') {
        this.renderer.setDebugMode(false);
      }
    });
  }

  // Start the game loop
  private startGameLoop(): void {
    const gameLoop = () => {
      if (!this.gameRunning) return;
      
      // Update game state
      this.engine.update();
      
      // Render the game
      this.renderer.render(this.engine.getState());
      this.renderer.highlightSelectedUnits(this.selectedUnits);
      
      // Check for game over condition
      this.checkGameOver();
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Start the loop
    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Render the game with a selection box
  private renderGameWithSelectionBox(currentPos: Position): void {
    if (!this.selectionStart) return;
    
    // Render the game
    this.renderer.render(this.engine.getState());
    
    // Draw the selection box
    this.renderer.drawSelectionBox(this.selectionStart, currentPos);
    
    // Highlight already selected units
    this.renderer.highlightSelectedUnits(this.selectedUnits);
  }

  // Handle a single click (select a unit or target)
  private handleSingleClick(position: Position, addToSelection: boolean): void {
    const state = this.engine.getState();
    
    // Check if clicked on a unit
    let clickedUnit: Unit | null = null;
    
    Object.values(state.units).forEach(unit => {
      if (unit.isDead) return;
      
      const dx = position.x - unit.position.x;
      const dy = position.y - unit.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Simple circular hit detection
      const hitRadius = unit.type === UnitType.TANK ? 15 : 10;
      
      if (distance <= hitRadius) {
        clickedUnit = unit;
      }
    });
    
    if (clickedUnit) {
      const unit = clickedUnit as Unit;
      if (unit.playerId === this.playerId) {
        // Select own unit
        if (addToSelection) {
          // Add to selection if not already selected
          if (!this.selectedUnits.some(u => u.id === unit.id)) {
            this.selectedUnits.push(unit);
          }
        } else {
          // Replace selection
          this.selectedUnits = [unit];
        }
      } else if (this.selectedUnits.length > 0) {
        // Target enemy unit
        this.selectedUnits.forEach(selectedUnit => {
          this.engine.attackUnit(selectedUnit.id, unit.id);
        });
      }
    } else if (this.selectedUnits.length > 0) {
      // Clicked on empty space with units selected - MOVE command
      this.moveSelectedUnitsTo(position);
    } else if (!addToSelection) {
      // Clicked on empty space, clear selection
      this.selectedUnits = [];
    }
  }

  // Move selected units to target position
  private moveSelectedUnitsTo(targetPos: Position): void {
    // Arrange units in a rough formation
    const unitCount = this.selectedUnits.length;
    const formationSize = Math.ceil(Math.sqrt(unitCount));
    const spacing = 30; // Space between units
    
    this.selectedUnits.forEach((unit, index) => {
      const row = Math.floor(index / formationSize);
      const col = index % formationSize;
      
      const offsetX = (col - formationSize / 2) * spacing;
      const offsetY = (row - formationSize / 2) * spacing;
      
      const unitTargetPos = {
        x: targetPos.x + offsetX,
        y: targetPos.y + offsetY,
      };
      
      this.engine.moveUnit(unit.id, unitTargetPos);
    });
  }

  // Select units within a box
  private selectUnitsInBox(startPos: Position, endPos: Position): void {
    const state = this.engine.getState();
    const minX = Math.min(startPos.x, endPos.x);
    const maxX = Math.max(startPos.x, endPos.x);
    const minY = Math.min(startPos.y, endPos.y);
    const maxY = Math.max(startPos.y, endPos.y);
    
    // Find all player units in the box
    const unitsInBox = Object.values(state.units).filter(unit => {
      if (unit.isDead || unit.playerId !== this.playerId) return false;
      
      return (
        unit.position.x >= minX &&
        unit.position.x <= maxX &&
        unit.position.y >= minY &&
        unit.position.y <= maxY
      );
    });
    
    // Add units to selection
    unitsInBox.forEach(unit => {
      if (!this.selectedUnits.some(u => u.id === unit.id)) {
        this.selectedUnits.push(unit);
      }
    });
  }

  // Issue a move or attack command to selected units
  private issueCommand(targetPos: Position): void {
    const state = this.engine.getState();
    
    // Check if the target position is on an enemy unit
    let targetUnit: Unit | null = null;
    
    Object.values(state.units).forEach(unit => {
      if (unit.isDead || unit.playerId === this.playerId) return;
      
      const dx = targetPos.x - unit.position.x;
      const dy = targetPos.y - unit.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Simple circular hit detection
      const hitRadius = unit.type === UnitType.TANK ? 15 : 10;
      
      if (distance <= hitRadius) {
        targetUnit = unit;
      }
    });
    
    if (targetUnit) {
      // Attack the target unit
      this.selectedUnits.forEach(unit => {
        this.engine.attackUnit(unit.id, targetUnit!.id);
      });
    } else {
      // Move to the target position
      this.moveSelectedUnitsTo(targetPos);
    }
  }

  // Check if the game should end
  private checkGameOver(): void {
    const state = this.engine.getState();
    const activePlayers = Object.values(state.players).filter(player => 
      player.units.length > 0 || 
      (player.resources[ResourceType.MONEY] >= 100 && player.resources[ResourceType.SUPPLIES] >= 50)
    );
    
    if (activePlayers.length <= 1) {
      this.gameRunning = false;
      
      // Draw game over screen
      const winner = activePlayers.length === 1 ? activePlayers[0].name : "Nobody";
      this.renderer.drawGameOver(winner);
      
      // Clean up
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  // Restart the game
  private restartGame(): void {
    // Reset game state
    this.engine = new GameEngine(this.canvas.width, this.canvas.height);
    this.selectedUnits = [];
    this.gameRunning = true;
    
    // Initialize player
    this.playerId = this.engine.addPlayer('Player', FactionType.USA);
    
    // Add AI opponents
    this.engine.addPlayer('AI 1', FactionType.CHINA);
    this.engine.addPlayer('AI 2', FactionType.GLA);
    
    // Start game loop
    this.startGameLoop();
  }
} 