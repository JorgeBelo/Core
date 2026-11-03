import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Field, Heading, Label, Loading, Notice, colors } from '@core/ui';
import { initials, modalityLabels, formatBRL } from '@core/domain';
import { readableError } from '@core/api-client';
import { repository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
import { exportStudentReport } from '../../../src/lib/student-report';
export default function Students() {
  const { professional } = useSession();
  const params = useLocalSearchParams<{ q?: string; saved?: string }>();
  const [search, setSearch] = useState(params.q ?? ''),
    [debounced, setDebounced] = useState(search),
    [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState('');
  async function exportPdf() {
    if (!professional || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const rows = await repository!.allStudents(professional.id);
      await exportStudentReport(rows, professional);
    } catch {
      setExportError('Não foi possível gerar o PDF completo. Confira a conexão e tente novamente.');
    } finally {
      setExporting(false);
    }
  }
  useEffect(() => {
    setSearch(params.q ?? '');
  }, [params.q]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ['students', professional?.id, debounced, page],
    queryFn: () => repository!.students(debounced, page),
    enabled: !!professional,
  });
  return (
    <>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <View style={{ gap: 7 }}>
          <Label muted style={{ fontSize: 11, letterSpacing: 1.5 }}>
            ACOMPANHAMENTO
          </Label>
          <Heading>Seus alunos</Heading>
          <Label muted>Uma visão organizada de cada pessoa que confia em você.</Label>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button secondary loading={exporting} onPress={exportPdf}>
            Exportar todos em PDF
          </Button>
          <Button onPress={() => router.push('/students/new')}>＋ Cadastrar aluno</Button>
        </View>
      </View>
      {params.saved === '1' && <Notice>Cadastro salvo com sucesso.</Notice>}
      {exportError && <Notice error>{exportError}</Notice>}
      <Card>
        <Field
          label="Buscar aluno"
          placeholder="Digite o nome…"
          value={search}
          onChangeText={setSearch}
        />
        <Label muted style={{ fontSize: 12 }}>
          {query.data ? `${query.data.count} aluno(s) encontrado(s)` : 'Consultando sua carteira…'}
        </Label>
      </Card>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <>
          <Notice error>{readableError(query.error)}</Notice>
          <Button secondary onPress={() => query.refetch()}>
            Tentar novamente
          </Button>
        </>
      ) : query.data.items.length ? (
        <Card>
          <FlatList
            scrollEnabled={false}
            data={query.data.items}
            keyExtractor={(s) => s.id}
            renderItem={({ item: s }) => (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  flexWrap: 'wrap',
                }}
              >
                <View
                  style={{
                    backgroundColor: '#323238',
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Label>{initials(s.full_name)}</Label>
                </View>
                <View style={{ flex: 1, minWidth: 120, gap: 3 }}>
                  <Label style={{ fontWeight: '600' }}>{s.full_name}</Label>
                  <Label muted style={{ fontSize: 12 }}>
                    {modalityLabels[s.modality]} · {s.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Label>
                  {s.email && (
                    <Label muted style={{ fontSize: 12 }}>
                      {s.email}
                    </Label>
                  )}
                  <Label muted style={{ fontSize: 12 }}>
                    {s.weekly_frequency ? `${s.weekly_frequency}×/semana` : 'Frequência a definir'}{' '}
                    ·{' '}
                    {s.monthly_fee_cents != null
                      ? `${formatBRL(s.monthly_fee_cents)}/mês`
                      : 'Mensalidade a definir'}
                  </Label>
                </View>
                <Button secondary onPress={() => router.push(`/students/${s.id}`)}>
                  Ver cadastro
                </Button>
              </View>
            )}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Button secondary disabled={page === 0} onPress={() => setPage((v) => v - 1)}>
              Anterior
            </Button>
            <Label muted style={{ fontSize: 12 }}>
              {page + 1} / {Math.max(1, Math.ceil(query.data.count / 20))}
            </Label>
            <Button
              secondary
              disabled={(page + 1) * 20 >= query.data.count}
              onPress={() => setPage((v) => v + 1)}
            >
              Próxima
            </Button>
          </View>
        </Card>
      ) : (
        <Card>
          <Heading level={2}>
            {debounced ? 'Nenhum aluno encontrado' : 'Comece pela primeira conexão'}
          </Heading>
          <Label muted>
            {debounced
              ? 'Tente outro nome para encontrar o cadastro.'
              : 'Os alunos cadastrados ficam disponíveis aqui, com seus objetivos e informações de contato.'}
          </Label>
          {!debounced && (
            <Button onPress={() => router.push('/students/new')}>Cadastrar primeiro aluno</Button>
          )}
        </Card>
      )}
    </>
  );
}
