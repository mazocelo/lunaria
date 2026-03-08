import { EditarPersonagemViewModel } from '../../../viewmodels/Personagens/EditarPersonagemViewModel';
import { Personagem } from '../../../models/Personagem';

class NovoPersonagemViewModel extends EditarPersonagemViewModel {
  constructor() {
    super();
    this.state = {
      ...this.state,
      gerandoBackground: false,
      backgroundGerado: null,
      validacao: null,
      validando: false,
    };
  }

  criarPersonagem = async (onSuccess) => {
    if (!this.state.nome.trim()) {
      this.setState({ error: 'O nome do personagem é obrigatório' });
      return;
    }

    this.setState({ loading: true, error: null });
    try {
      const vantagensIds = [];
      const desvantagensIds = [];

      if (Array.isArray(this.state.vantagens)) {
        this.state.vantagens.forEach(id => {
          const vantagem = this.state.vantagensDisponiveis?.find(v => String(v.id) === String(id));
          if (vantagem && vantagem.tipo === 'desvantagem') {
            desvantagensIds.push(Number(id));
          } else {
            vantagensIds.push(Number(id));
          }
        });
      }

      const historiasIds = Array.isArray(this.state.historias)
        ? this.state.historias.map(id => Number(id))
        : [];

      const dados = {
        nome: this.state.nome,
        raca_id: this.state.raca ? Number(this.state.raca) : undefined,
        classe_id: this.state.classe ? Number(this.state.classe) : undefined,
        sugestao_background: this.state.backgroundTipo,
        background: this.state.background,
        historias: historiasIds,
        forca: Number(this.state.atributos.forca) || 10,
        destreza: Number(this.state.atributos.destreza) || 10,
        constituicao: Number(this.state.atributos.constituicao) || 10,
        inteligencia: Number(this.state.atributos.inteligencia) || 10,
        agilidade: Number(this.state.atributos.agilidade) || 10,
        carisma: Number(this.state.atributos.carisma) || 10,
        vantagens: vantagensIds,
        desvantagens: desvantagensIds,
        nivel: this.state.nivel || 1,
      };

      const personagem = new Personagem(dados);
      const criado = await this.personagemService.create(personagem);

      // Se modo guiado, gerar background via IA após criação
      if (this.state.backgroundTipo === 'guiado' && criado?.id) {
        try {
          this.setState({ gerandoBackground: true });
          await this.personagemService.gerarBackground(criado.id, this.state.background);
        } catch (bgError) {
          console.warn('Background IA não gerado:', bgError.message);
          this.setState({
            gerandoBackground: false,
            error: 'Personagem criado com sucesso! Porém o background não pôde ser gerado pela IA. Você pode editá-lo depois.'
          });
          return; // Não navega, deixa o usuário ver a mensagem
        } finally {
          this.setState({ gerandoBackground: false });
        }
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      this.setState({ error: error.message || 'Erro ao criar personagem' });
    } finally {
      this.setState({ loading: false });
    }
  };

  /**
   * Gera preview do background via IA (requer personagem já criado)
   * Para uso no formulário de edição
   */
  gerarBackgroundPreview = async (personagemId) => {
    if (!personagemId) return;
    this.setState({ gerandoBackground: true });
    try {
      const resultado = await this.personagemService.gerarBackground(
        personagemId,
        this.state.background
      );
      if (resultado?.background) {
        this.setState({
          background: resultado.background,
          backgroundGerado: resultado.background
        });
      }
    } catch (error) {
      this.setState({ error: `Erro ao gerar background: ${error.message}` });
    } finally {
      this.setState({ gerandoBackground: false });
    }
  };

  reset = () => {
    this.setState({
      nome: '',
      raca: '',
      classe: '',
      backgroundTipo: 'guiado',
      background: '',
      historias: [],
      atributos: { forca: '', inteligencia: '', constituicao: '', agilidade: '', destreza: '', carisma: '' },
      vantagens: [],
      nivel: 1,
      hp: 100,
      loading: false,
      error: null,
      personagemId: null,
      gerandoBackground: false,
      backgroundGerado: null,
      validacao: null,
      validando: false,
    });
  };
}

export const novoPersonagemViewModel = new NovoPersonagemViewModel();
