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
