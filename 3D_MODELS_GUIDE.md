# 3D Models Integration Guide

## Overview
The NASA Habitat Builder now supports GLTF/GLB 3D models for realistic habitat modules! This replaces the basic cubes and cylinders with detailed 3D models.

## How It Works

### 1. **Automatic Model Loading**
- The system tries to load GLTF models first
- Falls back to procedural geometry if model isn't found
- Uses caching to avoid reloading the same models

### 2. **Model Paths**
Models should be placed in `/public/models/` with these names:
```
/public/models/
├── crew-sleep-pod.glb       # CREW_SLEEP modules
├── kitchen-module.glb       # FOOD_PREP modules  
├── medical-bay.glb          # MEDICAL modules
├── workstation.glb          # WORKSTATION modules
├── common-area.glb          # COMMON_AREA modules
├── recreation-room.glb      # RECREATION modules
├── gym-module.glb           # EXERCISE modules
├── hygiene-station.glb      # HYGIENE modules
├── waste-management.glb     # WASTE modules
├── maintenance-bay.glb      # MAINTENANCE modules
├── trash-compactor.glb      # TRASH_MGMT modules
├── life-support-rack.glb    # ECLSS modules
├── storage-rack.glb         # STOWAGE modules
├── airlock-chamber.glb      # AIRLOCK modules
├── science-glovebox.glb     # GLOVEBOX modules
└── custom-module.glb        # CUSTOM_CAD modules
```

### 3. **Model Requirements**
- **Format**: GLTF (.gltf) or GLB (.glb) 
- **Scale**: Any size (auto-scaled to module dimensions)
- **Materials**: PBR materials work best
- **Compression**: DRACO compression supported
- **Textures**: Embedded or external

## Features

### ✅ **Current Features**
- Automatic GLTF/GLB loading
- Graceful fallback to procedural geometry
- Model caching for performance
- Auto-scaling to module size
- Shadow casting and receiving
- Compliance status visualization
- Material enhancement (metalness, roughness)

### 🔄 **Fallback System**
If a GLTF model fails to load:
1. System logs the failure
2. Automatically creates procedural geometry
3. Uses appropriate colors per module type
4. No interruption to user experience

## Getting 3D Models

### **Option 1: Create Your Own**
- Use Blender, 3ds Max, Maya, etc.
- Export as GLTF/GLB format
- Keep polycount reasonable (~1K-10K vertices)

### **Option 2: Download Free Models**
- **NASA 3D Resources**: https://nasa3d.arc.nasa.gov/
- **Sketchfab**: Many free space/industrial models
- **Poly Haven**: High-quality PBR models
- **Google Poly** (archived but still accessible)

### **Option 3: AI-Generated Models**
- **Meshy.ai**: Generate models from text
- **Spline AI**: Create 3D models with AI
- **Luma AI**: Generate from images

## Console Feedback
The system provides detailed console logging:
```
🚀 Loading GLTF model for CREW_SLEEP: /models/crew-sleep-pod.glb
Loading progress for CREW_SLEEP: 45%
✅ Successfully loaded GLTF model for CREW_SLEEP
⚠️ Failed to load GLTF model for MEDICAL: 404
🔄 Falling back to procedural geometry for MEDICAL
🚀 All habitat modules loaded!
```

## Performance Notes
- Models are cached after first load
- Use DRACO compression for smaller file sizes
- Keep texture sizes reasonable (1K-2K max)
- Consider LOD (Level of Detail) for complex models

## Next Steps
1. Add your GLTF/GLB models to `/public/models/`
2. Refresh the application
3. Watch console for loading feedback
4. Enjoy realistic 3D habitat modules! 🚀

---
*The system gracefully handles missing models, so you can add them incrementally.*