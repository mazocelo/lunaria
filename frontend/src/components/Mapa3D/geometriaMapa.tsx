import { useMemo } from 'react';
import type { Corredor, MapaLayout, PapelSala, Sala } from '../../mapEngine';

/**
 * Traducao layout -> geometria three.js.
 *
 * Estes componentes nao decidem NADA sobre a planta: recebem o `MapaLayout`
 * pronto do motor e so o desenham. Toda a logica de geracao vive em
 * `src/mapEngine` e e testada sem renderizar nada.
 */

/** Paleta por papel narrativo — pensada para fundo escuro. */
const COR_PISO: Record<PapelSala, string> = {
  entrada: '#34d399',
  comum: '#64748b',
  encontro: '#f87171',
  segredo: '#c084fc',
  final: '#fbbf24',
};

const COR_PAREDE = '#334155';
const COR_CORREDOR = '#475569';
const ESPESSURA_PAREDE = 0.4;
const ESPESSURA_PISO = 0.2;

export function PisoSala({ sala }: { sala: Sala }) {
  return (
    <mesh
      position={[sala.x + sala.largura / 2, 0, sala.z + sala.profundidade / 2]}
      receiveShadow
    >
      <boxGeometry args={[sala.largura, ESPESSURA_PISO, sala.profundidade]} />
      <meshStandardMaterial
        color={COR_PISO[sala.papel]}
        roughness={0.85}
        // Salas de destaque brilham de leve para serem achadas de longe.
        emissive={sala.papel === 'comum' ? '#000000' : COR_PISO[sala.papel]}
        emissiveIntensity={sala.papel === 'comum' ? 0 : 0.25}
      />
    </mesh>
  );
}

export type LadoSala = 'norte' | 'sul' | 'leste' | 'oeste';

/** Vao de porta: em que lado da sala e em que coordenada do eixo livre. */
export interface Porta {
  lado: LadoSala;
  /** Coordenada no eixo que corre ao longo da parede (X no norte/sul, Z no leste/oeste). */
  pos: number;
  largura: number;
}

/**
 * Paredes da sala COM vaos de porta onde chegam corredores.
 *
 * Sem os vaos, a parede sela o corredor e a planta deixa de se ler como um
 * espaco navegavel: as salas viram caixas soltas e o jogador nao enxerga por
 * onde se anda. Cada parede e emitida como ate dois segmentos, deixando o vao
 * no meio. Ficam semitransparentes para a planta continuar legivel vista de
 * cima.
 */
