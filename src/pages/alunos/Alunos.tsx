import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Filter } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Aluno } from '../../types';
import { CadastroAlunoModal } from './CadastroAlunoModal';

// Mock data
const mockAlunos: Aluno[] = [
  {
    id: '1',
    personal_id: '1',
    name: 'João Silva',
    birth_date: '1990-05-15',
    phone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    frequency_per_week: 3,
    monthly_fee: 300.00,
    start_date: '2024-01-15',
    active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    personal_id: '1',
    name: 'Maria Santos',
    birth_date: '1985-08-22',
    phone: '(11) 97654-3210',
    whatsapp: '(11) 97654-3210',
    frequency_per_week: 2,
    monthly_fee: 250.00,
    start_date: '2024-02-01',
    active: true,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
  {
    id: '3',
    personal_id: '1',
    name: 'Pedro Oliveira',
    birth_date: '1992-12-10',
    phone: '(11) 96543-2109',
    frequency_per_week: 4,
    monthly_fee: 350.00,
    start_date: '2023-11-20',
    active: false,
    created_at: '2023-11-20T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
];

export const Alunos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const filteredAlunos = mockAlunos.filter((aluno) => {
    const matchesSearch = aluno.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === 'todos' || 
      (statusFilter === 'ativo' && aluno.active) ||
      (statusFilter === 'inativo' && !aluno.active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Alunos</h1>
          <p className="text-gray-light">Gerencie seus alunos e seus dados</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Cadastrar Novo Aluno
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-light" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-core w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-light" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
              className="input-core"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela de Alunos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-dark">
                <th className="text-left py-3 px-4 text-gray-light font-medium">Nome</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Telefone</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Frequência</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Mensalidade</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-light font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-light">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                filteredAlunos.map((aluno) => (
                  <tr key={aluno.id} className="border-b border-gray-dark hover:bg-dark-soft transition-colors">
                    <td className="py-4 px-4 text-white">{aluno.name}</td>
                    <td className="py-4 px-4 text-gray-light">{aluno.phone || '-'}</td>
                    <td className="py-4 px-4 text-gray-light">{aluno.frequency_per_week}x/semana</td>
                    <td className="py-4 px-4 text-white">
                      R$ {aluno.monthly_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          aluno.active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-light/20 text-gray-light'
                        }`}
                      >
                        {aluno.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => navigate(`/alunos/${aluno.id}`)}
                        className="text-primary hover:text-primary-light transition-colors flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && <CadastroAlunoModal onClose={() => setShowModal(false)} />}
    </div>
  );
};
