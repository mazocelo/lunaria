// src/Pages/Personagem/Wizard/components/LegacyStageAdapter.tsx
// TEMPORÁRIO (Fase 1): embrulha o WizardChat atual para as etapas ainda não migradas.
// Some na Fase 2 junto com WizardChat.tsx e wizard-theme.css.
import WizardChat from './WizardChat';
import '../wizard-theme.css';

type WizardChatProps = Parameters<typeof WizardChat>[0];
export type LegacyStageAdapterProps = WizardChatProps & { theme: 'light' | 'dark' | 'gothic' };

const LegacyStageAdapter = ({ theme, ...rest }: LegacyStageAdapterProps) => (
  <div className={`wizard-atelier overflow-hidden rounded-2xl ${theme === 'light' ? 'light' : ''} ${theme === 'gothic' ? 'gothic' : ''}`} style={{ minHeight: '60vh' }}>
    <WizardChat {...rest} embedded />
  </div>
);

export default LegacyStageAdapter;
