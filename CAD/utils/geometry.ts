import * as THREE from 'three';
import { StarConfig } from '../types';

export function createGearGeometry(
  innerRadius = 0.5,
  outerRadius = 1,
  width = 0.25,
  teeth = 12,
  toothDepth = 0.2
): THREE.BufferGeometry {
  const shapes = new THREE.Shape();
  const angle = (2 * Math.PI) / teeth;
  const halfAngle = angle / 2;
  const toothAngle = halfAngle * 0.5;
  const toothWidth = Math.tan(toothAngle) * (outerRadius + toothDepth);

  for (let i = 0; i < teeth; i++) {
    const startAngle = i * angle;

    shapes.moveTo(Math.cos(startAngle) * outerRadius, Math.sin(startAngle) * outerRadius);
    shapes.lineTo(
      Math.cos(startAngle + toothAngle) * (outerRadius + toothDepth),
      Math.sin(startAngle + toothAngle) * (outerRadius + toothDepth)
    );
    shapes.lineTo(
      Math.cos(startAngle + halfAngle - toothAngle) * (outerRadius + toothDepth),
      Math.sin(startAngle + halfAngle - toothAngle) * (outerRadius + toothDepth)
    );
    shapes.lineTo(
      Math.cos(startAngle + halfAngle) * outerRadius,
      Math.sin(startAngle + halfAngle) * outerRadius
    );
  }

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shapes.holes.push(hole);

  const extrudeSettings = {
    steps: 1,
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  };

  const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
  geometry.center();
  geometry.rotateX(Math.PI / 2);

  return geometry;
}

export function createStarGeometry(config: StarConfig): THREE.Shape {
    const shape = new THREE.Shape();
    const { points, innerRadius, outerRadius } = config;
    const angleStep = (Math.PI * 2) / points / 2;
  
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * angleStep - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return shape;
}

export function createHeartGeometry(): THREE.Shape {
    const shape = new THREE.Shape();
    const x = -0.5, y = -0.7; // Offset to center it a bit better
    shape.moveTo(x + 0.5, y + 0.5);
    shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1, y);
    shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);
    return shape;
}