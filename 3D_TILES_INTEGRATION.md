# 3D Tiles Integration - NASA Habitat Designer

## Overview

The NASA Habitat Designer now supports real-world 3D terrain streaming using NASA/JPL's `3d-tiles-renderer` with React Three Fiber (R3F). This enables placing habitat modules on actual photorealistic terrain from Google Earth, Cesium Ion, or custom tilesets.

## Key Features

✅ **ACES Tone Mapping**: Professional cinematic rendering with exposure 1.15  
✅ **Mars-like Sky/Fog**: Atmospheric effects with realistic lighting  
✅ **Subtle Post-FX**: SMAA anti-aliasing + Bloom effects for visual quality  
✅ **Drag→Ghost→Drop**: Interactive module placement with terrain snapping  
✅ **Snap-to-Height API**: Automatic height calculation from streamed terrain  
✅ **Provider Plugins**: Official authentication for Google & Cesium services  
✅ **Attributions**: Required legal attributions displayed automatically  

## Configuration

### Environment Variables (.env.local)

```bash
# Provider selection: "google" | "cesium" | "custom"
VITE_TILES_PROVIDER=google

# Google Photorealistic 3D Tiles (requires API key + billing)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Cesium Ion (requires token + asset ID)
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
VITE_CESIUM_ION_URL=https://assets.cesium.com/123456/tileset.json

# Custom Tiles URL
VITE_CUSTOM_TILES_URL=https://example.com/tiles/tileset.json
```

### Google Photorealistic 3D Tiles Setup

1. **Get API Key**: Visit [Google Cloud Console](https://console.cloud.google.com)
2. **Enable Billing**: 3D Tiles require a billing account
3. **Enable APIs**: Enable Maps JavaScript API & Places API
4. **Set Quotas**: Monitor usage to avoid unexpected costs
5. **Add Key**: Update `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`

### Cesium Ion Setup

1. **Create Account**: Sign up at [Cesium Ion](https://cesium.com/ion/)
2. **Get Token**: Generate access token in dashboard
3. **Find Assets**: Browse tileset assets (terrain, buildings, etc.)
4. **Update Config**: Set `VITE_CESIUM_ION_TOKEN` and `VITE_CESIUM_ION_URL`

## Architecture

### Core Components

- **`SceneFrame.tsx`**: Main R3F Canvas with ACES tone mapping & effects
- **`DesignAreaTilesScene.tsx`**: 3D Tiles integration with module placement
- **`useTilesDnD.ts`**: Drag-and-drop hook for terrain-aware placement
- **`ModuleFactory.ts`**: Module mesh creation with material variants
- **`heightSampler.ts`**: Terrain height sampling for module snapping
- **`tilesConfig.ts`**: Provider configuration and authentication

### Integration Points

```typescript
// Main integration in NASAHabitatBuilder3D.tsx
<DesignAreaTilesScene
  onPlace={(module) => {
    // Convert 3D tiles placement to habitat object format
    const newObject: HabitatObject = {
      id: module.id,
      type: module.type as FunctionalType,
      position: [module.position.x, module.position.y, module.position.z],
      rotation: [module.rotation.x, module.rotation.y, module.rotation.z],
      scale: [module.scale.x, module.scale.y, module.scale.z],
      size: { w_m: 2.0, h_m: 2.1, l_m: 2.0 }
    };
    setObjects(prev => [...prev, newObject]);
    setSelectedId(newObject.id);
  }}
/>
```

## Usage

### Drag & Drop Workflow

1. **Select Module**: Drag any module from the left sidebar palette
2. **Ghost Preview**: Module ghost appears and follows terrain contours  
3. **Place Module**: Drop to place module snapped to terrain height
4. **Auto-Shadows**: Shadows render automatically on terrain surface

### Terrain Interaction

```typescript
// Height sampling anywhere on terrain
import { sampleTerrain } from '@/terrain/heightSampler';
const height = sampleTerrain(x, z); // Get height at world coordinates

// Set custom terrain sampler
import { setTerrainSampler } from '@/terrain/heightSampler';
setTerrainSampler((x: number, z: number) => {
  // Custom height calculation logic
  return heightValue;
});
```

## Performance

### Optimization Settings

```typescript
// Tiles renderer configuration
<TilesRenderer
  errorTarget={8}          // Balance between quality & performance
  errorThreshold={0.5}     // Lower = higher quality, worse performance  
  maxDepth={14}           // Maximum tile subdivision depth
  lruCache-maxSize={200}  // Cache size for loaded tiles
/>
```

### BVH Acceleration

The system automatically enables BVH (Bounding Volume Hierarchy) acceleration for fast raycasting against complex terrain meshes:

```typescript
// Automatic BVH setup in DesignAreaTilesScene.tsx
(THREE.Mesh as any).raycast = acceleratedRaycast;
```

## Troubleshooting

### Common Issues

**1. Tiles Not Loading**
- Check API keys are valid and have proper permissions
- Verify billing is enabled (for Google)
- Check browser console for authentication errors

**2. Performance Issues**
- Reduce `maxDepth` from 14 to 10-12
- Increase `errorThreshold` from 0.5 to 1.0
- Lower `lruCache-maxSize` if memory constrained

**3. Module Placement Issues**
- Ensure terrain has loaded before placing modules
- Check `sampleTerrain()` returns valid heights
- Verify raycaster intersections with terrain meshes

### Debug Tools

```typescript
// Enable tiles debugging
console.log('Tiles loaded:', tilesRef.current?.group);
console.log('Height at (0,0):', sampleTerrain(0, 0));
```

## Legal & Attribution

The system automatically displays required attributions for:
- **Google**: "© Google" attribution overlay
- **Cesium**: Cesium Ion branding and asset credits
- **Custom**: Configurable attribution text

**Important**: Always comply with provider terms of service and attribution requirements.

## Future Enhancements

- **LOD Control**: User-adjustable level-of-detail settings
- **Terrain Editing**: Modify terrain height for custom landing sites  
- **Multi-Provider**: Load multiple tilesets simultaneously
- **Offline Mode**: Cache tiles for disconnected operation
- **Custom Shaders**: Enhanced terrain materials and lighting

---

This implementation provides a professional foundation for NASA habitat design on real-world terrain while maintaining performance and legal compliance.