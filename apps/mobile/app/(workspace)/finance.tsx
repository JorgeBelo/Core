import React from 'react';
import { Planned } from '../../src/components/Planned';
export default function Finance() {
  return (
    <Planned
      name="Financeiro"
      phase="Fase 3"
      description="Clareza para cuidar do seu trabalho."
      items={[
        'Planos e contratos',
        'Contas a receber, pagamentos parciais e despesas',
        'Fluxo de caixa previsto e realizado',
        'Relatórios gerenciais',
      ]}
    />
  );
}
