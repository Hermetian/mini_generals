import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Unit,
  Position,
  Player,
  Resource,
  UnitType,
  FactionType,
  ResourceType,
  UnitCost
} from './types';

// Base costs for units
const BASE_UNIT_COSTS: Record<UnitType, UnitCost> = {
  [UnitType.SOLDIER]: {
    [ResourceType.MONEY]: 150,
  },
  [UnitType.TANK]: {
    [ResourceType.MONEY]: 450,
  },
  [UnitType.HELICOPTER]: {
    [ResourceType.MONEY]: 700,
  },
};

// Unit stats
const UNIT_STATS: Record<UnitType, Omit<Unit, 'id' | 'position' | 'playerId' | 'targetId' | 'path' | 'isDead' | 'isMoving' | 'isAttacking'>> = {
  [UnitType.SOLDIER]: {
    type: UnitType.SOLDIER,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    range: 3,
    speed: 2,
    canAttackAir: true,
    canAttackGround: true,
  },
  [UnitType.TANK]: {
    type: UnitType.TANK,
    health: 300,
    maxHealth: 300,
    attack: 30,
    defense: 20,
    range: 5,
    speed: 1.5,
    canAttackAir: false,
    canAttackGround: true,
  },
  [UnitType.HELICOPTER]: {
    type: UnitType.HELICOPTER,
    health: 200,
    maxHealth: 200,
    attack: 25,
    defense: 10,
    range: 7,
    speed: 3,
    canAttackAir: true,
    canAttackGround: true,
  },
};

// Resource generation config
const RESOURCE_CONFIG = {
  respawnTime: 30, // seconds
  resourceAmount: {
    [ResourceType.MONEY]: 150,
  },
  mapResourceCount: {
    [ResourceType.MONEY]: 15,
  },
};

export class GameEngine {
  private state: GameState;
  private lastUpdateTime: number;
  private resourceSpots: Position[] = [];

  constructor(mapWidth: number, mapHeight: number) {
    this.state = {
      players: {},
      units: {},
      resources: {},
      gameTime: 0,
      mapSize: {
        width: mapWidth,
        height: mapHeight,
      },
    };
    this.lastUpdateTime = Date.now();
    this.generateResourceSpots();
  }

  // Initialize resource positions
  private generateResourceSpots(): void {
    const { width, height } = this.state.mapSize;
    const totalSpots = RESOURCE_CONFIG.mapResourceCount[ResourceType.MONEY];
    
    // Create resource positions around the map
    for (let i = 0; i < totalSpots; i++) {
      const margin = 100; // Keep resources away from edges
      const position: Position = {
        x: Math.random() * (width - 2 * margin) + margin,
        y: Math.random() * (height - 2 * margin) + margin,
      };
      this.resourceSpots.push(position);
    }
    
    // Generate initial resources
    this.spawnResources();
  }

  // Create resources on the map
  private spawnResources(): void {
    const moneyCount = RESOURCE_CONFIG.mapResourceCount[ResourceType.MONEY];
    
    // Create money resources
    for (let i = 0; i < moneyCount; i++) {
      const resource: Resource = {
        id: uuidv4(),
        type: ResourceType.MONEY,
        position: this.resourceSpots[i],
        amount: RESOURCE_CONFIG.resourceAmount[ResourceType.MONEY],
        respawnTime: RESOURCE_CONFIG.respawnTime,
        isCollected: false,
      };
      this.state.resources[resource.id] = resource;
    }
  }

  // Get current game state
  public getState(): GameState {
    return this.state;
  }

  // Add a player to the game
  public addPlayer(name: string, faction: FactionType): string {
    const playerId = uuidv4();
    const { width, height } = this.state.mapSize;
    
    // Generate random base position
    const basePosition: Position = {
      x: Math.random() * (width - 200) + 100,
      y: Math.random() * (height - 200) + 100,
    };
    
    // Generate random color for player
    const playerColors = [
      '#FF5733', // Red
      '#33FF57', // Green
      '#3357FF', // Blue
      '#F3FF33', // Yellow
      '#FF33F3', // Pink
    ];
    
    const color = playerColors[Object.keys(this.state.players).length % playerColors.length];
    
    const player: Player = {
      id: playerId,
      name,
      faction,
      resources: {
        [ResourceType.MONEY]: 800, // Starting money (increased since it's the only resource now)
      },
      units: [],
      basePosition,
      color,
    };
    
    this.state.players[playerId] = player;
    
    // Create initial units for the player
    this.createUnit(playerId, UnitType.SOLDIER, {
      x: basePosition.x - 20,
      y: basePosition.y - 20,
    });
    
    this.createUnit(playerId, UnitType.SOLDIER, {
      x: basePosition.x + 20,
      y: basePosition.y - 20,
    });
    
    this.createUnit(playerId, UnitType.TANK, {
      x: basePosition.x,
      y: basePosition.y + 20,
    });
    
    return playerId;
  }

