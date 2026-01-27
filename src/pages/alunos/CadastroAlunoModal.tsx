import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';

interface CadastroAlunoModalProps {
  onClose: () => void;
}

export const CadastroAlunoModal = ({ onClose }: CadastroAlunoModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    phone: '',
    whatsapp: '',
    frequency_per_week: 2,
    monthly_fee: '',
    start_date: '',
    observations: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar chamada à API
    toast.success('Aluno cadastrado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-dark">
          <h2 className="text-2xl font-sans font-semibold text-white">Cadastrar Novo Aluno</h2>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-core w-full"
                placeholder="Nome do aluno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Data de Nascimento *
              </label>
              <input
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="input-core w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-core w-full"
                placeholder="(11) 98765-4321"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="input-core w-full"
                placeholder="(11) 98765-4321"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Frequência Semanal *
              </label>
              <input
                type="number"
                min="1"
                max="7"
                required
                value={formData.frequency_per_week}
                onChange={(e) => setFormData({ ...formData, frequency_per_week: parseInt(e.target.value) })}
                className="input-core w-full"
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
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input-core w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="input-core w-full"
              rows={3}
              placeholder="Observações sobre o aluno..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-dark">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Cadastrar Aluno
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
