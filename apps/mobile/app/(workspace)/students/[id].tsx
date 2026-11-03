import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Loading, Notice } from '@core/ui';
import { readableError } from '@core/api-client';
import { StudentEditor } from '../../../src/components/StudentEditor';
import { repository } from '../../../src/lib/backend';
import { useSession } from '../../../src/lib/session';
export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { professional } = useSession();
  const query = useQuery({
    queryKey: ['student', id, professional?.id],
    queryFn: () => repository!.student(id),
    enabled: !!professional && /^[a-f0-9-]{36}$/i.test(id),
  });
  if (!/^[a-f0-9-]{36}$/i.test(id)) return <Notice error>Identificador de aluno inválido.</Notice>;
  if (query.isPending) return <Loading />;
  if (query.error)
    return (
      <>
        <Notice error>{readableError(query.error)}</Notice>
        <Button onPress={() => query.refetch()}>Tentar novamente</Button>
      </>
    );
  return <StudentEditor key={query.data.updated_at} student={query.data} />;
}
