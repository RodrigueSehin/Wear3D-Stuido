import { Environment, Lightformer } from "@react-three/drei";
import type { LightingPreset } from "../presets";

/**
 * Trois environnements d'éclairage (CDC F-11), construits avec des Lightformers :
 * aucun HDR à télécharger, rendu calculé une fois (frames = 1).
 */
export function LightingEnvironment({ preset }: { preset: LightingPreset }) {
  return (
    <Environment key={preset} resolution={256} frames={1}>
      {preset === "studio" && (
        <>
          <Lightformer
            form="rect"
            intensity={2.2}
            position={[-2, 1.5, 3]}
            scale={[3, 3, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.1}
            position={[2.5, 0.5, 2]}
            scale={[2, 3, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            position={[0, 2, -3]}
            scale={[4, 1.5, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="circle"
            intensity={1.2}
            position={[0, 4, 0]}
            scale={3}
            rotation-x={Math.PI / 2}
          />
          {/* Rebond du sol : éclaire le dessous des manches. */}
          <Lightformer
            form="rect"
            intensity={0.8}
            position={[0, -3, 1]}
            scale={[6, 6, 1]}
            target={[0, 0, 0]}
          />
        </>
      )}
      {preset === "outdoor" && (
        <>
          <color attach="background" args={["#bcd3f2"]} />
          <Lightformer
            form="circle"
            intensity={4}
            color="#fff3dc"
            position={[3, 5, 3]}
            scale={2}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1}
            color="#9cc3ff"
            position={[0, 6, 0]}
            scale={[12, 12, 1]}
            rotation-x={Math.PI / 2}
          />
          <Lightformer
            form="rect"
            intensity={0.5}
            color="#c8b79a"
            position={[0, -3, 0]}
            scale={[12, 12, 1]}
            rotation-x={-Math.PI / 2}
          />
        </>
      )}
      {preset === "sunset" && (
        <>
          <color attach="background" args={["#f2b27a"]} />
          <Lightformer
            form="circle"
            intensity={5}
            color="#ffb067"
            position={[-4, 1.2, 2.5]}
            scale={2.2}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={0.9}
            color="#7e8fd6"
            position={[3, 3, -2]}
            scale={[6, 4, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={0.5}
            color="#d98a55"
            position={[0, -3, 0]}
            scale={[12, 12, 1]}
            rotation-x={-Math.PI / 2}
          />
        </>
      )}
      {preset === "boutique" && (
        <>
          <color attach="background" args={["#efe6da"]} />
          <Lightformer
            form="rect"
            intensity={1.8}
            color="#fff1de"
            position={[0, 4, 2]}
            scale={[8, 3, 1]}
            rotation-x={Math.PI / 3}
          />
          <Lightformer
            form="rect"
            intensity={1}
            color="#ffe3c2"
            position={[-3, 1, 2]}
            scale={[2, 3, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={0.7}
            color="#fff8ef"
            position={[3, 1, 1]}
            scale={[2, 3, 1]}
            target={[0, 0, 0]}
          />
        </>
      )}
      {preset === "night" && (
        <>
          <color attach="background" args={["#05070f"]} />
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#3b82f6"
            position={[-3, 1, 2]}
            scale={[1, 4, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#ec4899"
            position={[3, 1, -1]}
            scale={[1, 4, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="circle"
            intensity={1.2}
            color="#c7d2fe"
            position={[0, 4, 1]}
            scale={2}
            rotation-x={Math.PI / 2}
          />
        </>
      )}
      {preset === "showroom" && (
        <>
          <color attach="background" args={["#0a1226"]} />
          {[-1.5, 0, 1.5].map((x) => (
            <Lightformer
              key={x}
              form="rect"
              intensity={2.5}
              position={[x, 3, 1]}
              scale={[0.25, 3, 1]}
              rotation-x={Math.PI / 2.5}
            />
          ))}
          <Lightformer
            form="ring"
            intensity={2}
            color="#4c8dff"
            position={[0, 0.3, 3]}
            scale={1.6}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#8f6bff"
            position={[0, 0.5, -3]}
            scale={[4, 2, 1]}
            target={[0, 0, 0]}
          />
        </>
      )}
    </Environment>
  );
}
