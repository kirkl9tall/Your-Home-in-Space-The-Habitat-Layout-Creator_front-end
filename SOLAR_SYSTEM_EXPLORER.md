# 🌌 NASA Eyes Solar System Explorer

## Overview
An interactive 3D solar system explorer inspired by NASA's Eyes on the Solar System, integrated into the Mars Habitat Designer. Select your mission destination by exploring and clicking on planets in a fully rendered solar system!

## Features

### 🚀 **NASA Eyes-Inspired Experience**
- **Full 3D Solar System**: Navigate through space with realistic planetary orbits
- **Interactive Planet Selection**: Click on any planet to learn about mission opportunities  
- **Smooth Cinematic Transitions**: NASA Eyes-style zoom animations from orbit to surface
- **Real-time Orbital Mechanics**: Planets orbit the sun with accurate relative speeds

### 🪐 **Available Mission Destinations**

1. **🌍 Earth Orbit (LEO)** - *Beginner*
   - Training ground for space habitats
   - Resources: Solar Power, Earth Support, Regular Resupply

2. **🌙 Luna (Moon)** - *Intermediate*  
   - Gateway to deep space exploration
   - Resources: Helium-3, Water Ice, Rare Earth Elements

3. **🚀 Mars Transit** - *Advanced*
   - Deep space habitat for the journey to Mars
   - Resources: Recycling Systems, Radiation Shielding, Self-Sufficiency

4. **🔴 Mars Surface** - *Expert*
   - The Red Planet - Ultimate challenge for human settlement
   - Resources: CO2 Atmosphere, Water Ice, Iron Oxide, Regolith

5. **⭐ Deep Space** - *Expert*
   - Interstellar voyage - The final frontier
   - Resources: Nuclear Power, Closed Ecosystems, Advanced Recycling

## How to Use

### **Step 1: Access Solar System Explorer**
1. Open the Mars Habitat Designer
2. Look for the **🌍 Globe button** in the Mission Control sidebar header
3. Click to launch the Solar System Explorer

### **Step 2: Explore the Solar System**
- **Mouse Controls**: Click and drag to rotate the view
- **Planet Interaction**: Hover over planets to see highlights
- **Planet Selection**: Click on any planet to view mission details

### **Step 3: Select Your Mission**
1. Click on a planet to open the mission information panel
2. Review:
   - **Mission Difficulty** (Beginner → Expert)
   - **Mission Description** 
   - **Available Resources** for habitat construction
3. Click **"Launch Mission to [Planet]"** to proceed

### **Step 4: Cinematic Transition**
- Experience a smooth NASA Eyes-style zoom animation
- Camera transitions from solar system view to planetary surface
- Automatically switches to the Habitat Builder with planet-specific terrain

## Technical Details

### **Realistic Orbital Mechanics**
- Planets orbit at different speeds based on distance from sun
- Earth orbit: Fastest rotation (Beginner missions)
- Deep Space: Slowest movement (Expert missions)
- Real-time 3D rendering using Three.js

### **Planet-Specific Environments**
Each destination generates unique:
- **Terrain**: Mars gets red rocky landscape, Moon gets gray crater fields
- **Atmosphere**: Mars shows atmospheric halo, Moon has none
- **Lighting**: Accurate solar lighting and shadows
- **Resources**: Each planet offers different construction materials

### **Integration with Habitat Builder**
- Selected destination automatically updates mission scenario
- Terrain generation adapts to chosen planet
- Resource availability affects module design constraints
- Mission difficulty influences habitat requirements

## Tips for Best Experience

1. **Start with Earth (LEO)** for learning habitat design basics
2. **Progress through difficulty levels**: Earth → Moon → Mars Transit → Mars/Deep Space
3. **Consider resources** when planning habitats - each planet has unique constraints
4. **Use the transition time** to plan your habitat strategy for the destination

## Future Enhancements

- **More Planets**: Venus, Asteroid Belt, Jupiter/Saturn moons
- **Mission Briefings**: Detailed mission parameters for each destination  
- **Resource Constraints**: Planet-specific material limitations
- **Multiple Landing Sites**: Choose specific regions on planets
- **Seasonal Changes**: Dynamic lighting and atmospheric conditions

---

**Built with**: Three.js, React, TypeScript  
**Inspired by**: NASA's Eyes on the Solar System  
**Purpose**: Making space habitat design more immersive and educational