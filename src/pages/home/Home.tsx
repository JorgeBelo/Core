import { useNavigate } from 'react-router-dom';
import { Users, Calendar, User, ArrowRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-dark to-dark-soft border-b border-gray-dark">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'AC Soft Icecream, sans-serif' }}>
              CORE
            </h1>
            <p className="text-xl md:text-2xl text-gray-light mb-4">
              Gestão para Personal Trainers
            </p>
            <p className="text-base md:text-lg text-gray-light max-w-2xl mx-auto">
              Organize seus alunos, gerencie sua agenda semanal e tenha controle total do seu trabalho em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Alunos */}
          <Card className="bg-dark-soft border-gray-dark hover:border-primary transition-all cursor-pointer group">
            <div className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="text-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Alunos</h2>
              <p className="text-gray-light mb-6 leading-relaxed">
                Cadastre e gerencie seus alunos com facilidade. Mantenha informações como contato, frequência semanal, mensalidade e status de pagamento sempre atualizados.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Cadastro completo de alunos</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Status ativo/inativo</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Relatórios em PDF</span>
                </li>
              </ul>
              <Button 
                onClick={() => navigate('/alunos')}
                className="w-full flex items-center justify-center gap-2"
              >
                Acessar Alunos
                <ArrowRight size={18} />
              </Button>
            </div>
          </Card>

          {/* Card Agenda */}
          <Card className="bg-dark-soft border-gray-dark hover:border-primary transition-all cursor-pointer group">
            <div className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Calendar className="text-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Agenda Semanal</h2>
              <p className="text-gray-light mb-6 leading-relaxed">
                Organize seus horários de atendimento com uma agenda semanal visual. Agende treinos, visualize sua semana e gerencie seus compromissos.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Grade semanal completa</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Horários flexíveis</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Até 4 alunos por horário</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Visualização clara e intuitiva</span>
                </li>
              </ul>
              <Button 
                onClick={() => navigate('/agenda')}
                className="w-full flex items-center justify-center gap-2"
              >
                Acessar Agenda
                <ArrowRight size={18} />
              </Button>
            </div>
          </Card>

          {/* Card Perfil */}
          <Card className="bg-dark-soft border-gray-dark hover:border-primary transition-all cursor-pointer group">
            <div className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <User className="text-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Perfil</h2>
              <p className="text-gray-light mb-6 leading-relaxed">
                Gerencie suas informações profissionais. Mantenha seus dados atualizados, adicione foto de perfil e configure suas preferências.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Dados profissionais</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Foto de perfil</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Registro CREF</span>
                </li>
                <li className="text-gray-light text-sm flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Informações de contato</span>
                </li>
              </ul>
              <Button 
                onClick={() => navigate('/perfil')}
                className="w-full flex items-center justify-center gap-2"
              >
                Acessar Perfil
                <ArrowRight size={18} />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-dark mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-center text-gray-light text-sm">
            Core - Gestão para Personal Trainers © 2026
          </p>
        </div>
      </div>
    </div>
  );
};
