import { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface HorarioSemanal {
  id?: string;
  dia_semana: number; // 0 = Segunda, 6 = Domingo
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
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

export const Agenda = () => {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<HorarioSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadHorarios();
    }
  }, [user]);

  const loadHorarios = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('horarios_semanais')
        .select('*')
        .eq('personal_id', user.id)
        .order('dia_semana')
        .order('hora_inicio');

      if (error) throw error;

      setHorarios(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error);
      // Se a tabela não existir, inicializar com array vazio
      if (error.code !== 'PGRST116') {
        toast.error('Erro ao carregar horários');
      }
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const addHorario = (diaSemana: number) => {
    setHorarios([
      ...horarios,
      {
        dia_semana: diaSemana,
        hora_inicio: '08:00',
        hora_fim: '12:00',
        ativo: true,
      },
    ]);
  };

  const updateHorario = (index: number, field: keyof HorarioSemanal, value: any) => {
    const updated = [...horarios];
    updated[index] = { ...updated[index], [field]: value };
    setHorarios(updated);
  };

  const removeHorario = (index: number) => {
    setHorarios(horarios.filter((_, i) => i !== index));
  };

  const saveHorarios = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Deletar todos os horários existentes
      await supabase.from('horarios_semanais').delete().eq('personal_id', user.id);

      // Inserir novos horários
      if (horarios.length > 0) {
        const horariosToInsert = horarios.map((h) => ({
          personal_id: user.id,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fim: h.hora_fim,
          ativo: h.ativo,
        }));

        const { error } = await supabase.from('horarios_semanais').insert(horariosToInsert);

        if (error) throw error;
      }

      toast.success('Horários salvos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar horários:', error);
      toast.error(error.message || 'Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  const getHorariosPorDia = (diaSemana: number) => {
    return horarios.filter((h) => h.dia_semana === diaSemana);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">
            Agenda Semanal
          </h1>
          <p className="text-gray-light">Cadastre seus horários fixos de atendimento</p>
        </div>
        <Button onClick={saveHorarios} disabled={saving}>
          <Save size={20} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-light">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {diasSemana.map((dia) => {
            const horariosDia = getHorariosPorDia(dia.id);

            return (
              <Card key={dia.id} title={dia.nome}>
                <div className="space-y-3">
                  {horariosDia.length === 0 ? (
                    <p className="text-gray-light text-sm">Nenhum horário cadastrado</p>
                  ) : (
                    horariosDia.map((horario, index) => {
                      const globalIndex = horarios.findIndex(
                        (h) => h === horario
                      );
                      return (
                        <div
                          key={globalIndex}
                          className="flex items-center gap-4 p-4 bg-dark-soft rounded-lg border border-gray-dark"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <label className="text-gray-light text-sm whitespace-nowrap">
                              Das
                            </label>
                            <input
                              type="time"
                              value={horario.hora_inicio}
                              onChange={(e) =>
                                updateHorario(globalIndex, 'hora_inicio', e.target.value)
                              }
                              className="input-core w-32"
                            />
                            <label className="text-gray-light text-sm whitespace-nowrap">
                              às
                            </label>
                            <input
                              type="time"
                              value={horario.hora_fim}
                              onChange={(e) =>
                                updateHorario(globalIndex, 'hora_fim', e.target.value)
                              }
                              className="input-core w-32"
                            />
                            <label className="flex items-center gap-2 ml-4 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={horario.ativo}
                                onChange={(e) =>
                                  updateHorario(globalIndex, 'ativo', e.target.checked)
                                }
                                className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                              />
                              <span className="text-white text-sm">Ativo</span>
                            </label>
                          </div>
                          <button
                            onClick={() => removeHorario(globalIndex)}
                            className="text-primary hover:text-red-600 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => addHorario(dia.id)}
                    className="w-full"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar Horário
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
