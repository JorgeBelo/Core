import { useState, useEffect, useMemo } from 'react';
import { X, UserMinus, Trash2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import toast from 'react-hot-toast';
import type { Aluno } from '../../types';

interface AgendaItem {
  id: string;
  personal_id: string;
  aluno_id?: string;
  dia_semana: number; // 0 = Segunda, 6 = Domingo
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  aluno?: Aluno;
  created_at: string;
  updated_at: string;
}

const diasSemana = [
  { id: 0, nome: 'Segunda-feira' },
  { id: 1, nome: 'Terça-feira' },
  { id: 2, nome: 'Quarta-feira' },
  { id: 3, nome: 'Quinta-feira' },
  { id: 4, nome: 'Sexta-feira' },
  { id: 5, nome: 'Sábado' },
  { id: 6, nome: 'Domingo' },
];

/** Gera horários a cada 30 min entre inicio e fim (formato HH:mm). Fim é exclusivo. */
function generateTimeSlotsBetween(horaInicio: string, horaFim: string): string[] {
  const [hStart, mStart] = horaInicio.split(':').map(Number);
  const [hEnd, mEnd] = horaFim.split(':').map(Number);
  const startMinutes = hStart * 60 + mStart;
  const endMinutes = hEnd * 60 + mEnd;
  const slots: string[] = [];
  for (let min = startMinutes; min < endMinutes; min += 30) {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  return slots;
}

export const Agenda = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{
    dia: number;
    hora: string;
  } | null>(null);
  const [showAlunoModal, setShowAlunoModal] = useState(false);
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('09:00');

  /** Modal de edição: ao clicar em horário ocupado */
  const [editingSlot, setEditingSlot] = useState<{ dia: number; hora: string } | null>(null);
  const [editForm, setEditForm] = useState<{
    horaInicio: string;
    horaFim: string;
    removedIds: string[];
    newAlunoIds: string[];
  } | null>(null);

  const workingDays = userProfile?.agenda_working_days != null && userProfile.agenda_working_days.length > 0
    ? userProfile.agenda_working_days
    : [0, 1, 2, 3, 4, 5, 6];
  const agendaHoraInicio = userProfile?.agenda_hora_inicio || '06:00';
  const agendaHoraFim = userProfile?.agenda_hora_fim || '23:00';

  const diasSemanaFiltered = useMemo(
    () => diasSemana.filter((d) => workingDays.includes(d.id)),
    [workingDays]
  );
  const timeSlots = useMemo(
    () => generateTimeSlotsBetween(agendaHoraInicio, agendaHoraFim),
    [agendaHoraInicio, agendaHoraFim]
  );

  useEffect(() => {
    if (user) {
      loadAgenda();
      loadAlunos();
    }
  }, [user]);

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
      // Buscar agenda - usando dia_semana ao invés de data
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
        .order('dia_semana')
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

  /** Normaliza hora para HH:mm (banco pode retornar HH:mm:ss). */
  const normalizeHora = (h: string): string => {
    if (!h) return h;
    const parts = String(h).trim().split(':');
    return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  };

  /** Retorna todos os agendamentos do slot (um horário pode ter até 4 alunos). */
  const getAgendaForSlot = (dia: number, hora: string): AgendaItem[] => {
    const h = normalizeHora(hora);
    return agendaItems.filter((item) => {
      const start = normalizeHora(String(item.hora_inicio));
      const end = normalizeHora(String(item.hora_fim));
      return item.dia_semana === dia && start <= h && end > h;
    });
  };

  /** Nome do aluno: do join ou da lista local (evita espaço em branco). */
  const getAlunoNome = (item: AgendaItem): string => {
    const fromJoin = item.aluno?.nome || (item.aluno as any)?.name;
    if (fromJoin) return fromJoin;
    const local = alunos.find((a) => a.id === item.aluno_id);
    return local?.nome || local?.name || 'Aluno';
  };

  const handleSlotClick = (dia: number, hora: string) => {
    const items = getAgendaForSlot(dia, hora);

    if (items.length > 0) {
      const first = items[0];
      setEditingSlot({ dia, hora });
      setEditForm({
        horaInicio: normalizeHora(String(first.hora_inicio)),
        horaFim: normalizeHora(String(first.hora_fim)),
        removedIds: [],
        newAlunoIds: [],
      });
    } else {
      setSelectedSlot({ dia, hora });
      setHoraInicio(hora);
      const [h, m] = hora.split(':').map(Number);
      const endHour = (h + 1) % 24;
      setHoraFim(`${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      setSelectedAlunoIds([]);
      setShowAlunoModal(true);
    }
  };

  const saveAgendaItem = async () => {
    if (!user || !selectedSlot) {
      toast.error('Dados do horário não encontrados');
      return;
    }
    if (selectedAlunoIds.length === 0) {
      toast.error('Selecione pelo menos um aluno (até 4)');
      return;
    }
    if (!horaInicio || !horaFim) {
      toast.error('Defina as horas de início e fim');
      return;
    }

    try {
      const rows = selectedAlunoIds.map((aluno_id) => ({
        personal_id: user.id,
        aluno_id,
        dia_semana: selectedSlot.dia,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
      }));

      const { error } = await supabase.from('agenda_personal').insert(rows);

      if (error) throw error;

      toast.success(
        selectedAlunoIds.length === 1
          ? 'Horário agendado com sucesso!'
          : `${selectedAlunoIds.length} alunos agendados com sucesso!`
      );
      setShowAlunoModal(false);
      setSelectedSlot(null);
      setSelectedAlunoIds([]);
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

  const deleteAgendaItemsForSlot = async (dia: number, hora: string) => {
    const items = getAgendaForSlot(dia, hora);
    try {
      for (const item of items) {
        const { error } = await supabase.from('agenda_personal').delete().eq('id', item.id);
        if (error) throw error;
      }
      toast.success('Agendamentos removidos!');
      loadAgenda();
    } catch (error: any) {
      console.error('Erro ao remover agendamentos:', error);
      toast.error('Erro ao remover agendamentos');
    }
  };

  const handleSaveEditModal = async () => {
    if (!user || !editingSlot || !editForm) return;

    const items = getAgendaForSlot(editingSlot.dia, editingSlot.hora);
    const remaining = items.filter((i) => !editForm.removedIds.includes(i.id));
    const totalAfter = remaining.length + editForm.newAlunoIds.length;
    if (totalAfter === 0) {
      toast.error('O horário precisa ter pelo menos um aluno. Use "Remover todos" para apagar o horário.');
      return;
    }
    if (totalAfter > 4) {
      toast.error('Máximo de 4 alunos por horário.');
      return;
    }

    try {
      for (const id of editForm.removedIds) {
        const { error } = await supabase.from('agenda_personal').delete().eq('id', id);
        if (error) throw error;
      }

      if (editForm.newAlunoIds.length > 0) {
        const rows = editForm.newAlunoIds.map((aluno_id) => ({
          personal_id: user.id,
          aluno_id,
          dia_semana: editingSlot.dia,
          hora_inicio: editForm.horaInicio,
          hora_fim: editForm.horaFim,
        }));
        const { error } = await supabase.from('agenda_personal').insert(rows);
        if (error) throw error;
      }

      const horaChanged =
        editForm.horaInicio !== normalizeHora(String(items[0]?.hora_inicio)) ||
        editForm.horaFim !== normalizeHora(String(items[0]?.hora_fim));
      if (horaChanged && remaining.length > 0) {
        for (const item of remaining) {
          const { error } = await supabase
            .from('agenda_personal')
            .update({
              hora_inicio: editForm.horaInicio,
              hora_fim: editForm.horaFim,
            })
            .eq('id', item.id);
          if (error) throw error;
        }
      }

      toast.success('Alterações salvas!');
      setEditingSlot(null);
      setEditForm(null);
      loadAgenda();
    } catch (error: any) {
      console.error('Erro ao salvar edição:', error);
      toast.error(error.message || 'Erro ao salvar alterações');
    }
  };

  const handleRemoveAllInEdit = () => {
    if (!editingSlot) return;
    if (confirm('Remover todos os agendamentos deste horário?')) {
      deleteAgendaItemsForSlot(editingSlot.dia, editingSlot.hora);
      setEditingSlot(null);
      setEditForm(null);
    }
  };

  const getSlotStyle = (hasItems: boolean) => {
    if (!hasItems) {
      return 'bg-dark-soft border border-gray-dark hover:border-primary/50 transition-colors cursor-pointer';
    }
    return 'bg-primary/20 border border-primary text-white cursor-pointer';
  };

  const calculateSlotHeight = (firstItem: AgendaItem | undefined, hora: string) => {
    if (!firstItem || normalizeHora(String(firstItem.hora_inicio)) !== hora) return null;

    const [startH, startM] = String(firstItem.hora_inicio).split(':').map(Number);
    const [endH, endM] = String(firstItem.hora_fim).split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const durationMinutes = endMinutes - startMinutes;

    return Math.max(48, (durationMinutes / 30) * 48);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Agenda Semanal</h1>
        <p className="text-gray-light text-sm sm:text-base">
          Grade personalizada conforme seus dias e horários de atendimento. Configure em Perfil → Horários para a Agenda.
        </p>
      </div>

      {diasSemanaFiltered.length === 0 ? (
        <Card>
          <p className="text-gray-light text-center py-8">
            Nenhum dia de atendimento configurado. Vá em <strong className="text-white">Perfil</strong> → <strong className="text-white">Horários para a Agenda</strong> e selecione os dias e horários em que você atende.
          </p>
        </Card>
      ) : loading ? (
        <div className="text-center py-12 text-gray-light">Carregando...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-light font-medium w-16 sm:w-24 border-b border-gray-dark sticky left-0 bg-dark-soft z-10">
                      <span className="text-xs sm:text-sm">Horário</span>
                    </th>
                    {diasSemanaFiltered.map((dia) => (
                      <th
                        key={dia.id}
                        className="text-center py-3 px-2 sm:px-4 text-gray-light font-medium min-w-[100px] sm:min-w-[150px] border-b border-gray-dark"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm sm:text-lg font-semibold text-white">{dia.nome.split('-')[0]}</span>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((hora) => (
                  <tr key={hora} className="border-b border-gray-dark">
                    <td className="py-2 px-2 sm:px-4 text-gray-light font-medium text-xs sm:text-sm sticky left-0 bg-dark-soft z-10 border-r border-gray-dark">
                      {hora}
                    </td>
                    {diasSemanaFiltered.map((dia) => {
                      const items = getAgendaForSlot(dia.id, hora);
                      const firstItem = items[0];
                      const isFirstSlot =
                        firstItem && normalizeHora(String(firstItem.hora_inicio)) === hora;
                      const slotHeight = calculateSlotHeight(firstItem, hora);

                      return (
                        <td
                          key={`${dia.id}-${hora}`}
                          className="py-1 px-1"
                          style={{ position: 'relative', height: '48px' }}
                        >
                          {isFirstSlot && firstItem && slotHeight ? (
                            <div
                              className={`${getSlotStyle(true)} rounded p-1 sm:p-2 text-xs flex flex-col justify-center min-h-[44px]`}
                              style={{
                                height: `${slotHeight}px`,
                                position: 'absolute',
                                top: 0,
                                left: '4px',
                                right: '4px',
                                zIndex: 10,
                              }}
                              onClick={() => handleSlotClick(dia.id, hora)}
                            >
                              <p className="font-semibold truncate text-[10px] sm:text-xs">
                                {items.map((it) => getAlunoNome(it)).join(', ')}
                              </p>
                              <p className="text-[9px] sm:text-xs opacity-80 mt-0.5 sm:mt-1">
                                {normalizeHora(String(firstItem.hora_inicio))} - {normalizeHora(String(firstItem.hora_fim))}
                              </p>
                            </div>
                          ) : items.length === 0 ? (
                            <div
                              className={`${getSlotStyle(false)} rounded p-1 text-center text-xs h-full flex items-center justify-center min-h-[44px]`}
                              onClick={() => handleSlotClick(dia.id, hora)}
                            >
                              <span className="text-gray-light opacity-50 text-[10px] sm:text-xs">Livre</span>
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
      )}

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
                  setSelectedAlunoIds([]);
                }}
                className="text-gray-light hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Dia</label>
                <p className="text-gray-light">
                  {diasSemana.find((d) => d.id === selectedSlot.dia)?.nome}
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
                  Alunos (até 4 no mesmo horário) *
                </label>
                <p className="text-xs text-gray-light mb-2">
                  Marque os alunos que atendem juntos neste horário (dupla, trio ou grupo de 4).
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-dark rounded-lg p-3 bg-dark">
                  {alunos.map((aluno) => {
                    const id = aluno.id;
                    const checked = selectedAlunoIds.includes(id);
                    const disabled =
                      !checked && selectedAlunoIds.length >= 4;
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg border transition-colors ${
                          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-soft'
                        } ${checked ? 'border-primary bg-primary/10' : 'border-gray-dark'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            if (checked) {
                              setSelectedAlunoIds((prev) => prev.filter((x) => x !== id));
                            } else if (selectedAlunoIds.length < 4) {
                              setSelectedAlunoIds((prev) => [...prev, id]);
                            }
                          }}
                          className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                        />
                        <span className="text-white text-sm">
                          {aluno.nome || aluno.name || 'Sem nome'}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedAlunoIds.length > 0 && (
                  <p className="text-xs text-gray-light mt-2">
                    {selectedAlunoIds.length} aluno(s) selecionado(s)
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-dark">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAlunoModal(false);
                    setSelectedSlot(null);
                    setSelectedAlunoIds([]);
                  }}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button onClick={saveAgendaItem} className="min-h-[44px] w-full sm:w-auto">Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização/edição de horário ocupado */}
      {editingSlot && editForm && (() => {
        const items = getAgendaForSlot(editingSlot.dia, editingSlot.hora);
        const currentItems = items.filter((i) => !editForm.removedIds.includes(i.id));
        const currentAlunoIds = currentItems.map((i) => i.aluno_id).filter(Boolean) as string[];
        const totalAlunos = currentAlunoIds.length + editForm.newAlunoIds.length;
        const alunosDisponiveisParaAdd = alunos.filter(
          (a) => !currentAlunoIds.includes(a.id) && !editForm.newAlunoIds.includes(a.id)
        );
        const podeAddMais = totalAlunos < 4 && alunosDisponiveisParaAdd.length > 0;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-dark">
                <h2 className="text-xl font-sans font-semibold text-white">
                  Detalhes do horário
                </h2>
                <button
                  onClick={() => {
                    setEditingSlot(null);
                    setEditForm(null);
                  }}
                  className="text-gray-light hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-light text-sm">
                  Visualize os alunos deste horário. Você pode editar o horário, remover ou adicionar alunos individualmente, ou remover todos os agendamentos.
                </p>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Dia</label>
                  <p className="text-gray-light">
                    {diasSemana.find((d) => d.id === editingSlot.dia)?.nome}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Hora início</label>
                    <input
                      type="time"
                      value={editForm.horaInicio}
                      onChange={(e) =>
                        setEditForm((prev) => prev ? { ...prev, horaInicio: e.target.value } : null)
                      }
                      className="input-core w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Hora fim</label>
                    <input
                      type="time"
                      value={editForm.horaFim}
                      onChange={(e) =>
                        setEditForm((prev) => prev ? { ...prev, horaFim: e.target.value } : null)
                      }
                      className="input-core w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Alunos neste horário
                  </label>
                  {currentItems.length === 0 ? (
                    <p className="text-gray-light text-sm">Nenhum aluno (adicione abaixo ou remova o horário).</p>
                  ) : (
                    <ul className="space-y-2 border border-gray-dark rounded-lg p-3 bg-dark">
                      {currentItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-dark-soft"
                        >
                          <span className="text-white text-sm">
                            {getAlunoNome(item)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) =>
                                prev ? { ...prev, removedIds: [...prev.removedIds, item.id] } : null
                              )
                            }
                            className="text-primary hover:text-primary-light flex items-center gap-1 min-h-[44px] px-2"
                            title="Remover deste horário"
                          >
                            <UserMinus size={18} />
                            <span className="text-xs">Remover</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {podeAddMais && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Adicionar mais alunos (até 4 no total)
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-dark rounded-lg p-3 bg-dark">
                      {alunosDisponiveisParaAdd.map((aluno) => {
                        const checked = editForm.newAlunoIds.includes(aluno.id);
                        const disabled = !checked && totalAlunos >= 4;
                        return (
                          <label
                            key={aluno.id}
                            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg border transition-colors ${
                              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-soft'
                            } ${checked ? 'border-primary bg-primary/10' : 'border-gray-dark'}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                if (checked) {
                                  setEditForm((prev) =>
                                    prev
                                      ? { ...prev, newAlunoIds: prev.newAlunoIds.filter((x) => x !== aluno.id) }
                                      : null
                                  );
                                } else if (totalAlunos < 4) {
                                  setEditForm((prev) =>
                                    prev ? { ...prev, newAlunoIds: [...prev.newAlunoIds, aluno.id] } : null
                                  );
                                }
                              }}
                              className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                            />
                            <span className="text-white text-sm">
                              {aluno.nome || aluno.name || 'Sem nome'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-dark">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingSlot(null);
                      setEditForm(null);
                    }}
                    className="min-h-[44px]"
                  >
                    Fechar
                  </Button>
                  <Button onClick={handleSaveEditModal} className="min-h-[44px]">
                    Salvar alterações
                  </Button>
                  <button
                    type="button"
                    onClick={handleRemoveAllInEdit}
                    className="min-h-[44px] px-4 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Remover todos
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
