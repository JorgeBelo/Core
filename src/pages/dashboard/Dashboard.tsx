import { Users, DollarSign, AlertCircle, Calendar, TrendingUp, UserCheck, CreditCard, Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const navigate = useNavigate();
  
  // Mock data - será substituído por dados reais da API
  const stats = {
    alunosAtivos: 24,
    faturamentoMes: 12400.00,
    mensalidadesAtrasadas: 3,
    proximosAniversarios: 2,
    proximosAtendimentos: 5,
  };

  const statCards = [
    {
      title: 'Alunos Ativos',
      value: stats.alunosAtivos,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Faturamento do Mês',
      value: `R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Mensalidades Atrasadas',
      value: stats.mensalidadesAtrasadas,
      icon: AlertCircle,
      color: 'text-red-500',
    },
    {
      title: 'Próximos Aniversários',
      value: stats.proximosAniversarios,
      icon: Calendar,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-gray-light">Bem-vindo de volta! Aqui está um resumo do seu negócio.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-light text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} bg-dark-soft p-3 rounded-lg`}>
                  <Icon size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Próximos Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Próximos Atendimentos de Hoje">
          <div className="space-y-3">
            {stats.proximosAtendimentos > 0 ? (
              <p className="text-gray-light">
                Você tem <span className="text-primary font-semibold">{stats.proximosAtendimentos}</span> atendimentos agendados para hoje.
              </p>
            ) : (
              <p className="text-gray-light">Nenhum atendimento agendado para hoje.</p>
            )}
            <button className="btn-primary w-full mt-4">
              Ver Agenda Completa
            </button>
          </div>
        </Card>

        <Card title="Resumo Financeiro">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-light">Total Recebido (Mês)</span>
              <span className="text-green-500 font-semibold text-lg">
                R$ {stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-light">Em Aberto</span>
              <span className="text-yellow-500 font-semibold text-lg">R$ 2.400,00</span>
            </div>
            <div className="pt-4 border-t border-gray-dark">
              <div className="flex items-center gap-2 text-gray-light">
                <TrendingUp size={16} />
                <span className="text-sm">Crescimento de 12% em relação ao mês anterior</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Ações Rápidas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-3 py-4"
            onClick={() => {
              toast.success('Presença registrada!');
            }}
          >
            <UserCheck size={24} />
            <div className="text-left">
              <p className="font-semibold">Registrar Presença</p>
              <p className="text-xs opacity-80">Marcar aluno presente</p>
            </div>
          </Button>

          <Button
            variant="secondary"
            className="flex items-center justify-center gap-3 py-4"
            onClick={() => {
              navigate('/financeiro');
              toast.success('Redirecionando para pagamentos...');
            }}
          >
            <CreditCard size={24} />
            <div className="text-left">
              <p className="font-semibold">Lançar Pagamento</p>
              <p className="text-xs opacity-80">Registrar mensalidade paga</p>
            </div>
          </Button>

          <Button
            variant="secondary"
            className="flex items-center justify-center gap-3 py-4"
            onClick={() => {
              navigate('/alunos');
            }}
          >
            <Plus size={24} />
            <div className="text-left">
              <p className="font-semibold">Novo Aluno</p>
              <p className="text-xs opacity-80">Cadastrar novo aluno</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};
