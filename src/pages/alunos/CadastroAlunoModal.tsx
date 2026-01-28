import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { maskWhatsApp, unmaskWhatsApp } from '../../utils/masks';
import { useAuth } from '../../contexts/AuthContext';
import type { Aluno } from '../../types';

interface CadastroAlunoModalProps {
  onClose: () => void;
  aluno?: Aluno | null;
}

export const CadastroAlunoModal = ({ onClose, aluno }: CadastroAlunoModalProps) => {
  const { user } = useAuth();
  const isEditing = !!aluno;
  const [formData, setFormData] = useState({
    nome: aluno?.nome || aluno?.name || '',
    whatsapp: aluno?.whatsapp ? maskWhatsApp(aluno.whatsapp) : '',
    monthly_fee: aluno?.monthly_fee?.toString() || '',
    payment_day: aluno?.payment_day?.toString() || '5',
    payment_status: aluno?.payment_status || 'pendente',
  });
  const [loading, setLoading] = useState(false);

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: masked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const alunoData = {
        personal_id: user.id,
        nome: formData.nome,
        whatsapp: unmaskWhatsApp(formData.whatsapp),
        monthly_fee: parseFloat(formData.monthly_fee),
        payment_day: parseInt(formData.payment_day),
        payment_status: formData.payment_status,
      };

      if (isEditing && aluno) {
        // Atualizar aluno existente
        const { error } = await supabase
          .from('alunos')
          .update(alunoData)
          .eq('id', aluno.id);

        if (error) throw error;
        toast.success('Aluno atualizado com sucesso!');
      } else {
        // Criar novo aluno
        const { error } = await supabase
          .from('alunos')
          .insert({
            ...alunoData,
            active: true,
          });

        if (error) throw error;
        toast.success('Aluno cadastrado com sucesso!');
      }

      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar aluno:', error);
      toast.error(error.message || 'Erro ao cadastrar aluno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <h2 className="text-2xl font-sans font-semibold text-white">
            {isEditing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
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
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="input-core w-full"
                placeholder="Nome do aluno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={formData.whatsapp}
                onChange={handleWhatsAppChange}
                className="input-core w-full"
                placeholder="(11) 9 9999-9999"
                maxLength={16}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Valor da Mensalidade *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                className="input-core w-full"
                placeholder="300.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Dia de Pagamento *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={formData.payment_day}
                onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                className="input-core w-full"
                placeholder="5"
              />
              <p className="text-xs text-gray-light mt-1">Dia do mês (1-31)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status de Pagamento *
              </label>
              <select
                required
                value={formData.payment_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_status: e.target.value as 'pago' | 'pendente' | 'atrasado',
                  })
                }
                className="input-core w-full"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-dark">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (isEditing ? 'Atualizando...' : 'Cadastrando...') 
                : (isEditing ? 'Atualizar Aluno' : 'Cadastrar Aluno')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
