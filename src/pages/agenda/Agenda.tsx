import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Agenda as AgendaType } from '../../types';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data
const mockAgenda: AgendaType[] = [
  {
    id: '1',
    personal_id: '1',
    aluno_id: '1',
    date: '2024-01-27',
    time: '08:00',
    duration: 60,
    status: 'agendado',
    notes: 'Treino de pernas',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    personal_id: '1',
    aluno_id: '2',
    date: '2024-01-27',
    time: '09:00',
    duration: 60,
    status: 'agendado',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: '3',
    personal_id: '1',
    date: '2024-01-27',
    time: '10:00',
    duration: 60,
    status: 'livre',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
];

const mockAlunos: { [key: string]: string } = {
  '1': 'João Silva',
  '2': 'Maria Santos',
};

export const Agenda = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 7 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getAgendaForDay = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mockAgenda.find(
      (a) => a.date === dateStr && a.time === time
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Agenda</h1>
          <p className="text-gray-light">Visualize e gerencie seus horários</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Controles de Navegação */}
      <Card>
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft size={20} />
          </Button>
          <h2 className="text-xl font-sans font-semibold text-white">
            {format(weekStart, "d 'de' MMMM", { locale: ptBR })} -{' '}
            {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button
            variant="secondary"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </Card>

      {/* Calendário Semanal */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-gray-light font-medium w-24">Horário</th>
                {weekDays.map((day) => (
                  <th key={day.toString()} className="text-center py-3 px-4 text-gray-light font-medium min-w-[150px]">
                    <div className="flex flex-col">
                      <span className="text-sm">{format(day, 'EEE', { locale: ptBR })}</span>
                      <span className="text-lg font-semibold">{format(day, 'd')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time} className="border-t border-gray-dark">
                  <td className="py-3 px-4 text-gray-light font-medium">{time}</td>
                  {weekDays.map((day) => {
                    const agenda = getAgendaForDay(day, time);
                    return (
                      <td key={day.toString()} className="py-2 px-2">
                        {agenda ? (
                          <div
                            className={`p-2 rounded-lg text-sm ${
                              agenda.status === 'agendado'
                                ? agenda.aluno_id
                                  ? 'bg-primary/20 border border-primary text-white'
                                  : 'bg-yellow-500/20 border border-yellow-500 text-yellow-500'
                                : 'bg-gray-dark text-gray-light'
                            }`}
                          >
                            {agenda.aluno_id ? (
                              <>
                                <p className="font-semibold">{mockAlunos[agenda.aluno_id]}</p>
                                {agenda.notes && (
                                  <p className="text-xs mt-1 opacity-80">{agenda.notes}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs">Livre</p>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-dark-soft border border-gray-dark hover:border-primary/50 transition-colors cursor-pointer text-center text-xs text-gray-light">
                            Livre
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
