# 🌙 Lunar Terrain Setup Guide

The NASA Habitat Builder now supports **real lunar surface terrain** from Cesium Ion when the destination is set to "LUNAR" or "LUNAR_SURFACE".

## ✅ **Quick Setup**

### 1. **Get Cesium Ion API Key** (Free)
- Visit: https://ion.cesium.com
- Sign up for free account
- Go to "Access Tokens" in your dashboard
- Copy your default API token

### 2. **Configure Environment**
- Copy `.env.example` to `.env.local`
- Add your Cesium Ion key:
```bash
VITE_ION_KEY=your_cesium_ion_api_key_here
```

### 3. **Test Lunar Terrain**
- Set mission destination to "LUNAR" or "LUNAR_SURFACE"
- The app will automatically:
  - Show gray fallback lunar terrain initially
  - Attempt to load real Cesium Ion lunar surface data
  - Switch to high-resolution lunar terrain when loaded

## 🚀 **Features Added**

### **Lunar Terrain Loading:**
- **Real NASA lunar surface data** via Cesium Ion (Asset ID: 2684829)
- **Fallback lunar terrain** with realistic crater variations
- **Proper scaling** for lunar base construction site (100m × 100m)
- **Lunar-specific camera controls** with appropriate zoom limits

### **Environment Detection:**
- **Mars terrain**: 200m × 200m construction site, zoom range 8-300
- **Lunar terrain**: 100m × 100m base site, zoom range 8-200
- **Space stations**: Standard 50m × 50m platforms, zoom range 5-100

### **Visual Differences:**
- **Lunar surface**: Subtle gray craters, lower gravity feel
- **Mars surface**: Reddish-brown rocky terrain, larger scale
- **Lunar lighting**: Stark shadows, no atmosphere effects

## 🔧 **Troubleshooting**

### **No Lunar Terrain Loading?**
1. **Check API key**: Ensure `VITE_ION_KEY` is set in `.env.local`
2. **Check console**: Look for Cesium Ion error messages
3. **Check network**: Lunar tiles require internet connection
4. **Fallback mode**: Gray terrain will always show as backup

### **Console Messages to Look For:**
```
🌙 Lunar fallback terrain created
Attempting to load Cesium Ion Lunar surface data...
✅ Cesium Ion Lunar terrain loaded successfully!
✅ Lunar base site positioned
```

## 📊 **Technical Details**

### **Lunar Dataset (Cesium Ion)**
- **Asset ID**: 2684829
- **Source**: NASA, ESA, USGS lunar mapping data
- **Resolution**: High-resolution lunar surface mesh
- **Coverage**: Global lunar surface with detailed crater mapping

### **Camera Settings for Lunar Environment**
- **Initial distance**: 80 units (between Mars 120 and Earth 25)
- **Zoom limits**: 8-200 units
- **Pan speed**: 0.2 (same as Mars for large terrain)
- **Rotation**: Enabled with ground plane constraint

The lunar terrain provides a realistic foundation for designing lunar bases and habitats! 🌙🚀