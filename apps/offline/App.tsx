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
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Intro, Sheet, Avatar } from './src/mobile-ui';
import { EditorForm, Editor } from './src/editors';
import { AgendaScreen } from './src/agenda-screen';
import { academyReportHtml, academyStudents } from './src/academy-report';
import {
  CoreState,
  setDaySessionStatus,
  minutes,
  weekNames,
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
type Confirm = { title: string; detail: string; action: () => Promise<void> } | null;
const errorText = (e: unknown) =>
  e instanceof Error
    ? e.name === 'ZodError'
      ? 'Confira os dados: nome, telefone com DDD, valor, frequência e datas válidas.'
      : e.message
    : 'Não foi possível concluir a operação.';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <CoreApp />
    </SafeAreaProvider>
  );
}
function CoreApp() {
  const [showIntro, setShowIntro] = useState(true);
  const [showReminders, setShowReminders] = useState(false);
  const [state, setState] = useState<CoreState | null>(null);
  const current = useRef<CoreState | null>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<Tab>('Início');
  const [selectedMonth, setMonth] = useState(currentMonth());
  const [today, setToday] = useState(localDay());
  const [editor, setEditor] = useState<Editor | null>(null);
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

  useEffect(() => {
    if (
      !showIntro &&
      state &&
      !state.profile.name.trim() &&
      !state.profile.setupComplete &&
      !editor
    )
      setEditor({ kind: 'profile', onboarding: true });
  }, [showIntro, state?.profile.name, state?.profile.setupComplete]);
  if (showIntro)
    return (
      <>
        <StatusBar style="light" />
        <Intro onDone={() => setShowIntro(false)} />
      </>
    );
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
  function financialReport() {
    const esc = (x: string) =>
      x.replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
      );
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>CORE — Relatório</title><style>body{font:14px Arial;color:#222;margin:40px}h1{color:#a20100}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px 6px;border-bottom:1px solid #ddd}small{color:#666}tr{break-inside:avoid}</style><h1>Core</h1><h2>Mensalidades — ${esc(monthLabel(selectedMonth))}</h2><p>${esc(state!.profile.name || 'Personal Trainer')} ${state!.profile.cref ? '· CREF ' + esc(state!.profile.cref) : ''}</p><p>Previsto: ${money(summary.expected)} · Recebido: ${money(summary.received)} · Em aberto: ${money(summary.pending)}</p><table><thead><tr><th>Aluno</th><th>Valor</th><th>Vencimento</th><th>Situação</th><th>Pagamento</th></tr></thead><tbody>${bills.map((b) => `<tr><td>${esc(nameOf(b))}</td><td>${money(b.amountCents)}</td><td>${displayDay(b.dueDate)}</td><td>${status(b, today)}</td><td>${b.paidOn ? displayDay(b.paidOn) : '—'}</td></tr>`).join('')}</tbody></table><p><small>Gerado em ${displayDay(today)}. Resumo por mês da mensalidade, com pagamentos registrados manualmente. Não é comprovante bancário.</small></p></html>`;
    void run(() => exportReport(html));
  }
  function report() {
    void run(() => exportReport(academyReportHtml(current.current!)));
  }
  function closeEditor() {
    if (editor?.kind === 'profile' && editor.onboarding && !state!.profile.setupComplete) {
      void commit((s) => ({ ...s, profile: { ...s.profile, setupComplete: true } })).then((ok) => {
        if (ok) setEditor(null);
      });
    } else setEditor(null);
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
              style={{ width: 36, height: 36, borderRadius: 10 }}
            />
            <View>
              <Txt style={{ fontSize: 22, fontWeight: '800', letterSpacing: -1 }}>Core</Txt>
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
              padding: wide ? 28 : 16,
              paddingBottom: 32,
              gap: 16,
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar meu perfil"
                  onPress={() => setEditor({ kind: 'profile' })}
                >
                  <Card style={{ padding: 16 }}>
                    <View style={ui.row}>
                      <Avatar name={state.profile.name} photo={state.profile.photo} />
                      <View style={{ flex: 1, gap: 5 }}>
                        <Txt style={{ fontSize: 21, fontWeight: '700' }}>
                          {state.profile.name || 'Seu perfil no Core'}
                        </Txt>
                        <Txt muted style={{ fontSize: 12 }}>
                          {state.profile.cref ? `CREF ${state.profile.cref}` : 'Personal Trainer'}
                        </Txt>
                      </View>
                      <Icon name="create-outline" color={colors.muted} />
                    </View>
                  </Card>
                </Pressable>
                <View style={{ gap: 12 }}>
                  <Txt style={s.section}>Mensalidades de {monthLabel(currentMonth())}</Txt>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      ['Já recebeu', homeTotals.received, colors.green],
                      ['Falta receber', homeTotals.pending, colors.amber],
                    ].map(([label, value, color]) => (
                      <Card key={String(label)} style={{ flex: 1, padding: 15, gap: 8 }}>
                        <Txt muted style={{ fontSize: 12 }}>
                          {label}
                        </Txt>
                        <Txt
                          style={{ fontSize: 23, fontWeight: '700', letterSpacing: -0.7, color }}
                        >
                          {money(Number(value))}
                        </Txt>
                      </Card>
                    ))}
                  </View>
                  <Txt muted style={{ fontSize: 12 }}>
                    Previsto no mês: {money(homeTotals.expected)} · {active.length} aluno
                    {active.length === 1 ? '' : 's'} ativo{active.length === 1 ? '' : 's'}
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {(
                    [
                      [
                        'Cadastrar aluno',
                        'person-add-outline',
                        () => setEditor({ kind: 'student' }),
                      ],
                      ['Alunos', 'people-outline', () => navigate('Alunos')],
                      ['Financeiro', 'wallet-outline', () => navigate('Financeiro')],
                      ['Relatórios', 'document-text-outline', () => navigate('Relatórios')],
                    ] as [string, IconName, () => void][]
                  ).map(([label, icon, action]) => (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      onPress={action}
                      style={({ pressed }) => ({
                        flexBasis: '47%',
                        flexGrow: 1,
                        backgroundColor: colors.panel,
                        borderWidth: 1,
                        borderColor: colors.line,
                        borderRadius: 17,
                        padding: 18,
                        gap: 12,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Icon
                        name={icon}
                        color={label === 'Cadastrar aluno' ? colors.accent : colors.text}
                        size={25}
                      />
                      <Txt style={{ fontWeight: '700' }}>{label}</Txt>
                    </Pressable>
                  ))}
                </View>
                {overdue.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ver mensalidades em atraso"
                    onPress={() => navigate('Financeiro')}
                  >
                    <Card style={{ padding: 15, borderLeftWidth: 3, borderLeftColor: colors.red }}>
                      <View style={ui.row}>
                        <Icon name="alert-circle-outline" color={colors.accent} />
                        <View style={{ flex: 1, gap: 3 }}>
                          <Txt style={{ fontWeight: '700' }}>
                            {overdue.length} mensalidade(s) em atraso
                          </Txt>
                          <Txt muted style={{ fontSize: 12 }}>
                            {money(totals(overdue, today).pending)} considerando todos os meses
                          </Txt>
                        </View>
                        <Icon name="chevron-forward" color={colors.muted} />
                      </View>
                    </Card>
                  </Pressable>
                )}
                <View style={ui.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mostrar lembretes"
                    onPress={() => setShowReminders(!showReminders)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <Txt style={s.section}>Lembretes ({pendingReminders.length})</Txt>
                    <Icon name={showReminders ? 'chevron-up' : 'chevron-down'} size={16} />
                  </Pressable>
                  <Button
                    title="Novo lembrete"
                    icon="add"
                    iconOnly
                    secondary
                    onPress={() => setEditor({ kind: 'reminder' })}
                  />
                </View>
                {showReminders &&
                  (pendingReminders.length ? (
                    pendingReminders.map((r) => (
                      <Card key={r.id} style={{ padding: 15 }}>
                        <View style={ui.row}>
                          <View style={{ flex: 1, gap: 5 }}>
                            <Txt>{r.title}</Txt>
                            <Txt muted style={{ fontSize: 12 }}>
                              {displayDay(r.date)}
                            </Txt>
                          </View>
                          <Button
                            title="Concluir lembrete"
                            icon="checkmark"
                            iconOnly
                            secondary
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
                    <Txt muted>Nenhum lembrete pendente.</Txt>
                  ))}
                {birthdays.map((st) => (
                  <Card key={st.id} style={{ padding: 15 }}>
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
                              `Olá, ${st.name}! Feliz aniversário! Desejo muita saúde e felicidade!`,
                            ),
                          ),
                        );
                      }}
                    />
                  </Card>
                ))}
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
              <AgendaScreen
                state={state}
                date={agendaDate}
                onDate={setAgendaDate}
                onCreate={(range) =>
                  setEditor({
                    kind: 'session',
                    date: agendaDate,
                    start: range?.start,
                    duration: range ? Math.min(60, minutes(range.end) - minutes(range.start)) : 60,
                  })
                }
                onWorkHours={() => setEditor({ kind: 'work-hours' })}
                onComplete={(row) => {
                  void commit((s) => setDaySessionStatus(s, row, 'done'));
                }}
                onCancel={(row) =>
                  setConfirm({
                    title: 'Cancelar esta aula?',
                    detail:
                      'O horário será liberado nesta data. Uma aula fixa continuará nos outros dias. A mensalidade não será alterada.',
                    action: async () => {
                      if (await commit((s) => setDaySessionStatus(s, row, 'canceled')))
                        setConfirm(null);
                    },
                  })
                }
              />
            )}
            {tab === 'Financeiro' && (
              <>
                <Heading
                  title="Financeiro"
                  subtitle="Mensalidades organizadas pelo mês de referência."
                />
                {monthPicker}
                {stats(summary)}
                <Button
                  title="Exportar financeiro"
                  secondary
                  icon="document-text-outline"
                  onPress={financialReport}
                />
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
                <Heading
                  title="Relatório para a academia"
                  subtitle="Alunos e frequência semanal, prontos para compartilhar."
                />
                <Button
                  title="Gerar PDF para academia"
                  icon="document-text-outline"
                  onPress={report}
                />
                <Card style={{ padding: 16 }}>
                  <View style={ui.row}>
                    <Txt muted>Alunos ativos</Txt>
                    <Txt style={{ fontSize: 24, fontWeight: '700' }}>{active.length}</Txt>
                  </View>
                  <View style={ui.row}>
                    <Txt muted style={{ flex: 1 }}>
                      Atendimentos previstos / semana
                    </Txt>
                    <Txt style={{ fontSize: 24, fontWeight: '700' }}>
                      {active.reduce((sum, st) => sum + st.frequency, 0)}
                    </Txt>
                  </View>
                </Card>
                <Txt muted style={{ fontSize: 12, lineHeight: 20 }}>
                  O PDF inclui seu nome, CREF, todos os alunos ativos e quantas vezes cada um treina
                  por semana. Valores de mensalidade e contatos ficam fora desse documento.
                </Txt>
                {academyStudents(state).map((st) => (
                  <Card key={st.id} style={{ padding: 15 }}>
                    <View style={ui.row}>
                      <Txt style={{ flex: 1, fontWeight: '600' }}>{st.name}</Txt>
                      <Badge label={`${st.frequency}x / semana`} />
                    </View>
                  </Card>
                ))}
                {!active.length && (
                  <Empty
                    title="Sua relação de alunos aparecerá aqui"
                    detail="Cadastre seus alunos e a frequência combinada para gerar o relatório."
                  />
                )}
              </>
            )}
            {tab === 'Ajustes' && (
              <>
                <Heading title="Ajustes" subtitle="Seu perfil e a segurança dos seus dados." />
                <Button
                  title="Meus horários de trabalho"
                  secondary
                  icon="time-outline"
                  onPress={() => setEditor({ kind: 'work-hours' })}
                />
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
        {(editor || student) && (
          <Modal
            visible
            animationType="slide"
            onRequestClose={() => {
              if (!busy) {
                if (editor) closeEditor();
                else setDetailId(null);
              }
            }}
          >
            {editor ? (
              <EditorForm
                editor={editor}
                state={state}
                busy={busy}
                saveError={notice}
                onClose={closeEditor}
                onSubmit={async (change) => {
                  if (await commit(change)) setEditor(null);
                }}
              />
            ) : (
              student && (
                <Sheet
                  title="Perfil do aluno"
                  closeLabel="Voltar aos alunos"
                  onClose={() => setDetailId(null)}
                >
                  {student && (
                    <>
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
                          value={
                            student.birthDate ? displayDay(student.birthDate) : 'Não informado'
                          }
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
                            Linking.openURL(
                              whatsappUrl(student, `Olá, ${student.name}! Tudo bem?`),
                            ),
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
                      {!student.archivedOn && (
                        <Button
                          title="Organizar dias e horários"
                          secondary
                          icon="calendar-outline"
                          onPress={() => {
                            setDetailId(null);
                            setEditor({ kind: 'weekly', student });
                          }}
                        />
                      )}
                      {state.weeklySlots
                        .filter(
                          (slot) =>
                            slot.studentId === student.id &&
                            (!slot.endsBefore || slot.endsBefore > today),
                        )
                        .map((slot) => (
                          <Txt key={slot.id} muted>
                            {weekNames[slot.weekday]} · {slot.start} às {slot.end}
                          </Txt>
                        ))}
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
                </Sheet>
              )
            )}
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
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
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
