import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Heading, Label, Notice } from '@core/ui';
export function Planned({
  name,
  phase,
  description,
  items,
}: {
  name: string;
  phase: string;
  description: string;
  items: string[];
}) {
  return (
    <>
      <Label muted style={{ fontSize: 11, letterSpacing: 1.5 }}>
        PLANO DE DESENVOLVIMENTO
      </Label>
      <Heading>{name}</Heading>
      <Notice>Etapa planejada · {phase}. Este módulo ainda não está disponível.</Notice>
      <Card>
        <Heading level={2}>{description}</Heading>
        <Label muted>
          A fundação atual contempla acesso, perfis, cadastro de alunos e indicadores dessa
          carteira.
        </Label>
        <View style={{ gap: 12, paddingVertical: 10 }}>
          {items.map((s, i) => (
            <Label key={s}>
              <Label muted>0{i + 1} </Label>
              {s}
            </Label>
          ))}
        </View>
        <Button secondary onPress={() => router.push('/students')}>
          Continuar na gestão de alunos
        </Button>
      </Card>
    </>
  );
}
