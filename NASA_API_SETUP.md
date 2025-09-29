# NASA Validation API Setup Guide

## Issue: Invalid API Key

The current API key in the code appears to be incomplete:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

This looks like the beginning of a JWT token, but JWT tokens have 3 parts separated by dots (.).

## How to Get the Complete API Key:

1. **Check your API provider** - The API key should be a complete JWT token that looks like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Gk_yJpWDXmx1LLfcj8Gd2FWDM8EKmJf-dQzb_6h4-_A
   ```
   (This is just an example - yours will be different)

2. **Common locations to find the complete key:**
   - Modal dashboard API keys section
   - Email confirmation from the API provider
   - Your account settings on the API platform
   - Environment variables file if you saved it there

## Current API Test:

```bash
curl -X POST "https://amine759--nasa-habitat-validator-api.modal.run/agent" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_COMPLETE_API_KEY_HERE" \
  -d '{"scenario":{"crew_size":4,"mission_duration_days":365,"destination":"MARS_SURFACE","fairing":{"name":"Falcon 9","inner_diameter_m":5.2,"inner_height_m":13.1,"shape":"CONE"}},"habitat":{"shape":"CYLINDER","levels":1,"dimensions":{"diameter_m":6.5,"height_m":12},"pressurized_volume_m3":400,"net_habitable_volume_m3":300},"modules":[],"version":"1.0.0"}'
```

## Quick Fix:

1. Find your complete API key
2. Update the key in `src/lib/habitatValidation.ts`
3. The validation will work properly

## Current Behavior:

- ✅ App works fine locally
- ✅ Fallback validation shows API error clearly
- ❌ NASA validation fails due to incomplete API key
- ✅ Error handling is working correctly

The validation system is working correctly - it's just missing the complete API key!