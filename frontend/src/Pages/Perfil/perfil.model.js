import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/ApiClient';

export const usePerfilModel = () => {
  const { user, updateUser } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [preferencias, setPreferencias] = useState({
    tema: 'escuro',
    notificacoes: { convites: true, amizades: true, sessoes: true },
  });
  const [privacidade, setPrivacidade] = useState({
    perfil_publico: true,
    mostrar_estatisticas: true,
  });
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [estatisticas, setEstatisticas] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      if (user.preferencias) setPreferencias(prev => ({ ...prev, ...user.preferencias }));
      if (user.privacidade) setPrivacidade(prev => ({ ...prev, ...user.privacidade }));
    }
    if (user?.id) {
      apiClient.get(`/usuarios/${user.id}/estatisticas`)
        .then(response => setEstatisticas(response.data || response))
        .catch(() => { /* silencioso */ });
    }
  }, [user]);

  const salvarPerfil = useCallback(async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Nome e obrigatorio');
      return;
    }
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
      setSavingProfile(false);
      setError(err.message || 'Erro ao atualizar perfil');
    }
  }, [nome, email, user, updateUser]);

  const alterarSenha = useCallback(async (e) => {
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
      setSavingPassword(false);
      setError(err.message || 'Erro ao alterar senha');
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
