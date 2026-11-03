import { useMemo } from 'react';
import { criarRng, hashSeed } from '../../mapEngine/rng';
import type { Sala } from '../../mapEngine';
import type { DirecaoArte } from './direcaoArte';

/**
 * Adornos de cena por papel narrativo da sala.
 *
 * Sem eles o mapa e um conjunto de caixas vazias: a planta se le, mas nao
 * transmite lugar nenhum. Pilares dao escala, escombros dao idade, tochas dao
 * foco de luz e o altar marca o destino.
 *
 * Tudo e posicionado por PRNG semeado no id da sala — nunca `Math.random`, que
 * faria os objetos saltarem de lugar a cada re-render do React.
 */

interface PropsSalaProps {
  sala: Sala;
  arte: DirecaoArte;
  /** Interiores ganham pilares e tochas; espaco aberto nao. */
  fechado: boolean;
}

export function PropsSala({ sala, arte, fechado }: PropsSalaProps) {
  const adornos = useMemo(() => {
    const rng = criarRng(hashSeed(`props::${sala.id}::${sala.papel}`));
    const cx = sala.x + sala.largura / 2;
    const cz = sala.z + sala.profundidade / 2;
    const alturaUtil = Math.max(sala.altura, 3);

    const pilares: Array<[number, number]> = [];
    const escombros: Array<{ pos: [number, number, number]; escala: number; giro: number }> = [];
    const tochas: Array<[number, number, number]> = [];

    // Pilares so em salas grandes: em sala pequena eles entopem o vao e
    // atrapalham a leitura da planta.
    if (fechado && sala.largura >= 9 && sala.profundidade >= 9) {
      const margemX = sala.largura * 0.26;
      const margemZ = sala.profundidade * 0.26;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          pilares.push([cx + sx * margemX, cz + sz * margemZ]);
        }
      }
    }

    const quantidadeEscombros = sala.papel === 'comum' ? 3 : 5;
    for (let i = 0; i < quantidadeEscombros; i++) {
      escombros.push({
        pos: [
          sala.x + 1.5 + rng.proximo() * (sala.largura - 3),
          0.2,
          sala.z + 1.5 + rng.proximo() * (sala.profundidade - 3),
        ],
        escala: 0.35 + rng.proximo() * 0.85,
        giro: rng.proximo() * Math.PI,
      });
    }

    if (fechado) {
      // Encostadas na parede norte e sul, viradas para dentro.
      tochas.push([cx - sala.largura * 0.3, alturaUtil * 0.62, sala.z + 0.6]);
      tochas.push([cx + sala.largura * 0.3, alturaUtil * 0.62, sala.z + sala.profundidade - 0.6]);
    }

    return { pilares, escombros, tochas, cx, cz, alturaUtil };
  }, [sala, fechado]);

  const { paleta, materiais } = arte;

  return (
    <group>
      {adornos.pilares.map(([px, pz], i) => (
        <mesh key={`pil-${i}`} position={[px, adornos.alturaUtil / 2, pz]} castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.7, adornos.alturaUtil, 8]} />
          <meshStandardMaterial
            color={paleta.parede}
            roughness={materiais.rugosidade}
            metalness={materiais.metalico}
          />
        </mesh>
      ))}

      {adornos.escombros.map((e, i) => (
        <mesh key={`esc-${i}`} position={e.pos} rotation={[0, e.giro, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[e.escala, 0]} />
          <meshStandardMaterial color={paleta.piso} roughness={1} metalness={0} />
        </mesh>
      ))}

      {adornos.tochas.map((pos, i) => (
        <group key={`toc-${i}`} position={pos}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.12, 0.9, 6]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.9} />
          </mesh>
          {/* A chama e emissiva e carrega uma luz pontual curta: o custo e baixo
              e o ganho de atmosfera e o maior de todos os adornos. */}
          <mesh position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial
              color={arte.atmosfera.luzCor}
              emissive={arte.atmosfera.luzCor}
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, 0.7, 0]}
            color={arte.atmosfera.luzCor}
            intensity={6}
            distance={13}
            decay={2}
          />
        </group>
      ))}

      {sala.papel === 'final' && (
        <group position={[adornos.cx, 0, adornos.cz]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.5, 1.9, 0.9, 10]} />
            <meshStandardMaterial color={paleta.acento} roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.35, 0]}>
            <icosahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial
              color={paleta.acento}
              emissive={paleta.acento}
              emissiveIntensity={1.7}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[0, 1.6, 0]} color={paleta.acento} intensity={9} distance={20} decay={2} />
        </group>
      )}

      {sala.papel === 'segredo' && (
        <mesh position={[adornos.cx, 0.42, adornos.cz]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.85, 1]} />
          <meshStandardMaterial color={paleta.acento} roughness={0.5} metalness={0.4} />
        </mesh>
      )}

      {sala.papel === 'encontro' && (
        // Marcas de fogueira: sugerem ocupacao sem precisar modelar criaturas.
        <group position={[adornos.cx, 0.12, adornos.cz]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[1.15, 1.15, 0.12, 12]} />
            <meshStandardMaterial color="#1c1917" roughness={1} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <coneGeometry args={[0.45, 0.7, 7]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.6, 0]} color="#fb923c" intensity={5} distance={12} decay={2} />
        </group>
      )}
    </group>
  );
}
