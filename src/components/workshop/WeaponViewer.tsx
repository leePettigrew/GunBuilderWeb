"use client";

/**
 * Workshop viewer v2 — the Tarkov loop, for real:
 *  - visible anchor points (ember rings) measured from the model's geometry
 *  - pieces are physical objects: drag them off, drop them near an anchor to
 *    snap on; incompatible or occupied anchors refuse
 *  - socket chaining: a mounted rail provides a raised railTop anchor
 *  - rotate / scale gizmos on the selected piece ("extrude" = axis scale)
 *  - reworked exploded view (per-part directions) + full bench layout mode
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, TransformControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  PIECES,
  SLIDE_FINISHES,
  WEAPON_MODELS,
  type PartId,
  type PieceDef,
  type PlacedPiece,
  type SocketType,
  type WeaponModelDef,
} from "@/lib/workshop/manifests";

// ---------------------------------------------------------------------------
// State contract with the page
// ---------------------------------------------------------------------------

export interface WorkshopState {
  modelId: string;
  view: "assembled" | "bench";
  explode: number;
  clay: boolean;
  spin: boolean;
  finish: string; // slide finish id
  placed: PlacedPiece[];
  selectedKey: string | null;
  gizmo: "off" | "rotate" | "scale";
}

export interface ViewerCallbacks {
  updatePiece: (key: string, patch: Partial<PlacedPiece>) => void;
  selectPiece: (key: string | null) => void;
  onHoverPart: (part: PartId | null) => void;
}

export const PART_LABELS: Record<PartId, string> = {
  frame: "Frame",
  slide: "Slide",
  barrel: "Barrel",
  mag: "Magazine",
  trigger: "Trigger group",
  misc: "Misc",
};

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

const clayMat = (color: string, metalness: number, roughness: number) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

const CLAY: Record<PartId, THREE.MeshStandardMaterial> = {
  frame: clayMat("#454c55", 0.6, 0.52),
  slide: clayMat("#5d656f", 0.7, 0.4),
  barrel: clayMat("#737a83", 0.75, 0.32),
  mag: clayMat("#3a4048", 0.55, 0.58),
  trigger: clayMat("#868d95", 0.7, 0.36),
  misc: clayMat("#525960", 0.65, 0.46),
};
const PIECE_MAT = clayMat("#343b43", 0.65, 0.44);
const PIECE_MAT_SELECTED = clayMat("#3f4854", 0.65, 0.4);
PIECE_MAT_SELECTED.emissive = new THREE.Color("#ff6a2b");
PIECE_MAT_SELECTED.emissiveIntensity = 0.16;

// ---------------------------------------------------------------------------
// Socket model
// ---------------------------------------------------------------------------

interface SocketInstance {
  id: string; // "muzzle" | "railTop" | "under" | "magwell" | "<type>@<pieceKey>"
  type: SocketType;
  pos: THREE.Vector3;
}

/** Mount offset so a piece's body sits ON the anchor, not centered in it. */
function mountOffset(def: PieceDef): THREE.Vector3 {
  switch (def.socket) {
    case "muzzle":
      return new THREE.Vector3(def.lengthFrac / 2 + 0.005, 0, 0);
    case "railTop":
      return new THREE.Vector3(0, 0.01, 0);
    case "under":
      return new THREE.Vector3(0, -0.032, 0);
    case "magwell":
      return new THREE.Vector3(-0.02, -0.1, 0);
    case "side":
      return new THREE.Vector3(0, 0, 0.04);
  }
}

// ---------------------------------------------------------------------------
// Weapon loading — normalized, part-grouped, sockets measured from geometry
// ---------------------------------------------------------------------------

