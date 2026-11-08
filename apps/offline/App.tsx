import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { randomUUID } from 'expo-crypto';
import {
  CoreState,
  Student,
  Bill,
  Reminder,
  Session,
  saveSession,
  backupText,
  currentMonth,
  day,
  displayDay,
  emptyState,
  localDay,
  money,
  monthLabel,
  parseBackup,
  reconcile,
  saveStudent,
  shiftMonth,
  status,
  totals,
  whatsappMessage,
  whatsappUrl,
} from './src/domain';
import { loadState, persistState, loadRecovery, restoreState } from './src/storage';
import { exportReport, exportText, importText } from './src/files';
import {
  Badge,
  Busy,
  Button,
  Card,
  Empty,
  Field,
  Heading,
  Icon,
  IconName,
  Txt,
  colors,
  styles as ui,
} from './src/ui';
import { finishMoneyInput, moneyInput, phoneInput } from '../../packages/ui/src/input-masks';

type Tab = 'Início' | 'Agenda' | 'Alunos' | 'Financeiro' | 'Ajustes' | 'Relatórios';
type Editor =
  | { kind: 'student'; student?: Student }
  | { kind: 'profile' }
  | { kind: 'reminder' }
  | { kind: 'session' }
  | null;
type Confirm = { title: string; detail: string; action: () => Promise<void> } | null;
const errorText = (e: unknown) =>
  e instanceof Error
    ? e.name === 'ZodError'
      ? 'Confira os dados: nome, telefone com DDD, valor, frequência e datas válidas.'
      : e.message
    : 'Não foi possível concluir a operação.';

