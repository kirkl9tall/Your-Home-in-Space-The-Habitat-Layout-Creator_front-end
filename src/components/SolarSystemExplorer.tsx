import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info, Play, RotateCcw, ArrowLeft, Target, Globe, Rocket } from 'lucide-react';
import { Destination } from '@/lib/schemas';

// Realistic planetary data based on NASA specifications
interface CelestialBody {
  id: string;
  name: string;
  destination?: Destination;
  
  // Realistic orbital mechanics
  semiMajorAxis: number; // AU from Sun
  orbitalPeriod: number; // Earth years
  rotationPeriod: number; // Earth hours
  
  // Physical properties  
  radius: number; // km (scaled for display)
  mass: number; // Earth masses
  
  // Visual properties
  color: string;
  albedo: number; // reflectivity 0-1
  hasAtmosphere: boolean;
  atmosphereColor?: string;
  
  // Mission properties
  habitability: 'Unsuitable' | 'Challenging' | 'Possible' | 'Ideal';
  description: string;
  missionType?: string;
}

interface Planet {
  id: string;
  name: string;
  radius: number;
  destination: Destination;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface SolarSystemExplorerProps {
  onDestinationSelect: (destination: Destination) => void;
  onClose: () => void;
  currentDestination?: Destination;
}

// Scientifically accurate solar system data (NASA/JPL specifications)
const SOLAR_SYSTEM: CelestialBody[] = [
  // The Sun
  {
    id: 'sun',
    name: 'Sun',
    semiMajorAxis: 0,
    orbitalPeriod: 0,
    rotationPeriod: 609.12, // 25.38 days
    radius: 696340, // km
    mass: 332946, // Earth masses
    color: '#FDB813',
    albedo: 0,
    hasAtmosphere: false,
    habitability: 'Unsuitable',
    description: 'Our star - source of energy for the solar system'
  },
  
  // Inner Planets
  {
    id: 'mercury',
    name: 'Mercury',
    semiMajorAxis: 0.387,
    orbitalPeriod: 0.241,
    rotationPeriod: 1407.6,
    radius: 2439.7,
    mass: 0.055,
    color: '#8C7853',
    albedo: 0.068,
    hasAtmosphere: false,
    habitability: 'Unsuitable',
    description: 'Closest planet to the Sun - extreme temperatures'
  },
  
  {
    id: 'venus',
    name: 'Venus',
    semiMajorAxis: 0.723,
    orbitalPeriod: 0.615,
    rotationPeriod: -5832.5, // retrograde
    radius: 6051.8,
    mass: 0.815,
    color: '#FFC649',
    albedo: 0.77,
    hasAtmosphere: true,
    atmosphereColor: '#FFAA44',
    habitability: 'Unsuitable',
    description: 'Hottest planet - thick toxic atmosphere'
  },
  
  {
    id: 'earth',
    name: 'Earth',
    destination: 'LEO',
    semiMajorAxis: 1.0,
    orbitalPeriod: 1.0,
    rotationPeriod: 23.93,
    radius: 6371,
    mass: 1.0,
    color: '#6B93D6',
    albedo: 0.306,
    hasAtmosphere: true,
    atmosphereColor: '#4FC3F7',
    habitability: 'Ideal',
    description: 'Our home planet - perfect for life',
    missionType: 'Low Earth Orbit Station'
  },
  
  {
    id: 'moon',
    name: 'Luna (Moon)',
    destination: 'LUNAR',
    semiMajorAxis: 1.0, // Orbits Earth, not Sun
    orbitalPeriod: 0.0748, // ~27.3 days
    rotationPeriod: 655.7,
    radius: 1737.1,
    mass: 0.012,
    color: '#C8C8C8',
    albedo: 0.136,
    hasAtmosphere: false,
    habitability: 'Challenging',
    description: 'Earth\'s natural satellite - gateway to deep space',
    missionType: 'Lunar Base'
  },
  
  {
    id: 'mars',
    name: 'Mars',
    destination: 'MARS_SURFACE',
    semiMajorAxis: 1.524,
    orbitalPeriod: 1.88,
    rotationPeriod: 24.62,
    radius: 3389.5,
    mass: 0.107,
    color: '#CD5C5C',
    albedo: 0.170,
    hasAtmosphere: true,
    atmosphereColor: '#D2691E',
    habitability: 'Possible',
    description: 'The Red Planet - target for human colonization',
    missionType: 'Planetary Base'
  },
  
  // Outer Planets (for completeness, but not mission targets yet)
  {
    id: 'jupiter',
    name: 'Jupiter',
    semiMajorAxis: 5.204,
    orbitalPeriod: 11.86,
    rotationPeriod: 9.93,
    radius: 69911,
    mass: 317.8,
    color: '#D8CA9D',
    albedo: 0.343,
    hasAtmosphere: true,
    atmosphereColor: '#FAD5A5',
    habitability: 'Unsuitable',
    description: 'Gas giant - largest planet in our solar system'
  },
  
  {
    id: 'saturn',
    name: 'Saturn',
    semiMajorAxis: 9.582,
    orbitalPeriod: 29.46,
    rotationPeriod: 10.66,
    radius: 58232,
    mass: 95.2,
    color: '#FAD5A5',
    albedo: 0.342,
    hasAtmosphere: true,
    atmosphereColor: '#F4E4BC',
    habitability: 'Unsuitable',
    description: 'Ringed gas giant - spectacular ring system'
  }
];

// Mission-capable destinations only
const MISSION_TARGETS = SOLAR_SYSTEM.filter(body => body.destination);

export function SolarSystemExplorer({ onDestinationSelect, onClose, currentDestination }: SolarSystemExplorerProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const planetsRef = useRef<{[key: string]: {group: THREE.Group}}>({});

  const [selectedBody, setSelectedBody] = useState<string | null>(null);
  const [hoveredBody, setHoveredBody] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null);
  
