import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPagamentosPendentes,
  updateMensalidadeStatus,
  type PagamentoPendenteItem,
} from '../../services/mensalidadesService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export const PagamentosPendentes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<PagamentoPendenteItem[]>([]);
  const [confirmItem, setConfirmItem] = useState<PagamentoPendenteItem | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendentes();
    }
  }, [user]);

  const loadPendentes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const lista = await getPagamentosPendentes(user.id);
      setItens(lista);
    } catch (error: any) {
      console.error('Erro ao carregar pendentes:', error);
      toast.error('Erro ao carregar pagamentos pendentes');
    } finally {
      setLoading(false);
    }
  };

  const totalPendente = useMemo(() => itens.reduce((s, i) => s + i.amount, 0), [itens]);

  const handleConfirmarPagamento = async () => {
    if (!confirmItem) return;
    setSalvando(true);
    try {
      // Marca como pago com a data de HOJE (quando o aluno realmente acertou)
      const hoje = new Date().toISOString().slice(0, 10);
      await updateMensalidadeStatus(confirmItem.id, 'pago', hoje);

      // Remove da lista local
      setItens((prev) => prev.filter((i) => i.id !== confirmItem.id));

      const mesRef = confirmItem.due_date.slice(0, 7);
      const [y, m] = mesRef.split('-').map(Number);
      const mesLabel = format(new Date(y, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });

      toast.success(
        `Pagamento de ${confirmItem.aluno_nome} (${mesLabel}) registrado! Ele aparecerá no Histórico de Entrada.`
      );
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    } finally {
      setSalvando(false);
      setConfirmItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">
          Pagamentos Pendentes
        </h1>
        <p className="text-gray-light text-sm sm:text-base">
          Mensalidades de meses anteriores que ainda não foram pagas. Quando o aluno acertar,
          marque como pago e ele entrará no <strong className="text-white">Histórico de Entrada</strong> com a data de hoje.
        </p>
      </div>

      {/* Resumo */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <AlertTriangle className="text-primary" size={28} />
            </div>
            <div>
              <p className="text-gray-light text-sm">Total em atraso</p>
              <p className="text-2xl font-bold text-primary">
                {currencyFormatter.format(totalPendente)}
              </p>
              <p className="text-xs text-gray-light mt-0.5">
                {itens.length} {itens.length === 1 ? 'mensalidade pendente' : 'mensalidades pendentes'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de pendentes */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={22} className="text-primary" />
          Mensalidades em atraso
        </h2>

        {loading ? (
          <div className="py-12 text-center text-gray-light">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
            <p className="text-white font-medium">Nenhuma mensalidade em atraso!</p>
            <p className="text-gray-light text-sm mt-1">
              Todos os alunos estão em dia com os meses anteriores.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-dark">
            {itens.map((item) => {
              const mesRef = item.due_date.slice(0, 7);
              const [y, m] = mesRef.split('-').map(Number);
              const mesLabel = format(new Date(y, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });

              return (
                <li
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="text-primary" size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{item.aluno_nome}</p>
                      <p className="text-gray-light text-sm">
                        Venceu em <span className="text-primary font-medium">{mesLabel}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-primary font-semibold">
                      {currencyFormatter.format(item.amount)}
                    </span>
                    <Button
                      onClick={() => setConfirmItem(item)}
                      className="min-h-[44px] text-sm"
                    >
                      Marcar como pago
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Dica */}
      <Card className="border-green-500/30 bg-green-500/5">
        <div className="flex gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={22} />
          <div className="text-sm text-gray-light">
            <p className="text-white font-medium mb-1">Como funciona</p>
            <p>
              Quando você marca um pagamento atrasado como <strong className="text-white">pago</strong>,
              ele vai para o <strong className="text-white">Histórico de Entrada</strong> com a data de hoje
              (quando o aluno realmente pagou), mas referenciando o mês original da mensalidade.
              Assim o histórico fica correto e organizado.
            </p>
          </div>
        </div>
      </Card>

      {/* Modal de confirmação */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-soft border border-gray-dark rounded-lg w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/20">
                <AlertTriangle className="text-primary" size={24} />
              </div>
              <h2 className="text-xl font-sans font-semibold text-white">
                Confirmar pagamento
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-light text-sm mb-3">
                Você tem certeza que deseja registrar o pagamento de:
              </p>
              <div className="bg-dark rounded-lg p-4 border border-gray-dark">
                <p className="text-white font-medium">{confirmItem.aluno_nome}</p>
                <p className="text-gray-light text-sm">
                  Mês de referência:{' '}
                  <span className="text-white">
                    {format(
                      new Date(
                        Number(confirmItem.due_date.slice(0, 4)),
                        Number(confirmItem.due_date.slice(5, 7)) - 1,
                        1
                      ),
                      "MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </span>
                </p>
                <p className="text-primary font-semibold mt-2">
                  {currencyFormatter.format(confirmItem.amount)}
                </p>
              </div>
              <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-gray-light">
                  <strong className="text-white">Atenção:</strong> Ao confirmar, este pagamento será
                  registrado com a data de <strong className="text-white">hoje</strong> e o aluno
                  sumirá desta lista. O registro aparecerá no Histórico de Entrada.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setConfirmItem(null)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmarPagamento}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Confirmar pagamento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