export default function App() {
  return (
    <SafeAreaProvider>
      <CoreApp />
    </SafeAreaProvider>
  );
}
function CoreApp() {
  const [state, setState] = useState<CoreState | null>(null);
  const current = useRef<CoreState | null>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<Tab>('Início');
  const [selectedMonth, setMonth] = useState(currentMonth());
  const [today, setToday] = useState(localDay());
  const [editor, setEditor] = useState<Editor>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [showArchived, setShowArchived] = useState(false);
  const [agendaDate, setAgendaDate] = useState(localDay());
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const install = (s: CoreState) => {
    current.current = s;
    setState(s);
  };
  async function commit(change: (s: CoreState) => CoreState) {
    if (lock.current || !current.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      const next = change(reconcile(current.current));
      await persistState(next);
      install(next);
      return true;
    } catch (e) {
      setNotice(errorText(e));
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function run(action: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    void (async () => {
      try {
        const s = reconcile((await loadState()) ?? emptyState());
        await persistState(s);
        install(s);
      } catch {
        setFatal(
          'Não foi possível ler os dados locais. Eles foram preservados. Feche e reabra o app; se o erro continuar, mantenha os dados do aplicativo e solicite ajuda.',
        );
      }
    })();
    const refresh = () => {
      setToday(localDay());
      if (current.current && reconcile(current.current) !== current.current) void commit((s) => s);
    };
    const sub = AppState.addEventListener('change', (value) => {
      if (value === 'active') refresh();
    });
    const interval = setInterval(refresh, 60000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  if (!state)
    return (
      <SafeAreaView style={s.root}>
        <View style={{ padding: 30, gap: 18 }}>
          <Txt style={{ fontSize: 28, fontWeight: '700' }}>Core</Txt>
          {fatal ? <Txt>{fatal}</Txt> : <ActivityIndicator color={colors.accent} />}
        </View>
      </SafeAreaView>
    );
  const active = state.students.filter((st) => !st.archivedOn);
  const bills = state.bills.filter((b) => b.month === selectedMonth);
  const thisMonth = state.bills.filter((b) => b.month === currentMonth());
  const summary = totals(bills, today);
  const homeTotals = totals(thisMonth, today);
  const overdue = state.bills.filter((b) => !b.paidOn && b.dueDate < today);
  const student = state.students.find((st) => st.id === detailId);
  const nameOf = (b: Bill) => state.students.find((st) => st.id === b.studentId)!.name;
  const pendingReminders = state.reminders
    .filter((r) => !r.done)
    .sort((a, b) => a.date.localeCompare(b.date));
  const birthdays = active.filter((st) => st.birthDate.slice(5) === today.slice(5));
  function navigate(t: Tab) {
    setTab(t);
    setSearch('');
    setDetailId(null);
  }
  const message = (st: Student, b: Bill) => {
    void run(() => Linking.openURL(whatsappUrl(st, whatsappMessage(st, b, today))));
  };
  const payment = (b: Bill) => {
    setDetailId(null);
    setConfirm({
      title: b.paidOn ? 'Desfazer pagamento?' : 'Registrar pagamento?',
      detail: `${nameOf(b)} · ${monthLabel(b.month)} · ${money(b.amountCents)}. ${b.paidOn ? 'A mensalidade voltará a ficar em aberto.' : 'O valor integral será marcado como recebido hoje. Este registro é manual.'}`,
      action: async () => {
        const ok = await commit((s) => ({
          ...s,
          bills: s.bills.map((row) =>
            row.id === b.id ? { ...row, paidOn: b.paidOn ? null : localDay() } : row,
          ),
        }));
        if (ok) setConfirm(null);
      },
    });
  };
  async function restore() {
    const text = await importText();
    if (text === null) return;
    const candidate = reconcile(parseBackup(text));
    setConfirm({
      title: 'Restaurar este backup?',
      detail: `Contém ${candidate.students.length} aluno(s) e ${candidate.bills.length} mensalidade(s). Substitui os dados deste aparelho. Uma cópia do estado anterior ficará disponível em Ajustes.`,
      action: async () => {
        await run(async () => {
          await restoreState(candidate);
          install(candidate);
          setConfirm(null);
          setDetailId(null);
          setMonth(currentMonth());
          setNotice('Backup restaurado neste aparelho.');
        });
      },
    });
  }
  function report() {
    const esc = (x: string) =>
      x.replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
      );
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>CORE — Relatório</title><style>body{font:14px Arial;color:#222;margin:40px}h1{color:#a20100}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px 6px;border-bottom:1px solid #ddd}small{color:#666}tr{break-inside:avoid}</style><h1>Core</h1><h2>Mensalidades — ${esc(monthLabel(selectedMonth))}</h2><p>${esc(state!.profile.name || 'Personal Trainer')} ${state!.profile.cref ? '· CREF ' + esc(state!.profile.cref) : ''}</p><p>Previsto: ${money(summary.expected)} · Recebido: ${money(summary.received)} · Em aberto: ${money(summary.pending)}</p><table><thead><tr><th>Aluno</th><th>Valor</th><th>Vencimento</th><th>Situação</th><th>Pagamento</th></tr></thead><tbody>${bills.map((b) => `<tr><td>${esc(nameOf(b))}</td><td>${money(b.amountCents)}</td><td>${displayDay(b.dueDate)}</td><td>${status(b, today)}</td><td>${b.paidOn ? displayDay(b.paidOn) : '—'}</td></tr>`).join('')}</tbody></table><p><small>Gerado em ${displayDay(today)}. Resumo por mês da mensalidade, com pagamentos registrados manualmente. Não é comprovante bancário.</small></p></html>`;
    void run(() => exportReport(html));
  }
  const monthPicker = (
    <View style={[ui.row, { justifyContent: 'flex-start' }]}>
      <Button
        title="Mês anterior"
        iconOnly
        icon="chevron-back"
        secondary
        onPress={() => setMonth(shiftMonth(selectedMonth, -1))}
      />
      <Txt style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize', fontWeight: '700' }}>
        {monthLabel(selectedMonth)}
      </Txt>
      <Button
        title="Próximo mês"
        iconOnly
        icon="chevron-forward"
        secondary
        disabled={selectedMonth >= currentMonth()}
        onPress={() => setMonth(shiftMonth(selectedMonth, 1))}
      />
    </View>
  );
  const stats = (values: ReturnType<typeof totals>) => (
    <View style={s.stats}>
      {[
        ['Previsto no mês', values.expected, colors.text],
        ['Recebido', values.received, colors.green],
        ['Em aberto', values.pending, colors.amber],
        ['Em atraso', values.overdue, colors.accent],
      ].map(([label, value, color]) => (
        <Card
          key={label}
          style={{ flexBasis: wide ? '23%' : '47%', flexGrow: 1, padding: 17, gap: 10 }}
        >
          <Txt muted style={{ fontSize: 12 }}>
            {label}
          </Txt>
          <Txt style={{ fontSize: wide ? 25 : 22, fontWeight: '700', letterSpacing: -0.7, color }}>
            {money(Number(value))}
          </Txt>
        </Card>
      ))}
    </View>
  );
  const billCard = (b: Bill, showName = true) => {
    const st = state.students.find((st) => st.id === b.studentId)!;
    const label = status(b, today);
    return (
      <Card key={b.id}>
        <View style={ui.row}>
          <View style={{ flex: 1, gap: 7 }}>
            <Txt style={{ fontWeight: '700', fontSize: 16 }}>
              {showName ? st.name : monthLabel(b.month)}
            </Txt>
            <Txt muted style={{ fontSize: 12 }}>
              Vencimento {displayDay(b.dueDate)}
              {b.paidOn ? ` · Pago em ${displayDay(b.paidOn)}` : ''}
            </Txt>
          </View>
          <Txt style={{ fontSize: 19, fontWeight: '700' }}>{money(b.amountCents)}</Txt>
        </View>
        <Badge
          label={label}
          tone={b.paidOn ? 'green' : label === 'Em atraso' ? 'accent' : 'amber'}
        />
        <View style={s.wrap}>
          <Button
            title={b.paidOn ? 'Desfazer pagamento' : 'Registrar pagamento'}
            icon={b.paidOn ? 'arrow-undo-outline' : 'checkmark-outline'}
            secondary={!!b.paidOn}
            onPress={() => payment(b)}
          />
          {!b.paidOn && (
            <Button
              title="Lembrar no WhatsApp"
              icon="logo-whatsapp"
              secondary
              onPress={() => message(st, b)}
            />
          )}
        </View>
      </Card>
    );
  };
  const navItems: [Tab, IconName][] = [
    ['Início', 'grid-outline'],
    ['Alunos', 'people-outline'],
    ['Agenda', 'calendar-outline'],
    ['Financeiro', 'wallet-outline'],
    ['Ajustes', 'settings-outline'],
  ];
  return (
    <Busy.Provider value={busy}>
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <View style={s.top}>
          <View style={ui.row}>
            <Image
              source={require('./assets/icon.png')}
              style={{ width: 50, height: 50, borderRadius: 12 }}
            />
            <View>
              <Txt style={{ fontSize: 24, fontWeight: '800', letterSpacing: -1 }}>Core</Txt>
              {wide && (
                <Txt muted style={{ fontSize: 10 }}>
                  GESTÃO PARA PERSONAL TRAINERS
                </Txt>
              )}
            </View>
          </View>
          <Badge label={busy ? 'Salvando…' : 'Salvo no aparelho'} tone="green" />
        </View>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {wide && (
            <View style={s.sidebar}>
              {navItems.map(([title, icon]) => (
                <Nav
                  key={title}
                  title={title}
                  icon={icon}
                  active={tab === title}
                  onPress={() => navigate(title)}
                />
              ))}
              <Nav
                title="Relatórios"
                icon="document-text-outline"
                active={tab === 'Relatórios'}
                onPress={() => navigate('Relatórios')}
              />
              <View style={{ flex: 1 }} />
              <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
                Seu controle diário, disponível mesmo sem internet.
              </Txt>
            </View>
          )}
          <ScrollView
            key={tab}
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: wide ? 36 : 20,
              paddingBottom: 32,
              gap: 22,
              maxWidth: 1150,
              width: '100%',
              alignSelf: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            {notice !== '' && (
              <Pressable
                onPress={() => setNotice('')}
                accessibilityRole="button"
                accessibilityLabel="Fechar aviso"
              >
                <Card style={{ borderColor: colors.accent }}>
                  <Txt>{notice}</Txt>
                </Card>
              </Pressable>
            )}
            {tab === 'Início' && (
              <>
                <Heading
                  title={
                    state.profile.name
                      ? `Olá, ${state.profile.name.split(' ')[0]}.`
                      : 'Seu dia no Core'
                  }
                  subtitle={new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  action={
                    <Button
                      title="Novo aluno"
                      icon="add"
                      onPress={() => setEditor({ kind: 'student' })}
                    />
                  }
                />
                <View style={ui.row}>
                  <Txt style={s.section}>Resumo de {monthLabel(currentMonth())}</Txt>
                  <Badge
                    label={`${active.length} aluno${active.length === 1 ? '' : 's'} ativo${active.length === 1 ? '' : 's'}`}
                  />
                </View>
                {stats(homeTotals)}
                <Card style={{ borderLeftColor: colors.red, borderLeftWidth: 4 }}>
                  <View style={ui.row}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Txt style={{ fontSize: 19, fontWeight: '700' }}>
                        O que precisa de atenção
                      </Txt>
                      <Txt muted style={{ lineHeight: 22 }}>
                        {overdue.length
                          ? `${overdue.length} mensalidade(s) em atraso, somando ${money(totals(overdue, today).pending)} em todos os meses.`
                          : 'Nenhuma mensalidade em atraso.'}
                      </Txt>
                    </View>
                    <Icon name="notifications-outline" color={colors.accent} size={28} />
                  </View>
                  <Button title="Ver financeiro" secondary onPress={() => navigate('Financeiro')} />
                </Card>
                {!state.students.length && (
                  <Empty
                    title="Comece pelo primeiro aluno"
                    detail="Cadastre os dados e o valor combinado. O Core organiza a mensalidade e o vencimento para você."
                  >
                    <Button
                      title="Cadastrar primeiro aluno"
                      icon="person-add-outline"
                      onPress={() => setEditor({ kind: 'student' })}
                    />
                  </Empty>
                )}
                {birthdays.map((st) => (
                  <Card key={st.id}>
                    <Txt>Hoje é aniversário de {st.name} 🎉</Txt>
                    <Button
                      title="Parabenizar no WhatsApp"
                      secondary
                      icon="logo-whatsapp"
                      onPress={() => {
                        void run(() =>
                          Linking.openURL(
                            whatsappUrl(
                              st,
                              `Olá, ${st.name}! Feliz aniversário! Desejo muita saúde, felicidade e conquistas. Um ótimo dia para você!`,
                            ),
                          ),
                        );
                      }}
                    />
                  </Card>
                ))}
                <View style={ui.row}>
                  <Txt style={s.section}>Lembretes</Txt>
                  <Button
                    title="Novo lembrete"
                    icon="add"
                    secondary
                    onPress={() => setEditor({ kind: 'reminder' })}
                  />
                </View>
                {pendingReminders.length ? (
                  pendingReminders.map((r) => (
                    <Card key={r.id}>
                      <View style={ui.row}>
                        <View style={{ flex: 1, gap: 6 }}>
                          <Txt style={{ fontWeight: '600' }}>{r.title}</Txt>
                          <Txt muted style={{ fontSize: 12 }}>
                            {displayDay(r.date)}
                            {r.date < today ? ' · Pendente' : ''}
                          </Txt>
                        </View>
                        <Button
                          title="Concluir"
                          secondary
                          icon="checkmark"
                          onPress={() => {
                            void commit((s) => ({
                              ...s,
                              reminders: s.reminders.map((x) =>
                                x.id === r.id ? { ...x, done: true } : x,
                              ),
                            }));
                          }}
                        />
                      </View>
                    </Card>
                  ))
                ) : (
                  <Txt muted>Nenhum lembrete pendente. Os lembretes aparecem aqui no app.</Txt>
                )}
                <Button
                  title="Abrir agenda"
                  secondary
                  icon="calendar-outline"
                  onPress={() => navigate('Agenda')}
                />
                <Button
                  title="Ver relatórios"
                  secondary
                  icon="document-text-outline"
                  onPress={() => navigate('Relatórios')}
                />
              </>
            )}
            {tab === 'Alunos' && (
              <>
                <Heading
                  title="Alunos"
                  subtitle="Dados e mensalidades sempre à mão."
                  action={
                    <Button
                      title="Novo aluno"
                      icon="add"
                      onPress={() => setEditor({ kind: 'student' })}
                    />
                  }
                />
                <Field
                  label="Buscar aluno"
                  value={search}
                  onChange={setSearch}
                  placeholder="Nome ou telefone"
                />
                <View style={s.wrap}>
                  <Button
                    title="Ativos"
                    secondary={showArchived}
                    onPress={() => setShowArchived(false)}
                  />
                  <Button
                    title="Arquivados"
                    secondary={!showArchived}
                    onPress={() => setShowArchived(true)}
                  />
                </View>
                {state.students
                  .filter(
                    (st) =>
                      !!st.archivedOn === showArchived &&
                      (st.name
                        .toLocaleLowerCase('pt-BR')
                        .includes(search.toLocaleLowerCase('pt-BR')) ||
                        (search.replace(/\D/g, '') &&
                          st.phone.includes(search.replace(/\D/g, '')))),
                  )
                  .map((st) => (
                    <Pressable
                      key={st.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir aluno ${st.name}`}
                      onPress={() => setDetailId(st.id)}
                    >
                      <Card>
                        <View style={ui.row}>
                          <View style={s.avatar}>
                            <Txt style={{ color: colors.accent, fontSize: 19, fontWeight: '700' }}>
                              {st.name
                                .split(' ')
                                .slice(0, 2)
                                .map((x) => x[0])
                                .join('')}
                            </Txt>
                          </View>
                          <View style={{ flex: 1, gap: 6 }}>
                            <Txt style={{ fontWeight: '700', fontSize: 17 }}>{st.name}</Txt>
                            <Txt muted style={{ fontSize: 13 }}>
                              {st.frequency}x por semana · vence dia {st.dueDay}
                            </Txt>
                            <Txt style={{ color: colors.green }}>{money(st.feeCents)}/mês</Txt>
                          </View>
                          <Icon name="chevron-forward" color={colors.muted} />
                        </View>
                      </Card>
                    </Pressable>
                  ))}
                {!state.students.some((st) => !!st.archivedOn === showArchived) && (
                  <Empty
                    title={showArchived ? 'Nenhum aluno arquivado' : 'Sua lista começa aqui'}
                    detail={
                      showArchived
                        ? 'Alunos arquivados mantêm o histórico financeiro.'
                        : 'Adicione um aluno para começar a organizar suas mensalidades.'
                    }
                  />
                )}
              </>
            )}
            {tab === 'Agenda' && (
              <>
                <Heading
                  title="Agenda"
                  subtitle="Seus atendimentos, um horário de cada vez."
                  action={
                    <Button
                      title="Novo horário"
                      icon="add"
                      disabled={!active.length}
                      onPress={() => setEditor({ kind: 'session' })}
                    />
                  }
                />
                <View style={ui.row}>
                  <Button
                    title="Semana anterior"
                    iconOnly
                    icon="chevron-back"
                    secondary
                    onPress={() => {
                      const d = new Date(agendaDate + 'T12:00:00');
                      d.setDate(d.getDate() - 7);
                      setAgendaDate(localDay(d));
                    }}
                  />
                  <Txt style={{ fontWeight: '700' }}>
                    {new Date(agendaDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Txt>
                  <Button
                    title="Próxima semana"
                    iconOnly
                    icon="chevron-forward"
                    secondary
                    onPress={() => {
                      const d = new Date(agendaDate + 'T12:00:00');
                      d.setDate(d.getDate() + 7);
                      setAgendaDate(localDay(d));
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(agendaDate + 'T12:00:00');
                    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i);
                    const iso = localDay(d);
                    return (
                      <Pressable
                        key={iso}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver dia ${displayDay(iso)}`}
                        onPress={() => setAgendaDate(iso)}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          gap: 7,
                          paddingVertical: 13,
                          borderRadius: 12,
                          backgroundColor: iso === agendaDate ? colors.red : colors.panel,
                        }}
                      >
                        <Txt muted style={{ fontSize: 10 }}>
                          {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d.getDay()]}
                        </Txt>
                        <Txt style={{ fontWeight: '700', fontSize: 18 }}>{d.getDate()}</Txt>
                      </Pressable>
                    );
                  })}
                </View>
                <Txt style={s.section}>Atendimentos em {displayDay(agendaDate)}</Txt>
                {state.sessions
                  .filter((row) => row.date === agendaDate)
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .map((row) => (
                    <Card key={row.id}>
                      <View style={ui.row}>
                        <View style={{ flex: 1, gap: 7 }}>
                          <Txt style={{ fontWeight: '700', fontSize: 17 }}>
                            {state.students.find((st) => st.id === row.studentId)!.name}
                          </Txt>
                          <Txt muted>
                            {row.start} – {row.end}
                          </Txt>
                        </View>
                        <Badge
                          label={
                            row.status === 'scheduled'
                              ? 'Agendado'
                              : row.status === 'done'
                                ? 'Concluído'
                                : 'Cancelado'
                          }
                          tone={row.status === 'done' ? 'green' : 'muted'}
                        />
                      </View>
                      {row.notes !== '' && <Txt muted>{row.notes}</Txt>}
                      {row.status === 'scheduled' && (
                        <View style={s.wrap}>
                          <Button
                            title="Concluir atendimento"
                            secondary
                            icon="checkmark"
                            onPress={() => {
                              void commit((s) => ({
                                ...s,
                                sessions: s.sessions.map((x) =>
                                  x.id === row.id ? { ...x, status: 'done' } : x,
                                ),
                              }));
                            }}
                          />
                          <Button
                            title="Cancelar horário"
                            secondary
                            onPress={() =>
                              setConfirm({
                                title: 'Cancelar este horário?',
                                detail:
                                  'O atendimento permanecerá no histórico como cancelado, liberando o horário na agenda. A mensalidade não será alterada.',
                                action: async () => {
                                  if (
                                    await commit((s) => ({
                                      ...s,
                                      sessions: s.sessions.map((x) =>
                                        x.id === row.id ? { ...x, status: 'canceled' } : x,
                                      ),
                                    }))
                                  )
                                    setConfirm(null);
                                },
                              })
                            }
                          />
                        </View>
                      )}
                    </Card>
                  ))}
                {!state.sessions.some((row) => row.date === agendaDate) && (
                  <Empty
                    title="Dia livre por aqui"
                    detail={
                      active.length
                        ? 'Adicione um horário para organizar o atendimento de um aluno.'
                        : 'Cadastre um aluno antes de agendar o primeiro atendimento.'
                    }
                  />
                )}
                <Button
                  title="Voltar para hoje"
                  secondary
                  onPress={() => setAgendaDate(localDay())}
                />
              </>
            )}
            {tab === 'Financeiro' && (
              <>
                <Heading
                  title="Financeiro"
                  subtitle="Mensalidades organizadas pelo mês de referência."
                />
                {monthPicker}
                {stats(summary)}
                <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
                  Em aberto inclui valores a vencer e em atraso deste mês. O pagamento é registrado
                  por você, sem consulta ao banco.
                </Txt>
                <View style={s.wrap}>
                  {['Todas', 'Em aberto', 'Em atraso', 'Pagas'].map((f) => (
                    <Button
                      key={f}
                      title={f}
                      secondary={filter !== f}
                      onPress={() => setFilter(f)}
                    />
                  ))}
                </View>
                {bills
                  .filter(
                    (b) =>
                      filter === 'Todas' ||
                      (filter === 'Pagas'
                        ? !!b.paidOn
                        : filter === 'Em aberto'
                          ? !b.paidOn
                          : !b.paidOn && b.dueDate < today),
                  )
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .map((b) => billCard(b))}
                {!bills.length && (
                  <Empty
                    title="Sem mensalidades neste mês"
                    detail="As mensalidades começam no mês em que você cadastra o aluno. Cada mês mantém seu próprio histórico."
                  />
                )}
                {!!overdue.filter((b) => b.month !== selectedMonth).length && (
                  <Card>
                    <Txt style={{ color: colors.amber }}>
                      Há {overdue.filter((b) => b.month !== selectedMonth).length} mensalidade(s)
                      atrasada(s) em outros meses.
                    </Txt>
                    <Txt muted>
                      Abra o aluno para consultar todo o histórico ou use o seletor de mês.
                    </Txt>
                  </Card>
                )}
              </>
            )}
            {tab === 'Relatórios' && (
              <>
                <Heading title="Relatórios" subtitle="Uma visão simples do seu trabalho." />
                {monthPicker}
                {stats(summary)}
                <Card>
                  <Txt style={s.section}>Seus alunos hoje</Txt>
                  <View style={ui.row}>
                    <Txt muted>Alunos ativos</Txt>
                    <Txt>{active.length}</Txt>
                  </View>
                  <View style={ui.row}>
                    <Txt muted>Atendimentos contratados / semana</Txt>
                    <Txt>{active.reduce((n, st) => n + st.frequency, 0)}</Txt>
                  </View>
                  <Txt muted style={{ fontSize: 12 }}>
                    A frequência indica o combinado, sem controle de presença.
                  </Txt>
                  {Array.from(new Set(active.map((st) => st.frequency)))
                    .sort()
                    .map((f) => (
                      <View key={f} style={ui.row}>
                        <Txt>{f}x por semana</Txt>
                        <Txt>{active.filter((st) => st.frequency === f).length} aluno(s)</Txt>
                      </View>
                    ))}
                </Card>
                <Button title="Gerar relatório PDF" icon="document-text-outline" onPress={report} />
                <Txt muted style={{ fontSize: 12 }}>
                  No navegador, escolha “Salvar como PDF” na janela de impressão.
                </Txt>
              </>
            )}
            {tab === 'Ajustes' && (
              <>
                <Heading title="Ajustes" subtitle="Seu perfil e a segurança dos seus dados." />
                <Card>
                  <View style={ui.row}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Txt style={s.section}>{state.profile.name || 'Seu perfil profissional'}</Txt>
                      <Txt muted>
                        {state.profile.cref ? `CREF ${state.profile.cref}` : 'Personal Trainer'}
                      </Txt>
                    </View>
                    <Button
                      title="Editar perfil"
                      secondary
                      icon="create-outline"
                      onPress={() => setEditor({ kind: 'profile' })}
                    />
                  </View>
                </Card>
                <Card>
                  <Icon name="shield-checkmark-outline" color={colors.green} size={28} />
                  <Txt style={s.section}>Backup dos seus dados</Txt>
                  <Txt muted style={{ lineHeight: 23 }}>
                    Os dados ficam neste aparelho. Exporte uma cópia e guarde fora dele para
                    conseguir restaurar se trocar ou perder o celular. O arquivo contém dados
                    pessoais dos alunos.
                  </Txt>
                  <Button
                    title="Exportar backup"
                    icon="download-outline"
                    onPress={() => {
                      void run(() =>
                        exportText(`core-backup-${localDay()}.json`, backupText(current.current!)),
                      );
                    }}
                  />
                  <Button
                    title="Restaurar backup"
                    secondary
                    icon="cloud-upload-outline"
                    onPress={() => {
                      void run(restore);
                    }}
                  />
                  <Button
                    title="Exportar cópia anterior à restauração"
                    secondary
                    onPress={() => {
                      void run(async () => {
                        const previous = await loadRecovery();
                        if (!previous)
                          throw new Error('Nenhuma restauração foi feita neste aparelho.');
                        await exportText(
                          `core-antes-restauracao-${localDay()}.json`,
                          backupText(previous),
                        );
                      });
                    }}
                  />
                  <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
                    Google Drive automático ainda não está conectado. Exportar abre as opções de
                    salvar ou compartilhar do aparelho.
                  </Txt>
                </Card>
                {Platform.OS === 'web' && (
                  <Card style={{ borderColor: colors.amber }}>
                    <Txt style={{ color: colors.amber, fontWeight: '700' }}>
                      Prévia no navegador
                    </Txt>
                    <Txt muted style={{ lineHeight: 22 }}>
                      Esta prévia salva os dados neste navegador. Limpar os dados do site os remove.
                      Ela não sincroniza com o celular. O app instalado utiliza um banco local no
                      aparelho.
                    </Txt>
                  </Card>
                )}
                <Button
                  title="Abrir relatórios"
                  secondary
                  icon="document-text-outline"
                  onPress={() => navigate('Relatórios')}
                />
                <Card>
                  <Txt style={s.section}>Sobre o Core</Txt>
                  <Txt muted style={{ lineHeight: 23 }}>
                    Gestão para Personal Trainers. Alunos, mensalidades e financeiro com foco no seu
                    dia a dia, mesmo sem internet.
                  </Txt>
                  <Txt muted style={{ fontSize: 12 }}>
                    Desenvolvido por Jorge Amado Belo · Base offline 0.1
                  </Txt>
                </Card>
              </>
            )}
          </ScrollView>
        </View>
        {!wide && (
          <View style={s.bottom}>
            {navItems.map(([title, icon]) => (
              <Nav
                key={title}
                title={title}
                icon={icon}
                active={tab === title || (title === 'Ajustes' && tab === 'Relatórios')}
                onPress={() => navigate(title)}
                compact
              />
            ))}
          </View>
        )}
        {editor && (
          <Modal
            visible
            animationType="slide"
            onRequestClose={() => {
              if (!busy) setEditor(null);
            }}
          >
            <SafeAreaView style={s.root}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={s.modalContent}
                >
                  {editor && (
                    <EditorForm
                      editor={editor}
                      state={state}
                      busy={busy}
                      saveError={notice}
                      onClose={() => setEditor(null)}
                      onSubmit={async (change) => {
                        if (await commit(change)) setEditor(null);
                      }}
                    />
                  )}
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Modal>
        )}
        {student && (
          <Modal visible animationType="slide" onRequestClose={() => setDetailId(null)}>
            <SafeAreaView style={s.root}>
              <ScrollView contentContainerStyle={s.modalContent}>
                {student && (
                  <>
                    <Button
                      title="Voltar aos alunos"
                      secondary
                      icon="arrow-back"
                      onPress={() => setDetailId(null)}
                    />
                    <Heading
                      title={student.name}
                      subtitle={
                        student.archivedOn
                          ? 'Aluno arquivado · histórico preservado'
                          : 'Dados do aluno'
                      }
                    />
                    <Card>
                      <Info label="Telefone" value={phoneInput(student.phone)} />
                      <Info
                        label="Nascimento"
                        value={student.birthDate ? displayDay(student.birthDate) : 'Não informado'}
                      />
                      <Info label="Frequência" value={`${student.frequency}x por semana`} />
                      <Info label="Mensalidade combinada" value={money(student.feeCents)} />
                      <Info label="Vencimento" value={`Todo dia ${student.dueDay}`} />
                      {student.notes !== '' && <Txt muted>{student.notes}</Txt>}
                    </Card>
                    <Button
                      title="Conversar no WhatsApp"
                      secondary
                      icon="logo-whatsapp"
                      onPress={() => {
                        void run(() =>
                          Linking.openURL(whatsappUrl(student, `Olá, ${student.name}! Tudo bem?`)),
                        );
                      }}
                    />
                    {!student.archivedOn && (
                      <Button
                        title="Editar aluno"
                        secondary
                        icon="create-outline"
                        onPress={() => {
                          setDetailId(null);
                          setEditor({ kind: 'student', student });
                        }}
                      />
                    )}
                    <Txt style={s.section}>Histórico de mensalidades</Txt>
                    {state.bills
                      .filter((b) => b.studentId === student.id)
                      .sort((a, b) => b.month.localeCompare(a.month))
                      .map((b) => billCard(b, false))}
                    {!student.archivedOn && (
                      <Button
                        title="Arquivar aluno"
                        secondary
                        icon="archive-outline"
                        onPress={() => {
                          setDetailId(null);
                          setConfirm({
                            title: 'Arquivar aluno?',
                            detail: `${student.name} sairá da lista de ativos. O mês atual e todo o histórico financeiro serão mantidos. Novas mensalidades deixarão de ser geradas após este mês.`,
                            action: async () => {
                              if (
                                await commit((s) => ({
                                  ...s,
                                  students: s.students.map((st) =>
                                    st.id === student.id ? { ...st, archivedOn: localDay() } : st,
                                  ),
                                }))
                              )
                                setConfirm(null);
                            },
                          });
                        }}
                      />
                    )}
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
        {confirm && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => {
              if (!busy) setConfirm(null);
            }}
          >
            <View style={s.overlay}>
              <Card style={{ width: '100%', maxWidth: 440, padding: 26, gap: 22 }}>
                <Txt style={s.section}>{confirm?.title}</Txt>
                <Txt muted style={{ lineHeight: 24 }}>
                  {confirm?.detail}
                </Txt>
                <Button
                  title="Confirmar"
                  onPress={() => {
                    void confirm?.action();
                  }}
                />
                <Button title="Cancelar" secondary onPress={() => setConfirm(null)} />
                {notice !== '' && <Txt style={{ color: colors.accent }}>{notice}</Txt>}
              </Card>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Busy.Provider>
  );
}

function Nav({
  title,
  icon,
  active,
  onPress,
  compact = false,
}: {
  title: Tab;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[compact ? s.navCompact : s.nav, active && { backgroundColor: '#291615' }]}
    >
      <Icon name={icon} color={active ? colors.accent : colors.muted} size={22} />
      <Txt
        style={{
          color: active ? colors.accent : colors.muted,
          fontSize: compact ? 11 : 15,
          fontWeight: active ? '700' : '500',
        }}
      >
        {title}
      </Txt>
    </Pressable>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={ui.row}>
      <Txt muted style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt style={{ flex: 1, textAlign: 'right' }}>{value}</Txt>
    </View>
  );
}
function EditorForm({
  editor,
  state,
  busy,
  saveError,
  onClose,
  onSubmit,
}: {
  editor: NonNullable<Editor>;
  state: CoreState;
  busy: boolean;
  saveError: string;
  onClose: () => void;
  onSubmit: (change: (s: CoreState) => CoreState) => Promise<void>;
}) {
  const st = editor.kind === 'student' ? editor.student : undefined;
  const [name, setName] = useState(
    st?.name ?? (editor.kind === 'profile' ? state.profile.name : ''),
  );
  const [cref, setCref] = useState(state.profile.cref);
  const [phone, setPhone] = useState(st ? phoneInput(st.phone) : '');
  const [fee, setFee] = useState(
    st ? (st.feeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
  );
  const [due, setDue] = useState(String(st?.dueDay ?? 5));
  const [frequency, setFrequency] = useState(String(st?.frequency ?? 3));
  const [birth, setBirth] = useState(st?.birthDate ? displayDay(st.birthDate) : '');
  const [notes, setNotes] = useState(st?.notes ?? '');
  const [date, setDate] = useState(displayDay(localDay()));
  const [error, setError] = useState('');
  const [sessionStudent, setSessionStudent] = useState('');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:00');
  const toISO = (d: string) => d.split('/').reverse().join('-');
  async function submit() {
    setError('');
    try {
      if (editor.kind === 'student') {
        if (!/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(fee))
          throw new Error('Informe a mensalidade no formato 400,00.');
        const cents = Math.round(Number(fee.replace(/\./g, '').replace(',', '.')) * 100);
        const bday = birth ? day.parse(toISO(birth)) : '';
        if (bday > localDay()) throw new Error('Nascimento não pode estar no futuro.');
        const student: Student = {
          id: st?.id ?? randomUUID(),
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          feeCents: cents,
          dueDay: Number(due),
          frequency: Number(frequency),
          birthDate: bday,
          notes,
          startMonth: st?.startMonth ?? currentMonth(),
          archivedOn: st?.archivedOn ?? null,
        };
        // Validate before handing off so the form retains its error and values.
        saveStudent(state, student);
        await onSubmit((s) => saveStudent(s, student));
      } else if (editor.kind === 'profile') {
        if (name.trim().length < 2 || name.length > 120 || cref.length > 50)
          throw new Error('Informe um nome válido. CREF é opcional.');
        await onSubmit((s) => ({ ...s, profile: { name: name.trim(), cref: cref.trim() } }));
      } else if (editor.kind === 'session') {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end))
          throw new Error('Informe início e término no formato HH:MM.');
        if (end <= start) throw new Error('O término deve ser após o início.');
        const session: Session = {
          id: randomUUID(),
          studentId: sessionStudent,
          date: day.parse(toISO(date)),
          start,
          end,
          status: 'scheduled',
          notes,
        };
        saveSession(state, session);
        await onSubmit((s) => saveSession(s, session));
      } else {
        if (!name.trim() || name.length > 200)
          throw new Error('Informe um lembrete com até 200 caracteres.');
        const reminder: Reminder = {
          id: randomUUID(),
          title: name.trim(),
          date: day.parse(toISO(date)),
          done: false,
        };
        await onSubmit((s) => ({ ...s, reminders: [...s.reminders, reminder] }));
      }
    } catch (e) {
      setError(errorText(e));
    }
  }
  const maskDate = (value: string) =>
    value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
  return (
    <>
      <Button
        title="Cancelar edição"
        secondary
        icon="arrow-back"
        onPress={onClose}
        disabled={busy}
      />
      <Heading
        title={
          editor.kind === 'student'
            ? st
              ? 'Editar aluno'
              : 'Novo aluno'
            : editor.kind === 'profile'
              ? 'Seu perfil'
              : editor.kind === 'session'
                ? 'Novo horário'
                : 'Novo lembrete'
        }
        subtitle={
          editor.kind === 'student' ? 'O essencial para organizar o atendimento.' : undefined
        }
      />
      {editor.kind !== 'session' && (
        <Card>
          <Field
            label={editor.kind === 'reminder' ? 'Lembrete' : 'Nome'}
            value={name}
            onChange={setName}
            placeholder={
              editor.kind === 'reminder' ? 'Ex.: conversar sobre renovação' : 'Nome completo'
            }
          />
          {editor.kind === 'profile' && (
            <Field label="CREF (opcional)" value={cref} onChange={setCref} />
          )}
          {editor.kind === 'reminder' && (
            <Field
              label="Data do lembrete"
              value={date}
              onChange={(v) => setDate(maskDate(v))}
              keyboard="number-pad"
              placeholder="DD/MM/AAAA"
            />
          )}
          {editor.kind === 'student' && (
            <>
              <Field
                label="Telefone com DDD"
                value={phone}
                onChange={(v) => setPhone(phoneInput(v))}
                keyboard="phone-pad"
                placeholder="(49) 99999-9999"
              />
              <Field
                label="Nascimento (opcional)"
                value={birth}
                onChange={(v) => setBirth(maskDate(v))}
                keyboard="number-pad"
                placeholder="DD/MM/AAAA"
              />
            </>
          )}
        </Card>
      )}
      {editor.kind === 'session' && (
        <Card>
          <Txt style={s.section}>Escolha o aluno</Txt>
          {state.students
            .filter((st) => !st.archivedOn)
            .map((st) => (
              <Button
                key={st.id}
                title={st.name}
                secondary={sessionStudent !== st.id}
                onPress={() => setSessionStudent(st.id)}
              />
            ))}
          <Field
            label="Data do atendimento"
            value={date}
            onChange={(v) => setDate(maskDate(v))}
            keyboard="number-pad"
            placeholder="DD/MM/AAAA"
          />
          <Field label="Início (HH:MM)" value={start} onChange={setStart} placeholder="08:00" />
          <Field label="Término (HH:MM)" value={end} onChange={setEnd} placeholder="09:00" />
          <Field
            label="Observações do horário (opcional)"
            value={notes}
            onChange={setNotes}
            multiline
          />
        </Card>
      )}
      {editor.kind === 'student' && (
        <Card>
          <Txt style={s.section}>Mensalidade e frequência</Txt>
          <Field
            label="Mensalidade (R$)"
            value={fee}
            onChange={(v) => setFee(moneyInput(v, fee))}
            keyboard="decimal-pad"
            placeholder="400,00"
          />
          <Field
            label="Dia do vencimento (1 a 31)"
            value={due}
            onChange={setDue}
            keyboard="number-pad"
          />
          <Field
            label="Treinos por semana (1 a 7)"
            value={frequency}
            onChange={setFrequency}
            keyboard="number-pad"
          />
          <Field label="Observações (opcional)" value={notes} onChange={setNotes} multiline />
          <Txt muted style={{ fontSize: 12, lineHeight: 20 }}>
            {st
              ? 'Alterações no valor e vencimento valem para as próximas mensalidades. As já geradas mantêm os valores originais.'
              : 'A primeira mensalidade será criada para o mês atual.'}{' '}
            Vencimentos em dias inexistentes no mês usam o último dia.
          </Txt>
        </Card>
      )}
      {(error || saveError) !== '' && (
        <Card style={{ borderColor: colors.accent }}>
          <Txt style={{ color: colors.accent }}>{error || saveError}</Txt>
        </Card>
      )}
      <Button
        title={busy ? 'Salvando…' : 'Salvar'}
        icon="checkmark"
        onPress={() => {
          setFee(finishMoneyInput(fee));
          void submit();
        }}
        disabled={busy}
      />
    </>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 8,
  },
  sidebar: { width: 215, padding: 18, gap: 10, borderRightWidth: 1, borderRightColor: colors.line },
  section: { fontSize: 17, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#291615',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: 9,
    backgroundColor: colors.panel,
    gap: 4,
  },
  nav: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, alignItems: 'center' },
  navCompact: {
    flex: 1,
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 22,
    gap: 20,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