export function ParedesSala({ sala, portas = [] }: { sala: Sala; portas?: Porta[] }) {
  if (sala.altura <= 0) return null;

  const y = sala.altura / 2;
  const pecas: Array<{ pos: [number, number, number]; args: [number, number, number] }> = [];

  /**
   * Emite uma parede quebrada nos vaos. `inicio`/`fim` sao a extensao da parede
   * no eixo livre; `fixo` e a coordenada do eixo perpendicular.
   */
  const emitir = (lado: LadoSala, inicio: number, fim: number, fixo: number) => {
    const vaos = portas
      .filter((p) => p.lado === lado)
      .map((p) => [p.pos - p.largura / 2, p.pos + p.largura / 2] as const)
      .sort((a, b) => a[0] - b[0]);

    let cursor = inicio;
    const trechos: Array<[number, number]> = [];
    for (const [a, b] of vaos) {
      if (a > cursor) trechos.push([cursor, Math.min(a, fim)]);
      cursor = Math.max(cursor, b);
    }
    if (cursor < fim) trechos.push([cursor, fim]);

    for (const [a, b] of trechos) {
      const comprimento = b - a;
      if (comprimento <= 0.05) continue;
      const meio = (a + b) / 2;
      const horizontal = lado === 'norte' || lado === 'sul';
      pecas.push({
        pos: horizontal ? [meio, y, fixo] : [fixo, y, meio],
        args: horizontal
          ? [comprimento, sala.altura, ESPESSURA_PAREDE]
          : [ESPESSURA_PAREDE, sala.altura, comprimento],
      });
    }
  };

  emitir('norte', sala.x, sala.x + sala.largura, sala.z);
  emitir('sul', sala.x, sala.x + sala.largura, sala.z + sala.profundidade);
  emitir('oeste', sala.z, sala.z + sala.profundidade, sala.x);
  emitir('leste', sala.z, sala.z + sala.profundidade, sala.x + sala.largura);

  return (
    <group>
      {pecas.map((p, i) => (
        <mesh key={i} position={p.pos} castShadow>
          <boxGeometry args={p.args} />
          <meshStandardMaterial color={COR_PAREDE} roughness={0.9} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** Cidade: o quarteirao e um bloco solido, nao um comodo vazio. */
export function PredioUrbano({ sala }: { sala: Sala }) {
  return (
    <mesh
      position={[sala.x + sala.largura / 2, sala.altura / 2, sala.z + sala.profundidade / 2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[sala.largura, sala.altura, sala.profundidade]} />
      <meshStandardMaterial
        color={sala.papel === 'comum' ? '#475569' : COR_PISO[sala.papel]}
        roughness={0.8}
      />
    </mesh>
  );
}

/**
 * Piso do corredor: um bloco por trecho da polilinha. Os trechos sao sempre
 * alinhados a um eixo (corredor em L), entao basta medir qual eixo variou.
 */
export function PisoCorredor({ corredor }: { corredor: Corredor }) {
  const trechos = useMemo(() => {
    const saida: Array<{ pos: [number, number, number]; args: [number, number, number] }> = [];
    for (let i = 1; i < corredor.pontos.length; i++) {
      const a = corredor.pontos[i - 1];
      const b = corredor.pontos[i];
      const dx = Math.abs(b.x - a.x);
      const dz = Math.abs(b.z - a.z);
      if (dx < 0.01 && dz < 0.01) continue;

      const meio: [number, number, number] = [(a.x + b.x) / 2, -0.02, (a.z + b.z) / 2];
      // Soma a largura no comprimento para os trechos se sobreporem no cotovelo
      // e nao deixarem um buraco no canto do L.
      saida.push({
        pos: meio,
        args:
          dx >= dz
            ? [dx + corredor.largura, ESPESSURA_PISO, corredor.largura]
            : [corredor.largura, ESPESSURA_PISO, dz + corredor.largura],
      });
    }
    return saida;
  }, [corredor]);

  return (
    <group>
      {trechos.map((t, i) => (
        <mesh key={i} position={t.pos} receiveShadow>
          <boxGeometry args={t.args} />
          <meshStandardMaterial color={COR_CORREDOR} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Vegetacao da floresta. Usa posicao derivada do proprio layout (indice da
 * clareira + angulo fixo) em vez de Math.random, senao as arvores saltariam de
 * lugar a cada re-render do React.
 */
export function Vegetacao({ layout }: { layout: MapaLayout }) {
  const arvores = useMemo(() => {
    const saida: Array<[number, number, number]> = [];
    layout.salas.forEach((sala, indiceSala) => {
      const cx = sala.x + sala.largura / 2;
      const cz = sala.z + sala.profundidade / 2;
      const raio = Math.max(sala.largura, sala.profundidade) * 0.85;
      for (let k = 0; k < 10; k++) {
        const angulo = ((indiceSala * 7 + k * 13) % 360) * (Math.PI / 180);
        const dist = raio + ((k * 3) % 7);
        saida.push([cx + Math.cos(angulo) * dist, 0, cz + Math.sin(angulo) * dist]);
      }
    });
    return saida;
  }, [layout]);

  return (
    <group>
      {arvores.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 3, 6]} />
            <meshStandardMaterial color="#57534e" roughness={1} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[1.8, 4.5, 7]} />
            <meshStandardMaterial color="#15803d" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
