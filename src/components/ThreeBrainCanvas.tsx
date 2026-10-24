import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OctaLobe } from '../types';

interface ThreeBrainCanvasProps {
  lobes: OctaLobe[];
  selectedLobeIdx: number;
  onSelectLobe: (idx: number) => void;
  metronomeHz: number;
  pulseTrigger: number;
  tripwireTrigger: number;
}

export const ThreeBrainCanvas: React.FC<ThreeBrainCanvasProps> = ({
  selectedLobeIdx,
  onSelectLobe,
  metronomeHz,
  pulseTrigger,
  tripwireTrigger,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const centralMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const centralCoreRef = useRef<THREE.Mesh | null>(null);
  const coreLightRef = useRef<THREE.PointLight | null>(null);
  const lobeMeshesRef = useRef<Array<{
    group: THREE.Group;
    outer: THREE.Mesh;
    inner: THREE.Mesh;
    outerMat: THREE.MeshStandardMaterial;
    innerMat: THREE.MeshStandardMaterial;
  }>>([]);
  const onSelectRef = useRef(onSelectLobe);
  onSelectRef.current = onSelectLobe;

  // React to Pulse Trigger
  useEffect(() => {
    if (pulseTrigger === 0) return;
    if (centralMatRef.current && coreLightRef.current && centralCoreRef.current) {
      centralMatRef.current.color.setHex(0xffd700);
      coreLightRef.current.intensity = 5.5;
      centralCoreRef.current.scale.set(1.4, 1.4, 1.4);

      const timer = setTimeout(() => {
        if (centralMatRef.current && coreLightRef.current) {
          centralMatRef.current.color.setHex(0x00e5ff);
          coreLightRef.current.intensity = 2.2;
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pulseTrigger]);

  // React to Tripwire Trigger
  useEffect(() => {
    if (tripwireTrigger === 0) return;
    const lobe0 = lobeMeshesRef.current[0];
    if (lobe0) {
      lobe0.innerMat.color.setHex(0xff1744);
      lobe0.innerMat.emissive.setHex(0xff1744);
      lobe0.outerMat.color.setHex(0xff1744);

      const timer = setTimeout(() => {
        lobe0.innerMat.color.setHex(0x00ff7f);
        lobe0.innerMat.emissive.setHex(0x00ff7f);
        lobe0.outerMat.color.setHex(0x00e5ff);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [tripwireTrigger]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x050811, 0.032);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 4.5, 13.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 28;
    controls.minDistance = 3.5;
    controls.autoRotate = false;

    // Ambient & Tactical Lights
    const ambientLight = new THREE.AmbientLight(0x00e5ff, 0.45);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x00e5ff, 0x050811, 0.6);
    scene.add(hemisphereLight);

    const coreLight = new THREE.PointLight(0x00e5ff, 2.2, 28);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    const goldLight = new THREE.PointLight(0xffd700, 1.8, 22);
    goldLight.position.set(0, 7, 0);
    scene.add(goldLight);

    // Brain Group Assembly
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // Central Wireframe Tesseract (Inner Core)
    const centralGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const centralMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    centralMatRef.current = centralMat;
    const centralCore = new THREE.Mesh(centralGeo, centralMat);
    centralCoreRef.current = centralCore;
    brainGroup.add(centralCore);

    // Nested Inner Solid Harmonic Core (Octahedron mesh)
    const innerSolidGeo = new THREE.OctahedronGeometry(0.75, 0);
    const innerSolidMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff9900,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.85,
    });
    const innerCoreMesh = new THREE.Mesh(innerSolidGeo, innerSolidMat);
    brainGroup.add(innerCoreMesh);

    // 8 Symmetrical Lobes using Golden Ratio Fibonacci Sphere
    const lobeMeshes: Array<{
      group: THREE.Group;
      outer: THREE.Mesh;
      inner: THREE.Mesh;
      outerMat: THREE.MeshStandardMaterial;
      innerMat: THREE.MeshStandardMaterial;
    }> = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < 8; i++) {
      const y = 1 - (i / 7) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const orbitRadius = 4.4;
      const x = Math.cos(theta) * radiusAtY * orbitRadius;
      const z = Math.sin(theta) * radiusAtY * orbitRadius;
      const posY = y * (orbitRadius * 0.7);

      const lobeGroup = new THREE.Group();
      lobeGroup.position.set(x, posY, z);
      lobeGroup.userData = { lobeIndex: i };

      // Outer Dodecahedron wireframe
      const lobeOuterGeo = new THREE.DodecahedronGeometry(0.85, 0);
      const lobeOuterMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x003344,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      });
      const outerMesh = new THREE.Mesh(lobeOuterGeo, lobeOuterMat);
      outerMesh.userData = { lobeIndex: i };
      lobeGroup.add(outerMesh);

      // Inner glowing nucleus
      const lobeInnerGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const lobeInnerMat = new THREE.MeshStandardMaterial({
        color: 0x00ff7f,
        emissive: 0x00ff7f,
        emissiveIntensity: 0.85,
        roughness: 0.3,
      });
      const innerMesh = new THREE.Mesh(lobeInnerGeo, lobeInnerMat);
      innerMesh.userData = { lobeIndex: i };
      lobeGroup.add(innerMesh);

      brainGroup.add(lobeGroup);
      lobeMeshes.push({
        group: lobeGroup,
        outer: outerMesh,
        inner: innerMesh,
        outerMat: lobeOuterMat,
        innerMat: lobeInnerMat,
      });

      // Synaptic Laser Line to Center
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.38,
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, posY, z),
      ]);
      const synLine = new THREE.Line(lineGeo, lineMat);
      brainGroup.add(synLine);
    }
    lobeMeshesRef.current = lobeMeshes;

    // Concentric Orbital Resonance Rings (3.69 Hz Guidance)
    const ringRadii = [5.4, 6.8, 8.2];
    ringRadii.forEach((radius, i) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.035, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0xffd700 : 0x00e5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22 - i * 0.04,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + i * 0.25;
      ringMesh.rotation.y = i * 0.35;
      brainGroup.add(ringMesh);
    });

    // Ambient Swarm Particle Field
    const particleCount = 650;
    const particleGeo = new THREE.BufferGeometry();
    const pCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pCoords[i] = (Math.random() - 0.5) * 32;
      pCoords[i + 1] = (Math.random() - 0.5) * 22;
      pCoords[i + 2] = (Math.random() - 0.5) * 32;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pCoords, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Raycasting for interactive 3D Lobe selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets: THREE.Object3D[] = [];
      lobeMeshes.forEach(l => {
        targets.push(l.outer);
        targets.push(l.inner);
      });
      const intersects = raycaster.intersectObjects(targets, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const lobeIdx = hit.userData?.lobeIndex;
        if (typeof lobeIdx === 'number') {
          onSelectRef.current(lobeIdx);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      controls.update();

      // Brain Group Continuous Gyro Rotation
      brainGroup.rotation.y = elapsedTime * 0.12;
      brainGroup.rotation.x = Math.sin(elapsedTime * 0.18) * 0.07;
      centralCore.rotation.x = -elapsedTime * 0.35;
      centralCore.rotation.y = elapsedTime * 0.45;
      innerCoreMesh.rotation.y = -elapsedTime * 0.55;

      // 3.69 Hz Tesla Breathing Cadence
      const pulseRate = metronomeHz || 3.69;
      const pulse = 1.0 + 0.07 * Math.sin(elapsedTime * pulseRate * Math.PI * 2);
      centralCore.scale.set(pulse, pulse, pulse);

      // Orbit Lobes Rotation & Selected Visual Focus
      lobeMeshes.forEach((item, idx) => {
        item.outer.rotation.y += 0.015;
        item.outer.rotation.x += 0.008;

        const isSelected = idx === selectedLobeIdx;
        if (isSelected) {
          item.inner.scale.set(1.45, 1.45, 1.45);
          item.outerMat.color.setHex(0xffd700);
          item.outerMat.opacity = 0.95;
        } else {
          item.inner.scale.set(1.0, 1.0, 1.0);
          item.outerMat.color.setHex(0x00e5ff);
          item.outerMat.opacity = 0.6;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [metronomeHz, selectedLobeIdx]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
    />
  );
};