  // Create celestial meshes storage
  const celestialMeshes: {[key: string]: THREE.Group} = {};

  // Distance scale for visualization
  const DISTANCE_SCALE = 0.1;
  
  // Create PLANETS array from MISSION_TARGETS for compatibility
  const PLANETS = MISSION_TARGETS as Planet[];

  // Initialize Three.js scene with NASA Eyes realism
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with realistic space environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008); // Deep space black
    
    // Camera setup with NASA Eyes-style perspective
    const camera = new THREE.PerspectiveCamera(
      45, // Narrower FOV for more realistic view
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.01,
      10000 // Extended far plane for solar system scale
    );
    camera.position.set(0, 15, 30); // Closer initial view
    cameraRef.current = camera;
    
    // Renderer setup with enhanced quality
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    
    // Realistic starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      // Spherical distribution for realistic star field
      const radius = 500;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Realistic star colors (blue-white to red)
      const temp = Math.random();
      if (temp > 0.8) { // Blue-white stars
        colors[i * 3] = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i * 3 + 2] = 1.0;
      } else if (temp > 0.6) { // White stars
        const brightness = 0.8 + Math.random() * 0.2;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
      } else { // Yellow-red stars
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        colors[i * 3 + 2] = 0.2 + Math.random() * 0.4;
      }
      
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({ 
      size: 1.5,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      sizeAttenuation: false
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Realistic Sun with proper scale and lighting
    const sunRadius = 0.5; // Scaled down for visibility
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFDB813,
      emissive: 0xFDB813,
      emissiveIntensity: 0.8
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Realistic sun lighting
    const sunLight = new THREE.PointLight(0xFFFFFF, 1.5, 0, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 100;
    scene.add(sunLight);
    
    // Subtle ambient light for realism
    const ambientLight = new THREE.AmbientLight(0x202040, 0.1);
    scene.add(ambientLight);
    
    // Create celestial body meshes with realistic scaling
    const celestialMeshes: { [key: string]: THREE.Group } = {};
    const SCALE_FACTOR = 0.001; // Scale down for visibility
    const DISTANCE_SCALE = 15; // Scale distances for visibility
    
    SOLAR_SYSTEM.forEach(body => {
      if (body.id === 'sun') return; // Sun already created
      
      const bodyGroup = new THREE.Group();
      
      // Calculate realistic size (scaled)
      const displayRadius = Math.max(body.radius * SCALE_FACTOR, 0.1);
      
      // Planet/moon mesh with realistic materials
      const geometry = new THREE.SphereGeometry(displayRadius, 32, 32);
      let material: THREE.Material;
      
      if (body.id === 'earth') {
        material = new THREE.MeshPhongMaterial({ 
          color: body.color,
          shininess: 5,
          specular: 0x111111
        });
      } else if (body.id === 'mars') {
        material = new THREE.MeshLambertMaterial({ 
          color: body.color,
          roughness: 0.9
        });
      } else {
        material = new THREE.MeshLambertMaterial({ 
          color: body.color
        });
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bodyGroup.add(mesh);
      
      // Realistic atmosphere rendering
      if (body.hasAtmosphere && body.atmosphereColor) {
        const atmosRadius = displayRadius * 1.03;
        const atmosGeometry = new THREE.SphereGeometry(atmosRadius, 32, 32);
        const atmosMaterial = new THREE.MeshBasicMaterial({
          color: body.atmosphereColor,
          transparent: true,
          opacity: body.id === 'venus' ? 0.7 : 0.15,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending
        });
        const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
        bodyGroup.add(atmosphere);
      }
      
      // Position based on semi-major axis (scaled)
      let orbitRadius: number;
      if (body.id === 'moon') {
        // Moon orbits Earth, position relative to Earth's orbit
        orbitRadius = 1.5; // Close to Earth
      } else {
        orbitRadius = body.semiMajorAxis * DISTANCE_SCALE;
      }
      
      // Initial orbital position
      const angle = (Math.random() * Math.PI * 2);
      bodyGroup.position.x = Math.cos(angle) * orbitRadius;
      bodyGroup.position.z = Math.sin(angle) * orbitRadius;
      
      // Subtle orbit indicators (not full rings like in games)
      if (body.destination) { // Only for mission targets
        const orbitPoints = [];
        const orbitSegments = 128;
        for (let i = 0; i <= orbitSegments; i++) {
          const theta = (i / orbitSegments) * Math.PI * 2;
          orbitPoints.push(new THREE.Vector3(
            Math.cos(theta) * orbitRadius,
            0,
            Math.sin(theta) * orbitRadius
          ));
        }
        
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.2
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
      }
      
      scene.add(bodyGroup);
      celestialMeshes[body.id] = bodyGroup;
      
      // Store planet references for transitions
      if (body.destination) {
        planetsRef.current[body.id] = { group: bodyGroup };
      }
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate planets
      Object.values(celestialMeshes).forEach((bodyGroup, index) => {
        bodyGroup.rotation.y += 0.001 + (index * 0.0002);
      });
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup function
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle planet selection and transition NASA Eyes style
  const handlePlanetTransition = (planet: Planet) => {
    if (isTransitioning || !cameraRef.current) return;

    setIsTransitioning(true);
    console.log(`🚀 NASA Eyes style transition to ${planet.name}...`);

    const camera = cameraRef.current;
    const planetGroup = planetsRef.current[planet.id]?.group;
    
    if (!planetGroup) {
      console.error('Planet group not found');
      setIsTransitioning(false);
      return;
    }

    // NASA Eyes style: zoom transition from solar system to planet surface
    const planetPosition = planetGroup.position.clone();
    const targetPosition = planetPosition.clone();
    targetPosition.z += planet.radius * 4; // Close approach
    targetPosition.y += planet.radius; // Slightly above

    // Smooth camera transition with NASA Eyes easing
    const startPosition = camera.position.clone();
    const startTarget = new THREE.Vector3(0, 0, 0);
    const endTarget = planetPosition.clone();
    
    const duration = 3000; // 3 seconds for cinematic effect
    const startTime = Date.now();

    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // NASA Eyes smooth easing - accelerate then decelerate
      const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      
      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      
      // Interpolate look-at target
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easeProgress);
      camera.lookAt(currentTarget);
      
      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        // Transition complete - switch to habitat builder
        console.log(`✅ Landed on ${planet.name}! Switching to habitat builder...`);
        setTimeout(() => {
          onDestinationSelect(planet.destination);
        }, 500);
      }
    };

    animateTransition();
  };

  const getDifficultyColor = (difficulty: Planet['difficulty']) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-600';
      case 'Intermediate': return 'bg-yellow-600';
      case 'Advanced': return 'bg-orange-600';
      case 'Expert': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* 3D Solar System View */}
      <div className="flex-1 relative">
        <div ref={mountRef} className="w-full h-full" />
        
        {/* NASA Eyes UI Overlay */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          {/* Title Card */}
          <Card className="bg-black/80 border-white/30 backdrop-blur-md pointer-events-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-white text-lg">
                <Sun className="w-6 h-6 text-yellow-400" />
                NASA Eyes - Solar System Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-300 mb-2">
                Select your mission destination by clicking on a planet
              </p>
              {hoveredPlanet && (
                <div className="text-xs text-blue-300">
                  Hovering: <strong>{hoveredPlanet.name}</strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button 
            onClick={onClose}
            variant="outline"
            className="bg-black/80 border-white/30 text-white hover:bg-white/10 pointer-events-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Designer
          </Button>
        </div>

        {/* Planet Navigation */}
        <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
          <div className="flex justify-center gap-2 flex-wrap">
            {PLANETS.map((planet) => (
              <Badge 
                key={planet.id}
                className={`pointer-events-auto cursor-pointer transition-all ${
                  selectedPlanet?.id === planet.id 
                    ? 'bg-blue-600 text-white border-blue-400 scale-110' 
                    : hoveredPlanet?.id === planet.id
                    ? 'bg-white/20 text-white border-white/40 scale-105'
                    : 'bg-black/70 text-gray-300 border-white/20'
                } hover:bg-white/30 hover:scale-105`}
                onClick={() => setSelectedPlanet(planet)}
              >
                {planet.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Planet Information Panel - NASA Eyes Style */}
      {selectedPlanet && (
        <Card className="w-96 bg-black/95 border-white/30 backdrop-blur-md text-white m-6 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-400" />
              {selectedPlanet.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 space-y-4">
            {/* Difficulty Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`${getDifficultyColor(selectedPlanet.difficulty)} text-white px-3 py-1`}>
                {selectedPlanet.difficulty}
              </Badge>
              <span className="text-sm text-gray-400">Mission Difficulty</span>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {selectedPlanet.description}
              </p>
            </div>

            {/* Available Resources */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-yellow-400" />
                Available Resources
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {selectedPlanet.resources.map((resource, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs bg-white/10 border-white/30 text-gray-200 justify-start"
                  >
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>

            {/* NASA Eyes Style Mission Button */}
            <div className="pt-4 border-t border-white/20">
              <Button
                onClick={() => handlePlanetTransition(selectedPlanet)}
                disabled={isTransitioning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 relative overflow-hidden"
              >
                {isTransitioning ? (
                  <>
                    <Globe className="w-4 h-4 mr-2 animate-pulse" />
                    Traveling to {selectedPlanet.name}...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch Mission to {selectedPlanet.name}
                  </>
                )}
                {isTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SolarSystemExplorer;