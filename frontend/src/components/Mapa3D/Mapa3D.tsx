import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { gerarMapa, type LocalRoteiro, type MapaLayout } from '../../mapEngine';
import { ParedesSala, PisoCorredor, PisoSala, PredioUrbano, Vegetacao } from './geometriaMapa';

/**
 * Visualizador 3D de um local do roteiro.
 *
 * A geracao acontece em `useMemo` a partir de (historiaId, local): e pura e
 * deterministica, entao nao precisa de estado, efeito nem requisicao — o mesmo
 * local sempre remonta a mesma planta, em qualquer cliente.
 */

interface Mapa3DProps {
  historiaId: number | string;
  local: LocalRoteiro;
  /** Altura do viewport 3D; a cena se enquadra sozinha ao tamanho do mapa. */
  altura?: number;
  isLight?: boolean;
}

const LEGENDA: Array<{ cor: string; texto: string }> = [
  { cor: '#34d399', texto: 'Entrada' },
  { cor: '#f87171', texto: 'Encontro' },
  { cor: '#c084fc', texto: 'Segredo' },
  { cor: '#fbbf24', texto: 'Final' },
];

export default function Mapa3D({ historiaId, local, altura = 420, isLight = false }: Mapa3DProps) {
  // Memoiza por CONTEUDO, nao por identidade de objeto: `local` costuma vir de
  // props e ganha referencia nova a cada render do pai, o que regeraria o mapa
  // sem necessidade. A chave abaixo so muda quando o local realmente muda.
  const chave = `${historiaId}|${local.nome ?? ''}|${local.tipo ?? ''}|${(local.segredos ?? []).join('~')}|${(local.monstros_comuns ?? []).join('~')}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layout = useMemo(() => gerarMapa(historiaId, local), [chave]);

  const { centro, distancia } = useMemo(() => {
    const { minX, maxX, minZ, maxZ } = layout.limites;
    const largura = Math.max(maxX - minX, 1);
    const profundidade = Math.max(maxZ - minZ, 1);
    return {
      centro: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2] as [number, number, number],
      // Distancia proporcional ao maior lado mantem o mapa inteiro enquadrado
      // tanto numa dungeon pequena quanto numa cidade grande.
      distancia: Math.max(largura, profundidade) * 1.15 + 25,
    };
  }, [layout]);

  const corFundo = isLight ? '#e2e8f0' : '#0f172a';

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ height: altura }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [centro[0] + distancia * 0.6, distancia * 0.75, centro[2] + distancia * 0.6],
          fov: 50,
          far: 4000,
        }}
      >
        <color attach="background" args={[corFundo]} />
        <fog attach="fog" args={[corFundo, distancia * 0.9, distancia * 3]} />

        <ambientLight intensity={isLight ? 0.9 : 0.45} />
        <directionalLight
          position={[centro[0] + 60, 90, centro[2] + 40]}
          intensity={isLight ? 1.5 : 1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Luz de preenchimento fria evita que as faces opostas fiquem pretas. */}
        <directionalLight position={[centro[0] - 50, 40, centro[2] - 60]} intensity={0.35} color="#93c5fd" />

        <Suspense fallback={null}>
          <CenaMapa layout={layout} />
        </Suspense>

        <OrbitControls
          target={centro}
          makeDefault
          maxPolarAngle={Math.PI / 2.1}
          minDistance={12}
          maxDistance={distancia * 2.5}
        />
      </Canvas>

      <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-2 py-1 text-[11px] text-white">
        <div className="font-semibold">{layout.nome}</div>
        <div className="opacity-75">
          {layout.tipo} · {layout.salas.length} {layout.arquetipo === 'urbano' ? 'quarteirões' : layout.arquetipo === 'natural' ? 'clareiras' : 'salas'} · seed {layout.seed}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-2 rounded bg-black/55 px-2 py-1 text-[10px] text-white">
        {LEGENDA.map((l) => (
          <span key={l.texto} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: l.cor }} />
            {l.texto}
          </span>
        ))}
      </div>
    </div>
  );
}

function CenaMapa({ layout }: { layout: MapaLayout }) {
  const urbano = layout.arquetipo === 'urbano';
  const natural = layout.arquetipo === 'natural';

  return (
    <group>
      {natural && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1200, 1200]} />
          <meshStandardMaterial color="#1c3a1f" roughness={1} />
        </mesh>
      )}

      {layout.corredores.map((c, i) => (
        <PisoCorredor key={`c-${i}`} corredor={c} />
      ))}

      {layout.salas.map((sala) => (
        <group key={sala.id}>
          {urbano ? (
            <PredioUrbano sala={sala} />
          ) : (
            <>
              <PisoSala sala={sala} />
              <ParedesSala sala={sala} />
            </>
          )}

          {sala.rotulo && (
            <Html
              position={[sala.x + sala.largura / 2, Math.max(sala.altura, 3) + 1.5, sala.z + sala.profundidade / 2]}
              center
              distanceFactor={45}
              // occlude evita rotulo de sala escondida "vazar" por cima da parede.
              occlude
            >
              <div className="pointer-events-none whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-white">
                {sala.rotulo.length > 42 ? `${sala.rotulo.slice(0, 42)}…` : sala.rotulo}
              </div>
            </Html>
          )}
        </group>
      ))}

      {natural && <Vegetacao layout={layout} />}
    </group>
  );
}
