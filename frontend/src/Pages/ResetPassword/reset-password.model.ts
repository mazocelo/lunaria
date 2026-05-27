import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ResetPasswordFormData {
  senha: string;
  confirmarSenha: string;
}

interface ResetPasswordErrors {
  senha?: string;
  confirmarSenha?: string;
}

type FieldName = keyof ResetPasswordFormData;

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export const useResetPasswordModel = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState<ResetPasswordFormData>({ senha: '', confirmarSenha: '' });
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as FieldName]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (name: FieldName) => {
    setErrors(prev => {
      const next: ResetPasswordErrors = { ...prev };
      if (name === 'senha') {
        if (formData.senha && formData.senha.length < 6) {
          next.senha = 'Senha deve ter pelo menos 6 caracteres';
        } else {
          delete next.senha;
        }
      }
      if (name === 'confirmarSenha') {
        if (formData.confirmarSenha && formData.confirmarSenha !== formData.senha) {
          next.confirmarSenha = 'As senhas nao coincidem';
        } else {
          delete next.confirmarSenha;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ResetPasswordErrors = {};

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha e obrigatoria';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmacao e obrigatoria';
    } else if (formData.confirmarSenha !== formData.senha) {
      newErrors.confirmarSenha = 'As senhas nao coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitLoading(true);
    try {
      const result = await resetPassword({ token: token || '', senha: formData.senha }) as { success?: boolean; error?: string };
      if (result.success) {
        setSuccess(true);
        setNotification({ type: 'success', message: 'Senha redefinida com sucesso!' });
      } else {
        setNotification({ type: 'error', message: result.error || 'Erro ao redefinir senha' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Erro ao redefinir senha. Tente novamente.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(prev => !prev);
  const toggleShowConfirm = () => setShowConfirm(prev => !prev);
  const clearNotification = () => setNotification(null);

  return {
    token,
    formData,
    errors,
    notification,
    submitLoading,
    success,
    showPassword,
    showConfirm,
    handleChange,
    validateField,
    handleSubmit,
    toggleShowPassword,
    toggleShowConfirm,
    clearNotification,
  };
};
