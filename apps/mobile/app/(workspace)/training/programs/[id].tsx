import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Loading, Notice } from '@core/ui';
import { readableError } from '@core/api-client';
import { ProgramEditor } from '../../../../src/components/ProgramEditor';
import { trainingRepository } from '../../../../src/lib/backend';
export default function EditProgram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['program', id],
    queryFn: () => trainingRepository!.program(id),
  });
  if (query.isPending) return <Loading />;
  if (query.error)
    return (
      <>
        <Notice error>{readableError(query.error)}</Notice>
        <Button onPress={() => query.refetch()}>Tentar novamente</Button>
      </>
    );
  return <ProgramEditor key={query.data.id} program={query.data} />;
}
