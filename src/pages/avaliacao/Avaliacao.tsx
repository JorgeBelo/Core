import { Activity, Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const Avaliacao = () => {

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
            onClick={() => {/* TODO: implementar wizard */}}
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
              <p className="text-3xl font-bold text-white">47</p>
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
              <p className="text-3xl font-bold text-white">8</p>
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
              <p className="text-3xl font-bold text-white">12</p>
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
        
        <div className="space-y-4">
          {/* Card de Avaliação - Exemplo */}
          <div className="bg-dark border border-gray-dark rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">CS</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Carlos Silva</h3>
                  <p className="text-gray-light text-sm">📅 27/01/2026 • 3 Dobras</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-gray-light text-xs">Peso</p>
                  <p className="text-white font-semibold">85.0 kg</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-light text-xs">IMC</p>
                  <p className="text-white font-semibold">27.8</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-light text-xs">% Gordura</p>
                  <p className="text-green-500 font-semibold">16.2%</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="text-sm px-3 py-1">Ver</Button>
                  <Button variant="secondary" className="text-sm px-3 py-1">Comparar</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mais exemplos */}
          <div className="bg-dark border border-gray-dark rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">AC</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Ana Costa</h3>
                  <p className="text-gray-light text-sm">📅 25/01/2026 • 7 Dobras</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-gray-light text-xs">Peso</p>
                  <p className="text-white font-semibold">62.0 kg</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-light text-xs">IMC</p>
                  <p className="text-white font-semibold">22.8</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-light text-xs">% Gordura</p>
                  <p className="text-yellow-500 font-semibold">22.5%</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="text-sm px-3 py-1">Ver</Button>
                  <Button variant="secondary" className="text-sm px-3 py-1">Comparar</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado vazio */}
        <div className="text-center py-12 hidden">
          <Activity className="mx-auto text-gray-dark mb-4" size={48} />
          <p className="text-gray-light mb-4">Nenhuma avaliação realizada ainda</p>
          <Button onClick={() => {/* TODO: implementar wizard */}}>
            <Plus size={20} className="mr-2" />
            Realizar Primeira Avaliação
          </Button>
        </div>
      </Card>
    </div>
  );
};
