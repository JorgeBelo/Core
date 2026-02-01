import { useState, useEffect } from 'react';
import {
  Plus,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { ContaFinanceira } from '../../types';
import type { Aluno } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  addMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { parseLocalDate } from '../../utils/dateUtils';
import { maskCurrencyBRL, unmaskCurrencyBRLToNumber } from '../../utils/masks';

type Aba = 'lancar' | 'mensalidades' | 'resumo' | 'extrato' | 'contas';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export const Financeiro = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>('lancar');
  const [mesRef, setMesRef] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [formLancar, setFormLancar] = useState({
    tipo: 'receber' as 'receber' | 'pagar',
    descricao: '',
    valor: '',
    data: format(new Date(), 'yyyy-MM-dd'),
  });
  const [salvando, setSalvando] = useState(false);

  const [filtroExtratoMes, setFiltroExtratoMes] = useState<string>('');
  const [filtroExtratoTipo, setFiltroExtratoTipo] = useState<string>('');

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [mesMensalidades, setMesMensalidades] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [recebidosMensalidades, setRecebidosMensalidades] = useState<Record<string, boolean>>({});
  const [valoresMensalidades, setValoresMensalidades] = useState<Record<string, number>>({});
  const [salvandoMensalidades, setSalvandoMensalidades] = useState(false);

  const hoje = new Date();

  useEffect(() => {
    if (user) loadContas();
  }, [user]);

  useEffect(() => {
    if (user && aba === 'mensalidades') loadAlunos();
  }, [user, aba]);

  const loadAlunos = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('personal_id', user.id)
        .order('nome');
      if (error) throw error;
      const list = (data || []) as Aluno[];
      setAlunos(list);
      const inits: Record<string, boolean> = {};
      const vals: Record<string, number> = {};
      list.forEach((a) => {
        inits[a.id] = false;
        vals[a.id] = typeof a.monthly_fee === 'number' ? a.monthly_fee : parseFloat(String(a.monthly_fee)) || 0;
      });
      setRecebidosMensalidades(inits);
      setValoresMensalidades(vals);
    } catch (e: any) {
      toast.error('Erro ao carregar alunos');
    }
  };

  const loadContas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('personal_id', user.id)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      setContas((data || []) as ContaFinanceira[]);
    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  };

  const inicioMes = startOfMonth(mesRef);
  const fimMes = endOfMonth(mesRef);
  const contasDoMes = contas.filter((c) => {
    const d = parseLocalDate(c.data_vencimento);
    return isWithinInterval(d, { start: inicioMes, end: fimMes });
  });

  const totalRecebido = contasDoMes
    .filter((c) => c.tipo === 'receber' && c.pago)
    .reduce((s, c) => s + (c.valor || 0), 0);
  const totalPago = contasDoMes
    .filter((c) => c.tipo === 'pagar' && c.pago)
    .reduce((s, c) => s + (c.valor || 0), 0);
  const saldoMes = totalRecebido - totalPago;
  const proximosVencimentos = contas
    .filter((c) => c.tipo === 'pagar' && !c.pago)
    .sort((a, b) => parseLocalDate(a.data_vencimento).getTime() - parseLocalDate(b.data_vencimento).getTime())
    .slice(0, 5);

  const contasPagarPendentes = contas.filter((c) => c.tipo === 'pagar' && !c.pago);

  const handleLancar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const valor = unmaskCurrencyBRLToNumber(formLancar.valor);
    if (valor <= 0) {
      toast.error('Informe um valor maior que zero.');
      return;
    }
    if (!formLancar.descricao.trim()) {
      toast.error('Informe a descrição.');
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase.from('contas_financeiras').insert({
        personal_id: user.id,
        descricao: formLancar.descricao.trim(),
        valor,
        data_vencimento: formLancar.data,
        categoria: formLancar.tipo === 'receber' ? 'Receita' : 'Despesa',
        tipo: formLancar.tipo,
        parcelada: false,
        conta_fixa: false,
        pago: formLancar.tipo === 'receber' ? true : false,
      });
      if (error) throw error;
      toast.success('Lançamento registrado.');
      setFormLancar({ ...formLancar, descricao: '', valor: '' });
      loadContas();
    } catch (error: any) {
      console.error('Erro ao lançar:', error);
      toast.error(error.message || 'Erro ao lançar');
    } finally {
      setSalvando(false);
    }
  };

  const marcarComoPago = async (conta: ContaFinanceira) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('contas_financeiras')
        .update({ pago: true, data_pagamento: format(new Date(), 'yyyy-MM-dd') })
        .eq('id', conta.id);
      if (error) throw error;
      toast.success('Marcado como pago.');
      loadContas();
    } catch (error: any) {
      toast.error('Erro ao atualizar.');
    }
  };

  const gerarMensalidadesEmLote = async () => {
    if (!user) return;
    const [y, m] = mesMensalidades.split('-').map(Number);
    const mesLabel = format(new Date(y, m - 1, 1), 'MMMM/yyyy', { locale: ptBR });
    const primeiroDia = `${mesMensalidades}-01`;
    const marcados = alunos.filter((a) => recebidosMensalidades[a.id]);
    if (marcados.length === 0) {
      toast.error('Marque pelo menos um aluno que pagou.');
      return;
    }
    setSalvandoMensalidades(true);
    try {
      const rows = marcados.map((a) => {
        const nome = a.nome || a.name || 'Aluno';
        const valor = valoresMensalidades[a.id] ?? a.monthly_fee ?? 0;
        return {
          personal_id: user.id,
          descricao: `Mensalidade de ${nome} - ${mesLabel}`,
          valor,
          data_vencimento: primeiroDia,
          categoria: 'Mensalidade',
          tipo: 'receber' as const,
          parcelada: false,
          conta_fixa: false,
          pago: true,
        };
      });
      const { error } = await supabase.from('contas_financeiras').insert(rows);
      if (error) throw error;
      toast.success(`${marcados.length} mensalidade(s) de ${mesLabel} registrada(s).`);
      setRecebidosMensalidades((prev) => {
        const next = { ...prev };
        marcados.forEach((a) => { next[a.id] = false; });
        return next;
      });
      loadContas();
    } catch (error: any) {
      console.error('Erro ao gerar mensalidades:', error);
      toast.error(error.message || 'Erro ao gerar lançamentos');
    } finally {
      setSalvandoMensalidades(false);
    }
  };

  const excluirLancamento = async (conta: ContaFinanceira) => {
    if (!confirm(`Excluir o lançamento "${conta.descricao}"?`)) return;
    try {
      const { error } = await supabase.from('contas_financeiras').delete().eq('id', conta.id);
      if (error) throw error;
      toast.success('Lançamento excluído.');
      loadContas();
    } catch (error: any) {
      toast.error('Erro ao excluir.');
    }
  };

  const extratoFiltrado = (() => {
    let list = [...contas];
    if (filtroExtratoMes) list = list.filter((c) => c.data_vencimento.startsWith(filtroExtratoMes));
    if (filtroExtratoTipo) list = list.filter((c) => c.tipo === filtroExtratoTipo);
    return list;
  })();

  const abas: { id: Aba; label: string; icon: React.ReactNode }[] = [
    { id: 'lancar', label: 'Lançar', icon: <Plus size={18} /> },
    { id: 'mensalidades', label: 'Mensalidades do mês', icon: <Users size={18} /> },
    { id: 'resumo', label: 'Resumo do mês', icon: <DollarSign size={18} /> },
    { id: 'extrato', label: 'Extrato', icon: <FileText size={18} /> },
    { id: 'contas', label: 'Contas a pagar', icon: <Clock size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-white mb-2">Financeiro</h1>
        <p className="text-gray-light text-sm sm:text-base">
          Um único livro de lançamentos: você lança, o sistema grava. Resumo e extrato são visões sobre os mesmos dados.
        </p>
      </div>

      {/* Abas */}
      <Card className="p-0 overflow-hidden">
        <div className="flex border-b border-gray-dark overflow-x-auto">
          {abas.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAba(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                aba === tab.id
                  ? 'bg-primary text-white border-b-2 border-primary'
                  : 'text-gray-light hover:bg-dark-soft hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {loading && aba !== 'lancar' && aba !== 'mensalidades' ? (
        <div className="text-center py-12 text-gray-light">Carregando...</div>
      ) : (
        <>
          {/* Aba: Lançar */}
          {aba === 'lancar' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Novo lançamento</h2>
              <form onSubmit={handleLancar} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tipo *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={formLancar.tipo === 'receber'}
                        onChange={() => setFormLancar({ ...formLancar, tipo: 'receber' })}
                        className="text-primary"
                      />
                      <span className="text-white">Receita</span>
                      <ArrowDownToLine size={18} className="text-green-500" />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={formLancar.tipo === 'pagar'}
                        onChange={() => setFormLancar({ ...formLancar, tipo: 'pagar' })}
                        className="text-primary"
                      />
                      <span className="text-white">Despesa</span>
                      <ArrowUpFromLine size={18} className="text-primary" />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Descrição *</label>
                  <input
                    type="text"
                    required
                    value={formLancar.descricao}
                    onChange={(e) => setFormLancar({ ...formLancar, descricao: e.target.value })}
                    className="input-core w-full"
                    placeholder="Ex: Mensalidade – João – Jan/2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Valor *</label>
                  <input
                    type="text"
                    required
                    value={formLancar.valor}
                    onChange={(e) => setFormLancar({ ...formLancar, valor: maskCurrencyBRL(e.target.value) })}
                    className="input-core w-full"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data *</label>
                  <input
                    type="date"
                    required
                    value={formLancar.data}
                    onChange={(e) => setFormLancar({ ...formLancar, data: e.target.value })}
                    className="input-core w-full"
                  />
                </div>
                <Button type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Lançar'}
                </Button>
              </form>
            </Card>
          )}

          {/* Aba: Mensalidades do mês (em lote) */}
          {aba === 'mensalidades' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-2">Mensalidades do mês (em lote)</h2>
              <p className="text-gray-light text-sm mb-4">
                Selecione o mês e marque quem já pagou. Ao clicar em &quot;Gerar lançamentos&quot;, um registro é criado para cada aluno marcado (nome e valor ficam salvos). Gere apenas uma vez por mês para evitar duplicatas.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <label className="flex items-center gap-2">
                  <span className="text-gray-light text-sm">Mês de referência:</span>
                  <input
                    type="month"
                    value={mesMensalidades}
                    onChange={(e) => setMesMensalidades(e.target.value)}
                    className="input-core w-auto"
                  />
                </label>
                <Button onClick={gerarMensalidadesEmLote} disabled={salvandoMensalidades}>
                  {salvandoMensalidades ? 'Gerando...' : 'Gerar lançamentos'}
                </Button>
                <span className="text-gray-light text-sm">
                  {alunos.filter((a) => recebidosMensalidades[a.id]).length} marcado(s)
                </span>
              </div>
              {alunos.length === 0 ? (
                <p className="text-gray-light py-6">Nenhum aluno cadastrado. Cadastre alunos em Alunos.</p>
              ) : (
                <ul className="divide-y divide-gray-dark">
                  {alunos.map((a) => {
                    const nome = a.nome || a.name || 'Aluno';
                    const valor = valoresMensalidades[a.id] ?? (typeof a.monthly_fee === 'number' ? a.monthly_fee : parseFloat(String(a.monthly_fee)) || 0);
                    return (
                      <li key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!recebidosMensalidades[a.id]}
                            onChange={(e) => setRecebidosMensalidades((prev) => ({ ...prev, [a.id]: e.target.checked }))}
                            className="rounded border-gray-dark text-primary focus:ring-primary w-5 h-5"
                          />
                          <span className="text-white font-medium truncate">{nome}</span>
                        </label>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValoresMensalidades((prev) => ({ ...prev, [a.id]: parseFloat(e.target.value) || 0 }))}
                            className="input-core w-28 text-right"
                          />
                          <span className="text-gray-light text-sm">R$</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          )}

          {/* Aba: Resumo do mês */}
          {aba === 'resumo' && (
            <>
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMesRef((d) => subMonths(d, 1))}
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-dark text-gray-light hover:bg-dark-soft hover:text-white flex items-center justify-center"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <span className="text-white font-semibold min-w-[160px] text-center">
                    {format(mesRef, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMesRef((d) => addMonths(d, 1))}
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-dark text-gray-light hover:bg-dark-soft hover:text-white flex items-center justify-center"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMesRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}
                  className="text-primary hover:text-primary-light text-sm font-medium min-h-[44px] px-3"
                >
                  Mês atual
                </button>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/30">
                  <p className="text-gray-light text-sm mb-1">Total recebido</p>
                  <p className="text-2xl font-bold text-green-500">{currencyFormatter.format(totalRecebido)}</p>
                </Card>
                <Card className="bg-primary/10 border-primary/30">
                  <p className="text-gray-light text-sm mb-1">Total pago</p>
                  <p className="text-2xl font-bold text-primary">{currencyFormatter.format(totalPago)}</p>
                </Card>
                <Card className={saldoMes >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-primary/10 border-primary/30'}>
                  <p className="text-gray-light text-sm mb-1">Saldo do mês</p>
                  <p className={`text-2xl font-bold ${saldoMes >= 0 ? 'text-green-500' : 'text-primary'}`}>
                    {currencyFormatter.format(saldoMes)}
                  </p>
                </Card>
              </div>

              {proximosVencimentos.length > 0 && (
                <Card title="Próximos vencimentos">
                  <ul className="space-y-2">
                    {proximosVencimentos.map((c) => (
                      <li
                        key={c.id}
                        className="flex justify-between items-center py-2 border-b border-gray-dark last:border-0"
                      >
                        <span className="text-white">{c.descricao}</span>
                        <span className="text-gray-light text-sm">
                          {format(parseLocalDate(c.data_vencimento), "d 'de' MMM", { locale: ptBR })} —{' '}
                          {currencyFormatter.format(c.valor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}

          {/* Aba: Extrato */}
          {aba === 'extrato' && (
            <Card>
              <div className="flex flex-wrap gap-4 mb-4">
                <select
                  value={filtroExtratoMes}
                  onChange={(e) => setFiltroExtratoMes(e.target.value)}
                  className="input-core w-auto min-w-[140px]"
                >
                  <option value="">Todos os meses</option>
                  {Array.from(new Set(contas.map((c) => c.data_vencimento.slice(0, 7)))).sort().reverse().map((ym) => {
                    const [y, m] = ym.split('-').map(Number);
                    return (
                      <option key={ym} value={ym}>
                        {format(new Date(y, m - 1, 1), 'MMMM/yyyy', { locale: ptBR })}
                      </option>
                    );
                  })}
                </select>
                <select
                  value={filtroExtratoTipo}
                  onChange={(e) => setFiltroExtratoTipo(e.target.value)}
                  className="input-core w-auto min-w-[120px]"
                >
                  <option value="">Todos</option>
                  <option value="receber">Receitas</option>
                  <option value="pagar">Despesas</option>
                </select>
              </div>
              {extratoFiltrado.length === 0 ? (
                <p className="text-gray-light py-8 text-center">Nenhum lançamento encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-dark">
                        <th className="text-left py-3 px-4 text-gray-light font-medium">Data</th>
                        <th className="text-left py-3 px-4 text-gray-light font-medium">Tipo</th>
                        <th className="text-left py-3 px-4 text-gray-light font-medium">Descrição</th>
                        <th className="text-left py-3 px-4 text-gray-light font-medium">Valor</th>
                        <th className="text-left py-3 px-4 text-gray-light font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-light font-medium w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {extratoFiltrado.map((c) => (
                        <tr key={c.id} className="border-b border-gray-dark hover:bg-dark-soft/50">
                          <td className="py-3 px-4 text-gray-light text-sm">
                            {format(parseLocalDate(c.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={c.tipo === 'receber' ? 'text-green-500' : 'text-primary'}>
                              {c.tipo === 'receber' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">{c.descricao}</td>
                          <td className="py-3 px-4 font-semibold">
                            {c.tipo === 'receber' ? (
                              <span className="text-green-500">+{currencyFormatter.format(c.valor)}</span>
                            ) : (
                              <span className="text-primary">−{currencyFormatter.format(c.valor)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {c.tipo === 'pagar' ? (
                              c.pago ? (
                                <span className="text-green-500 text-sm">Pago</span>
                              ) : (
                                <span className="text-primary text-sm">Pendente</span>
                              )
                            ) : (
                              <span className="text-gray-light text-sm">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => excluirLancamento(c)}
                              className="text-gray-light hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Aba: Contas a pagar */}
          {aba === 'contas' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Despesas pendentes</h2>
              {contasPagarPendentes.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto text-green-500 mb-2" size={40} />
                  <p className="text-gray-light">Nenhuma conta a pagar no momento.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-dark">
                  {contasPagarPendentes.map((c) => (
                    <li key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-medium">{c.descricao}</p>
                        <p className="text-gray-light text-sm">
                          Vencimento: {format(parseLocalDate(c.data_vencimento), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-semibold">{currencyFormatter.format(c.valor)}</span>
                        <Button onClick={() => marcarComoPago(c)} className="min-h-[44px]">
                          Marcar como pago
                        </Button>
                        <button
                          type="button"
                          onClick={() => excluirLancamento(c)}
                          className="text-gray-light hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