  // Create a new unit for a player
  public createUnit(playerId: string, unitType: UnitType, position: Position): string | null {
    const player = this.state.players[playerId];
    if (!player) return null;
    
    // Calculate cost scaling based on number of units
    const scalingFactor = 1 + (player.units.length * 0.1); // 10% increase per unit
    const unitCost = {
      [ResourceType.MONEY]: Math.floor(BASE_UNIT_COSTS[unitType][ResourceType.MONEY] * scalingFactor),
    };
    
    // Check if player has enough resources
    if (
      player.resources[ResourceType.MONEY] < unitCost[ResourceType.MONEY]
    ) {
      return null; // Not enough resources
    }
    
    // Deduct resources
    player.resources[ResourceType.MONEY] -= unitCost[ResourceType.MONEY];
    
    // Create unit
    const unitId = uuidv4();
    const unitStats = UNIT_STATS[unitType];
    
    const unit: Unit = {
      id: unitId,
      ...unitStats,
      position,
      playerId,
      isDead: false,
      isMoving: false,
      isAttacking: false,
    };
    
    this.state.units[unitId] = unit;
    player.units.push(unit);
    
    return unitId;
  }

  // Move a unit to a new position
  public moveUnit(unitId: string, targetPosition: Position): boolean {
    const unit = this.state.units[unitId];
    if (!unit || unit.isDead) return false;
    
    // Calculate path (simple direct path for now)
    unit.path = [targetPosition];
    unit.isMoving = true;
    unit.isAttacking = false;
    unit.targetId = undefined;
    
    return true;
  }

  // Command a unit to attack an enemy unit
  public attackUnit(attackerId: string, targetId: string): boolean {
    const attacker = this.state.units[attackerId];
    const target = this.state.units[targetId];
    
    if (
      !attacker || 
      !target || 
      attacker.isDead || 
      target.isDead || 
      attacker.playerId === target.playerId
    ) {
      return false;
    }
    
    // Check if this unit can attack the target type
    if (!this.canUnitAttackTarget(attacker, target)) {
      return false;
    }
    
    attacker.targetId = targetId;
    attacker.isAttacking = true;
    
    return true;
  }

  // Update the game state (called on each frame)
  public update(): void {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;
    
    this.state.gameTime += deltaTime;
    
    this.updateUnits(deltaTime);
    this.updateResources(deltaTime);
    this.collectResources();
  }

