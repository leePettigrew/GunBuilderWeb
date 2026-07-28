"use client";

/**
 * The 3D workshop viewer: loads a sourced GLB, normalizes it (muzzle → +X,
 * length 1), regroups meshes into named parts, renders everything in a
 * unified "armory clay" material (or the model's own textures), snaps
 * attachment models to sockets, and supports hover/select, part toggles and
 * an exploded view — the Tarkov-style inspect loop.
 */

import { Suspense, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  ATTACHMENT_MODELS,
  WEAPON_MODELS,
  type AttachmentModelDef,
  type PartId,
  type WeaponModelDef,
} from "@/lib/workshop/manifests";

// ---------------------------------------------------------------------------
// Materials — armory clay per part group (untextured, coherent across models)
// ---------------------------------------------------------------------------

const CLAY: Record<PartId | "attachment", THREE.MeshStandardMaterial> = {
  frame: new THREE.MeshStandardMaterial({ color: "#454c55", metalness: 0.6, roughness: 0.52 }),
  slide: new THREE.MeshStandardMaterial({ color: "#5d656f", metalness: 0.7, roughness: 0.4 }),
  barrel: new THREE.MeshStandardMaterial({ color: "#737a83", metalness: 0.75, roughness: 0.32 }),
  mag: new THREE.MeshStandardMaterial({ color: "#3a4048", metalness: 0.55, roughness: 0.58 }),
  trigger: new THREE.MeshStandardMaterial({ color: "#868d95", metalness: 0.7, roughness: 0.36 }),
  misc: new THREE.MeshStandardMaterial({ color: "#525960", metalness: 0.65, roughness: 0.46 }),
  attachment: new THREE.MeshStandardMaterial({ color: "#343b43", metalness: 0.65, roughness: 0.44 }),
};
const HOVER_EMISSIVE = new THREE.Color("#ff6a2b");

export interface WorkshopState {
  modelId: string;
  attachmentIds: string[];
  magMode: "standard" | "extended" | "removed";
  slideOn: boolean;
  clay: boolean;
  exploded: number; // 0..1
  spin: boolean;
}

export const PART_LABELS: Record<PartId, string> = {
  frame: "Frame",
  slide: "Slide",
  barrel: "Barrel",
  mag: "Magazine",
  trigger: "Trigger group",
  misc: "Misc",
};

function partOf(def: WeaponModelDef, meshName: string): PartId {
  for (const [re, part] of def.parts) if (re.test(meshName)) return part;
  return "frame";
}

/** Clone + normalize: rotate per manifest, scale longest axis to 1, center. */
function useNormalizedScene(def: WeaponModelDef) {
  const gltf = useGLTF(def.url);
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    root.rotation.set(...def.preRotation);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = 1 / Math.max(size.x, size.y, size.z, 1e-6);
    const center = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    root.position.sub(center);
    holder.add(root);
    holder.scale.setScalar(scale);
    // collect meshes per part + keep original materials for the texture mode
    const groups = new Map<PartId, THREE.Mesh[]>();
    holder.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.userData.originalMaterial = obj.material;
        obj.userData.basePos = obj.position.clone();
        const part = partOf(def, obj.name || obj.parent?.name || "");
        if (def.hidden?.test(obj.name) === true) obj.visible = false;
        const list = groups.get(part) ?? [];
        list.push(obj);
        groups.set(part, list);
      }
    });
    // measured sockets: bore height + muzzle face from the barrel/slide
    // bounding boxes — no hand-tuned coordinates, tight for any model
    holder.updateMatrixWorld(true);
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
    const boreY = barrelBox
      ? (barrelBox.min.y + barrelBox.max.y) / 2
      : slideBox
        ? (slideBox.min.y + slideBox.max.y) / 2
        : all.min.y + (all.max.y - all.min.y) * 0.72;
    const muzzleX = barrelBox ? Math.max(barrelBox.max.x, all.max.x) : all.max.x;
    const topY = slideBox ? slideBox.max.y : all.max.y;
    const sockets = {
      muzzle: { x: muzzleX, y: boreY },
      rail: { x: slideBox ? slideBox.min.x + (slideBox.max.x - slideBox.min.x) * 0.24 : -0.1, y: topY },
      under: { x: muzzleX - 0.16, y: boreY - 0.075 },
    };
    return { holder, groups, sockets };
  }, [gltf.scene, def]);
}

