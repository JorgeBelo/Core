import React from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Heading, Label, Loading, Notice, colors } from '@core/ui';
import { initials, modalityLabels, periodStart, formatBRL } from '@core/domain';
import { readableError } from '@core/api-client';
import { repository } from '../../src/lib/backend';
import { useSession } from '../../src/lib/session';
import { ActionTile, IconButton } from '../../src/components/Visual';
export default function Home() {
  const { professional } = useSession();
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const query = useQuery({
    queryKey: ['dashboard', professional?.id, 'month'],
    queryFn: () => repository!.dashboard(periodStart('month')),
    enabled: !!professional,
  });
  if (!professional) return null;
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: compact ? 'nowrap' : 'wrap',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <View style={{ gap: 5, flex: 1 }}>
          <Label muted style={{ fontSize: 12 }}>
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}
          </Label>
          <Heading>Olá, {professional.display_name.split(' ')[0]}.</Heading>
          <Label muted>O que vamos fazer hoje?</Label>
        </View>
        {compact ? (
          <IconButton
            icon="person-add-outline"
            label="Cadastrar aluno"
            onPress={() => router.push('/students/new')}
          />
        ) : (
          <Button secondary onPress={() => router.push('/students/new')}>
            ＋ Cadastrar aluno
          </Button>
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <ActionTile
          icon="add"
          title="Criar treino"
          description="Escolha o aluno e comece."
          primary
          compact={compact}
          onPress={() => router.push('/training/programs/new')}
          style={{ flex: 1, minWidth: compact ? 130 : 210 }}
        />
        <ActionTile
          icon="people-outline"
          title="Meus alunos"
          compact={compact}
          description="Cadastros e acompanhamento"
          onPress={() => router.push('/students')}
          style={{ flex: 1, minWidth: compact ? 130 : 210 }}
        />
        <ActionTile
          icon="wallet-outline"
          title="Financeiro"
          compact={compact}
          description="Valores e recebimentos"
          onPress={() => router.push('/finance')}
          style={{ flex: 1, minWidth: compact ? 130 : 210 }}
        />
        <ActionTile
          icon="chatbubble-outline"
          title="Mensagens"
          description="Vencimentos e aniversários"
          compact={compact}
          onPress={() => router.push('/messages')}
          style={{ flex: 1, minWidth: compact ? 130 : 210 }}
        />
      </View>
      <View style={{ gap: 14 }}>
        <Heading level={2}>Visão geral</Heading>
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { title: 'Alunos ativos', value: query.data.active, icon: 'people-outline' },
                { title: 'Novos neste mês', value: query.data.recent, icon: 'person-add-outline' },
              ].map((item) => (
                <Card
                  key={item.title}
                  style={{ flex: 1, padding: 18, gap: 8, backgroundColor: '#18181D' }}
                >
                  <Ionicons name={item.icon as any} size={18} color={colors.secondary} />
                  <Label style={{ fontSize: 30, fontWeight: '700', lineHeight: 36 }}>
                    {item.value}
                  </Label>
                  <Label muted style={{ fontSize: 12 }}>
                    {item.title}
                  </Label>
                </Card>
              ))}
            </View>
            <Card style={{ padding: compact ? 18 : 22 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Heading level={2}>Seus alunos</Heading>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos os alunos"
                  onPress={() => router.push('/students')}
                  style={{ padding: 10 }}
                >
                  <Label style={{ color: '#E9A1A0', fontSize: 13 }}>Ver todos →</Label>
                </Pressable>
              </View>
              {query.data.latest.length ? (
                query.data.latest.map((s) => (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir cadastro de ${s.full_name}`}
                    onPress={() => router.push(`/students/${s.id}`)}
                    style={{
                      borderTopWidth: 1,
                      borderColor: colors.border,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        backgroundColor: '#303038',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Label style={{ fontWeight: '600' }}>{initials(s.full_name)}</Label>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Label style={{ fontWeight: '600' }}>{s.full_name}</Label>
                      <Label muted style={{ fontSize: 12 }}>
                        {modalityLabels[s.modality]}
                        {s.weekly_frequency ? ` · ${s.weekly_frequency}×/semana` : ''}
                        {s.status === 'inactive' ? ' · Inativo' : ''}
                      </Label>
                      {s.monthly_fee_cents != null && (
                        <Label muted style={{ fontSize: 12 }}>
                          {formatBRL(s.monthly_fee_cents)}/mês
                        </Label>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
                  </Pressable>
                ))
              ) : (
                <View style={{ paddingVertical: 18, gap: 8 }}>
                  <Heading level={3}>Cadastre seu primeiro aluno</Heading>
                  <Label muted>Os cadastros e os próximos treinos começam por aqui.</Label>
                  <Button secondary onPress={() => router.push('/students/new')}>
                    Adicionar primeiro aluno
                  </Button>
                </View>
              )}
            </Card>
          </>
        )}
      </View>
    </>
  );
}
