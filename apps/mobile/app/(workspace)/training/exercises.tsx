import React, { useState } from 'react';
import { View, Modal, ScrollView, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, Card, Choice, Field, Heading, Label, Loading, Notice, colors } from '@core/ui';
import {
  exerciseSchema,
  newExercise,
  experienceLabels,
  type Exercise,
  type ExerciseInput,
} from '@core/domain';
import { readableError } from '@core/api-client';
import { trainingRepository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
export default function ExerciseLibrary() {
  const { professional } = useSession();
  const cache = useQueryClient();
  const [search, setSearch] = useState(''),
    [term, setTerm] = useState(''),
    [group, setGroup] = useState(''),
    [filterGroup, setFilterGroup] = useState(''),
    [favorites, setFavorites] = useState(false),
    [page, setPage] = useState(0);
  const [editor, setEditor] = useState<{ input: ExerciseInput; existing?: Exercise } | null>(null),
    [validation, setValidation] = useState(''),
    [tagsText, setTagsText] = useState('');
  const query = useQuery({
    queryKey: ['exercises', professional?.id, term, page, filterGroup, favorites],
    queryFn: () => trainingRepository!.exercises(term, page, filterGroup, favorites),
    enabled: !!professional,
  });
  const save = useMutation({
    mutationFn: () =>
      trainingRepository!.saveExercise(
        exerciseSchema.parse(editor!.input),
        professional!.id,
        editor!.existing,
      ),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['exercises'] });
      await cache.invalidateQueries({ queryKey: ['picker', 'exercise'] });
      setEditor(null);
    },
  });
  function update<K extends keyof ExerciseInput>(key: K, value: ExerciseInput[K]) {
    setEditor((v) => (v ? { ...v, input: { ...v.input, [key]: value } } : v));
  }
  function submit() {
    const result = exerciseSchema.safeParse(editor!.input);
    if (!result.success) {
      setValidation(result.error.issues.map((v) => v.message).join('\n'));
      return;
    }
    setValidation('');
    save.mutate();
  }
  return (
    <>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <View style={{ gap: 6 }}>
          <Label muted>TREINOS / BIBLIOTECA</Label>
          <Heading>Seu repertório de movimento.</Heading>
          <Label muted>Exercícios próprios, organizados para prescrever com agilidade.</Label>
        </View>
        <Button
          onPress={() => {
            save.reset();
            setValidation('');
            setEditor({ input: newExercise() });
            setTagsText('');
          }}
        >
          ＋ Novo exercício
        </Button>
      </View>
      <Button secondary onPress={() => router.push('/training')}>
        Voltar para treinos
      </Button>
      <Card>
        <Field
          label="Nome do exercício"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setTerm(search);
            setFilterGroup(group);
            setPage(0);
          }}
        />
        <Field
          label="Grupo muscular (filtro exato)"
          value={group}
          onChangeText={setGroup}
          placeholder="Ex.: Quadríceps"
        />
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button
            secondary
            onPress={() => {
              setTerm(search);
              setFilterGroup(group);
              setPage(0);
            }}
          >
            Aplicar filtros
          </Button>
          <Button
            secondary
            onPress={() => {
              setFavorites((v) => !v);
              setPage(0);
            }}
          >
            {favorites ? 'Mostrar todos' : 'Somente favoritos'}
          </Button>
        </View>
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
      ) : (
        <>
          <Label muted>{query.data.count} exercício(s)</Label>
          {!query.data.items.length && (
            <Card>
              <Heading level={2}>Uma biblioteca com a sua assinatura</Heading>
              <Label muted>
                Cadastre o primeiro exercício. Use instruções e vídeos próprios ou com licença
                adequada.
              </Label>
            </Card>
          )}
          {query.data.items.map((e) => (
            <Card key={e.id}>
              <Heading level={3}>
                {e.favorite ? '★ ' : ''}
                {e.name}
              </Heading>
              <Label muted>
                {e.muscle_group} · {e.equipment || 'Sem equipamento'} ·{' '}
                {experienceLabels[e.complexity]}
              </Label>
              {!!e.instructions && <Label>{e.instructions}</Label>}
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <Button
                  secondary
                  onPress={() => {
                    save.reset();
                    setValidation('');
                    setEditor({ input: e, existing: e });
                    setTagsText(e.tags.join(', '));
                  }}
                >
                  Editar exercício
                </Button>
                {!!e.video_url && (
                  <Button
                    secondary
                    onPress={() =>
                      Linking.openURL(e.video_url).catch(() =>
                        setValidation('Não foi possível abrir o vídeo.'),
                      )
                    }
                  >
                    Abrir vídeo
                  </Button>
                )}
              </View>
            </Card>
          ))}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
            <Button secondary disabled={page === 0} onPress={() => setPage((v) => v - 1)}>
              Anterior
            </Button>
            <Button
              secondary
              disabled={(page + 1) * 20 >= query.data.count}
              onPress={() => setPage((v) => v + 1)}
            >
              Próxima
            </Button>
          </View>
        </>
      )}
      {!editor && !!validation && <Notice error>{validation}</Notice>}
      <Modal
        visible={!!editor}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!save.isPending) setEditor(null);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#000B',
            padding: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card style={{ width: '100%', maxWidth: 720, maxHeight: '95%' }}>
            <Heading level={2}>{editor?.existing ? 'Editar exercício' : 'Novo exercício'}</Heading>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={{ gap: 16 }}
            >
              {!!validation && <Notice error>{validation}</Notice>}
              {save.error && <Notice error>{readableError(save.error)}</Notice>}
              {editor && (
                <>
                  <Field
                    label="Nome *"
                    value={editor.input.name}
                    onChangeText={(v) => update('name', v)}
                    maxLength={160}
                  />
                  <Field
                    label="Grupo muscular *"
                    value={editor.input.muscle_group}
                    onChangeText={(v) => update('muscle_group', v)}
                    maxLength={80}
                  />
                  <Field
                    label="Equipamento"
                    value={editor.input.equipment}
                    onChangeText={(v) => update('equipment', v)}
                    maxLength={120}
                  />
                  <Field
                    label="Tipo de movimento"
                    value={editor.input.movement}
                    onChangeText={(v) => update('movement', v)}
                    maxLength={120}
                  />
                  <Choice
                    label="Complexidade"
                    value={editor.input.complexity}
                    onChange={(v) => update('complexity', v)}
                    options={Object.entries(experienceLabels).map(([value, label]) => ({
                      value: value as ExerciseInput['complexity'],
                      label,
                    }))}
                  />
                  <Field
                    label="Instruções técnicas"
                    multiline
                    value={editor.input.instructions}
                    onChangeText={(v) => update('instructions', v)}
                    maxLength={5000}
                  />
                  <Field
                    label="Vídeo próprio ou licenciado (HTTPS)"
                    value={editor.input.video_url}
                    onChangeText={(v) => update('video_url', v)}
                    autoCapitalize="none"
                    maxLength={2048}
                  />
                  <Label muted style={{ fontSize: 12 }}>
                    O vídeo é aberto no navegador. Adicione apenas mídia que você tenha direito de
                    utilizar.
                  </Label>
                  <Field
                    label="Tags separadas por vírgula"
                    value={tagsText}
                    onChangeText={(v) => {
                      setTagsText(v);
                      update(
                        'tags',
                        v
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      );
                    }}
                  />
                  <Choice
                    label="Favorito"
                    value={editor.input.favorite ? 'yes' : 'no'}
                    onChange={(v) => update('favorite', v === 'yes')}
                    options={[
                      { value: 'yes', label: 'Sim' },
                      { value: 'no', label: 'Não' },
                    ]}
                  />
                  {editor.existing && (
                    <Choice
                      label="Disponibilidade na biblioteca"
                      value={editor.input.archived ? 'archived' : 'available'}
                      onChange={(v) => update('archived', v === 'archived')}
                      options={[
                        { value: 'available', label: 'Disponível' },
                        { value: 'archived', label: 'Arquivado' },
                      ]}
                    />
                  )}
                </>
              )}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Button secondary disabled={save.isPending} onPress={() => setEditor(null)}>
                Cancelar
              </Button>
              <Button loading={save.isPending} onPress={submit}>
                Salvar exercício
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
    </>
  );
}
