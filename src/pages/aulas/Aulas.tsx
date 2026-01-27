import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Treino } from '../../types';

// Mock data
const mockTreinos: Treino[] = [
  {
    id: '1',
    personal_id: '1',
    name: 'Treino A - Peito e Tríceps',
    category: 'hipertrofia',
    exercises: [
      { id: '1', name: 'Supino Reto', sets: 4, reps: '8-10', rest: 90 },
      { id: '2', name: 'Supino Inclinado', sets: 3, reps: '10-12', rest: 90 },
      { id: '3', name: 'Tríceps Pulley', sets: 3, reps: '12-15', rest: 60 },
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    personal_id: '1',
    name: 'Treino B - Costas e Bíceps',
    category: 'hipertrofia',
    exercises: [
      { id: '3', name: 'Barra Fixa', sets: 4, reps: 'até a falha', rest: 90 },
      { id: '4', name: 'Remada Curvada', sets: 3, reps: '10-12', rest: 90 },
      { id: '5', name: 'Rosca Direta', sets: 3, reps: '12-15', rest: 60 },
    ],
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: '3',
    personal_id: '1',
    name: 'Treino Cardio Intenso',
    category: 'cardio',
    exercises: [
      { id: '6', name: 'Corrida', sets: 1, reps: '30 min', rest: 0 },
      { id: '7', name: 'Bicicleta', sets: 1, reps: '20 min', rest: 0 },
    ],
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
];

const categoryLabels: { [key: string]: string } = {
  hipertrofia: 'Hipertrofia',
  cardio: 'Cardio',
  funcional: 'Funcional',
  emagrecimento: 'Emagrecimento',
  forca: 'Força',
  outros: 'Outros',
};

const categoryColors: { [key: string]: string } = {
  hipertrofia: 'bg-primary/20 text-primary border-primary',
  cardio: 'bg-red-500/20 text-red-500 border-red-500',
  funcional: 'bg-blue-500/20 text-blue-500 border-blue-500',
  emagrecimento: 'bg-green-500/20 text-green-500 border-green-500',
  forca: 'bg-yellow-500/20 text-yellow-500 border-yellow-500',
  outros: 'bg-gray-light/20 text-gray-light border-gray-light',
};

export const Aulas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  const filteredTreinos = mockTreinos.filter((treino) => {
    const matchesSearch = treino.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || treino.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Biblioteca de Treinos</h1>
          <p className="text-gray-light">Gerencie seus treinos e exercícios</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Novo Treino
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-light" size={20} />
            <input
              type="text"
              placeholder="Buscar treino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-core w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-light" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-core"
            >
              <option value="todos">Todas as Categorias</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Grid de Treinos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTreinos.map((treino) => (
          <Card key={treino.id} className="hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-sans font-semibold text-white">{treino.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[treino.category]}`}
              >
                {categoryLabels[treino.category]}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-gray-light text-sm mb-3">
                {treino.exercises.length} exercício{treino.exercises.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-dark">
                {treino.exercises.map((exercicio) => (
                  <div
                    key={exercicio.id}
                    className="bg-dark p-3 rounded-lg border border-gray-dark"
                  >
                    <p className="text-white font-medium">{exercicio.name}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-light">
                      {exercicio.sets && <span>{exercicio.sets} séries</span>}
                      {exercicio.reps && <span>{exercicio.reps} reps</span>}
                      {exercicio.rest && <span>{exercicio.rest}s descanso</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-dark flex gap-2">
              <Button variant="secondary" className="flex-1 text-sm py-2">
                Editar
              </Button>
              <Button className="flex-1 text-sm py-2">
                Usar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredTreinos.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-light">
            Nenhum treino encontrado
          </div>
        </Card>
      )}
    </div>
  );
};
