import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/ApiClient';

export interface PerfilPreferencias {
  tema?: string;
  notificacoes?: {
    convites?: boolean;
    amizades?: boolean;
    sessoes?: boolean;
  };
}

export interface PerfilPrivacidade {
  perfil_publico?: boolean;
  mostrar_estatisticas?: boolean;
}

export interface PerfilEstatisticas {
  totalHistorias?: number;
  totalPersonagens?: number;
  totalSessoes?: number;
  totalMensagens?: number;
}

export const usePerfilModel = () => {
  const { user, updateUser } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [preferencias, setPreferencias] = useState<PerfilPreferencias>({
    tema: 'escuro',
    notificacoes: { convites: true, amizades: true, sessoes: true },
  });
  const [privacidade, setPrivacidade] = useState<PerfilPrivacidade>({
    perfil_publico: true,
    mostrar_estatisticas: true,
  });
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [estatisticas, setEstatisticas] = useState<PerfilEstatisticas | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNome((user.nome as string) || '');
      setEmail((user.email as string) || '');
      setBio((user.bio as string) || '');
      setAvatar((user.avatar as string) || '');
      if (user.preferencias) setPreferencias(prev => ({ ...prev, ...(user.preferencias as PerfilPreferencias) }));
      if (user.privacidade) setPrivacidade(prev => ({ ...prev, ...(user.privacidade as PerfilPrivacidade) }));
    }
    if (user?.id) {
      apiClient.get(`/usuarios/${user.id}/estatisticas`)
        .then((response: unknown) => {
          const res = response as { data?: PerfilEstatisticas } & PerfilEstatisticas;
          setEstatisticas(res.data || res);
        })
        .catch(() => { /* silencioso */ });
    }
  }, [user]);

  const salvarPerfil = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Nome e obrigatorio');
      return;
    }
    if (!user) return;
    setSavingProfile(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const dados = { nome, email, bio: bio || null, avatar: avatar || null, preferencias, privacidade };
      await apiClient.put(`/usuarios/${user.id}`, dados);
      setSavingProfile(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      updateUser({ ...user, nome, email, bio, avatar, preferencias, privacidade });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      setSavingProfile(false);
      setError(message);
    }
  }, [nome, email, bio, avatar, preferencias, privacidade, user, updateUser]);

  const alterarSenha = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual) {
      setError('Senha atual e obrigatoria');
      return;
    }
    if (!novaSenha || novaSenha.length < 8) {
      setError('Nova senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('Senhas nao conferem');
      return;
    }
    if (!user) return;
    setSavingPassword(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.put(`/usuarios/${user.id}`, {
        senha_atual: senhaAtual,
        senha: novaSenha,
      });
      setSavingPassword(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setSuccessMessage('Senha alterada com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar senha';
      setSavingPassword(false);
      setError(message);
    }
  }, [senhaAtual, novaSenha, confirmarSenha, user]);

  return {
    nome,
    email,
    bio,
    avatar,
    preferencias,
    privacidade,
    senhaAtual,
    novaSenha,
    confirmarSenha,
    estatisticas,
    savingProfile,
    savingPassword,
    error,
    successMessage,
    setNome,
    setEmail,
    setBio,
    setAvatar,
    setPreferencias,
    setPrivacidade,
    setSenhaAtual,
    setNovaSenha,
    setConfirmarSenha,
    salvarPerfil,
    alterarSenha,
  };
};
