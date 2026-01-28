import { useState, useEffect, useRef } from 'react';
import { Save, Camera, Link as LinkIcon } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useUserProfile } from '../../hooks/useUserProfile';
import toast from 'react-hot-toast';
import { maskWhatsApp, unmaskWhatsApp } from '../../utils/masks';
import { supabase } from '../../lib/supabaseClient';

export const Perfil = () => {
  const { userProfile, updateProfile } = useUserProfile();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cref: '',
    avatarUrl: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone ? maskWhatsApp(userProfile.phone) : '',
        cref: userProfile.cref || '',
        avatarUrl: userProfile.avatar_url || '',
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        // Salva telefone SEM máscara no banco
        phone: formData.phone ? unmaskWhatsApp(formData.phone) : '',
        cref: formData.cref,
        avatar_url: formData.avatarUrl,
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userProfile?.id) {
      toast.error('Usuário não encontrado para atualizar a foto.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${userProfile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicData, error: publicError } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicError) throw publicError;

      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem.');
      }

      // Atualiza estado local e no perfil (tabela users)
      setFormData((prev) => ({ ...prev, avatarUrl: publicUrl }));
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar foto de perfil:', error);
      toast.error(error.message || 'Erro ao enviar foto de perfil');
    } finally {
      setUploadingAvatar(false);
      // Reseta o input para permitir re-upload do mesmo arquivo depois
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Perfil do Personal</h1>
        <p className="text-gray-light text-sm sm:text-base">Atualize seus dados profissionais e de acesso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Painel de perfil (foto + dados principais) - Estilo Nutcache com avatar à esquerda */}
        <Card className="lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-dark-soft flex items-center justify-center overflow-hidden border-2 border-primary/60">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={formData.name || 'Foto do personal'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-white">
                      {(formData.name || 'P')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Alterar foto"
                  onClick={() => {
                    // Abre o seletor de arquivos do dispositivo (PC ou celular)
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingAvatar}
                >
                  <Camera size={18} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-lg font-semibold">
                  {formData.name || 'Seu nome completo'}
                </p>
                <p className="text-gray-light text-sm mt-1">{formData.email || 'seu@email.com'}</p>
                {formData.cref && (
                  <p className="text-xs text-primary font-medium mt-2">
                    CREF: {formData.cref}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full space-y-3">
              {/* Input de arquivo escondido para upload direto */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <div className="flex flex-col items-start gap-1">
                <label className="text-xs text-gray-light">URL da foto (opcional)</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarUrl: e.target.value.trim() })
                  }
                  ref={avatarInputRef}
                  className="input-core w-full text-xs"
                  placeholder="https://..."
                />
              </div>

              <div className="p-3 rounded-lg border border-gray-dark bg-dark-soft flex items-center justify-between gap-3">
                <div>
                  <p className="text-white text-sm font-medium">Conta Google</p>
                  <p className="text-gray-light text-xs">
                    Integração real com login Google será configurada depois.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
                  disabled
                >
                  <span className="bg-white rounded-full flex items-center justify-center w-5 h-5">
                    <span className="text-[10px] font-bold text-primary">G</span>
                  </span>
                  <span>Vincular Google</span>
                  <LinkIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Formulário de dados pessoais / profissionais */}
        <Card title="Informações do Personal" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-core w-full"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-core w-full"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Telefone de Contato
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: maskWhatsApp(e.target.value) })
                  }
                  className="input-core w-full"
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  CREF
                </label>
                <input
                  type="text"
                  value={formData.cref}
                  onChange={(e) => setFormData({ ...formData, cref: e.target.value })}
                  className="input-core w-full"
                  placeholder="Ex: CREF 123456-G/SP"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-dark">
              <Button type="submit" className="min-h-[44px] w-full sm:w-auto">
                <Save size={20} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Configurações Adicionais */}
      <Card title="Configurações">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-dark rounded-lg">
            <div>
              <p className="text-white font-medium">Notificações por Email</p>
              <p className="text-gray-light text-sm">Receba alertas sobre mensalidades e aniversários</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-dark rounded-lg">
            <div>
              <p className="text-white font-medium">Notificações Push</p>
              <p className="text-gray-light text-sm">Receba notificações no navegador</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};
