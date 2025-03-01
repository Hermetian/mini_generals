# Mini Generals

A 2D Command & Conquer Generals-inspired .io game built with TypeScript and HTML5 Canvas.

## Features

- Real-time strategy (RTS) gameplay
- Resource collection and unit production
- .io-style persistent units
- Dynamic unit cost scaling (units become more expensive as you build more)
- Multiple unit types (Soldier, Tank, Helicopter)
- Multiple factions (USA, China, GLA)
- 2D rendered graphics using HTML5 Canvas
- SVG art assets

## How to Play

- **Left-click** to select units
- **Shift + left-click** to add to selection
- **Right-click** to move selected units
- **Right-click on enemies** to attack
- Use the **buttons at the top** to create new units
- Number keys **1**, **2**, **3** can also be used to create units
- Press **ESC** to clear selection
- Hold **D** key to see debug information

## Game Mechanics

- Collect resources (Money and Supplies) scattered around the map
- Use resources to build units
- The more units you have, the more expensive new units become
- Capture the map by eliminating opponents
- Resources respawn over time

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to the URL shown in the terminal

## Build for Production

```
npm run build
```

## Technologies Used

- TypeScript
- HTML5 Canvas
- Vite (for development and building)
- SVG graphics 