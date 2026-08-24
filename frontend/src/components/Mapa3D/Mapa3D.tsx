import { Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { gerarMapa, type LocalRoteiro, type MapaLayout } from '../../mapEngine';
import { ParedesSala, PisoCorredor, PisoSala, PredioUrbano, Vegetacao, type Porta } from './geometriaMapa';

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

  const { centro, raio, meiaExtensao } = useMemo(() => {
    const { minX, maxX, minZ, maxZ } = layout.limites;
    const largura = Math.max(maxX - minX, 1);
    const profundidade = Math.max(maxZ - minZ, 1);
    const alturaMax = layout.salas.reduce((m, s) => Math.max(m, s.altura), 0);
    return {
      centro: [(minX + maxX) / 2, alturaMax / 2, (minZ + maxZ) / 2] as [number, number, number],
      // Meia-extensao da caixa envolvente; o <EnquadrarCamera> projeta os cantos
      // no frustum para achar a distancia exata que faz tudo caber.
      meiaExtensao: [largura / 2, Math.max(alturaMax, 1) / 2, profundidade / 2] as [number, number, number],
      raio: Math.hypot(largura / 2, profundidade / 2, alturaMax),
    };
  }, [layout]);

  const corFundo = isLight ? '#e2e8f0' : '#0f172a';

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ height: altura }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [centro[0] + raio, centro[1] + raio, centro[2] + raio], fov: 50, far: 8000 }}
      >
        <color attach="background" args={[corFundo]} />
        <fog attach="fog" args={[corFundo, raio * 2.2, raio * 6]} />

        <ambientLight intensity={isLight ? 0.9 : 0.45} />
        <directionalLight
          position={[centro[0] + raio, centro[1] + raio * 1.6, centro[2] + raio * 0.7]}
          intensity={isLight ? 1.5 : 1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Luz de preenchimento fria evita que as faces opostas fiquem pretas. */}
        <directionalLight position={[centro[0] - raio, centro[1] + raio * 0.7, centro[2] - raio]} intensity={0.35} color="#93c5fd" />

        <Suspense fallback={null}>
          <CenaMapa layout={layout} />
        </Suspense>

        <EnquadrarCamera centro={centro} meiaExtensao={meiaExtensao} />

        <OrbitControls
          target={centro}
          makeDefault
          maxPolarAngle={Math.PI / 2.1}
          minDistance={Math.max(raio * 0.15, 6)}
          maxDistance={raio * 8}
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

/**
 * Descobre por onde cada corredor entra em cada sala, para abrir o vao de porta
 * na parede certa. O corredor parte do centro da sala, entao a direcao do
 * primeiro trecho (ou do ultimo, invertido, na sala de destino) diz o lado.
 */
function calcularPortas(layout: MapaLayout): Map<string, Porta[]> {
  const porSala = new Map<string, Porta[]>();
  const registrar = (salaId: string, porta: Porta) => {
    const atual = porSala.get(salaId);
    if (atual) atual.push(porta);
    else porSala.set(salaId, [porta]);
  };

  for (const c of layout.corredores) {
    if (c.pontos.length < 2) continue;

    const partida = c.pontos[0];
    const rumo = c.pontos[1];
    const chegada = c.pontos[c.pontos.length - 1];
    const vindo = c.pontos[c.pontos.length - 2];

    for (const [salaId, base, alvo] of [
      [c.deSalaId, partida, rumo],
      [c.paraSalaId, chegada, vindo],
    ] as const) {
      const dx = alvo.x - base.x;
      const dz = alvo.z - base.z;
      // O eixo de maior deslocamento define por qual parede o corredor sai; a
      // posicao do vao e a coordenada constante do trecho.
      if (Math.abs(dx) >= Math.abs(dz)) {
        registrar(salaId, { lado: dx >= 0 ? 'leste' : 'oeste', pos: base.z, largura: c.largura });
      } else {
        registrar(salaId, { lado: dz >= 0 ? 'sul' : 'norte', pos: base.x, largura: c.largura });
      }
    }
  }
  return porSala;
}

/**
 * Posiciona a camera para o mapa INTEIRO caber, seja uma dungeon compacta ou
 * uma cidade extensa. Um fator fixo nao serve: o que cabe depende tanto do
 * tamanho do mapa quanto do aspecto do canvas, que muda com o layout da pagina.
 * Aqui o ajuste usa a esfera envolvente e o menor dos dois campos de visao
 * (vertical e horizontal), garantindo que nenhuma borda fique cortada.
 */
function EnquadrarCamera({
  centro,
  meiaExtensao,
}: {
  centro: [number, number, number];
  meiaExtensao: [number, number, number];
}) {
  const camera = useThree((s) => s.camera);
  const tamanho = useThree((s) => s.size);

  useEffect(() => {
    const perspectiva = camera as THREE.PerspectiveCamera;
    const aspecto = Math.max(tamanho.width / Math.max(tamanho.height, 1), 0.01);
    const fovV = (perspectiva.fov * Math.PI) / 180;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspecto);
    const tanV = Math.tan(fovV / 2);
    const tanH = Math.tan(fovH / 2);

    // Direcao 3/4 (isometrica): mostra planta e volume ao mesmo tempo.
    const dir = new THREE.Vector3(0.72, 0.62, 0.72).normalize();
    const direita = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    const cima = new THREE.Vector3().crossVectors(dir, direita).normalize();

    // Projeta os 8 cantos da caixa nos eixos da camera e exige que cada um
    // caiba nos dois campos de visao. Encaixa bem mais apertado que a esfera
    // envolvente, que desperdicava moldura por usar a diagonal 3D.
    let distancia = 0;
    const [hx, hy, hz] = meiaExtensao;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const canto = new THREE.Vector3(sx * hx, sy * hy, sz * hz);
          const profundidade = canto.dot(dir);
          const extensaoV = Math.abs(canto.dot(cima));
          const extensaoH = Math.abs(canto.dot(direita));
          distancia = Math.max(
            distancia,
            extensaoV / tanV + profundidade,
            extensaoH / tanH + profundidade,
          );
        }
      }
    }
    distancia = Math.max(distancia, 1) * 1.06;

    perspectiva.position.set(
      centro[0] + dir.x * distancia,
      centro[1] + dir.y * distancia,
      centro[2] + dir.z * distancia,
    );
    perspectiva.near = Math.max(distancia / 800, 0.1);
    perspectiva.far = distancia * 12;
    perspectiva.lookAt(centro[0], centro[1], centro[2]);
    perspectiva.updateProjectionMatrix();
  }, [camera, tamanho.width, tamanho.height, centro, meiaExtensao]);

  return null;
}

function CenaMapa({ layout }: { layout: MapaLayout }) {
  const urbano = layout.arquetipo === 'urbano';
  const natural = layout.arquetipo === 'natural';
  const portas = useMemo(() => calcularPortas(layout), [layout]);

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
              <ParedesSala sala={sala} portas={portas.get(sala.id)} />
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
