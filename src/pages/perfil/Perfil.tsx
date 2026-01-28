import { useState } from 'react';
import { Save, Clock, Camera, Link as LinkIcon } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const Perfil = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cref: user?.cref || '',
    avatarUrl: '',
  });

  const [workHours, setWorkHours] = useState({
    start: '08:00',
    end: '18:00',
    days: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar chamada à API
    if (user) {
      updateUser({ ...user, ...formData });
    }
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleWorkHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar chamada à API
    toast.success('Horários de trabalho atualizados!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-semibold text-white mb-2">Perfil do Personal</h1>
        <p className="text-gray-light">Atualize seus dados profissionais e de acesso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de perfil (foto + dados principais) */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-dark-soft flex items-center justify-center overflow-hidden border-2 border-primary/60">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.name || 'Foto do personal'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold">
                    {(formData.name || 'P')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-lg hover:bg-primary/80 transition-colors"
                title="Alterar foto"
              >
                <Camera size={16} />
              </button>
            </div>

            <div>
              <p className="text-white text-lg font-semibold">
                {formData.name || 'Seu nome completo'}
              </p>
              <p className="text-gray-light text-sm">{formData.email || 'seu@email.com'}</p>
              {formData.cref && (
                <p className="text-xs text-primary font-medium mt-1">
                  CREF: {formData.cref}
                </p>
              )}
            </div>

            <div className="w-full space-y-3">
              <div className="flex flex-col items-start gap-1">
                <label className="text-xs text-gray-light">URL da foto (opcional)</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
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
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors"
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <Button type="submit">
                <Save size={20} className="mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Horários de Trabalho */}
      <Card title="Horários de Trabalho">
        <form onSubmit={handleWorkHoursSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Horário de Início
              </label>
              <input
                type="time"
                value={workHours.start}
                onChange={(e) => setWorkHours({ ...workHours, start: e.target.value })}
                className="input-core w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Horário de Término
              </label>
              <input
                type="time"
                value={workHours.end}
                onChange={(e) => setWorkHours({ ...workHours, end: e.target.value })}
                className="input-core w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Dias da Semana
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries({
                monday: 'Segunda-feira',
                tuesday: 'Terça-feira',
                wednesday: 'Quarta-feira',
                thursday: 'Quinta-feira',
                friday: 'Sexta-feira',
                saturday: 'Sábado',
                sunday: 'Domingo',
              }).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-dark hover:border-primary transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={workHours.days[key as keyof typeof workHours.days]}
                    onChange={(e) =>
                      setWorkHours({
                        ...workHours,
                        days: { ...workHours.days, [key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                  />
                  <span className="text-white text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-dark">
            <Button type="submit">
              <Clock size={20} className="mr-2" />
              Salvar Horários
            </Button>
          </div>
        </form>
      </Card>

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
