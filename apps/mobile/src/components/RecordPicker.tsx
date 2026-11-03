import React, { useState } from 'react';
import { Modal, View, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Field, Heading, Label, Loading, Notice, colors } from '@core/ui';
import { repository, trainingRepository } from '../lib/backend';
import { readableError } from '@core/api-client';
import type { Student, Exercise } from '@core/domain';
export function RecordPicker({
  kind,
  visible,
  onClose,
  onSelect,
}: {
  kind: 'student' | 'exercise';
  visible: boolean;
  onClose: () => void;
  onSelect: (record: Student | Exercise) => void;
}) {
  const [search, setSearch] = useState(''),
    [term, setTerm] = useState(''),
    [page, setPage] = useState(0);
  const query = useQuery<{ items: (Student | Exercise)[]; count: number }>({
    queryKey: ['picker', kind, term, page],
    queryFn: async () =>
      kind === 'student'
        ? await repository!.students(term, page)
        : await trainingRepository!.exercises(term, page),
    enabled: visible,
  });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#000B',
          padding: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card style={{ width: '100%', maxWidth: 680, maxHeight: '90%' }}>
          <Heading level={2}>
            {kind === 'student' ? 'Escolher aluno' : 'Adicionar exercício'}
          </Heading>
          <Field
            label="Pesquisar por nome"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              setTerm(search);
              setPage(0);
            }}
          />
          <Button
            secondary
            onPress={() => {
              setTerm(search);
              setPage(0);
            }}
          >
            Pesquisar
          </Button>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            {query.isPending ? (
              <Loading />
            ) : query.error ? (
              <Notice error>{readableError(query.error)}</Notice>
            ) : query.data.items.length ? (
              query.data.items.map((item) => (
                <View
                  key={item.id}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  <Label>{'full_name' in item ? item.full_name : item.name}</Label>
                  {'muscle_group' in item && (
                    <Label muted>
                      {item.muscle_group} · {item.equipment || 'Sem equipamento'}
                    </Label>
                  )}
                  <Button
                    secondary
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    Selecionar
                  </Button>
                </View>
              ))
            ) : (
              <Label muted>Nenhum registro encontrado. Cadastre antes de selecionar.</Label>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
            <Button secondary disabled={page === 0} onPress={() => setPage((v) => v - 1)}>
              Anterior
            </Button>
            <Button
              secondary
              disabled={!query.data || (page + 1) * 20 >= query.data.count}
              onPress={() => setPage((v) => v + 1)}
            >
              Próxima
            </Button>
          </View>
          <Button secondary onPress={onClose}>
            Fechar seleção
          </Button>
        </Card>
      </View>
    </Modal>
  );
}
