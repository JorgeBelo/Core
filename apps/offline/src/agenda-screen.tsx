import React, { useState } from 'react';
import { View } from 'react-native';
import {
  CoreState,
  DaySession,
  displayDay,
  localDay,
  freeRanges,
  sessionsForDate,
  minutes,
} from './domain';
import { Badge, Button, Card, Empty, Heading, Txt, colors, styles as ui } from './ui';
export function AgendaScreen({
  state,
  date,
  onDate,
  onCreate,
  onComplete,
  onCancel,
  onWorkHours,
}: {
  state: CoreState;
  date: string;
  onDate: (v: string) => void;
  onCreate: (range?: { start: string; end: string }) => void;
  onComplete: (row: DaySession) => void;
  onCancel: (row: DaySession) => void;
  onWorkHours: () => void;
}) {
  const [showCanceled, setShowCanceled] = useState(false);
  const [view, setView] = useState<'classes' | 'free'>('classes');
  const all = sessionsForDate(state, date);
  const active = all.filter((row) => row.status !== 'canceled');
  const changeDay = (step: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + step);
    onDate(localDay(d));
  };
  return (
    <>
      <Heading title="Agenda" subtitle="Suas aulas e os horários disponíveis." />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button title="Aulas" secondary={view !== 'classes'} onPress={() => setView('classes')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Horários livres"
            secondary={view !== 'free'}
            onPress={() => setView('free')}
          />
        </View>
      </View>
      <View style={ui.row}>
        <Button
          title="Dia anterior"
          icon="chevron-back"
          iconOnly
          secondary
          onPress={() => changeDay(-1)}
        />
        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Txt style={{ fontWeight: '700', fontSize: 18 }}>
            {date === localDay() ? 'Hoje' : displayDay(date)}
          </Txt>
          <Txt muted style={{ fontSize: 12, textTransform: 'capitalize', textAlign: 'center' }}>
            {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Txt>
        </View>
        <Button
          title="Próximo dia"
          icon="chevron-forward"
          iconOnly
          secondary
          onPress={() => changeDay(1)}
        />
      </View>
      {view === 'free' ? (
        <>
          {!state.profile.workHours.length ? (
            <Empty
              title="Quando você atende?"
              detail="Defina seus dias de trabalho e os períodos de atendimento para ver as vagas."
            >
              <Button title="Definir meus horários" icon="time-outline" onPress={onWorkHours} />
            </Empty>
          ) : (
            <>
              <Txt style={{ fontWeight: '700' }}>Janelas livres neste dia</Txt>
              {freeRanges(state, date).map((range) => (
                <Card key={range.start} style={{ padding: 16 }}>
                  <View style={ui.row}>
                    <Txt style={{ fontSize: 19, fontWeight: '700', flex: 1 }}>
                      {range.start} às {range.end}
                    </Txt>
                    <Button
                      title={`Agendar às ${range.start}`}
                      secondary
                      icon="add"
                      iconOnly
                      disabled={
                        !state.students.some((s) => !s.archivedOn) ||
                        minutes(range.end) - minutes(range.start) < 15
                      }
                      onPress={() => onCreate(range)}
                    />
                  </View>
                </Card>
              ))}
              {!freeRanges(state, date).length && (
                <Empty
                  title="Nenhuma janela livre"
                  detail="Este dia está sem expediente configurado ou todos os períodos já estão ocupados."
                />
              )}
              <Button title="Editar meus horários de trabalho" secondary onPress={onWorkHours} />
            </>
          )}
          <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
            As vagas respeitam seus períodos de trabalho, os horários fixos dos alunos e as aulas
            avulsas. Intervalos fora do expediente não aparecem como livres.
          </Txt>
        </>
      ) : (
        <>
          <Button
            title="Agendar aula"
            icon="add"
            disabled={!state.students.some((s) => !s.archivedOn)}
            onPress={() => onCreate()}
          />
          <View style={ui.row}>
            <Txt style={{ fontWeight: '700' }}>
              {active.length} aula{active.length === 1 ? '' : 's'} neste dia
            </Txt>
            {date !== localDay() && (
              <Button title="Ir para hoje" secondary onPress={() => onDate(localDay())} />
            )}
          </View>
          {(showCanceled ? all : active).map((row) => (
            <Card
              key={row.id}
              style={{ padding: 16, opacity: row.status === 'canceled' ? 0.65 : 1 }}
            >
              <View style={[ui.row, { alignItems: 'flex-start' }]}>
                <View style={{ minWidth: 60, gap: 3 }}>
                  <Txt style={{ fontWeight: '800', fontSize: 20 }}>{row.start}</Txt>
                  <Txt muted style={{ fontSize: 12 }}>
                    até {row.end}
                  </Txt>
                </View>
                <View style={{ flex: 1, gap: 9 }}>
                  <Txt style={{ fontWeight: '700', fontSize: 17 }}>
                    {state.students.find((st) => st.id === row.studentId)!.name}
                  </Txt>
                  <Badge
                    label={
                      row.status === 'scheduled'
                        ? 'Agendada'
                        : row.status === 'done'
                          ? 'Concluída'
                          : 'Cancelada'
                    }
                    tone={row.status === 'done' ? 'green' : 'muted'}
                  />
                  {row.notes !== '' && <Txt muted>{row.notes}</Txt>}
                </View>
              </View>
              {row.status === 'scheduled' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button
                    title="Concluir aula"
                    secondary
                    icon="checkmark"
                    onPress={() => onComplete(row)}
                  />
                  <Button title="Cancelar aula" secondary onPress={() => onCancel(row)} />
                </View>
              )}
            </Card>
          ))}
          {!active.length && (
            <Empty
              title="Nenhuma aula agendada"
              detail={
                state.students.some((s) => !s.archivedOn)
                  ? 'Toque em “Agendar aula”, escolha o aluno e o horário.'
                  : 'Cadastre um aluno para agendar a primeira aula.'
              }
            />
          )}
          {all.some((row) => row.status === 'canceled') && (
            <Button
              title={showCanceled ? 'Ocultar canceladas' : 'Mostrar aulas canceladas'}
              secondary
              onPress={() => setShowCanceled(!showCanceled)}
            />
          )}
          <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
            A agenda reúne aulas avulsas e horários fixos. Organize os horários fixos em Alunos →
            perfil do aluno → Dias e horários.
          </Txt>
        </>
      )}
    </>
  );
}
