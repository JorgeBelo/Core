import { useState } from 'react';
import { Save, Clock } from 'lucide-react';
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
        <h1 className="text-3xl font-sans font-semibold text-white mb-2">Perfil e Configurações</h1>
        <p className="text-gray-light">Gerencie seus dados pessoais e preferências</p>
      </div>

      {/* Dados Pessoais */}
      <Card title="Dados Pessoais">
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-core w-full"
                placeholder="(11) 98765-4321"
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
