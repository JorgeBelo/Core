import React from 'react';
import { View } from 'react-native';
import { router, Slot, usePathname } from 'expo-router';
import { Button, Heading, Label } from '@core/ui';
const sections = [
  ['/finance', 'Visão geral'],
  ['/finance/receivables', 'A receber'],
  ['/finance/payables', 'A pagar'],
  ['/finance/plans', 'Planos'],
  ['/finance/contracts', 'Contratos'],
  ['/finance/recurrences', 'Recorrências'],
  ['/finance/reports', 'Relatórios'],
] as const;
export default function FinanceLayout() {
  const path = usePathname();
  return (
    <>
      <View style={{ gap: 6 }}>
        <Label muted>GESTÃO PROFISSIONAL</Label>
        <Heading>Clareza em cada movimento.</Heading>
        <Label muted>Contas previstas e movimentações confirmadas, com histórico preservado.</Label>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {sections.map(([href, label]) => (
          <Button key={href} secondary={path !== href} onPress={() => router.push(href)}>
            {label}
          </Button>
        ))}
      </View>
      <Slot />
    </>
  );
}
