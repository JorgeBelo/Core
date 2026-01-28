import { supabase } from '../lib/supabaseClient';
import type { Notification } from '../types';
import { format, startOfDay } from 'date-fns';

export const createNotification = async (
  personalId: string,
  type: Notification['type'],
  title: string,
  message: string,
  relatedId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        personal_id: personalId,
        type,
        title,
        message,
        related_id: relatedId,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
};

export const checkAndCreateNotifications = async (personalId: string) => {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();

  // 1. Verificar pagamentos atrasados (payment_status pendente após payment_day)
  const { data: alunos, error: alunosError } = await supabase
    .from('alunos')
    .select('*')
    .eq('personal_id', personalId)
    .eq('active', true);

  if (!alunosError && alunos) {
    for (const aluno of alunos) {
      if (aluno.payment_status === 'pendente' && aluno.payment_day < diaHoje) {
        const diasAtraso = diaHoje - aluno.payment_day;
        const nome = aluno.nome || aluno.name || 'Aluno';
        const valor = aluno.monthly_fee || 0;

        // Verificar se já existe notificação para este aluno hoje
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('personal_id', personalId)
          .eq('type', 'atraso')
          .eq('related_id', aluno.id)
          .gte('created_at', format(startOfDay(hoje), 'yyyy-MM-dd'))
          .limit(1);

        if (!existing || existing.length === 0) {
          await createNotification(
            personalId,
            'atraso',
            'Pagamento Atrasado',
            `${nome} - Mensalidade de ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(valor)} está atrasada há ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}`,
            aluno.id
          );
        }
      }

      // 2. Verificar aniversários do dia
      if (aluno.birth_date) {
        const dt = new Date(aluno.birth_date);
        if (dt.getDate() === diaHoje && dt.getMonth() === mesHoje) {
          const nome = aluno.nome || aluno.name || 'Aluno';

          // Verificar se já existe notificação para este aniversário hoje
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('personal_id', personalId)
            .eq('type', 'aniversario')
            .eq('related_id', aluno.id)
            .gte('created_at', format(startOfDay(hoje), 'yyyy-MM-dd'))
            .limit(1);

          if (!existing || existing.length === 0) {
            await createNotification(
              personalId,
              'aniversario',
              'Aniversário do Dia',
              `Hoje é aniversário de ${nome}! 🎉`,
              aluno.id
            );
          }
        }
      }
    }
  }

  // 3. Verificar contas a pagar hoje
  const { data: contas, error: contasError } = await supabase
    .from('contas_financeiras')
    .select('*')
    .eq('personal_id', personalId)
    .eq('tipo', 'pagar')
    .eq('pago', false);

  if (!contasError && contas) {
    for (const conta of contas) {
      const dataVenc = new Date(conta.data_vencimento);
      if (
        dataVenc.getDate() === diaHoje &&
        dataVenc.getMonth() === mesHoje &&
        dataVenc.getFullYear() === hoje.getFullYear()
      ) {
        // Verificar se já existe notificação para esta conta hoje
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('personal_id', personalId)
          .eq('type', 'vencimento')
          .eq('related_id', conta.id)
          .gte('created_at', format(startOfDay(hoje), 'yyyy-MM-dd'))
          .limit(1);

        if (!existing || existing.length === 0) {
          const descricao = conta.descricao.split(' - Parcela')[0];
          await createNotification(
            personalId,
            'vencimento',
            'Conta a Pagar Hoje',
            `${descricao} - ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
            }).format(conta.valor)} vence hoje`,
            conta.id
          );
        }
      }
    }
  }
};

export const loadNotifications = async (personalId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('personal_id', personalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Notification[];
  } catch (error: any) {
    console.error('Erro ao carregar notificações:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Erro ao marcar notificação como lida:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (personalId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('personal_id', personalId)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return false;
  }
};