// ---------------------------------------------------------------------------
// Procedural attachments (clay-native: red dot, laser, flashlight)
// ---------------------------------------------------------------------------

function ProceduralAttachment({ def }: { def: AttachmentModelDef }) {
  if (def.id === "redDot") {
    return (
      <group>
        <mesh material={CLAY.attachment} position={[0, 0.01, 0]}>
          <boxGeometry args={[0.085, 0.022, 0.042]} />
        </mesh>
        <mesh material={CLAY.attachment} position={[-0.008, 0.042, 0]}>
          <boxGeometry args={[0.045, 0.036, 0.038]} />
        </mesh>
        <mesh position={[-0.008, 0.042, 0]}>
          <boxGeometry args={[0.041, 0.028, 0.04]} />
          <meshStandardMaterial color="#101418" emissive="#ff3b1f" emissiveIntensity={0.9} />
        </mesh>
      </group>
    );
  }
  if (def.id === "laser") {
    return (
      <group>
        <mesh material={CLAY.attachment}>
          <boxGeometry args={[0.09, 0.045, 0.05]} />
        </mesh>
        <mesh position={[0.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.012, 12]} />
          <meshStandardMaterial color="#200505" emissive="#ff2020" emissiveIntensity={1.4} />
        </mesh>
      </group>
    );
  }
  // flashlight
  return (
    <group>
      <mesh material={CLAY.attachment} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.033, 0.1, 16]} />
      </mesh>
      <mesh position={[0.052, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 16]} />
        <meshStandardMaterial color="#fff7d6" emissive="#ffe9a0" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function GlbAttachment({ def }: { def: AttachmentModelDef }) {
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
    holder.traverse((o) => {
      if (o instanceof THREE.Mesh) o.material = CLAY.attachment;
    });
    return holder;
  }, [gltf.scene, def]);
  return <primitive object={scene} />;
}

// ---------------------------------------------------------------------------
// The weapon assembly
// ---------------------------------------------------------------------------

