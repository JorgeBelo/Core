import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, User, Clipboard, Calculator } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { NovaAvaliacaoInput, ProtocoloAvaliacao } from '../../types/avaliacao';
import type { Aluno } from '../../types';

interface Props {
  alunos: Aluno[];
  onClose: () => void;
  onSubmit: (data: NovaAvaliacaoInput, sexo: 'M' | 'F', idade: number) => Promise<void>;
}

type Step = 1 | 2 | 3;

export const NovaAvaliacaoWizard = ({ alunos, onClose, onSubmit }: Props) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  
  // Dados do formulário
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [protocolo, setProtocolo] = useState<ProtocoloAvaliacao | null>(null);
  const [formData, setFormData] = useState<Partial<NovaAvaliacaoInput>>({
    data_avaliacao: new Date().toISOString().split('T')[0],
  });
  
  // Resultados calculados em tempo real
  const [resultados, setResultados] = useState<{
    imc?: number;
    classificacao_imc?: string;
  }>({});
  
  // Calcula IMC em tempo real
  useEffect(() => {
    if (formData.peso && formData.altura) {
      const alturaMetros = formData.altura / 100;
      const imc = Number((formData.peso / (alturaMetros * alturaMetros)).toFixed(2));
      let classificacao_imc = '';
      
      if (imc < 18.5) classificacao_imc = 'Abaixo do peso';
      else if (imc < 25) classificacao_imc = 'Normal';
      else if (imc < 30) classificacao_imc = 'Sobrepeso';
      else if (imc < 35) classificacao_imc = 'Obesidade Grau I';
      else if (imc < 40) classificacao_imc = 'Obesidade Grau II';
      else classificacao_imc = 'Obesidade Grau III';
      
      setResultados({ imc, classificacao_imc });
    }
  }, [formData.peso, formData.altura]);
  
  const handleNext = () => {
    if (step < 3) setStep((step + 1) as Step);
  };
  
  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };
  
  const handleSubmit = async () => {
    if (!alunoSelecionado || !protocolo) return;
    
    setLoading(true);
    try {
      const idade = calcularIdade(alunoSelecionado.birth_date);
      const sexo = alunoSelecionado.sexo || 'M';
      
      await onSubmit(
        {
          ...formData,
          aluno_id: alunoSelecionado.id,
          protocolo,
        } as NovaAvaliacaoInput,
        sexo,
        idade
      );
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };
  
  const canProceed = () => {
    if (step === 1) return alunoSelecionado !== null;
    if (step === 2) return protocolo !== null;
    if (step === 3) return formData.peso && formData.altura;
    return false;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-dark-soft border border-gray-dark rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <div>
            <h2 className="text-2xl font-bold text-white">Nova Avaliação Física</h2>
            <p className="text-gray-light text-sm mt-1">
              {step === 1 && '🎯 Passo 1: Selecione o aluno'}
              {step === 2 && '📋 Passo 2: Escolha o protocolo'}
              {step === 3 && '✍️ Passo 3: Preencha os dados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-light hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-light">Progresso</span>
            <span className="text-xs text-gray-light">{step}/3</span>
          </div>
          <div className="w-full bg-dark rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Selecionar Aluno */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Buscar aluno por nome..."
                  className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-3 text-white placeholder-gray-light focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alunos.filter(a => a.active !== false).map((aluno) => (
                  <Card
                    key={aluno.id}
                    className={`cursor-pointer transition-all ${
                      alunoSelecionado?.id === aluno.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-dark hover:border-primary/50'
                    }`}
                    onClick={() => setAlunoSelecionado(aluno)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="text-primary" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{aluno.name || aluno.nome}</h3>
                        <p className="text-gray-light text-sm">
                          {aluno.birth_date ? `${calcularIdade(aluno.birth_date)} anos` : 'Idade não informada'}
                        </p>
                      </div>
                      {alunoSelecionado?.id === aluno.id && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 2: Escolher Protocolo */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  protocolo === '3dobras'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-dark hover:border-primary/50'
                }`}
                onClick={() => setProtocolo('3dobras')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clipboard className="text-primary" size={32} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">📏 3 Dobras</h3>
                  <p className="text-gray-light text-sm mb-3">
                    Rápido e prático
                  </p>
                  <p className="text-xs text-gray-light">
                    ⏱️ ~5 minutos
                  </p>
                  <p className="text-xs text-gray-light mt-1">
                    Homens: Peitoral, Abdominal, Coxa
                  </p>
                  <p className="text-xs text-gray-light">
                    Mulheres: Tríceps, Supra-ilíaca, Coxa
                  </p>
                </div>
              </Card>
              
              <Card
                className={`cursor-pointer transition-all ${
                  protocolo === '7dobras'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-dark hover:border-primary/50'
                }`}
                onClick={() => setProtocolo('7dobras')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clipboard className="text-primary" size={32} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">📏 7 Dobras</h3>
                  <p className="text-gray-light text-sm mb-3">
                    Mais preciso e completo
                  </p>
                  <p className="text-xs text-gray-light">
                    ⏱️ ~10 minutos
                  </p>
                  <p className="text-xs text-gray-light mt-1">
                    Peitoral, Axilar, Tríceps, Subescapular
                  </p>
                  <p className="text-xs text-gray-light">
                    Abdominal, Supra-ilíaca, Coxa
                  </p>
                </div>
              </Card>
              
              <Card
                className={`cursor-pointer transition-all ${
                  protocolo === 'bioimpedancia'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-dark hover:border-primary/50'
                }`}
                onClick={() => setProtocolo('bioimpedancia')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="text-primary" size={32} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">⚡ Bioimpedância</h3>
                  <p className="text-gray-light text-sm mb-3">
                    Com aparelho específico
                  </p>
                  <p className="text-xs text-gray-light">
                    ⏱️ ~2 minutos
                  </p>
                  <p className="text-xs text-gray-light mt-1">
                    Requer balança de bioimpedância
                  </p>
                </div>
              </Card>
              
              <Card
                className={`cursor-pointer transition-all ${
                  protocolo === 'perimetros'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-dark hover:border-primary/50'
                }`}
                onClick={() => setProtocolo('perimetros')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clipboard className="text-primary" size={32} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">📐 Perímetros</h3>
                  <p className="text-gray-light text-sm mb-3">
                    Fita métrica tradicional
                  </p>
                  <p className="text-xs text-gray-light">
                    ⏱️ ~15 minutos
                  </p>
                  <p className="text-xs text-gray-light mt-1">
                    Medidas de circunferências corporais
                  </p>
                </div>
              </Card>
            </div>
          )}
          
          {/* Step 3: Preencher Dados */}
          {step === 3 && protocolo && (
            <div className="space-y-6">
              {/* Dados Básicos */}
              <div>
                <h3 className="text-white font-semibold mb-4">📅 Dados Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-light text-sm mb-2">Data da Avaliação</label>
                    <input
                      type="date"
                      value={formData.data_avaliacao}
                      onChange={(e) => setFormData({ ...formData, data_avaliacao: e.target.value })}
                      className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-light text-sm mb-2">⚖️ Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="85.0"
                      value={formData.peso || ''}
                      onChange={(e) => setFormData({ ...formData, peso: Number(e.target.value) })}
                      className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-light text-sm mb-2">📏 Altura (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="175"
                      value={formData.altura || ''}
                      onChange={(e) => setFormData({ ...formData, altura: Number(e.target.value) })}
                      className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                
                {/* Cálculos Automáticos */}
                {resultados.imc && (
                  <Card className="mt-4 bg-primary/10 border-primary">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-light text-sm">💡 Cálculos Automáticos</p>
                        <p className="text-white font-semibold mt-1">
                          IMC: {resultados.imc} ({resultados.classificacao_imc})
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        resultados.imc < 25 ? 'bg-green-500/20 text-green-500' :
                        resultados.imc < 30 ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {resultados.imc < 25 ? '🟢' : resultados.imc < 30 ? '🟡' : '🔴'}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
              
              {/* Campos específicos do protocolo */}
              {protocolo === '3dobras' && (
                <div>
                  <h3 className="text-white font-semibold mb-4">📏 Dobras Cutâneas (mm)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-light text-sm mb-2">💪 Peitoral</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="12"
                        value={formData.dobra_peitoral || ''}
                        onChange={(e) => setFormData({ ...formData, dobra_peitoral: Number(e.target.value) })}
                        className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm mb-2">🔥 Abdominal</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="18"
                        value={formData.dobra_abdominal || ''}
                        onChange={(e) => setFormData({ ...formData, dobra_abdominal: Number(e.target.value) })}
                        className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm mb-2">🦵 Coxa</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="15"
                        value={formData.dobra_coxa || ''}
                        onChange={(e) => setFormData({ ...formData, dobra_coxa: Number(e.target.value) })}
                        className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Observações */}
              <div>
                <label className="block text-gray-light text-sm mb-2">📝 Observações (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Aluno relatou treino intenso ontem..."
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white placeholder-gray-light focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-dark">
          <Button
            variant="secondary"
            onClick={step === 1 ? onClose : handleBack}
            className="flex items-center gap-2"
          >
            {step === 1 ? (
              <>
                <X size={20} />
                Cancelar
              </>
            ) : (
              <>
                <ChevronLeft size={20} />
                Voltar
              </>
            )}
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Próximo
              <ChevronRight size={20} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2"
            >
              {loading ? 'Salvando...' : 'Salvar e Gerar Relatório'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
