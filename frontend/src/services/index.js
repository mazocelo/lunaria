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
import { AuthService } from './AuthService';
import { NotificationService } from './NotificationService';

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
export { AuthService } from './AuthService';

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
export const authService = new AuthService(apiClient);
export const notificationService = new NotificationService(apiClient); 