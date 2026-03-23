// Importações primeiro
import { apiClient } from './ApiClient';
import { HistoriaService } from './HistoriaService';
import { PersonagemService } from './PersonagemService';
import { TemaService } from './TemaService';
import { VantagemService } from './VantagemService';
import { RacaService } from './RacaService';
import { ClasseService } from './ClasseService';
import { DesvantagemService } from './DesvantagemService';
import { MestreService } from './MestreService';
import { MonstroService } from './MonstroService';
import { EquipamentoService } from './EquipamentoService';
import { AuthService } from './AuthService';
import { NotificationService } from './NotificationService';
import { SessaoService } from './SessaoService';
import { AmizadeService } from './AmizadeService';
import { FeedService } from './FeedService';
import { ImageGenerationService } from './ImageGenerationService';
import { HabilidadeMagiaService } from './HabilidadeMagiaService';
import { MestreCriadorService } from './MestreCriadorService';
import { ItemTresDetService } from './ItemTresDetService';
import { MagiasTresDetService } from './MagiasTresDetService';

// Cliente API base
export { ApiClient, apiClient } from './ApiClient';

// Serviços específicos
export { HistoriaService } from './HistoriaService';
export { NotificationService } from './NotificationService';
export { PersonagemService } from './PersonagemService';
export { TemaService } from './TemaService';
export { VantagemService } from './VantagemService';
export { RacaService } from './RacaService';
export { ClasseService } from './ClasseService';
export { DesvantagemService } from './DesvantagemService';
export { MestreService } from './MestreService';
export { MonstroService } from './MonstroService';
export { EquipamentoService } from './EquipamentoService';
export { AuthService } from './AuthService';
export { SessaoService } from './SessaoService';
export { AmizadeService } from './AmizadeService';
export { FeedService } from './FeedService';
export { ImageGenerationService } from './ImageGenerationService';
export { HabilidadeMagiaService } from './HabilidadeMagiaService';
export { MestreCriadorService } from './MestreCriadorService';
export { ItemTresDetService } from './ItemTresDetService';
export { MagiasTresDetService } from './MagiasTresDetService';

// Instâncias padrão dos serviços
export const historiaService = new HistoriaService(apiClient);
export const personagemService = new PersonagemService(apiClient);
export const temaService = new TemaService(apiClient); 
export const vantagemService = new VantagemService(apiClient);
export const racaService = new RacaService(apiClient);
export const classeService = new ClasseService(apiClient);
export const desvantagemService = new DesvantagemService(apiClient);
export const mestreService = new MestreService(apiClient);
export const monstroService = new MonstroService(apiClient);
export const equipamentoService = new EquipamentoService(apiClient);
export const authService = new AuthService(apiClient);
export const notificationService = new NotificationService(apiClient);
export const sessaoService = new SessaoService(apiClient);
export const amizadeService = new AmizadeService(apiClient);
export const feedService = new FeedService(apiClient);
export const imageGenerationService = new ImageGenerationService(apiClient);
export const habilidadeService = new HabilidadeMagiaService(apiClient);
export const mestreCriadorService = new MestreCriadorService(apiClient);
export const itemTresDetService = new ItemTresDetService(apiClient);
export const magiasTresDetService = new MagiasTresDetService(apiClient);

// Catalogos (raridades, categorias)
export const catalogoService = {
  getRaridades: () => apiClient.get('/catalogos/raridades'),
  getCategoriasEquipamento: () => apiClient.get('/catalogos/categorias-equipamento'),
  getCategoriasMonstro: () => apiClient.get('/catalogos/categorias-monstro'),
};