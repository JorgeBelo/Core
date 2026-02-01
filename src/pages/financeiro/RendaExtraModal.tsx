import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { maskCurrencyBRL, unmaskCurrencyBRLToNumber } from '../../utils/masks';

interface RendaExtraModalProps {
  onClose: () => void;
  mesRef: Date;
}

export const RendaExtraModal = ({ onClose, mesRef }: RendaExtraModalProps) => {
  const { user } = useAuth();
  const primeiroDiaMes = format(mesRef, 'yyyy-MM-dd');
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: primeiroDiaMes,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const valor = unmaskCurrencyBRLToNumber(formData.valor);
      if (valor <= 0) {
        toast.error('Informe um valor maior que zero.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('contas_financeiras').insert({
        personal_id: user.id,
        descricao: formData.descricao.trim(),
        valor,
        data_vencimento: formData.data_vencimento,
        categoria: 'Renda extra',
        tipo: 'receber',
        parcelada: false,
        conta_fixa: false,
        pago: true,
      });

      if (error) throw error;

      toast.success('Renda extra cadastrada!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar renda extra:', error);
      toast.error(error.message || 'Erro ao cadastrar renda extra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <h2 className="text-xl font-sans font-semibold text-white">Adicionar renda extra</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-light hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Descrição *</label>
            <input
              type="text"
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="input-core w-full"
              placeholder="Ex: Venda de suplemento, Consultoria, Aula extra"
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
            <label className="block text-sm font-medium text-white mb-2">Data de referência *</label>
            <input
              type="date"
              required
              value={formData.data_vencimento}
              onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              className="input-core w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-dark">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
