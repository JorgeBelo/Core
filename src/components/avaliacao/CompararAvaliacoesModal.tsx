import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { BodyAvatar } from './BodyAvatar';
import { compararAvaliacoes } from '../../services/avaliacaoService';
import type { AvaliacaoFisica, ComparacaoAvaliacoes } from '../../types/avaliacao';

interface Props {
  avaliacoes: AvaliacaoFisica[];
  alunoNome: string;
  onClose: () => void;
}

export const CompararAvaliacoesModal = ({ avaliacoes, alunoNome, onClose }: Props) => {
  const [avaliacaoAnterior, setAvaliacaoAnterior] = useState<string>('');
  const [avaliacaoAtual, setAvaliacaoAtual] = useState<string>('');
  const [comparacao, setComparacao] = useState<ComparacaoAvaliacoes | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (avaliacoes.length >= 2) {
      setAvaliacaoAtual(avaliacoes[0].id);
      setAvaliacaoAnterior(avaliacoes[1].id);
    }
  }, [avaliacoes]);
  
  const handleComparar = async () => {
    if (!avaliacaoAnterior || !avaliacaoAtual) return;
    
    setLoading(true);
    try {
      const resultado = await compararAvaliacoes(avaliacaoAnterior, avaliacaoAtual);
      setComparacao(resultado);
    } catch (error) {
      console.error('Erro ao comparar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (avaliacaoAnterior && avaliacaoAtual) {
      handleComparar();
    }
  }, [avaliacaoAnterior, avaliacaoAtual]);
  
  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const renderIndicador = (valor: number, inverter = false) => {
    const positivo = inverter ? valor < 0 : valor > 0;
    const negativo = inverter ? valor > 0 : valor < 0;
    
    if (positivo) {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <TrendingUp size={16} />
          <span className="font-semibold">+{Math.abs(valor).toFixed(2)}</span>
        </div>
      );
    } else if (negativo) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <TrendingDown size={16} />
          <span className="font-semibold">-{Math.abs(valor).toFixed(2)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-light">
          <Minus size={16} />
          <span className="font-semibold">0.00</span>
        </div>
      );
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="bg-dark-soft border border-gray-dark rounded-xl max-w-7xl w-full my-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Comparar Avaliações</h2>
            <p className="text-gray-light text-sm mt-1">{alunoNome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-light hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Seletores */}
        <div className="p-6 border-b border-gray-dark">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-light text-sm mb-2">📅 Avaliação Anterior</label>
              <select
                value={avaliacaoAnterior}
                onChange={(e) => setAvaliacaoAnterior(e.target.value)}
                className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Selecione...</option>
                {avaliacoes.map((av) => (
                  <option key={av.id} value={av.id}>
                    {formatData(av.data_avaliacao)} - {av.peso}kg - {av.percentual_gordura}%
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-light text-sm mb-2">📅 Avaliação Atual</label>
              <select
                value={avaliacaoAtual}
                onChange={(e) => setAvaliacaoAtual(e.target.value)}
                className="w-full bg-dark border border-gray-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Selecione...</option>
                {avaliacoes.map((av) => (
                  <option key={av.id} value={av.id}>
                    {formatData(av.data_avaliacao)} - {av.peso}kg - {av.percentual_gordura}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Comparação */}
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-light">Carregando comparação...</p>
          </div>
        ) : comparacao ? (
          <div className="p-6 space-y-6">
            {/* Avatares Lado a Lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark border-gray-dark">
                <h3 className="text-white font-semibold mb-4 text-center">
                  📅 Anterior - {formatData(comparacao.anterior.data_avaliacao)}
                </h3>
                <div className="bg-dark-soft rounded-lg p-6">
                  <BodyAvatar
                    percentualGordura={comparacao.anterior.percentual_gordura}
                    sexo={comparacao.anterior.sexo || 'M'}
                    protocolo={comparacao.anterior.protocolo}
                    dobras={{
                      peitoral: comparacao.anterior.dobra_peitoral,
                      abdominal: comparacao.anterior.dobra_abdominal,
                      coxa: comparacao.anterior.dobra_coxa,
                      axilar_media: comparacao.anterior.dobra_axilar_media,
                      triceps: comparacao.anterior.dobra_triceps,
                      subescapular: comparacao.anterior.dobra_subescapular,
                      suprailiaca: comparacao.anterior.dobra_suprailiaca
                    }}
                    width={250}
                    height={400}
                  />
                </div>
              </Card>
              
              <Card className="bg-dark border-gray-dark">
                <h3 className="text-white font-semibold mb-4 text-center">
                  📅 Atual - {formatData(comparacao.atual.data_avaliacao)}
                </h3>
                <div className="bg-dark-soft rounded-lg p-6">
                  <BodyAvatar
                    percentualGordura={comparacao.atual.percentual_gordura}
                    sexo={comparacao.atual.sexo || 'M'}
                    protocolo={comparacao.atual.protocolo}
                    dobras={{
                      peitoral: comparacao.atual.dobra_peitoral,
                      abdominal: comparacao.atual.dobra_abdominal,
                      coxa: comparacao.atual.dobra_coxa,
                      axilar_media: comparacao.atual.dobra_axilar_media,
                      triceps: comparacao.atual.dobra_triceps,
                      subescapular: comparacao.atual.dobra_subescapular,
                      suprailiaca: comparacao.atual.dobra_suprailiaca
                    }}
                    width={250}
                    height={400}
                  />
                </div>
              </Card>
            </div>
            
            {/* Tabela Comparativa */}
            <Card className="bg-dark border-gray-dark">
              <h3 className="text-white font-semibold mb-4">📊 Evolução das Métricas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-dark">
                      <th className="text-left text-gray-light text-sm font-semibold py-3 px-4">Métrica</th>
                      <th className="text-center text-gray-light text-sm font-semibold py-3 px-4">Anterior</th>
                      <th className="text-center text-gray-light text-sm font-semibold py-3 px-4">Atual</th>
                      <th className="text-center text-gray-light text-sm font-semibold py-3 px-4">Diferença</th>
                      <th className="text-center text-gray-light text-sm font-semibold py-3 px-4">Variação %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-dark/50">
                      <td className="text-white py-3 px-4">⚖️ Peso</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.anterior.peso} kg</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.atual.peso} kg</td>
                      <td className="text-center py-3 px-4">
                        {renderIndicador(comparacao.diferencas.peso)}
                      </td>
                      <td className="text-center text-gray-light py-3 px-4">
                        {comparacao.percentuais.peso > 0 ? '+' : ''}{comparacao.percentuais.peso.toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-dark/50">
                      <td className="text-white py-3 px-4">📊 IMC</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.anterior.imc}</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.atual.imc}</td>
                      <td className="text-center py-3 px-4">
                        {renderIndicador(comparacao.diferencas.imc, true)}
                      </td>
                      <td className="text-center text-gray-light py-3 px-4">-</td>
                    </tr>
                    <tr className="border-b border-gray-dark/50">
                      <td className="text-white py-3 px-4">🔥 % Gordura</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.anterior.percentual_gordura}%</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.atual.percentual_gordura}%</td>
                      <td className="text-center py-3 px-4">
                        {renderIndicador(comparacao.diferencas.percentual_gordura, true)}
                      </td>
                      <td className="text-center text-gray-light py-3 px-4">
                        {comparacao.percentuais.percentual_gordura > 0 ? '+' : ''}{comparacao.percentuais.percentual_gordura.toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-dark/50">
                      <td className="text-white py-3 px-4">🔴 Massa Gorda</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.anterior.massa_gorda_kg} kg</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.atual.massa_gorda_kg} kg</td>
                      <td className="text-center py-3 px-4">
                        {renderIndicador(comparacao.diferencas.massa_gorda_kg, true)}
                      </td>
                      <td className="text-center text-gray-light py-3 px-4">
                        {comparacao.percentuais.massa_gorda_kg > 0 ? '+' : ''}{comparacao.percentuais.massa_gorda_kg.toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="text-white py-3 px-4">💪 Massa Magra</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.anterior.massa_magra_kg} kg</td>
                      <td className="text-center text-white py-3 px-4">{comparacao.atual.massa_magra_kg} kg</td>
                      <td className="text-center py-3 px-4">
                        {renderIndicador(comparacao.diferencas.massa_magra_kg)}
                      </td>
                      <td className="text-center text-gray-light py-3 px-4">
                        {comparacao.percentuais.massa_magra_kg > 0 ? '+' : ''}{comparacao.percentuais.massa_magra_kg.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
            
            {/* Resumo da Evolução */}
            <Card className="bg-primary/10 border-primary">
              <h3 className="text-white font-semibold mb-4">🎯 Resumo da Evolução</h3>
              <div className="space-y-2 text-sm">
                {comparacao.diferencas.peso < 0 && (
                  <p className="text-green-500">✓ Perda de {Math.abs(comparacao.diferencas.peso)} kg de peso corporal</p>
                )}
                {comparacao.diferencas.peso > 0 && (
                  <p className="text-yellow-500">⚠ Ganho de {comparacao.diferencas.peso} kg de peso corporal</p>
                )}
                {comparacao.diferencas.percentual_gordura < 0 && (
                  <p className="text-green-500">✓ Redução de {Math.abs(comparacao.diferencas.percentual_gordura)}% de gordura corporal</p>
                )}
                {comparacao.diferencas.massa_magra_kg > 0 && (
                  <p className="text-green-500">✓ Ganho de {comparacao.diferencas.massa_magra_kg} kg de massa magra</p>
                )}
                {comparacao.diferencas.massa_gorda_kg < 0 && (
                  <p className="text-green-500">✓ Perda de {Math.abs(comparacao.diferencas.massa_gorda_kg)} kg de massa gorda</p>
                )}
                
                {comparacao.diferencas.peso === 0 && comparacao.diferencas.percentual_gordura === 0 && (
                  <p className="text-gray-light">→ Sem alterações significativas no período</p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-light">Selecione duas avaliações para comparar</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-dark">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
