import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

THREE.Cache.enabled = true;

const DEFAULT_VIEW_DISTANCE = 10.2;
const MIN_VIEW_DISTANCE = 5.8;
const VIEW_ANGLE = Math.PI / 4;
const loader = new GLTFLoader();
const modelCache = new Map();

function loadModel(path) {
  if (!modelCache.has(path)) {
    modelCache.set(path, loader.loadAsync(path));
  }
  return modelCache.get(path);
}

export function preloadCellModels(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const startPreload = () => {
    uniquePaths.forEach((path, index) => {
      window.setTimeout(() => {
        loadModel(path).catch(() => {});
      }, 220 + index * 380);
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startPreload, { timeout: 1500 });
  } else {
    window.setTimeout(startPreload, 800);
  }
}

function updateCameraView(camera, distance) {
  const axis = distance / Math.sqrt(2);
  camera.position.set(0, axis, axis);
  camera.lookAt(0, 0, 0);
}

function makeBlobGeometry(id) {
  if (id === 'bacteria') return new THREE.CapsuleGeometry(1.85, 2.15, 18, 40);
  if (id === 'muscle') return new THREE.CapsuleGeometry(1.15, 4.7, 18, 52);
  if (id === 'neuron') return new THREE.SphereGeometry(1.35, 64, 32);
  return new THREE.SphereGeometry(id === 'plant' ? 1.95 : 1.65, 64, 32);
}

function addBranch(group, from, length, rotation, color) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(from.x, from.y, from.z),
    new THREE.Vector3(from.x + length * 0.32, from.y + 0.34, from.z + 0.12),
    new THREE.Vector3(from.x + length * 0.68, from.y - 0.18, from.z - 0.08),
    new THREE.Vector3(from.x + length, from.y + 0.14, from.z),
  ]);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 42, 0.055, 12, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.05 }),
  );
  tube.rotation.z = rotation;
  group.add(tube);
}

function buildFallbackCell(cell, crossSection, isolate) {
  const group = new THREE.Group();
  const accent = new THREE.Color(cell.accent);
  const shell = new THREE.Mesh(
    makeBlobGeometry(cell.id),
    new THREE.MeshPhysicalMaterial({
      color: accent,
      transparent: true,
      opacity: crossSection ? 0.28 : 0.48,
      roughness: 0.34,
      metalness: 0.02,
      transmission: 0.12,
      clearcoat: 0.4,
    }),
  );
  shell.scale.set(1.2, cell.id === 'muscle' ? 0.62 : 0.92, 0.82);
  if (cell.id === 'plant') shell.scale.set(1.05, 0.9, 0.62);
  if (cell.id === 'bacteria') shell.rotation.z = Math.PI / 2;
  if (cell.id === 'muscle') shell.rotation.z = Math.PI / 2;
  group.add(shell);

  if (cell.id === 'plant') {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(4.75, 3.85, 1.45, 8, 8, 2),
      new THREE.MeshStandardMaterial({
        color: '#8fbf63',
        transparent: true,
        opacity: 0.2,
        roughness: 0.6,
      }),
    );
    wall.rotation.z = 0.08;
    group.add(wall);
  }

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 48, 24),
    new THREE.MeshPhysicalMaterial({ color: '#6b3aa5', roughness: 0.28, clearcoat: 0.5 }),
  );
  nucleus.position.set(crossSection ? 0.42 : 0.15, 0.18, 0.38);
  nucleus.scale.set(1.2, 1.0, 0.9);
  group.add(nucleus);

  const innerColors = ['#f29362', '#46a6a1', '#e3b84f', '#8f69bd', '#d35a7c', '#5f9a66'];
  for (let i = 0; i < 22; i += 1) {
    const angle = i * 1.72;
    const radius = 0.55 + (i % 5) * 0.25;
    const part = new THREE.Mesh(
      i % 4 === 0 ? new THREE.TorusGeometry(0.22, 0.055, 10, 24) : new THREE.SphereGeometry(0.12 + (i % 3) * 0.035, 20, 12),
      new THREE.MeshStandardMaterial({
        color: innerColors[i % innerColors.length],
        roughness: 0.42,
        metalness: 0.03,
      }),
    );
    part.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.1) * radius * 0.68, (i % 7) * 0.09 - 0.22);
    part.rotation.set(angle * 0.2, angle * 0.33, angle * 0.1);
    if (isolate && i > 8) part.visible = false;
    group.add(part);
  }

  if (cell.id === 'neuron') {
    for (let i = 0; i < 9; i += 1) {
      addBranch(group, { x: 0.65, y: (i - 4) * 0.18, z: 0.05 }, 2.2 + i * 0.08, (i - 4) * 0.22, cell.accent);
    }
    addBranch(group, { x: -0.6, y: 0.02, z: 0 }, -3.3, 0.05, '#7382c7');
  }

  if (cell.id === 'bacteria' || cell.id === 'muscle') {
    for (let i = 0; i < 7; i += 1) {
      const strand = new THREE.Mesh(
        new THREE.TorusGeometry(0.72 + i * 0.08, 0.025, 8, 80),
        new THREE.MeshStandardMaterial({ color: i % 2 ? '#eaa0a8' : '#68b6ba', roughness: 0.5 }),
      );
      strand.rotation.set(Math.PI / 2, 0, i * 0.32);
      strand.scale.y = 0.35;
      strand.position.x = (i - 3) * 0.42;
      group.add(strand);
    }
  }

  if (crossSection) {
    const cut = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 64),
      new THREE.MeshBasicMaterial({ color: '#fff5dc', transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    cut.position.z = 0.62;
    cut.scale.set(cell.id === 'muscle' ? 1.75 : 1.08, 0.82, 1);
    group.add(cut);
  }

  return group;
}

