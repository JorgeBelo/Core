import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { addMonths, format } from 'date-fns';
import type { ContaFinanceira } from '../../types';

interface CadastroContaModalProps {
  onClose: () => void;
  conta?: ContaFinanceira | null;
}

export const CadastroContaModal = ({ onClose, conta }: CadastroContaModalProps) => {
  const { user } = useAuth();
  const isEditing = !!conta;
  const [formData, setFormData] = useState({
    descricao: conta?.descricao ?? '',
    valor: conta?.valor?.toString() ?? '',
    data_vencimento: conta?.data_vencimento ?? '',
    categoria: conta?.categoria ?? '',
    tipo: (conta?.tipo as 'pagar' | 'receber') ?? 'pagar',
    parcelada: conta?.parcelada ?? false,
    numero_parcelas: conta?.numero_parcelas ?? 1,
    conta_fixa: conta?.conta_fixa ?? false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const valor = parseFloat(formData.valor);
      const dataVencimento = new Date(formData.data_vencimento);

      // Edição de conta existente (atualiza apenas campos básicos)
      if (isEditing && conta) {
        const updateData = {
          descricao: formData.descricao,
          valor,
          data_vencimento: formData.data_vencimento,
          categoria: formData.categoria,
          tipo: formData.tipo,
        };

        const { error } = await supabase
          .from('contas_financeiras')
          .update(updateData)
          .eq('id', conta.id);

        if (error) throw error;

        toast.success('Conta atualizada com sucesso!');
        onClose();
        return;
      }

      // Conta Fixa (Recorrente Mensal)
      if (formData.conta_fixa) {
        // Criar contas para os próximos 12 meses
        const contas = [];
        for (let i = 0; i < 12; i++) {
          const dataParcela = addMonths(dataVencimento, i);
          contas.push({
            personal_id: user.id,
            descricao: formData.descricao,
            valor: valor,
            data_vencimento: format(dataParcela, 'yyyy-MM-dd'),
            categoria: formData.categoria,
            tipo: formData.tipo,
            parcelada: false,
            conta_fixa: true,
            pago: false,
          });
        }

        const { error } = await supabase.from('contas_financeiras').insert(contas);
        if (error) throw error;

        toast.success('Conta fixa cadastrada com sucesso! (12 meses)');
        onClose();
        return;
      }

      // Conta Parcelada
      if (formData.parcelada && formData.numero_parcelas > 1) {
        // Criar múltiplas contas para parcelas
        const contas = [];
        for (let i = 0; i < formData.numero_parcelas; i++) {
          const dataParcela = addMonths(dataVencimento, i);
          contas.push({
            personal_id: user.id,
            descricao: `${formData.descricao} - Parcela ${i + 1}/${formData.numero_parcelas}`,
            valor: valor / formData.numero_parcelas,
            data_vencimento: format(dataParcela, 'yyyy-MM-dd'),
            categoria: formData.categoria,
            tipo: formData.tipo,
            parcelada: true,
            numero_parcelas: formData.numero_parcelas,
            parcela_atual: i + 1,
            conta_fixa: false,
            pago: false,
          });
        }

        const { error } = await supabase.from('contas_financeiras').insert(contas);
        if (error) throw error;

        toast.success(`Conta parcelada cadastrada com sucesso! (${formData.numero_parcelas} parcelas)`);
        onClose();
        return;
      }

      // Conta única
      const { error } = await supabase.from('contas_financeiras').insert({
        personal_id: user.id,
        descricao: formData.descricao,
        valor: valor,
        data_vencimento: formData.data_vencimento,
        categoria: formData.categoria,
        tipo: formData.tipo,
        parcelada: false,
        conta_fixa: false,
        pago: false,
      });

      if (error) throw error;

      toast.success('Conta cadastrada com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar conta:', error);
      toast.error(error.message || 'Erro ao cadastrar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <h2 className="text-2xl font-sans font-semibold text-white">
            {isEditing ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-light hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tipo *
              </label>
              <select
                required
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value as 'pagar' | 'receber' })
                }
                className="input-core w-full"
              >
                <option value="pagar">Conta a Pagar</option>
                <option value="receber">Conta a Receber</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Descrição *
              </label>
              <input
                type="text"
                required
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="input-core w-full"
                placeholder="Ex: Aluguel, Mensalidade, etc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="input-core w-full"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                className="input-core w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Categoria *
              </label>
              <input
                type="text"
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="input-core w-full"
                placeholder="Ex: Aluguel, Material, Salário, etc"
              />
            </div>

            {!isEditing && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-dark hover:border-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.conta_fixa}
                    onChange={(e) => {
                      const isFixa = e.target.checked;
                      setFormData({
                        ...formData,
                        conta_fixa: isFixa,
                        parcelada: isFixa ? false : formData.parcelada, // Desmarca parcelada se marcar fixa
                      });
                    }}
                    className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                  />
                  <span className="text-white text-sm">Conta Fixa (Recorrente Mensal)</span>
                </label>
                <p className="text-xs text-gray-light ml-7">
                  Ex: Aluguel, Assinaturas - Gera automaticamente para os próximos 12 meses
                </p>

                {!formData.conta_fixa && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-dark hover:border-primary transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.parcelada}
                        onChange={(e) =>
                          setFormData({ ...formData, parcelada: e.target.checked })
                        }
                        className="w-4 h-4 text-primary bg-dark-soft border-gray-dark rounded focus:ring-primary"
                      />
                      <span className="text-white text-sm">É parcelada?</span>
                    </label>
                  </>
                )}
              </div>
            )}

            {formData.parcelada && !formData.conta_fixa && !isEditing && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Número de Parcelas * (até 420x)
                </label>
                <input
                  type="number"
                  min="2"
                  max="420"
                  required={formData.parcelada}
                  value={formData.numero_parcelas}
                  onChange={(e) => {
                    const num = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      numero_parcelas: Math.min(420, Math.max(1, num)),
                    });
                  }}
                  className="input-core w-full"
                />
                <p className="text-xs text-gray-light mt-1">
                  Máximo: 420 parcelas (ex: financiamento de imóvel)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-dark">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (isEditing ? 'Atualizando...' : 'Salvando...')
                : (isEditing ? 'Atualizar Conta' : 'Salvar Conta')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
