import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Choice, Heading, Label, Loading, Notice, colors } from '@core/ui';
import { initials, modalityLabels, periodStart } from '@core/domain';
import { readableError } from '@core/api-client';
import { repository } from '../../src/lib/backend';
import { useSession } from '../../src/lib/session';
export default function Home() {
  const { professional } = useSession();
  const { width } = useWindowDimensions();
  const wide = width > 1150;
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const query = useQuery({
    queryKey: ['dashboard', professional?.id, period],
    queryFn: () => repository!.dashboard(periodStart(period)),
    enabled: !!professional,
  });
  if (!professional) return null;
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return (
    <>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}
      >
        <View style={{ gap: 6 }}>
          <Label muted style={{ fontSize: 12, textTransform: 'capitalize' }}>
            {date}
          </Label>
          <Heading>Olá, {professional.display_name.split(' ')[0]}.</Heading>
          <Label muted>Seu trabalho em movimento, com tudo por perto.</Label>
        </View>
        <Button onPress={() => router.push('/students/new')}>＋ Cadastrar aluno</Button>
      </View>
      <View
        style={{
          padding: 28,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#4C2C30',
          backgroundColor: '#291C20',
          overflow: 'hidden',
          gap: 14,
        }}
      >
        <Label style={{ fontSize: 10, letterSpacing: 2, color: '#DEAAA8' }}>
          CORE PERSONAL / SEU ESPAÇO
        </Label>
        <Heading level={2}>O acompanhamento começa com conexão.</Heading>
        <Label style={{ color: '#C8BFC3', maxWidth: 570 }}>
          Conheça cada aluno, organize seus objetivos e construa uma base sólida para acompanhar a
          evolução.
        </Label>
        <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
          <Button secondary onPress={() => router.push('/students')}>
            Abrir minha carteira →
          </Button>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Heading level={2}>Visão geral</Heading>
        <Choice
          label="Período de novas entradas"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'month', label: 'Mês' },
            { value: 'quarter', label: 'Trimestre' },
            { value: 'year', label: 'Ano' },
          ]}
        />
      </View>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <>
          <Notice error>{readableError(query.error)}</Notice>
          <Button secondary onPress={() => query.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : (
        <>
          <View style={{ flexDirection: width > 700 ? 'row' : 'column', gap: 16 }}>
            {[
              {
                label: 'Alunos ativos',
                value: query.data.active,
                icon: 'people-outline',
                note: 'Em acompanhamento',
              },
              {
                label: 'Alunos inativos',
                value: query.data.inactive,
                icon: 'pause-circle-outline',
                note: 'Histórico preservado',
              },
              {
                label: 'Novas entradas',
                value: query.data.recent,
                icon: 'person-add-outline',
                note: 'Início no período selecionado',
              },
            ].map((item) => (
              <Card key={item.label} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Label muted>{item.label}</Label>
                  <Ionicons name={item.icon as any} color="#BE7776" size={20} />
                </View>
                <Label
                  style={{ fontSize: 36, lineHeight: 44, fontWeight: '600', letterSpacing: -1 }}
                >
                  {item.value}
                </Label>
                <Label muted style={{ fontSize: 12 }}>
                  {item.note}
                </Label>
              </Card>
            ))}
          </View>
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20 }}>
            <Card style={{ flex: 1.5 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Heading level={2}>Últimos cadastros</Heading>
                <Button secondary onPress={() => router.push('/students')}>
                  Ver todos
                </Button>
              </View>
              {query.data.latest.length ? (
                query.data.latest.map((s) => (
                  <View
                    key={s.id}
                    style={{
                      borderTopWidth: 1,
                      borderColor: colors.border,
                      paddingTop: 14,
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: '#323238',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Label>{initials(s.full_name)}</Label>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label>{s.full_name}</Label>
                      <Label muted style={{ fontSize: 12 }}>
                        {modalityLabels[s.modality]} · {s.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Label>
                    </View>
                    <Button secondary onPress={() => router.push(`/students/${s.id}`)}>
                      Abrir
                    </Button>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 24, gap: 8 }}>
                  <Ionicons name="people-outline" size={28} color={colors.secondary} />
                  <Heading level={3}>Sua carteira começa aqui</Heading>
                  <Label muted>
                    Cadastre seu primeiro aluno. Os indicadores serão calculados a partir dos
                    registros salvos.
                  </Label>
                </View>
              )}
            </Card>
            <Card style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, letterSpacing: 1.6, color: '#D6AAA8' }}>
                SUA ROTINA
              </Label>
              <Heading level={2}>Acompanhamento em dia.</Heading>
              <Label muted>
                Organize as prescrições dos seus alunos e acompanhe contas previstas e pagamentos
                confirmados.
              </Label>
              <Button secondary onPress={() => router.push('/training')}>
                Abrir treinos →
              </Button>
              <Button secondary onPress={() => router.push('/finance')}>
                Abrir financeiro →
              </Button>
            </Card>
          </View>
        </>
      )}
    </>
  );
}
