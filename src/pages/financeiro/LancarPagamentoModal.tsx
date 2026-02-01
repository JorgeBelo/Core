import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { maskCurrencyBRL, unmaskCurrencyBRLToNumber } from '../../utils/masks';
import type { Aluno } from '../../types';

interface LancarPagamentoModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  /** Se passado, pré-seleciona o aluno (ex.: ao abrir da ficha do aluno) */
  alunoId?: string | null;
}

const hoje = new Date();
const dataHoje = format(hoje, 'yyyy-MM-dd');

export const LancarPagamentoModal = ({ onClose, onSuccess, alunoId }: LancarPagamentoModalProps) => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [formData, setFormData] = useState({
    aluno_id: alunoId || '',
    mes_ano: format(hoje, 'yyyy-MM'),
    valor: '',
    data_recebimento: dataHoje,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      (async () => {
        setLoadingAlunos(true);
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .eq('personal_id', user.id)
          .order('nome');
        if (error) {
          toast.error('Erro ao carregar alunos');
          setLoadingAlunos(false);
          return;
        }
        setAlunos((data || []) as Aluno[]);
        if (alunoId && !formData.aluno_id) setFormData((f) => ({ ...f, aluno_id: alunoId }));
        setLoadingAlunos(false);
      })();
    }
  }, [user, alunoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (loading) return;

    const valor = unmaskCurrencyBRLToNumber(formData.valor);
    if (valor <= 0) {
      toast.error('Informe um valor maior que zero.');
      return;
    }
    const aluno = alunos.find((a) => a.id === formData.aluno_id);
    if (!aluno) {
      toast.error('Selecione um aluno.');
      return;
    }

    const alunoNome = aluno.nome || aluno.name || 'Aluno';
    const [y, m] = formData.mes_ano.split('-').map(Number);
    const mesRefLabel = format(new Date(y, m - 1, 1), 'MMMM/yyyy', { locale: ptBR });
    const descricao = `Mensalidade de ${alunoNome} - ${mesRefLabel}`;

    setLoading(true);
    try {
      const { error } = await supabase.from('contas_financeiras').insert({
        personal_id: user.id,
        descricao,
        valor,
        data_vencimento: formData.data_recebimento,
        categoria: 'Mensalidade',
        tipo: 'receber',
        parcelada: false,
        conta_fixa: false,
        pago: true,
      });

      if (error) throw error;

      toast.success('Pagamento lançado! O registro ficará salvo no histórico.');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao lançar pagamento:', error);
      toast.error(error.message || 'Erro ao lançar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <h2 className="text-xl font-sans font-semibold text-white">Lançar pagamento</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-light hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-light text-sm">
            O nome do aluno e o valor ficam salvos como texto. Mesmo que você exclua o aluno depois, o lançamento permanece no histórico.
          </p>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Aluno *</label>
            <select
              required
              value={formData.aluno_id}
              onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
              className="input-core w-full"
              disabled={loadingAlunos}
            >
              <option value="">Selecione...</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome || a.name || 'Aluno'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Mês de referência *</label>
            <input
              type="month"
              required
              value={formData.mes_ano}
              onChange={(e) => setFormData({ ...formData, mes_ano: e.target.value })}
              className="input-core w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Valor *</label>
            <input
              type="text"
              required
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: maskCurrencyBRL(e.target.value) })}
              className="input-core w-full"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Data do recebimento *</label>
            <input
              type="date"
              required
              value={formData.data_recebimento}
              onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
              className="input-core w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-dark">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Lançar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
