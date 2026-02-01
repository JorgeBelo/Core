import { useState, useEffect } from 'react';
import { Activity, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { NovaAvaliacaoWizard } from '../../components/avaliacao/NovaAvaliacaoWizard';
import { VisualizarAvaliacaoModal } from '../../components/avaliacao/VisualizarAvaliacaoModal';
import { CompararAvaliacoesModal } from '../../components/avaliacao/CompararAvaliacoesModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { criarAvaliacao, listarAvaliacoes } from '../../services/avaliacaoService';
import { gerarRelatorioPDF } from '../../services/pdfAvaliacaoService';
import type { Aluno, User } from '../../types';
import type { AvaliacaoFisica, NovaAvaliacaoInput } from '../../types/avaliacao';

export const Avaliacao = () => {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showCompararModal, setShowCompararModal] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<AvaliacaoFisica | null>(null);
  const [alunoSelecionadoComparacao, setAlunoSelecionadoComparacao] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalData, setPersonalData] = useState<User | null>(null);
  
  useEffect(() => {
    if (user) {
      loadData();
      loadPersonalData();
    }
  }, [user]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carrega alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user?.id)
        .order('nome');
      
      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);
      
      // Carrega avaliações
      const avaliacoesData = await listarAvaliacoes();
      setAvaliacoes(avaliacoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  
  const loadPersonalData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setPersonalData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do personal:', error);
    }
  };
  
  const handleNovaAvaliacao = async (data: NovaAvaliacaoInput, sexo: 'M' | 'F', idade: number) => {
    try {
      await criarAvaliacao(data, sexo, idade);
      toast.success('Avaliação criada com sucesso!');
      loadData();
      setShowWizard(false);
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast.error('Erro ao criar avaliação');
      throw error;
    }
  };
  
  const handleVisualizarAvaliacao = (avaliacao: AvaliacaoFisica) => {
    setAvaliacaoSelecionada(avaliacao);
    setShowVisualizarModal(true);
  };
  
  const handleCompararAvaliacoes = async (alunoId: string) => {
    setAlunoSelecionadoComparacao(alunoId);
    setShowCompararModal(true);
  };
  
  const handleGerarPDF = async () => {
    if (!avaliacaoSelecionada || !personalData) return;
    
    try {
      const alunoNome = getAlunoNome(avaliacaoSelecionada.aluno_id);
      await gerarRelatorioPDF(
        avaliacaoSelecionada,
        alunoNome,
        {
          nome: personalData.name,
          email: personalData.email,
          telefone: personalData.phone,
          cref: personalData.cref
        }
      );
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };
  
  const getAlunoNome = (alunoId: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    return aluno?.nome || aluno?.name || 'Aluno';
  };
  
  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };
  
  const getCorGordura = (percentual: number, sexo?: 'M' | 'F') => {
    if (!sexo) return 'text-gray-light';
    
    if (sexo === 'M') {
      if (percentual < 14) return 'text-green-500';
      if (percentual < 18) return 'text-blue-500';
      if (percentual < 25) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (percentual < 21) return 'text-green-500';
      if (percentual < 25) return 'text-blue-500';
      if (percentual < 32) return 'text-yellow-500';
      return 'text-red-500';
    }
  };
  
  // Métricas do dashboard
  const totalAvaliacoes = avaliacoes.length;
  const avaliacoesEsteMes = avaliacoes.filter(a => {
    const data = new Date(a.data_avaliacao);
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }).length;
  const alunosAvaliados = new Set(avaliacoes.map(a => a.aluno_id)).size;

  return (
    <div className="min-h-screen bg-dark p-4 lg:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Avaliação Física</h1>
            <p className="text-gray-light">
              Sistema moderno de avaliação corporal com relatórios visuais
            </p>
          </div>
          <Button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Avaliação</span>
          </Button>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-dark-soft border-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Total de Avaliações</p>
              <p className="text-3xl font-bold text-white">{totalAvaliacoes}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Activity className="text-primary" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-soft border-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Este Mês</p>
              <p className="text-3xl font-bold text-white">{avaliacoesEsteMes}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Activity className="text-green-500" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-soft border-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-light text-sm mb-1">Alunos Avaliados</p>
              <p className="text-3xl font-bold text-white">{alunosAvaliados}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-500" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Busca e Filtros */}
      <Card className="bg-dark-soft border-gray-dark mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 Buscar aluno..."
            className="flex-1 bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white placeholder-gray-light focus:outline-none focus:border-primary transition-colors"
          />
          <select className="bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors">
            <option value="">Todos os protocolos</option>
            <option value="3dobras">3 Dobras</option>
            <option value="7dobras">7 Dobras</option>
            <option value="bioimpedancia">Bioimpedância</option>
            <option value="perimetros">Perímetros</option>
          </select>
        </div>
      </Card>

      {/* Lista de Avaliações Recentes */}
      <Card className="bg-dark-soft border-gray-dark">
        <h2 className="text-xl font-bold text-white mb-4">📋 Avaliações Recentes</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-light">Carregando...</p>
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-dark mb-4" size={48} />
            <p className="text-gray-light mb-4">Nenhuma avaliação realizada ainda</p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus size={20} className="mr-2" />
              Realizar Primeira Avaliação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {avaliacoes.slice(0, 10).map((avaliacao) => {
              const nomeAluno = getAlunoNome(avaliacao.aluno_id);
              const iniciais = nomeAluno.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const protocoloLabel = {
                '3dobras': '3 Dobras',
                '7dobras': '7 Dobras',
                'bioimpedancia': 'Bioimpedância',
                'perimetros': 'Perímetros'
              }[avaliacao.protocolo];
              
              return (
                <div key={avaliacao.id} className="bg-dark border border-gray-dark rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold">{iniciais}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{nomeAluno}</h3>
                        <p className="text-gray-light text-sm">
                          📅 {formatData(avaliacao.data_avaliacao)} • {protocoloLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-gray-light text-xs">Peso</p>
                        <p className="text-white font-semibold">{avaliacao.peso} kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-light text-xs">IMC</p>
                        <p className="text-white font-semibold">{avaliacao.imc}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-light text-xs">% Gordura</p>
                        <p className={`font-semibold ${getCorGordura(avaliacao.percentual_gordura, avaliacao.sexo)}`}>
                          {avaliacao.percentual_gordura}%
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          className="text-sm px-3 py-1"
                          onClick={() => handleVisualizarAvaliacao(avaliacao)}
                        >
                          Ver
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="text-sm px-3 py-1"
                          onClick={() => handleCompararAvaliacoes(avaliacao.aluno_id)}
                        >
                          Comparar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      
      {/* Wizard de Nova Avaliação */}
      {showWizard && (
        <NovaAvaliacaoWizard
          alunos={alunos}
          onClose={() => setShowWizard(false)}
          onSubmit={handleNovaAvaliacao}
        />
      )}
      
      {/* Modal de Visualização */}
      {showVisualizarModal && avaliacaoSelecionada && (
        <VisualizarAvaliacaoModal
          avaliacao={avaliacaoSelecionada}
          alunoNome={getAlunoNome(avaliacaoSelecionada.aluno_id)}
          onClose={() => {
            setShowVisualizarModal(false);
            setAvaliacaoSelecionada(null);
          }}
          onGerarPDF={handleGerarPDF}
        />
      )}
      
      {/* Modal de Comparação */}
      {showCompararModal && alunoSelecionadoComparacao && (
        <CompararAvaliacoesModal
          avaliacoes={avaliacoes.filter(a => a.aluno_id === alunoSelecionadoComparacao)}
          alunoNome={getAlunoNome(alunoSelecionadoComparacao)}
          onClose={() => {
            setShowCompararModal(false);
            setAlunoSelecionadoComparacao(null);
          }}
        />
      )}
    </div>
  );
};