export default function CellViewer({ cell, crossSection, isolate, autoRotate, onAssetState }) {
  const hostRef = useRef(null);
  const autoRotateRef = useRef(autoRotate);
  const stateRef = useRef({
    pointerDown: false,
    lastX: 0,
    lastY: 0,
    rotationX: 0.04,
    rotationY: -0.55,
    distance: DEFAULT_VIEW_DISTANCE,
  });
  const [assetMessage, setAssetMessage] = useState('正在加载 3D 素材');

  const key = useMemo(() => `${cell.id}-${crossSection}-${isolate}`, [cell.id, crossSection, isolate]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    stateRef.current.rotationX = 0.04;
    stateRef.current.rotationY = -0.55;
    stateRef.current.distance = DEFAULT_VIEW_DISTANCE;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, 0.1, 100);
    updateCameraView(camera, stateRef.current.distance);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight('#fff8e8', '#6d5c85', 2.35);
    scene.add(ambient);
    const mainLight = new THREE.DirectionalLight('#ffffff', 2.8);
    mainLight.position.set(3, 4, 5);
    scene.add(mainLight);
    const rim = new THREE.DirectionalLight(cell.accent, 1.4);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    const stage = new THREE.Group();
    scene.add(stage);

    setAssetMessage('正在加载 3D 素材');
    onAssetState?.('正在加载 3D 素材');

    let cancelled = false;
    loadModel(cell.model)
      .then((gltf) => {
        if (cancelled) return;
        stage.clear();
        const model = gltf.scene.clone(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        model.position.sub(center);

        const normalized = new THREE.Group();
        normalized.add(model);
        normalized.scale.setScalar((cell.modelSize ?? 4.4) / maxAxis);
        if (cell.modelOffset) {
          normalized.position.add(new THREE.Vector3(...cell.modelOffset));
        }
        stage.add(normalized);
        setAssetMessage('已加载 3D 素材');
        onAssetState?.('已加载你上传的 3D 素材');
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = buildFallbackCell(cell, crossSection, isolate);
        stage.add(fallback);
        setAssetMessage('3D 素材未加载');
        onAssetState?.('3D 素材未加载，请检查模型文件');
      });

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.012, 8, 130),
      new THREE.MeshBasicMaterial({ color: '#ded0b7', transparent: true, opacity: 0.85 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.78;
    scene.add(ring);

    const onPointerDown = (event) => {
      stateRef.current.pointerDown = true;
      stateRef.current.lastX = event.clientX;
      stateRef.current.lastY = event.clientY;
    };
    const onPointerMove = (event) => {
      if (!stateRef.current.pointerDown) return;
      const dx = event.clientX - stateRef.current.lastX;
      const dy = event.clientY - stateRef.current.lastY;
      stateRef.current.lastX = event.clientX;
      stateRef.current.lastY = event.clientY;
      stateRef.current.rotationY += dx * 0.008;
      stateRef.current.rotationX += dy * 0.006;
    };
    const onPointerUp = () => {
      stateRef.current.pointerDown = false;
    };
    const onWheel = (event) => {
      event.preventDefault();
      stateRef.current.distance = THREE.MathUtils.clamp(
        stateRef.current.distance + event.deltaY * 0.0035,
        MIN_VIEW_DISTANCE,
        DEFAULT_VIEW_DISTANCE,
      );
      updateCameraView(camera, stateRef.current.distance);
    };
    const onResetView = () => {
      stateRef.current.rotationX = 0.04;
      stateRef.current.rotationY = -0.55;
      stateRef.current.distance = DEFAULT_VIEW_DISTANCE;
      updateCameraView(camera, stateRef.current.distance);
    };
    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      updateCameraView(camera, stateRef.current.distance);
    };

    host.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    host.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('cellviewer:reset', onResetView);
    window.addEventListener('resize', onResize);

    let frame = 0;
    let disposed = false;
    const animate = () => {
      if (disposed) return;
      frame += 1;
      if (autoRotateRef.current && !stateRef.current.pointerDown) {
        stateRef.current.rotationY += 0.0045;
      }
      stage.rotation.y = stateRef.current.rotationY;
      stage.rotation.x = stateRef.current.rotationX;
      stage.position.y = Math.sin(frame * 0.015) * 0.045;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      host.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('wheel', onWheel);
      window.removeEventListener('cellviewer:reset', onResetView);
      window.removeEventListener('resize', onResize);
      cancelled = true;
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [key, cell, crossSection, isolate, onAssetState]);

  return (
    <div className="viewer-shell" style={{ '--accent': cell.accent }}>
      <div ref={hostRef} className="cell-canvas" aria-label={`${cell.name} 3D 展示`} />
      <div className="viewer-hint">
        <strong>拖动</strong>旋转
        <span>滚轮缩放</span>
        <span>按住拖拽平移视角感</span>
      </div>
      <div className="asset-badge">{assetMessage}</div>
    </div>
  );
}
