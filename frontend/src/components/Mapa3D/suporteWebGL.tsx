import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Rede de protecao para o visualizador 3D.
 *
 * O mapa e a unica parte do app que exige WebGL. Sem checagem, um navegador
 * antigo ou uma maquina sem aceleracao grafica mostra um canvas em branco, sem
 * dizer o que houve — o usuario so ve a tela quebrada. Aqui a falha vira uma
 * mensagem explicita, e o resto da pagina (roteiro, imagens, narracao) segue
 * funcionando normalmente.
 */

export function AvisoSemWebGL({ altura, motivo }: { altura: number; motivo: string }) {
  return (
    <div
      className="flex w-full items-center justify-center rounded-lg border border-dashed border-slate-500/40 bg-slate-800/40 p-4 text-center"
      style={{ height: altura }}
    >
      <div className="max-w-xs text-xs text-slate-300">
        <p className="mb-1 font-semibold">Mapa 3D indisponivel</p>
        <p className="opacity-80">{motivo}</p>
      </div>
    </div>
  );
}

interface EstadoFronteira {
  falhou: boolean;
}

/**
 * Isola falhas do three.js (perda de contexto, driver quebrado) para nao
 * derrubar a arvore inteira do RoteiroViewer junto.
 */
export class FronteiraErro3D extends Component<
  { altura: number; children: ReactNode },
  EstadoFronteira
> {
  state: EstadoFronteira = { falhou: false };

  static getDerivedStateFromError(): EstadoFronteira {
    return { falhou: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Falha ao renderizar o mapa 3D:', erro, info.componentStack);
  }

  render() {
    if (this.state.falhou) {
      return (
        <AvisoSemWebGL
          altura={this.props.altura}
          motivo="Houve uma falha ao desenhar a cena. O restante do roteiro continua disponivel."
        />
      );
    }
    return this.props.children;
  }
}