function useWeapon(def: WeaponModelDef) {
  const gltf = useGLTF(def.url);
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    root.rotation.set(...def.preRotation);
    root.updateMatrixWorld(true);

    // pass 1: group every mesh by part name (mesh name or ancestors)
    const allMeshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const names = [obj.name, obj.parent?.name ?? "", obj.parent?.parent?.name ?? ""];
        let part: PartId = "frame";
        outer: for (const [re, p] of def.parts) {
          for (const n of names) {
            if (n !== "" && re.test(n)) {
              part = p;
              break outer;
            }
          }
        }
        obj.userData.part = part;
        allMeshes.push(obj);
      }
    });

    // pass 2: showcase GLBs scatter spare mags/slides/bullets around the gun —
    // keep only meshes clustered around the frame, hide the props
    const frameBox = new THREE.Box3();
    for (const m of allMeshes) if (m.userData.part === "frame") frameBox.expandByObject(m);
    const pad = frameBox.getSize(new THREE.Vector3()).length() * 0.35;
    const keepBox = frameBox.clone().expandByScalar(pad);
    const kept: THREE.Mesh[] = [];
    for (const m of allMeshes) {
      const mb = new THREE.Box3().setFromObject(m);
      const stray = !keepBox.intersectsBox(mb);
      const hidden = def.hidden?.test(m.name) === true;
      m.visible = !stray && !hidden;
      m.userData.stray = stray;
      if (!stray && !hidden) kept.push(m);
    }

    // pass 3: normalize using the KEPT cluster only
    const box = new THREE.Box3();
    for (const m of kept) box.expandByObject(m);
    const size = box.getSize(new THREE.Vector3());
    const scale = 1 / Math.max(size.x, size.y, size.z, 1e-6);
    const center = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    root.position.sub(center);
    holder.add(root);
    holder.scale.setScalar(scale);
    holder.updateMatrixWorld(true);

    const groups = new Map<PartId, THREE.Mesh[]>();
    for (const m of kept) {
      m.userData.originalMaterial = m.material;
      m.userData.basePos = m.position.clone();
      const part = m.userData.part as PartId;
      const list = groups.get(part) ?? [];
      list.push(m);
      groups.set(part, list);
    }

    const boxOf = (part: PartId): THREE.Box3 | null => {
      const meshes = groups.get(part);
      if (!meshes || meshes.length === 0) return null;
      const b = new THREE.Box3();
      for (const m of meshes) b.expandByObject(m);
      return b;
    };
    const all = new THREE.Box3().setFromObject(holder);
    const barrelBox = boxOf("barrel");
    const slideBox = boxOf("slide");
    const magBox = boxOf("mag");
    const boreY = barrelBox
      ? (barrelBox.min.y + barrelBox.max.y) / 2
      : slideBox
        ? (slideBox.min.y + slideBox.max.y) / 2
        : all.min.y + (all.max.y - all.min.y) * 0.72;
    const sockets: SocketInstance[] = [
      { id: "muzzle", type: "muzzle", pos: new THREE.Vector3(all.max.x, boreY, 0) },
      {
        id: "railTop",
        type: "railTop",
        pos: new THREE.Vector3(
          slideBox ? slideBox.min.x + (slideBox.max.x - slideBox.min.x) * 0.24 : -0.1,
          (slideBox ? slideBox.max.y : all.max.y) + 0.004,
          0,
        ),
      },
      { id: "under", type: "under", pos: new THREE.Vector3(all.max.x - 0.16, boreY - 0.07, 0) },
      {
        id: "magwell",
        type: "magwell",
        pos: new THREE.Vector3(
          magBox ? (magBox.min.x + magBox.max.x) / 2 : all.min.x + 0.22,
          magBox ? magBox.min.y + 0.02 : all.min.y + 0.05,
          0,
        ),
      },
    ];
    return { holder, groups, sockets };
  }, [gltf.scene, def]);
}

// ---------------------------------------------------------------------------
// Procedural pieces — modelled with lathes and slotted profiles
// ---------------------------------------------------------------------------

function lathe(points: [number, number][], segments = 28): THREE.BufferGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  ).rotateZ(-Math.PI / 2);
}

