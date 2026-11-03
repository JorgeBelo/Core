import React, { useEffect, useState } from 'react';
import { Modal, View, ScrollView, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice, colors } from '@core/ui';
import { exerciseSchema, newExercise, type Exercise } from '@core/domain';
import { readableError } from '@core/api-client';
import { trainingRepository } from '../lib/backend';
import { IconButton } from './Visual';
import { useSession } from '../lib/session';

export function ExercisePicker({
  existingIds,
  onClose,
  onAdd,
}: {
  existingIds: string[];
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
}) {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [creating, setCreating] = useState(false),
    [newInput, setNewInput] = useState(newExercise()),
    [createError, setCreateError] = useState('');
  const [search, setSearch] = useState(''),
    [term, setTerm] = useState(''),
    [page, setPage] = useState(0),
    [filter, setFilter] = useState<'all' | 'favorites'>('all'),
    [selected, setSelected] = useState<Record<string, Exercise>>({});
  const remaining = Math.max(0, 100 - existingIds.length);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const q = useQuery({
    queryKey: ['exercise-picker', term, page, filter],
    queryFn: () => trainingRepository!.exercises(term, page, '', filter === 'favorites'),
  });
  const count = Object.keys(selected).length;
  const create = useMutation({
    mutationFn: () =>
      trainingRepository!.saveExercise(exerciseSchema.parse(newInput), professional!.id),
    onSuccess: async (record) => {
      setSelected((s) => (Object.keys(s).length < remaining ? { ...s, [record.id]: record } : s));
      setSearch('');
      setTerm('');
      setPage(0);
      setFilter('all');
      setCreating(false);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['exercise-picker'] }),
        cache.invalidateQueries({ queryKey: ['exercises'] }),
      ]);
    },
  });
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!create.isPending) onClose();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#000B',
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card style={{ width: '100%', maxWidth: 780, maxHeight: '94%', padding: 20, gap: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Heading level={2}>Escolha os exercícios</Heading>
              <Label muted style={{ fontSize: 12 }}>
                Selecione vários e adicione de uma vez.
              </Label>
            </View>
            <IconButton
              icon="close"
              label="Fechar exercícios"
              onPress={onClose}
              disabled={create.isPending}
            />
          </View>
          {creating ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <Heading level={3}>Novo exercício</Heading>
              <Field
                label="Nome do novo exercício *"
                value={newInput.name}
                editable={!create.isPending}
                onChangeText={(v) => setNewInput((f) => ({ ...f, name: v }))}
                maxLength={160}
              />
              <Field
                label="Grupo muscular do novo exercício *"
                placeholder="Ex.: Quadríceps"
                value={newInput.muscle_group}
                editable={!create.isPending}
                onChangeText={(v) => setNewInput((f) => ({ ...f, muscle_group: v }))}
                maxLength={80}
              />
              <Label muted style={{ fontSize: 12 }}>
                Você pode complementar as instruções e o vídeo na biblioteca depois.
              </Label>
              {createError && <Notice error>{createError}</Notice>}
              {create.error && <Notice error>{readableError(create.error)}</Notice>}
              <Button
                loading={create.isPending}
                onPress={() => {
                  const parsed = exerciseSchema.safeParse(newInput);
                  if (!parsed.success) {
                    setCreateError('Preencha o nome e o grupo muscular do exercício.');
                    return;
                  }
                  setCreateError('');
                  create.mutate();
                }}
              >
                Salvar exercício
              </Button>
              <Button secondary disabled={create.isPending} onPress={() => setCreating(false)}>
                Voltar à seleção
              </Button>
            </ScrollView>
          ) : (
            <>
              <Field
                label="Buscar exercício"
                placeholder="Nome do exercício…"
                value={search}
                onChangeText={setSearch}
              />
              <Choice
                label="Biblioteca"
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setPage(0);
                }}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'favorites', label: '★ Favoritos' },
                ]}
              />
              <Button
                secondary
                onPress={() => {
                  setNewInput(newExercise());
                  setCreateError('');
                  create.reset();
                  setCreating(true);
                }}
              >
                ＋ Cadastrar exercício
              </Button>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 10 }}
                style={{ flexShrink: 1 }}
              >
                {q.isPending ? (
                  <Loading />
                ) : q.error ? (
                  <>
                    <Notice error>{readableError(q.error)}</Notice>
                    <Button secondary onPress={() => q.refetch()}>
                      Tentar novamente
                    </Button>
                  </>
                ) : q.data.items.length ? (
                  q.data.items.map((e) => {
                    const existing = existingIds.includes(e.id),
                      checked = !!selected[e.id];
                    const disabled = existing || (!checked && count >= remaining);
                    return (
                      <Pressable
                        key={e.id}
                        accessibilityRole="checkbox"
                        accessibilityLabel={e.name}
                        accessibilityState={{ checked: existing || checked, disabled }}
                        aria-checked={existing || checked}
                        disabled={disabled}
                        onPress={() =>
                          setSelected((s) => {
                            const next = { ...s };
                            if (next[e.id]) delete next[e.id];
                            else next[e.id] = e;
                            return next;
                          })
                        }
                        style={{
                          padding: 14,
                          borderWidth: 1,
                          borderRadius: 12,
                          borderColor: checked ? '#AF514C' : colors.border,
                          backgroundColor: checked ? '#322025' : '#18181D',
                          flexDirection: 'row',
                          gap: 12,
                          alignItems: 'center',
                          opacity: existing ? 0.5 : 1,
                        }}
                      >
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            backgroundColor: '#2E2E36',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons
                            name="barbell-outline"
                            size={24}
                            color={checked ? '#F0AAA5' : '#B6B6C0'}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Label style={{ fontWeight: '600' }}>{e.name}</Label>
                          <Label muted style={{ fontSize: 12 }}>
                            {e.muscle_group} · {e.equipment || 'Sem equipamento'}
                          </Label>
                          {existing && (
                            <Label muted style={{ fontSize: 11 }}>
                              Já adicionado neste treino
                            </Label>
                          )}
                        </View>
                        <Ionicons
                          name={checked || existing ? 'checkbox' : 'square-outline'}
                          color={checked ? '#E9938B' : '#858592'}
                          size={24}
                        />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 20, gap: 8 }}>
                    <Heading level={3}>
                      {term || filter === 'favorites'
                        ? 'Nenhum exercício encontrado'
                        : 'Sua biblioteca ainda está vazia'}
                    </Heading>
                    <Label muted>
                      {term
                        ? 'Tente outro nome.'
                        : filter === 'favorites'
                          ? 'Marque exercícios como favoritos na biblioteca.'
                          : 'Cadastre seus exercícios na Biblioteca antes de montar o treino.'}
                    </Label>
                  </View>
                )}
              </ScrollView>
              {!!q.data && q.data.count > 20 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <IconButton
                    icon="chevron-back"
                    label="Exercícios anteriores"
                    disabled={!page}
                    onPress={() => setPage((v) => v - 1)}
                  />
                  <Label muted>
                    {page + 1} / {Math.ceil(q.data.count / 20)}
                  </Label>
                  <IconButton
                    icon="chevron-forward"
                    label="Mais exercícios"
                    disabled={(page + 1) * 20 >= q.data.count}
                    onPress={() => setPage((v) => v + 1)}
                  />
                </View>
              )}
              {count >= remaining && (
                <Label muted style={{ fontSize: 12 }}>
                  Limite de 100 exercícios por treino.
                </Label>
              )}
              <Button
                disabled={!count}
                onPress={() => {
                  onAdd(Object.values(selected));
                  onClose();
                }}
              >
                Adicionar {count ? `${count} exercício${count > 1 ? 's' : ''}` : 'selecionados'}
              </Button>
            </>
          )}
        </Card>
      </View>
    </Modal>
  );
}
