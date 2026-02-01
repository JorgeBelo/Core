import { useState, useEffect, useRef } from 'react';
import { Save, Camera, Calendar } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useUserProfile } from '../../hooks/useUserProfile';
import toast from 'react-hot-toast';
import { maskWhatsApp, unmaskWhatsApp } from '../../utils/masks';
import { supabase } from '../../lib/supabaseClient';

const DIAS_SEMANA_AGENDA = [
  { id: 0, label: 'Segunda-feira' },
  { id: 1, label: 'Terça-feira' },
  { id: 2, label: 'Quarta-feira' },
  { id: 3, label: 'Quinta-feira' },
  { id: 4, label: 'Sexta-feira' },
  { id: 5, label: 'Sábado' },
  { id: 6, label: 'Domingo' },
];

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
  const [agendaWorkingDays, setAgendaWorkingDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [agendaHoraInicio, setAgendaHoraInicio] = useState('06:00');
  const [agendaHoraFim, setAgendaHoraFim] = useState('22:00');
  const [savingAgenda, setSavingAgenda] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone ? maskWhatsApp(userProfile.phone) : '',
        cref: userProfile.cref || '',
        avatarUrl: userProfile.avatar_url || '',
      });
      const days = userProfile.agenda_working_days;
      if (days != null && days.length > 0) {
        setAgendaWorkingDays(days);
      } else {
        setAgendaWorkingDays([0, 1, 2, 3, 4, 5, 6]);
      }
      setAgendaHoraInicio(userProfile.agenda_hora_inicio || '06:00');
      setAgendaHoraFim(userProfile.agenda_hora_fim || '22:00');
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

      // Obtém a URL pública do arquivo (getPublicUrl não retorna erro, só a URL)
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // A URL pública está em publicData.publicUrl
      const publicUrl = publicData?.publicUrl;
      
      if (!publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem.');
      }

      // Log para debug (pode remover depois)
      console.log('URL pública gerada:', publicUrl);

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

  const handleSaveAgendaSettings = async () => {
    if (agendaWorkingDays.length === 0) {
      toast.error('Selecione pelo menos um dia de atendimento.');
      return;
    }
    if (agendaHoraInicio >= agendaHoraFim) {
      toast.error('O horário de fim deve ser depois do horário de início.');
      return;
    }
    setSavingAgenda(true);
    try {
      await updateProfile({
        agenda_working_days: agendaWorkingDays,
        agenda_hora_inicio: agendaHoraInicio,
        agenda_hora_fim: agendaHoraFim,
      });
      toast.success('Horários da agenda salvos! A grade será exibida conforme sua configuração.');
    } catch (error: any) {
      console.error('Erro ao salvar horários da agenda:', error);
      const msg = error?.message || '';
      if (msg.includes('does not exist') || msg.includes('column')) {
        toast.error(
          'Colunas da agenda ainda não existem no banco. Execute o script em Supabase: SQL Editor → supabase/migrations/20250127_agenda_settings_users.sql'
        );
      } else {
        toast.error(msg || 'Erro ao salvar horários da agenda');
      }
    } finally {
      setSavingAgenda(false);
    }
  };

  const toggleAgendaDay = (id: number) => {
    setAgendaWorkingDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort((a, b) => a - b)
    );
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
              <Button type="submit" className="min-h-[44px] w-full sm:w-auto whitespace-nowrap">
                <Save size={20} className="mr-2" />
                Salvar
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Horários para a Agenda - personalização da grade semanal */}
      <Card
        title="Horários para a Agenda"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-gray-light text-sm">
            Defina em quais dias você atende e o intervalo de horários que aparece na grade da Agenda. Quem atende em academia 24h pode incluir madrugada; quem atende até 22h pode limitar o horário. A agenda exibirá apenas os dias e horários configurados.
          </p>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Dias que atendo
            </label>
            <div className="flex flex-wrap gap-3">
              {DIAS_SEMANA_AGENDA.map((dia) => {
                const checked = agendaWorkingDays.includes(dia.id);
                return (
                  <label
                    key={dia.id}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-dark hover:bg-dark-soft transition-colors min-h-[44px]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAgendaDay(dia.id)}
                      className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                    />
                    <span className="text-white text-sm">{dia.label.split('-')[0]}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Horário de início da grade
              </label>
              <input
                type="time"
                value={agendaHoraInicio}
                onChange={(e) => setAgendaHoraInicio(e.target.value)}
                className="input-core w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Horário de fim da grade
              </label>
              <input
                type="time"
                value={agendaHoraFim}
                onChange={(e) => setAgendaHoraFim(e.target.value)}
                className="input-core w-full"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-dark">
            <Button
              onClick={handleSaveAgendaSettings}
              disabled={savingAgenda}
              className="min-h-[44px] w-full sm:w-auto whitespace-nowrap"
            >
              <Calendar size={18} className="mr-2" />
              {savingAgenda ? 'Salvando...' : 'Salvar Horários'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
