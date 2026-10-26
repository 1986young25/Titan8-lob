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
  lobes,
  selectedLobeIdx,
  onSelectLobe,
  metronomeHz,
  pulseTrigger,
  tripwireTrigger,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const centralWireMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const centralDiamondRef = useRef<THREE.Mesh | null>(null);
  const centralGroupRef = useRef<THREE.Group | null>(null);
  const coreLightRef = useRef<THREE.PointLight | null>(null);

  const lobeMeshesRef = useRef<Array<{
    group: THREE.Group;
    outerMesh: THREE.Mesh;
    innerMesh: THREE.Mesh;
    outerMat: THREE.MeshStandardMaterial;
    innerMat: THREE.MeshStandardMaterial;
    laserLine: THREE.Line;
    basePos: THREE.Vector3;
    baseScale: number;
    colorHex: number;
  }>>([]);

  const onSelectRef = useRef(onSelectLobe);
  onSelectRef.current = onSelectLobe;

  // React to Pulse Trigger
  useEffect(() => {
    if (pulseTrigger === 0) return;
    if (centralWireMatRef.current && coreLightRef.current && centralDiamondRef.current) {
      centralWireMatRef.current.color.setHex(0xffffff);
      coreLightRef.current.intensity = 5.5;
      centralDiamondRef.current.scale.set(1.5, 1.5, 1.5);

      const timer = setTimeout(() => {
        if (centralWireMatRef.current && coreLightRef.current && centralDiamondRef.current) {
          centralWireMatRef.current.color.setHex(0xf59e0b);
          coreLightRef.current.intensity = 2.4;
          centralDiamondRef.current.scale.set(1.0, 1.0, 1.0);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pulseTrigger]);

  // React to Tripwire Trigger
  useEffect(() => {
    if (tripwireTrigger === 0) return;
    const lobe0 = lobeMeshesRef.current[0];
    const lobe4 = lobeMeshesRef.current[4]; // AMRA Vanguard
    [lobe0, lobe4].forEach((item) => {
      if (item) {
        item.outerMat.color.setHex(0xff1744);
        item.innerMat.color.setHex(0xff1744);
        item.innerMat.emissive.setHex(0xff1744);
      }
    });

    const timer = setTimeout(() => {
      [lobe0, lobe4].forEach((item) => {
        if (item) {
          item.outerMat.color.setHex(item.colorHex);
          item.innerMat.color.setHex(item.colorHex);
          item.innerMat.emissive.setHex(item.colorHex);
        }
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [tripwireTrigger]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect Software WebGL fallback
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
    scene.fog = new THREE.FogExp2(0x030712, 0.028);

    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 14.5);

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
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 30;
    controls.minDistance = 3.2;
    controls.autoRotate = false;

    // Ambient & Tactical Lights
    const ambientLight = new THREE.AmbientLight(0x06b6d4, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x06b6d4, 0x030712, 0.7);
    scene.add(hemiLight);

    const coreLight = new THREE.PointLight(0xf59e0b, 2.4, 28);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    const topCyanLight = new THREE.PointLight(0x06b6d4, 1.8, 24);
    topCyanLight.position.set(0, 8, 0);
    scene.add(topCyanLight);

    // Main Brain Group (lobes + central core + connections)
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 4D Gaussian Splatting Cloud (1,024 points, rotating counter to brain group)
    const splatGroup = new THREE.Group();
    scene.add(splatGroup);

    const splatCount = 1024;
    const splatPositions = new Float32Array(splatCount * 3);
    const splatColors = new Float32Array(splatCount * 3);

    for (let i = 0; i < splatCount; i++) {
      // Spherical distribution with radius between 3.2 and 8.5
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.2 + Math.pow(Math.random(), 0.8) * 5.3;

      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);

      splatPositions[i * 3] = x;
      splatPositions[i * 3 + 1] = y;
      splatPositions[i * 3 + 2] = z;

      // Color variation based on radial distance and coordinate angle
      const c = new THREE.Color();
      if (r < 4.5) {
        c.setHex(0xf59e0b); // Amber Core
      } else if (r < 6.5) {
        c.setHex(0x06b6d4); // Cyan Field
      } else {
        c.setHex(0x10b981); // Emerald Boundary
      }
      splatColors[i * 3] = c.r;
      splatColors[i * 3 + 1] = c.g;
      splatColors[i * 3 + 2] = c.b;
    }

    const splatGeo = new THREE.BufferGeometry();
    splatGeo.setAttribute('position', new THREE.BufferAttribute(splatPositions, 3));
    splatGeo.setAttribute('color', new THREE.BufferAttribute(splatColors, 3));

    const splatMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const splatPoints = new THREE.Points(splatGeo, splatMat);
    splatGroup.add(splatPoints);

    // Concentric Harmonic Resonance Rings (3.69 Hz Guidance)
    const ringRadii = [5.0, 6.8, 8.6];
    ringRadii.forEach((radius, i) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.04, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xf59e0b : 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.24 - i * 0.05,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + i * 0.22;
      ringMesh.rotation.y = i * 0.38;
      brainGroup.add(ringMesh);
    });

    // Central Core Group (Lobe 0: AURA)
    const centralGroup = new THREE.Group();
    centralGroup.position.set(0, 0, 0);
    centralGroup.userData = { lobeIndex: 0 };
    brainGroup.add(centralGroup);
    centralGroupRef.current = centralGroup;

    // Lobe 0 Outer: Icosahedron Wireframe (scale: 1.8, color: 0xf59e0b)
    const centralWireGeo = new THREE.IcosahedronGeometry(1.8, 1);
    const centralWireMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x8a5300,
      emissiveIntensity: 0.4,
      wireframe: true,
      transparent: true,
      opacity: 0.88,
    });
    centralWireMatRef.current = centralWireMat;
    const centralWireMesh = new THREE.Mesh(centralWireGeo, centralWireMat);
    centralWireMesh.userData = { lobeIndex: 0 };
    centralGroup.add(centralWireMesh);

    // Lobe 0 Inner: Diamond Octahedron Core (color: 0xff4500)
    const diamondGeo = new THREE.OctahedronGeometry(0.85, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    diamondMesh.userData = { lobeIndex: 0 };
    centralGroup.add(diamondMesh);
    centralDiamondRef.current = diamondMesh;

    // Initialize Lobes 0..7 References & Satellites (1..7)
    const lobeMeshes: Array<{
      group: THREE.Group;
      outerMesh: THREE.Mesh;
      innerMesh: THREE.Mesh;
      outerMat: THREE.MeshStandardMaterial;
      innerMat: THREE.MeshStandardMaterial;
      laserLine: THREE.Line;
      basePos: THREE.Vector3;
      baseScale: number;
      colorHex: number;
    }> = [];

    // Register Lobe 0
    const zeroDummyLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial());
    lobeMeshes.push({
      group: centralGroup,
      outerMesh: centralWireMesh,
      innerMesh: diamondMesh,
      outerMat: centralWireMat,
      innerMat: diamondMat,
      laserLine: zeroDummyLine,
      basePos: new THREE.Vector3(0, 0, 0),
      baseScale: 1.8,
      colorHex: 0xf59e0b,
    });

    // Build Satellites 1..7 at their precise spatial coordinates
    lobes.forEach((lobe, idx) => {
      if (idx === 0) return; // Central core handled above

      const [px, py, pz] = lobe.pos || [0, 0, 0];
      const satGroup = new THREE.Group();
      satGroup.position.set(px, py, pz);
      satGroup.userData = { lobeIndex: idx };

      // Outer Wireframe Octahedron
      const outerGeo = new THREE.OctahedronGeometry((lobe.scale || 1.0) * 0.82, 1);
      const outerMat = new THREE.MeshStandardMaterial({
        color: lobe.colorHex || 0x06b6d4,
        emissive: lobe.colorHex || 0x06b6d4,
        emissiveIntensity: 0.35,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.userData = { lobeIndex: idx };
      satGroup.add(outerMesh);

      // Inner Glowing Nucleus Sphere
      const innerGeo = new THREE.SphereGeometry((lobe.scale || 1.0) * 0.3, 16, 16);
      const innerMat = new THREE.MeshStandardMaterial({
        color: lobe.colorHex || 0x06b6d4,
        emissive: lobe.colorHex || 0x06b6d4,
        emissiveIntensity: 0.9,
        roughness: 0.25,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.userData = { lobeIndex: idx };
      satGroup.add(innerMesh);

      brainGroup.add(satGroup);

      // Laser Synaptic Vector Line to [0, 0, 0]
      const lineMat = new THREE.LineBasicMaterial({
        color: lobe.colorHex || 0x06b6d4,
        transparent: true,
        opacity: 0.45,
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(px, py, pz),
      ]);
      const laserLine = new THREE.Line(lineGeo, lineMat);
      brainGroup.add(laserLine);

      lobeMeshes.push({
        group: satGroup,
        outerMesh,
        innerMesh,
        outerMat,
        innerMat,
        laserLine,
        basePos: new THREE.Vector3(px, py, pz),
        baseScale: lobe.scale || 1.0,
        colorHex: lobe.colorHex || 0x06b6d4,
      });
    });

    lobeMeshesRef.current = lobeMeshes;

    // Raycasting for interactive 3D Lobe selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets: THREE.Object3D[] = [];
      lobeMeshes.forEach((item) => {
        targets.push(item.outerMesh);
        targets.push(item.innerMesh);
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
      brainGroup.rotation.x = Math.sin(elapsedTime * 0.16) * 0.06;

      // 4D Gaussian Splatting Cloud Counter-Rotation
      splatGroup.rotation.y = -elapsedTime * 0.08;
      splatGroup.rotation.x = Math.cos(elapsedTime * 0.1) * 0.04;

      // Central diamond rotation
      if (centralDiamondRef.current) {
        centralDiamondRef.current.rotation.x = -elapsedTime * 0.45;
        centralDiamondRef.current.rotation.y = elapsedTime * 0.55;
      }

      // 3.69 Hz Tesla Breathing Cadence
      const pulseRate = metronomeHz || 3.69;
      const breathing = 1.0 + 0.06 * Math.sin(elapsedTime * pulseRate * Math.PI * 2);
      if (centralGroupRef.current) {
        centralGroupRef.current.scale.set(breathing, breathing, breathing);
      }

      // Satellite animation & selected highlight
      lobeMeshes.forEach((item, idx) => {
        item.outerMesh.rotation.y += 0.016;
        item.outerMesh.rotation.x += 0.009;

        const isSelected = idx === selectedLobeIdx;
        if (idx === 0) {
          // Central core
          if (isSelected) {
            item.outerMat.color.setHex(0xffffff);
            item.outerMat.emissiveIntensity = 0.8;
          } else {
            item.outerMat.color.setHex(0xf59e0b);
            item.outerMat.emissiveIntensity = 0.4;
          }
        } else {
          // Satellites
          if (isSelected) {
            item.innerMesh.scale.set(1.5, 1.5, 1.5);
            item.outerMat.color.setHex(0xffd700);
            item.outerMat.opacity = 1.0;
            (item.laserLine.material as THREE.LineBasicMaterial).opacity = 0.9;
            (item.laserLine.material as THREE.LineBasicMaterial).color.setHex(0xffd700);
          } else {
            item.innerMesh.scale.set(1.0, 1.0, 1.0);
            item.outerMat.color.setHex(item.colorHex);
            item.outerMat.opacity = 0.75;
            (item.laserLine.material as THREE.LineBasicMaterial).opacity = 0.35;
            (item.laserLine.material as THREE.LineBasicMaterial).color.setHex(item.colorHex);
          }
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
  }, [lobes, metronomeHz, selectedLobeIdx]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
    />
  );
};
