import React from 'react';
import { Planned } from '../../src/components/Planned';
export default function Schedule() {
  return (
    <Planned
      name="Agenda"
      phase="Fase 4"
      description="Uma rotina bem organizada, atendimento por atendimento."
      items={[
        'Calendário de atendimentos e recorrências',
        'Verificação de conflitos de horário',
        'Presenças, faltas e regras configuráveis de reposição',
      ]}
    />
  );
}