function ProceduralPiece({ def, selected }: { def: PieceDef; selected: boolean }) {
  const mat = selected ? PIECE_MAT_SELECTED : PIECE_MAT;
  const latheGeo = useMemo(() => {
    switch (def.id) {
      case "suppressorSlim":
        return lathe([
          [0, -0.15], [0.024, -0.148], [0.03, -0.14], [0.03, -0.05], [0.027, -0.045], [0.03, -0.04],
          [0.03, 0.05], [0.027, 0.055], [0.03, 0.06], [0.03, 0.14], [0.024, 0.148], [0, 0.15],
        ]);
      case "suppressorHeavy":
        return lathe([
          [0, -0.12], [0.03, -0.118], [0.042, -0.105], [0.042, -0.02], [0.038, -0.015], [0.042, -0.01],
          [0.042, 0.07], [0.038, 0.075], [0.042, 0.08], [0.042, 0.1], [0.03, 0.115], [0, 0.118],
        ]);
      case "portedBrake":
        return lathe([
          [0, -0.055], [0.026, -0.053], [0.03, -0.045], [0.03, -0.03], [0.034, -0.025], [0.034, -0.01],
          [0.03, -0.005], [0.03, 0.01], [0.034, 0.015], [0.034, 0.03], [0.03, 0.035], [0.026, 0.05], [0, 0.053],
        ]);
      default:
        return null;
    }
  }, [def.id]);

  if (latheGeo) return <mesh geometry={latheGeo} material={mat} />;

  switch (def.id) {
    case "compensator":
      return (
        <group>
          <mesh material={mat}>
            <boxGeometry args={[0.09, 0.05, 0.052]} />
          </mesh>
          {[-0.02, 0.012].map((x) => (
            <mesh key={x} position={[x, 0.026, 0]} material={CLAY.mag}>
              <boxGeometry args={[0.022, 0.004, 0.034]} />
            </mesh>
          ))}
        </group>
      );
    case "railSegment":
      return (
        <group>
          <mesh material={mat} position={[0, 0.008, 0]}>
            <boxGeometry args={[0.3, 0.016, 0.05]} />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => -0.126 + i * 0.042).map((x) => (
            <mesh key={x} material={mat} position={[x, 0.024, 0]}>
              <boxGeometry args={[0.024, 0.016, 0.056]} />
            </mesh>
          ))}
        </group>
      );
    case "redDot":
      return (
        <group>
          <mesh material={mat} position={[0, 0.006, 0]}>
            <boxGeometry args={[0.08, 0.014, 0.04]} />
          </mesh>
          <mesh material={mat} position={[-0.006, 0.03, 0]}>
            <boxGeometry args={[0.042, 0.032, 0.036]} />
          </mesh>
          <mesh position={[-0.006, 0.03, 0]}>
            <boxGeometry args={[0.038, 0.024, 0.038]} />
            <meshStandardMaterial color="#101418" emissive="#ff3b1f" emissiveIntensity={0.9} />
          </mesh>
        </group>
      );
    case "magExtended":
      return (
        <group>
          <mesh material={mat} position={[0, -0.1, 0]}>
            <boxGeometry args={[0.085, 0.24, 0.05]} />
          </mesh>
          <mesh material={mat} position={[-0.004, -0.228, 0]}>
            <boxGeometry args={[0.105, 0.02, 0.062]} />
          </mesh>
        </group>
      );
    case "magDrum":
      return (
        <group>
          <mesh material={mat} position={[0, -0.06, 0]}>
            <boxGeometry args={[0.07, 0.12, 0.046]} />
          </mesh>
          <mesh material={mat} position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.05, 24]} />
          </mesh>
          <mesh material={CLAY.trigger} position={[0, -0.16, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
          </mesh>
        </group>
      );
    case "verticalGrip":
      return (
        <group>
          <mesh material={mat} position={[0, -0.008, 0]}>
            <boxGeometry args={[0.09, 0.016, 0.048]} />
          </mesh>
          <mesh material={mat} position={[0.004, -0.062, 0]} rotation={[0, 0, 0.14]}>
            <cylinderGeometry args={[0.021, 0.027, 0.095, 14]} />
          </mesh>
          {[-0.082, -0.062, -0.042].map((y) => (
            <mesh key={y} material={CLAY.mag} position={[0.004 + (y + 0.062) * 0.14, y, 0]} rotation={[0, 0, 0.14]}>
              <cylinderGeometry args={[0.0275, 0.0275, 0.006, 14]} />
            </mesh>
          ))}
        </group>
      );
    case "cantedIrons":
      return (
        <group rotation={[-0.6, 0, 0]}>
          <mesh material={mat} position={[-0.03, 0.014, 0]}>
            <boxGeometry args={[0.018, 0.028, 0.03]} />
          </mesh>
          <mesh material={mat} position={[0.032, 0.011, 0]}>
            <boxGeometry args={[0.012, 0.022, 0.006]} />
          </mesh>
          <mesh material={mat} position={[0, 0.002, 0]}>
            <boxGeometry args={[0.095, 0.008, 0.02]} />
          </mesh>
        </group>
      );
    case "laser":
      return (
        <group>
          <mesh material={mat}>
            <boxGeometry args={[0.09, 0.042, 0.048]} />
          </mesh>
          <mesh position={[0.048, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.01, 12]} />
            <meshStandardMaterial color="#200505" emissive="#ff2020" emissiveIntensity={1.4} />
          </mesh>
        </group>
      );
    case "flashlight":
      return (
        <group>
          <mesh material={mat} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.026, 0.031, 0.1, 18]} />
          </mesh>
          <mesh position={[0.052, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.029, 0.029, 0.006, 18]} />
            <meshStandardMaterial color="#fff7d6" emissive="#ffe9a0" emissiveIntensity={0.7} />
          </mesh>
        </group>
      );
    case "foregrip":
      return (
        <mesh material={mat} position={[0, -0.045, 0]}>
          <cylinderGeometry args={[0.02, 0.026, 0.09, 14]} />
        </mesh>
      );
    default:
      return (
        <mesh material={mat}>
          <boxGeometry args={[0.08, 0.05, 0.05]} />
        </mesh>
      );
  }
}

