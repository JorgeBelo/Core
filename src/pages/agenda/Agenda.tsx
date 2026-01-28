import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { Aluno } from '../../types';

interface AgendaItem {
  id: string;
  personal_id: string;
  aluno_id?: string;
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  aluno?: Aluno;
  created_at: string;
  updated_at: string;
}

export const Agenda = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{
    dia: number;
    hora: string;
  } | null>(null);
  const [showAlunoModal, setShowAlunoModal] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('09:00');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Segunda-feira
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Gerar horários de 6h às 23h com intervalos de 30 minutos
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (user) {
      loadAgenda();
      loadAlunos();
    }
  }, [user, currentWeek]);

  const loadAlunos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user.id)
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      setAlunos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos');
    }
  };

  const loadAgenda = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      // Buscar agenda da semana atual
      const { data, error } = await supabase
        .from('agenda_personal')
        .select(`
          *,
          aluno:alunos (
            id,
            nome,
            name,
            whatsapp
          )
        `)
        .eq('personal_id', user.id)
        .gte('data', weekStartStr)
        .lte('data', weekEndStr)
        .order('hora_inicio');

      if (error) throw error;

      setAgendaItems(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar agenda:', error);
      if (error.code !== 'PGRST116') {
        toast.error('Erro ao carregar agenda');
      }
      setAgendaItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getAgendaForSlot = (dia: number, hora: string): AgendaItem | undefined => {
    const dayDate = weekDays[dia];
    const dateStr = format(dayDate, 'yyyy-MM-dd');

    return agendaItems.find(
      (item) =>
        item.data === dateStr &&
        item.hora_inicio <= hora &&
        item.hora_fim > hora
    );
  };

  const handleSlotClick = (dia: number, hora: string) => {
    const existing = getAgendaForSlot(dia, hora);

    if (existing) {
      // Se já existe, permitir remover
      if (confirm('Deseja remover este agendamento?')) {
        deleteAgendaItem(existing.id);
      }
    } else {
      // Se não existe, abrir modal para selecionar aluno
      setSelectedSlot({ dia, hora });
      setHoraInicio(hora);
      // Calcular hora fim (padrão 1 hora depois)
      const [h, m] = hora.split(':').map(Number);
      const endHour = (h + 1) % 24;
      setHoraFim(`${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      setShowAlunoModal(true);
    }
  };

  const saveAgendaItem = async () => {
    if (!user || !selectedSlot || !selectedAlunoId) {
      toast.error('Selecione um aluno');
      return;
    }

    if (!horaInicio || !horaFim) {
      toast.error('Defina as horas de início e fim');
      return;
    }

    try {
      const selectedDay = weekDays[selectedSlot.dia];
      const dataStr = format(selectedDay, 'yyyy-MM-dd');

      // Verificar se já existe um agendamento no mesmo horário
      const { data: existing } = await supabase
        .from('agenda_personal')
        .select('id')
        .eq('personal_id', user.id)
        .eq('data', dataStr)
        .eq('hora_inicio', horaInicio)
        .single();

      if (existing) {
        toast.error('Já existe um agendamento neste horário');
        return;
      }

      const { error } = await supabase.from('agenda_personal').insert({
        personal_id: user.id,
        aluno_id: selectedAlunoId,
        data: dataStr,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
      });

      if (error) throw error;

      toast.success('Horário agendado com sucesso!');
      setShowAlunoModal(false);
      setSelectedSlot(null);
      setSelectedAlunoId('');
      loadAgenda();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error(error.message || 'Erro ao salvar agendamento');
    }
  };

  const deleteAgendaItem = async (id: string) => {
    try {
      const { error } = await supabase.from('agenda_personal').delete().eq('id', id);

      if (error) throw error;

      toast.success('Agendamento removido!');
      loadAgenda();
    } catch (error: any) {
      console.error('Erro ao remover agendamento:', error);
      toast.error('Erro ao remover agendamento');
    }
  };

  const getSlotStyle = (item: AgendaItem | undefined) => {
    if (!item) {
      return 'bg-dark-soft border border-gray-dark hover:border-primary/50 transition-colors cursor-pointer';
    }
    return 'bg-primary/20 border border-primary text-white cursor-pointer';
  };

  const calculateSlotHeight = (item: AgendaItem | undefined, hora: string) => {
    if (!item || item.hora_inicio !== hora) return null;

    const [startH, startM] = item.hora_inicio.split(':').map(Number);
    const [endH, endM] = item.hora_fim.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const durationMinutes = endMinutes - startMinutes;

    // Cada slot de 30 minutos = 48px, então altura = (duração / 30) * 48
    return Math.max(48, (durationMinutes / 30) * 48);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Agenda</h1>
          <p className="text-gray-light">Grade semanal de horários - Clique para agendar</p>
        </div>
        <Button onClick={() => setCurrentWeek(new Date())}>Hoje</Button>
      </div>

      {/* Controles de Navegação */}
      <Card>
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentWeek(subWeeks(currentWeek, 1));
            }}
          >
            <ChevronLeft size={20} />
            Semana Anterior
          </Button>
          <h2 className="text-xl font-sans font-semibold text-white">
            {format(weekStart, "d 'de' MMMM", { locale: ptBR })} -{' '}
            {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentWeek(addWeeks(currentWeek, 1));
            }}
          >
            Próxima Semana
            <ChevronRight size={20} />
          </Button>
        </div>
      </Card>

      {/* Grade Semanal */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-gray-light font-medium w-24 border-b border-gray-dark sticky left-0 bg-dark-soft z-10">
                  Horário
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.toString()}
                    className="text-center py-3 px-4 text-gray-light font-medium min-w-[150px] border-b border-gray-dark"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-normal">
                        {format(day, 'EEE', { locale: ptBR })}
                      </span>
                      <span className="text-lg font-semibold text-white">
                        {format(day, 'd')}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((hora) => (
                <tr key={hora} className="border-b border-gray-dark">
                  <td className="py-2 px-4 text-gray-light font-medium text-sm sticky left-0 bg-dark-soft z-10 border-r border-gray-dark">
                    {hora}
                  </td>
                  {weekDays.map((day, diaIndex) => {
                    const item = getAgendaForSlot(diaIndex, hora);
                    const isFirstSlot = item && item.hora_inicio === hora;
                    const slotHeight = calculateSlotHeight(item, hora);

                    return (
                      <td
                        key={`${day.toString()}-${hora}`}
                        className="py-1 px-1"
                        style={{ position: 'relative', height: '48px' }}
                      >
                        {isFirstSlot && item && slotHeight ? (
                          <div
                            className={`${getSlotStyle(item)} rounded p-2 text-xs flex flex-col justify-center`}
                            style={{
                              height: `${slotHeight}px`,
                              position: 'absolute',
                              top: 0,
                              left: '4px',
                              right: '4px',
                              zIndex: 10,
                            }}
                            onClick={() => handleSlotClick(diaIndex, hora)}
                          >
                            <p className="font-semibold truncate">
                              {item.aluno?.nome || item.aluno?.name || 'Aluno'}
                            </p>
                            <p className="text-xs opacity-80 mt-1">
                              {item.hora_inicio} - {item.hora_fim}
                            </p>
                          </div>
                        ) : !item ? (
                          <div
                            className={`${getSlotStyle(item)} rounded p-1 text-center text-xs h-full flex items-center justify-center`}
                            onClick={() => handleSlotClick(diaIndex, hora)}
                          >
                            <span className="text-gray-light opacity-50">Livre</span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Seleção de Aluno */}
      {showAlunoModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-dark">
              <h2 className="text-2xl font-sans font-semibold text-white">
                Agendar Horário
              </h2>
              <button
                onClick={() => {
                  setShowAlunoModal(false);
                  setSelectedSlot(null);
                }}
                className="text-gray-light hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Dia</label>
                <p className="text-gray-light">
                  {format(weekDays[selectedSlot.dia], "EEEE, d 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Hora Início *
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="input-core w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Hora Fim *
                  </label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="input-core w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Aluno *
                </label>
                <select
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  className="input-core w-full"
                  required
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome || aluno.name || 'Sem nome'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-dark">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAlunoModal(false);
                    setSelectedSlot(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={saveAgendaItem}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