function WeaponAssembly({
  state,
  onHoverPart,
  onSelectPart,
}: {
  state: WorkshopState;
  onHoverPart: (part: PartId | null) => void;
  onSelectPart: (part: PartId) => void;
}) {
  const def = WEAPON_MODELS.find((m) => m.id === state.modelId) ?? WEAPON_MODELS[0]!;
  const { holder, groups, sockets } = useNormalizedScene(def);
  const [hovered, setHovered] = useState<PartId | null>(null);

  // apply material mode, visibility, mag mode and exploded offsets per frame
  const modelCenter = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useFrame(() => {
    for (const [part, meshes] of groups) {
      for (const mesh of meshes) {
        // material mode
        const clay = CLAY[part];
        const original = mesh.userData.originalMaterial as THREE.Material;
        const target = state.clay ? clay : original;
        if (mesh.material !== target) mesh.material = target;
        if (state.clay) {
          clay.emissive = hovered === part ? HOVER_EMISSIVE : new THREE.Color("#000000");
          clay.emissiveIntensity = hovered === part ? 0.25 : 0;
        }
        // visibility rules
        if (part === "mag") mesh.visible = state.magMode !== "removed";
        if (part === "slide") mesh.visible = state.slideOn;
        if (def.hidden?.test(mesh.name) === true) mesh.visible = false;
        // extended mag: stretch down along its own axis
        if (part === "mag") {
          const s = state.magMode === "extended" ? 1.45 : 1;
          if (mesh.scale.y !== s) mesh.scale.setY(s);
        }
        // exploded view: offset each part from its AUTHORED position along
        // its direction from the model center (returns exactly on collapse)
        const basePos = mesh.userData.basePos as THREE.Vector3 | undefined;
        if (basePos) {
          if (!mesh.userData.explodeDir) {
            const dir = new THREE.Vector3();
            new THREE.Box3().setFromObject(mesh).getCenter(dir);
            dir.sub(modelCenter);
            if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0);
            mesh.userData.explodeDir = dir.normalize();
          }
          const dir = mesh.userData.explodeDir as THREE.Vector3;
          const target = basePos
            .clone()
            .addScaledVector(dir, state.exploded * 0.28 * (1 / Math.max(mesh.parent?.getWorldScale(new THREE.Vector3()).x ?? 1, 1e-6)));
          mesh.position.lerp(target, 0.18);
        }
      }
    }
  });

  const attachments = ATTACHMENT_MODELS.filter((a) => state.attachmentIds.includes(a.id));

  return (
    <group>
      <primitive
        object={holder}
        onPointerOver={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
          e.stopPropagation();
          const part = partOf(def, e.object.name);
          setHovered(part);
          onHoverPart(part);
        }}
        onPointerOut={() => {
          setHovered(null);
          onHoverPart(null);
        }}
        onClick={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
          e.stopPropagation();
          onSelectPart(partOf(def, e.object.name));
        }}
      />
      {attachments.map((att) => {
        // center each attachment on its measured socket: muzzle devices sit
        // half their length past the muzzle face, optics rest on the slide top
        const pos: [number, number, number] =
          att.socket === "muzzle"
            ? [sockets.muzzle.x + att.lengthFrac / 2 + 0.005, sockets.muzzle.y, 0]
            : att.socket === "rail"
              ? [sockets.rail.x, sockets.rail.y + 0.005, 0]
              : [sockets.under.x, sockets.under.y - 0.03, 0];
        return (
          <group key={att.id} position={pos}>
            {att.url === null ? <ProceduralAttachment def={att} /> : <GlbAttachment def={att} />}
          </group>
        );
      })}
    </group>
  );
}

function StudioEnvironment() {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.9;
  }, [gl, scene]);
  return null;
}

function Turntable({ spin, children }: { spin: boolean; children: React.ReactNode }) {
  const [group] = useState(() => new THREE.Group());
  useFrame((_, delta) => {
    if (spin) group.rotation.y += delta * 0.4;
  });
  return <primitive object={group}>{children}</primitive>;
}

// ---------------------------------------------------------------------------

export function WeaponViewer({
  state,
  onHoverPart,
  onSelectPart,
  className,
}: {
  state: WorkshopState;
  onHoverPart: (part: PartId | null) => void;
  onSelectPart: (part: PartId) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [1.3, 0.45, 1.25], fov: 30 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#0d1116"]} />
        <StudioEnvironment />
        {/* three-point armory lighting — no runtime CDN fetches */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 2]} intensity={2.2} />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#9db4c8" />
        <directionalLight position={[0, -2, 1]} intensity={0.35} color="#ff8a50" />
        <Suspense fallback={null}>
          <Turntable spin={state.spin}>
            <WeaponAssembly state={state} onHoverPart={onHoverPart} onSelectPart={onSelectPart} />
          </Turntable>
          <ContactShadows position={[0, -0.42, 0]} opacity={0.55} scale={2.4} blur={2.2} far={1.2} />
        </Suspense>
        <OrbitControls enableDamping dampingFactor={0.08} minDistance={0.5} maxDistance={2.4} target={[0.12, 0, 0]} />
        <gridHelper args={[4, 40, "#243040", "#1a222e"]} position={[0, -0.421, 0]} />
      </Canvas>
    </div>
  );
}

for (const m of WEAPON_MODELS) useGLTF.preload(m.url);
for (const a of ATTACHMENT_MODELS) if (a.url !== null) useGLTF.preload(a.url);
