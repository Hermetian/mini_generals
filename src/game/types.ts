export enum UnitType {
  SOLDIER = 'SOLDIER',
  TANK = 'TANK',
  HELICOPTER = 'HELICOPTER',
}

export enum FactionType {
  USA = 'USA',
  CHINA = 'CHINA',
  GLA = 'GLA',
}

export enum ResourceType {
  MONEY = 'MONEY',
}

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  faction: FactionType;
  resources: {
    [ResourceType.MONEY]: number;
  };
  units: Unit[];
  basePosition: Position;
  color: string;
}

export interface Unit {
  id: string;
  type: UnitType;
  position: Position;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  range: number;
  speed: number;
  playerId: string;
  targetId?: string;
  path?: Position[];
  isDead: boolean;
  isMoving: boolean;
  isAttacking: boolean;
  canAttackAir: boolean;
  canAttackGround: boolean;
}

export interface Resource {
  id: string;
  type: ResourceType;
  position: Position;
  amount: number;
  respawnTime: number;
  isCollected: boolean;
}

export interface GameState {
  players: { [id: string]: Player };
  units: { [id: string]: Unit };
  resources: { [id: string]: Resource };
  gameTime: number;
  mapSize: {
    width: number;
    height: number;
  };
}

export interface UnitCost {
  [ResourceType.MONEY]: number;
} 