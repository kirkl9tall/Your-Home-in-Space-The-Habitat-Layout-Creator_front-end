// Enhanced NASA Functional Area Model Generator
// File: src/utils/nasaModelGenerator.ts

import * as THREE from 'three';

export class NASAModuleGenerator {
  
  // Generate ISS-style Crew Quarters (0.91×1.98×0.76m)
  static createCrewQuarters(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main compartment walls
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xE8E8E8, 
      transparent: true, 
      opacity: 0.9 
    });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    group.add(walls);
    
    // Sleep surface with sleep restraints
    const bunkGeometry = new THREE.BoxGeometry(width * 0.85, 0.05, depth * 0.9);
    const bunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4A90E2 });
    const bunk = new THREE.Mesh(bunkGeometry, bunkMaterial);
    bunk.position.set(0, -height/2 + 0.4, 0);
    group.add(bunk);
    
    // Personal Control Panel (like ISS laptop computer)
    const controlGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.2);
    const controlMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1E });
    const control = new THREE.Mesh(controlGeometry, controlMaterial);
    control.position.set(-width/2 + 0.2, height/2 - 0.3, depth/2 - 0.1);
    group.add(control);
    
    // Storage compartments (crew personal items)
    for (let i = 0; i < 4; i++) {
      const storageGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.08);
      const storageMaterial = new THREE.MeshLambertMaterial({ color: 0x34C759 });
      const storage = new THREE.Mesh(storageGeometry, storageMaterial);
      storage.position.set(
        -width/2 + 0.1, 
        height/2 - 0.4 - i*0.15, 
        -depth/2 + 0.05
      );
      group.add(storage);
    }
    
    // Ventilation grilles (like ISS)
    for (let i = 0; i < 2; i++) {
      const grillGeometry = new THREE.PlaneGeometry(0.2, 0.2);
      const grillMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x8E8E93,
        transparent: true,
        opacity: 0.7
      });
      const grill = new THREE.Mesh(grillGeometry, grillMaterial);
      grill.position.set(width/2 - 0.01, height/2 - 0.2 - i*0.4, 0);
      grill.rotation.y = -Math.PI/2;
      group.add(grill);
    }
    
    return group;
  }
  
  // Generate ISS ARED-style Exercise Module  
  static createExerciseModule(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main structure
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFFFFFF,
      transparent: true, 
      opacity: 0.8 
    });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(main);
    
    // ARED-style resistance device (main exercise equipment)
    const aredGeometry = new THREE.BoxGeometry(width * 0.7, height * 0.6, depth * 0.4);
    const aredMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    const ared = new THREE.Mesh(aredGeometry, aredMaterial);
    ared.position.set(0, -height * 0.15, 0);
    group.add(ared);
    
    // Foot restraints and handholds
    for (let i = 0; i < 4; i++) {
      const restraintGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
      const restraintMaterial = new THREE.MeshLambertMaterial({ color: 0x007AFF });
      const restraint = new THREE.Mesh(restraintGeometry, restraintMaterial);
      
      if (i < 2) {
        // Handholds on walls
        restraint.position.set((-1)**i * width/2 * 0.8, height * 0.2, 0);
        restraint.rotation.z = Math.PI/2;
      } else {
        // Foot restraints on floor
        restraint.position.set((-1)**i * width * 0.3, -height/2 + 0.1, (-1)**i * depth * 0.2);
      }
      group.add(restraint);
    }
    
    return group;
  }
  
  // Generate ISS WHC-style Hygiene Module
  static createHygieneModule(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main hygiene compartment (cylindrical like ISS WHC)
    const radius = Math.min(width, depth) / 2.2;
    const mainGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    const mainMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F8FF });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(main);
    
    // Waste collection system
    const wcsGeometry = new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, height * 0.2, 12);
    const wcsMaterial = new THREE.MeshLambertMaterial({ color: 0x8E8E93 });
    const wcs = new THREE.Mesh(wcsGeometry, wcsMaterial);
    wcs.position.set(0, -height * 0.3, 0);
    group.add(wcs);
    
    // Water reclamation panels
    const panelGeometry = new THREE.BoxGeometry(width * 0.15, height * 0.4, depth * 0.1);
    const panelMaterial = new THREE.MeshLambertMaterial({ color: 0x007AFF });
    
    for (let i = 0; i < 3; i++) {
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(
        Math.cos(i * Math.PI * 2/3) * radius * 0.8,
        height * 0.1,
        Math.sin(i * Math.PI * 2/3) * radius * 0.8
      );
      group.add(panel);
    }
    
    return group;
  }
  
  // Generate ISS-style Food Preparation Module
  static createFoodPrepModule(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main galley structure
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(main);
    
    // Food warmer/rehydrator (like ISS)
    const warmerGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.25, depth * 0.4);
    const warmerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
    const warmer = new THREE.Mesh(warmerGeometry, warmerMaterial);
    warmer.position.set(-width * 0.25, height * 0.1, 0);
    group.add(warmer);
    
    // Water dispenser
    const waterGeometry = new THREE.CylinderGeometry(0.05, 0.05, height * 0.6, 12);
    const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x00BFFF });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(width * 0.3, 0, depth * 0.3);
    group.add(water);
    
    // Food storage compartments
    for (let i = 0; i < 6; i++) {
      const storageGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
      const storageMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
      const storage = new THREE.Mesh(storageGeometry, storageMaterial);
      storage.position.set(
        width/2 - 0.1,
        height/2 - 0.2 - (i%3)*0.2,
        -depth/2 + 0.1 + Math.floor(i/3)*0.2
      );
      group.add(storage);
    }
    
    return group;
  }
  
  // Generate ISS-style Medical Bay
  static createMedicalModule(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main medical compartment
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new THREE.MeshLambertMaterial({ color: 0xF0FFFF });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(main);
    
    // Medical examination area/restraint system
    const examGeometry = new THREE.BoxGeometry(width * 0.8, 0.1, depth * 0.6);
    const examMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const exam = new THREE.Mesh(examGeometry, examMaterial);
    exam.position.set(0, 0, 0);
    group.add(exam);
    
    // Medical equipment rack
    const rackGeometry = new THREE.BoxGeometry(width * 0.2, height * 0.8, depth * 0.2);
    const rackMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    const rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(-width * 0.3, 0, depth * 0.3);
    group.add(rack);
    
    // Emergency medical kit
    const kitGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.2);
    const kitMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    const kit = new THREE.Mesh(kitGeometry, kitMaterial);
    kit.position.set(width * 0.3, height * 0.3, -depth * 0.3);
    group.add(kit);
    
    return group;
  }
}

export default NASAModuleGenerator;