function GlbPiece({ def, selected }: { def: PieceDef; selected: boolean }) {
  const gltf = useGLTF(def.url ?? "");
  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.rotation.set(...def.preRotation);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = def.lengthFrac / Math.max(size.x, size.y, size.z, 1e-6);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);
    const holder = new THREE.Group();
    holder.add(root);
    holder.scale.setScalar(scale);
    return holder;
  }, [gltf.scene, def]);
  useMemo(() => {
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.material = selected ? PIECE_MAT_SELECTED : PIECE_MAT;
    });
  }, [scene, selected]);
  return <primitive object={scene} />;
}

// ---------------------------------------------------------------------------
// Anchor marker
// ---------------------------------------------------------------------------

function AnchorMarker({ socket, active, occupied }: { socket: SocketInstance; active: boolean; occupied: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && active) {
      const s = 1 + Math.sin(clock.elapsedTime * 5) * 0.15;
      ref.current.scale.setScalar(s);
    }
  });
  const color = occupied ? "#5c6650" : active ? "#ff6a2b" : "#7a4a30";
  return (
    <group ref={ref} position={socket.pos}>
      {active && (
        <Html center style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "#ff6a2b",
              background: "rgba(13,17,22,0.85)",
              border: "1px solid rgba(255,106,43,0.5)",
              borderRadius: 3,
              padding: "1px 5px",
              transform: "translateY(-22px)",
              whiteSpace: "nowrap",
            }}
          >
            {socket.type.toUpperCase()}
          </div>
        </Html>
      )}
      <mesh rotation={socket.type === "muzzle" ? [0, Math.PI / 2, 0] : [Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.022, 0.003, 8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.95 : 0.45} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const EXPLODE_DIR: Record<PartId, [number, number, number]> = {
  slide: [0.06, 0.26, 0],
  barrel: [0.34, 0.1, 0],
  mag: [-0.02, -0.3, 0],
  trigger: [0.02, -0.14, 0.08],
  frame: [0, 0, 0],
  misc: [-0.1, -0.06, 0.16],
};

const SOCKET_EXPLODE: Record<SocketType, [number, number, number]> = {
  muzzle: [0.24, 0, 0],
  railTop: [0, 0.2, 0],
  under: [0, -0.2, 0],
  magwell: [0, -0.26, 0],
  side: [0, 0, 0.2],
};

const BENCH_SLOTS: Record<PartId, [number, number, number]> = {
  frame: [0, -0.3, 0],
  slide: [-0.15, -0.3, -0.42],
  barrel: [0.42, -0.3, -0.42],
  mag: [-0.55, -0.3, 0],
  trigger: [0.55, -0.3, 0.05],
  misc: [0.55, -0.3, -0.2],
};

function pieceDef(id: string): PieceDef | undefined {
  return PIECES.find((p) => p.id === id);
}

/** Animated piece holder: lerps to its target unless being dragged. */
function PieceNode({
  target,
  immediate,
  rot,
  scale,
  refCb,
  onPointerDown,
  onPointerOver,
  onPointerOut,
  children,
}: {
  target: [number, number, number];
  immediate: boolean;
  rot: [number, number, number];
  scale: [number, number, number];
  refCb: (g: THREE.Group | null) => void;
  onPointerDown: (e: { stopPropagation: () => void; point: THREE.Vector3 }) => void;
  onPointerOver?: (e: { stopPropagation: () => void }) => void;
  onPointerOut?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group | null>(null);
  const initialized = useRef(false);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = new THREE.Vector3(...target);
    if (!initialized.current || immediate) {
      g.position.copy(t);
      initialized.current = true;
    } else {
      g.position.lerp(t, 0.22);
    }
  });
  return (
    <group
      ref={(g: THREE.Group | null) => {
        ref.current = g;
        refCb(g);
      }}
      rotation={rot}
      scale={scale}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {children}
    </group>
  );
}

