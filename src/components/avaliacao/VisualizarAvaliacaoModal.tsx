import { X, Download, Printer } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { BodyAvatar } from './BodyAvatar';
import type { AvaliacaoFisica } from '../../types/avaliacao';

interface Props {
  avaliacao: AvaliacaoFisica;
  alunoNome: string;
  onClose: () => void;
  onGerarPDF: () => void;
}

export const VisualizarAvaliacaoModal = ({ avaliacao, alunoNome, onClose, onGerarPDF }: Props) => {
  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const protocoloLabel = {
    '3dobras': '3 Dobras Cutâneas',
    '7dobras': '7 Dobras Cutâneas',
    'bioimpedancia': 'Bioimpedância',
    'perimetros': 'Perímetros Corporais'
  }[avaliacao.protocolo];
  
  const getCorClassificacao = (classificacao?: string) => {
    if (!classificacao) return 'text-gray-light';
    if (classificacao.includes('Normal') || classificacao.includes('Atleta') || classificacao.includes('Fitness')) {
      return 'text-green-500';
    }
    if (classificacao.includes('Sobrepeso') || classificacao.includes('Aceitável')) {
      return 'text-yellow-500';
    }
    return 'text-red-500';
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="bg-dark-soft border border-gray-dark rounded-xl max-w-6xl w-full my-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Avaliação Física</h2>
            <p className="text-gray-light text-sm mt-1">
              {alunoNome} • {formatData(avaliacao.data_avaliacao)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={onGerarPDF}
              className="flex items-center gap-2"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <button
              onClick={onClose}
              className="text-gray-light hover:text-white transition-colors ml-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Avatar 3D */}
            <Card className="bg-dark border-gray-dark">
              <h3 className="text-white font-semibold mb-4 text-center">🎯 Mapa Corporal</h3>
              <div className="bg-dark-soft rounded-lg p-6">
                <BodyAvatar
                  percentualGordura={avaliacao.percentual_gordura}
                  sexo={avaliacao.sexo || 'M'}
                  protocolo={avaliacao.protocolo}
                  dobras={{
                    peitoral: avaliacao.dobra_peitoral,
                    abdominal: avaliacao.dobra_abdominal,
                    coxa: avaliacao.dobra_coxa,
                    axilar_media: avaliacao.dobra_axilar_media,
                    triceps: avaliacao.dobra_triceps,
                    subescapular: avaliacao.dobra_subescapular,
                    suprailiaca: avaliacao.dobra_suprailiaca
                  }}
                  width={300}
                  height={500}
                  showLabels={true}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-light text-sm">Protocolo: {protocoloLabel}</p>
              </div>
            </Card>
            
            {/* Métricas Principais */}
            <div className="space-y-4">
              <Card className="bg-dark border-gray-dark">
                <h3 className="text-white font-semibold mb-4">📈 Métricas Principais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-soft rounded-lg p-4">
                    <p className="text-gray-light text-sm mb-1">⚖️ Peso</p>
                    <p className="text-2xl font-bold text-white">{avaliacao.peso} kg</p>
                  </div>
                  <div className="bg-dark-soft rounded-lg p-4">
                    <p className="text-gray-light text-sm mb-1">📏 Altura</p>
                    <p className="text-2xl font-bold text-white">{avaliacao.altura} cm</p>
                  </div>
                  <div className="bg-dark-soft rounded-lg p-4">
                    <p className="text-gray-light text-sm mb-1">📊 IMC</p>
                    <p className="text-2xl font-bold text-white">{avaliacao.imc}</p>
                    <p className={`text-xs mt-1 ${getCorClassificacao(avaliacao.classificacao_imc)}`}>
                      {avaliacao.classificacao_imc}
                    </p>
                  </div>
                  <div className="bg-dark-soft rounded-lg p-4">
                    <p className="text-gray-light text-sm mb-1">🔥 % Gordura</p>
                    <p className="text-2xl font-bold text-white">{avaliacao.percentual_gordura}%</p>
                    <p className={`text-xs mt-1 ${getCorClassificacao(avaliacao.classificacao_gordura)}`}>
                      {avaliacao.classificacao_gordura}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark border-gray-dark">
                <h3 className="text-white font-semibold mb-4">💪 Composição Corporal</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-soft rounded-lg">
                    <span className="text-gray-light">Massa Gorda</span>
                    <span className="text-white font-semibold">{avaliacao.massa_gorda_kg} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-soft rounded-lg">
                    <span className="text-gray-light">Massa Magra</span>
                    <span className="text-white font-semibold">{avaliacao.massa_magra_kg} kg</span>
                  </div>
                  {avaliacao.peso_ideal_kg && (
                    <div className="flex items-center justify-between p-3 bg-dark-soft rounded-lg">
                      <span className="text-gray-light">Peso Ideal</span>
                      <span className="text-white font-semibold">{avaliacao.peso_ideal_kg} kg</span>
                    </div>
                  )}
                  {avaliacao.rcq && (
                    <div className="flex items-center justify-between p-3 bg-dark-soft rounded-lg">
                      <span className="text-gray-light">RCQ (Cintura/Quadril)</span>
                      <span className="text-white font-semibold">{avaliacao.rcq}</span>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Gráfico de Composição */}
              <Card className="bg-dark border-gray-dark">
                <h3 className="text-white font-semibold mb-4">🍩 Composição Corporal</h3>
                <div className="flex items-center justify-center py-4">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="40"
                      strokeDasharray={`${(avaliacao.percentual_gordura / 100) * 502.4} 502.4`}
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="40"
                      strokeDasharray={`${((100 - avaliacao.percentual_gordura) / 100) * 502.4} 502.4`}
                      strokeDashoffset={`-${(avaliacao.percentual_gordura / 100) * 502.4}`}
                      transform="rotate(-90 100 100)"
                    />
                    <text x="100" y="95" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                      {avaliacao.percentual_gordura}%
                    </text>
                    <text x="100" y="115" textAnchor="middle" fill="#9ca3af" fontSize="12">
                      Gordura
                    </text>
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-light text-sm">Gordura ({avaliacao.percentual_gordura}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-light text-sm">Magra ({(100 - avaliacao.percentual_gordura).toFixed(1)}%)</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Dados Técnicos */}
          {(avaliacao.protocolo === '3dobras' || avaliacao.protocolo === '7dobras') && (
            <Card className="bg-dark border-gray-dark">
              <h3 className="text-white font-semibold mb-4">📏 Dobras Cutâneas (mm)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {avaliacao.dobra_peitoral && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Peitoral</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_peitoral} mm</p>
                  </div>
                )}
                {avaliacao.dobra_abdominal && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Abdominal</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_abdominal} mm</p>
                  </div>
                )}
                {avaliacao.dobra_coxa && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Coxa</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_coxa} mm</p>
                  </div>
                )}
                {avaliacao.dobra_axilar_media && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Axilar Média</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_axilar_media} mm</p>
                  </div>
                )}
                {avaliacao.dobra_triceps && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Tríceps</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_triceps} mm</p>
                  </div>
                )}
                {avaliacao.dobra_subescapular && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Subescapular</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_subescapular} mm</p>
                  </div>
                )}
                {avaliacao.dobra_suprailiaca && (
                  <div className="bg-dark-soft rounded-lg p-3">
                    <p className="text-gray-light text-sm">Supra-ilíaca</p>
                    <p className="text-white font-semibold">{avaliacao.dobra_suprailiaca} mm</p>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* Observações */}
          {avaliacao.observacoes && (
            <Card className="bg-dark border-gray-dark">
              <h3 className="text-white font-semibold mb-3">📝 Observações</h3>
              <p className="text-gray-light">{avaliacao.observacoes}</p>
            </Card>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-dark">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onGerarPDF} className="flex items-center gap-2">
            <Download size={18} />
            Baixar Relatório PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