  // Update all units (movement, combat, etc.)
  private updateUnits(deltaTime: number): void {
    Object.values(this.state.units).forEach(unit => {
      if (unit.isDead) return;
      
      // First check if the unit should auto-acquire a target
      this.checkForAutoTarget(unit);
      
      // Handle movement
      if (unit.isMoving && unit.path && unit.path.length > 0) {
        const targetPos = unit.path[0];
        
        // Calculate direction and distance
        const dx = targetPos.x - unit.position.x;
        const dy = targetPos.y - unit.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) {
          // Reached destination
          unit.path.shift();
          if (unit.path.length === 0) {
            unit.isMoving = false;
          }
        } else {
          // Move towards destination
          const moveDistance = unit.speed * deltaTime * 60;
          const ratio = Math.min(moveDistance / distance, 1);
          
          unit.position.x += dx * ratio;
          unit.position.y += dy * ratio;
        }
      }
      
      // Handle combat
      if (unit.isAttacking && unit.targetId) {
        const target = this.state.units[unit.targetId];
        
        if (!target || target.isDead) {
          unit.isAttacking = false;
          unit.targetId = undefined;
          return;
        }
        
        // Check if this unit can attack the target type
        const canAttack = this.canUnitAttackTarget(unit, target);
        if (!canAttack) {
          unit.isAttacking = false;
          unit.targetId = undefined;
          return;
        }
        
        // Calculate distance to target
        const dx = target.position.x - unit.position.x;
        const dy = target.position.y - unit.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= unit.range * 20) { // Range in game units
          // Within attack range, deal damage
          // Attack every second
          if (Math.floor(this.state.gameTime) > Math.floor(this.state.gameTime - deltaTime)) {
            const damage = Math.max(1, unit.attack - target.defense / 2);
            target.health -= damage;
            
            if (target.health <= 0) {
              target.health = 0;
              target.isDead = true;
              
              // Remove dead unit from player's units array
              const player = this.state.players[target.playerId];
              if (player) {
                player.units = player.units.filter(u => u.id !== target.id);
              }
            }
          }
        } else {
          // Move towards target to get in range
          const moveDistance = unit.speed * deltaTime * 60;
          const ratio = Math.min(moveDistance / distance, 1);
          
          unit.position.x += dx * ratio;
          unit.position.y += dy * ratio;
        }
      }
    });
  }

  // Check if a unit should automatically acquire a target
  private checkForAutoTarget(unit: Unit): void {
    // Only look for targets if not already attacking or moving
    if (unit.isAttacking || unit.isMoving) {
      return;
    }
    
    let nearestEnemy: Unit | null = null;
    let nearestDistance: number = Infinity;
    
    // Find the nearest enemy within detection range
    Object.values(this.state.units).forEach(otherUnit => {
      if (
        otherUnit.isDead || 
        otherUnit.playerId === unit.playerId
      ) {
        return;
      }
      
      // Check if this unit can attack the other unit
      if (!this.canUnitAttackTarget(unit, otherUnit)) {
        return;
      }
      
      const dx = otherUnit.position.x - unit.position.x;
      const dy = otherUnit.position.y - unit.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Auto-detect range is slightly larger than attack range
      const detectionRange = unit.range * 25;
      
      if (distance <= detectionRange && distance < nearestDistance) {
        nearestEnemy = otherUnit;
        nearestDistance = distance;
      }
    });
    
    // If found an enemy in range, attack it
    if (nearestEnemy !== null) {
      this.attackUnit(unit.id, (nearestEnemy as Unit).id);
    }
  }
  
  // Check if a unit can attack a target based on unit type
  private canUnitAttackTarget(attacker: Unit, target: Unit): boolean {
    // Determine if target is air or ground
    const isTargetAir = target.type === UnitType.HELICOPTER;
    
    if (isTargetAir) {
      return attacker.canAttackAir;
    } else {
      return attacker.canAttackGround;
    }
  }

  // Update resources (respawn collected resources)
  private updateResources(deltaTime: number): void {
    Object.values(this.state.resources).forEach(resource => {
      if (resource.isCollected) {
        resource.respawnTime -= deltaTime;
        
        if (resource.respawnTime <= 0) {
          resource.isCollected = false;
          resource.amount = RESOURCE_CONFIG.resourceAmount[resource.type];
          resource.respawnTime = RESOURCE_CONFIG.respawnTime;
        }
      }
    });
  }

  // Collect resources when units are near
  private collectResources(): void {
    const collectionRange = 30; // Units must be this close to collect
    
    Object.values(this.state.resources).forEach(resource => {
      if (resource.isCollected) return;
      
      Object.values(this.state.players).forEach(player => {
        // Check if any SOLDIER unit is near the resource (only soldiers can collect)
        const nearbyUnit = player.units.find(unit => {
          if (unit.isDead) return false;
          // Only soldiers can collect resources
          if (unit.type !== UnitType.SOLDIER) return false;
          
          const dx = unit.position.x - resource.position.x;
          const dy = unit.position.y - resource.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          return distance < collectionRange;
        });
        
        if (nearbyUnit) {
          // Collect the resource
          player.resources[ResourceType.MONEY] += resource.amount;
          resource.isCollected = true;
        }
      });
    });
  }

  // Check if the game should end
  private checkGameOver(): void {
    const state = this.getState();
    const activePlayers = Object.values(state.players).filter(player => 
      player.units.length > 0 || 
      player.resources[ResourceType.MONEY] >= 150
    );
    
    // ... existing code ...
  }
} 