function EnvironmentSetup() {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.9;
  }, [gl, scene]);
  return null;
}

function Scene({ state, cb }: { state: WorkshopState; cb: ViewerCallbacks }) {
  const def = WEAPON_MODELS.find((m) => m.id === state.modelId) ?? WEAPON_MODELS[0]!;
  const { holder, groups, sockets: baseSockets } = useWeapon(def);
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const pieceRefs = useRef(new Map<string, THREE.Group>());
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const dragPlane = useRef(new THREE.Plane());
  const spinGroup = useRef<THREE.Group>(null);

  // full socket list: base + sockets provided by mounted rail pieces
  const sockets = useMemo(() => {
    const list = [...baseSockets];
    for (const placed of state.placed) {
      const d = pieceDef(placed.pieceId);
      if (!d?.provides || placed.attachedTo === null) continue;
      const host = list.find((s) => s.id === placed.attachedTo);
      if (!host) continue;
      const off = mountOffset(d);
      for (const prov of d.provides) {
        list.push({
          id: `${prov.type}@${placed.key}`,
          type: prov.type,
          pos: host.pos.clone().add(off).add(new THREE.Vector3(...prov.offset)),
        });
      }
    }
    return list;
  }, [baseSockets, state.placed]);

  const occupiedIds = useMemo(
    () => new Set(state.placed.filter((p) => p.attachedTo !== null).map((p) => p.attachedTo as string)),
    [state.placed],
  );
  const magFitted = state.placed.some(
    (p) => p.attachedTo === "magwell" && pieceDef(p.pieceId)?.category === "magazine",
  );
  const draggingDef =
    draggingKey !== null ? pieceDef(state.placed.find((p) => p.key === draggingKey)?.pieceId ?? "") : undefined;

  const finishColor = SLIDE_FINISHES.find((f) => f.id === state.finish)?.color ?? "#5d656f";

  useFrame((_, delta) => {
    if (spinGroup.current && state.spin && state.view === "assembled") spinGroup.current.rotation.y += delta * 0.35;
    CLAY.slide.color.set(finishColor);
    for (const [part, meshes] of groups) {
      for (const mesh of meshes) {
        const original = mesh.userData.originalMaterial as THREE.Material;
        const target = state.clay ? CLAY[part] : original;
        if (mesh.material !== target) mesh.material = target;
        if (part === "mag") mesh.visible = !magFitted;
        const basePos = mesh.userData.basePos as THREE.Vector3 | undefined;
        if (basePos) {
          const inv = 1 / Math.max(mesh.parent?.getWorldScale(new THREE.Vector3()).x ?? 1, 1e-6);
          const target2 = basePos.clone();
          if (state.view === "bench") {
            const slot = BENCH_SLOTS[part];
            target2.add(new THREE.Vector3(slot[0] * inv * 0.3, slot[1] * inv * 0.55, slot[2] * inv * 0.55));
          } else {
            target2.add(new THREE.Vector3(...EXPLODE_DIR[part]).multiplyScalar(state.explode * inv * 0.32));
          }
          mesh.position.lerp(target2, 0.14);
        }
      }
    }
  });

  // drag machinery: raycast onto a camera-facing plane through the grab point
  useEffect(() => {
    if (draggingKey === null) return;
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(dragPlane.current, hit)) {
        const local = hit.clone();
        if (spinGroup.current) spinGroup.current.worldToLocal(local);
        cb.updatePiece(draggingKey, { attachedTo: null, pos: [local.x, local.y, local.z] });
      }
    };
    const up = () => {
      const placed = state.placed.find((p) => p.key === draggingKey);
      const d = placed ? pieceDef(placed.pieceId) : undefined;
      if (placed && d) {
        const pos = new THREE.Vector3(...placed.pos);
        let best: SocketInstance | null = null;
        let bestDist = 0.16; // snap radius
        for (const s of sockets) {
          if (s.type !== d.socket) continue;
          if (occupiedIds.has(s.id)) continue;
          const dist = s.pos.distanceTo(pos);
          if (dist < bestDist) {
            bestDist = dist;
            best = s;
          }
        }
        if (best !== null) cb.updatePiece(draggingKey, { attachedTo: best.id });
      }
      setDraggingKey(null);
    };
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [draggingKey, gl, camera, cb, sockets, occupiedIds, state.placed]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = draggingKey === null;
  }, [draggingKey]);

  // test hook: project pieces + sockets to canvas pixels for CDP tests
  const { size } = useThree();
  useFrame(() => {
    if (typeof window === "undefined" || !window.location.search.includes("wsdebug")) return;
    const v = new THREE.Vector3();
    const out: Record<string, [number, number]> = {};
    for (const [key, g] of pieceRefs.current) {
      g.getWorldPosition(v);
      v.project(camera);
      out[`piece:${key}`] = [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    }
    for (const sck of sockets) {
      v.copy(sck.pos);
      if (spinGroup.current) spinGroup.current.localToWorld(v);
      v.project(camera);
      out[`socket:${sck.id}`] = [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    }
    (window as unknown as { __wsScreens?: unknown }).__wsScreens = out;
  });

  const selectedPlaced = state.placed.find((p) => p.key === state.selectedKey) ?? null;
  const selectedObj = state.selectedKey !== null ? pieceRefs.current.get(state.selectedKey) : undefined;

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 2]} intensity={2.0} />
      <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#9db4c8" />
      <directionalLight position={[0, -2, 1]} intensity={0.3} color="#ff8a50" />
      <EnvironmentSetup />

      <group ref={spinGroup}>
        <primitive
          object={holder}
          onPointerOver={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
            e.stopPropagation();
            cb.onHoverPart((e.object.userData.part as PartId | undefined) ?? null);
          }}
          onPointerOut={() => cb.onHoverPart(null)}
          onPointerMissed={() => cb.selectPiece(null)}
        />

        {sockets.map((s) => (
          <AnchorMarker
            key={s.id}
            socket={s}
            occupied={occupiedIds.has(s.id)}
            active={draggingDef !== undefined && draggingDef.socket === s.type && !occupiedIds.has(s.id)}
          />
        ))}

        {state.placed.map((placed, idx) => {
          const d = pieceDef(placed.pieceId);
          if (!d) return null;
          const socket = placed.attachedTo !== null ? sockets.find((s) => s.id === placed.attachedTo) : null;
          let pos: [number, number, number];
          if (state.view === "bench") {
            pos = [-0.6 + (idx % 5) * 0.3, -0.4, 0.42 + Math.floor(idx / 5) * 0.28];
          } else if (socket) {
            const p = socket.pos.clone().add(mountOffset(d));
            if (state.explode > 0) p.add(new THREE.Vector3(...SOCKET_EXPLODE[d.socket]).multiplyScalar(state.explode));
            pos = [p.x, p.y, p.z];
          } else {
            pos = placed.pos;
          }
          const isSelected = state.selectedKey === placed.key;
          return (
            <PieceNode
              key={placed.key}
              target={pos}
              immediate={draggingKey === placed.key}
              rot={placed.rot}
              scale={placed.scale}
              refCb={(g) => {
                if (g) pieceRefs.current.set(placed.key, g);
                else pieceRefs.current.delete(placed.key);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                gl.domElement.style.cursor = "grab";
              }}
              onPointerOut={() => {
                gl.domElement.style.cursor = "auto";
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                cb.selectPiece(placed.key);
                if (state.gizmo !== "off" || state.view === "bench") return;
                gl.domElement.style.cursor = "grabbing";
                dragPlane.current.setFromNormalAndCoplanarPoint(
                  camera.getWorldDirection(new THREE.Vector3()).negate(),
                  e.point,
                );
                setDraggingKey(placed.key);
              }}
            >
              {d.url === null ? <ProceduralPiece def={d} selected={isSelected} /> : <GlbPiece def={d} selected={isSelected} />}
            </PieceNode>
          );
        })}
      </group>

      {selectedObj !== undefined && selectedPlaced !== null && state.gizmo !== "off" && (
        <TransformControls
          object={selectedObj}
          mode={state.gizmo}
          size={0.6}
          onMouseDown={() => {
            if (controlsRef.current) controlsRef.current.enabled = false;
          }}
          onMouseUp={() => {
            if (controlsRef.current) controlsRef.current.enabled = true;
            const g = pieceRefs.current.get(selectedPlaced.key);
            if (g) {
              cb.updatePiece(selectedPlaced.key, {
                rot: [g.rotation.x, g.rotation.y, g.rotation.z],
                scale: [g.scale.x, g.scale.y, g.scale.z],
              });
            }
          }}
        />
      )}

      <ContactShadows position={[0, -0.46, 0]} opacity={0.55} scale={3} blur={2.4} far={1.4} />
      <gridHelper args={[5, 50, "#243040", "#1a222e"]} position={[0, -0.461, 0]} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={2.6}
        target={[0.1, 0.02, 0]}
        makeDefault
      />
    </>
  );
}

// ---------------------------------------------------------------------------

export function WeaponViewer({
  state,
  cb,
  className,
}: {
  state: WorkshopState;
  cb: ViewerCallbacks;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [1.32, 0.5, 1.28], fov: 32 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#0d1116"]} />
        <Suspense fallback={null}>
          <Scene state={state} cb={cb} />
        </Suspense>
      </Canvas>
    </div>
  );
}

for (const m of WEAPON_MODELS) useGLTF.preload(m.url);
for (const p of PIECES) if (p.url !== null) useGLTF.preload(p.url);
