-- Core - Gestão para Personal Trainers
-- Schema do Banco de Dados PostgreSQL

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Personal Trainers
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Alunos
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    frequency_per_week INTEGER NOT NULL DEFAULT 1,
    monthly_fee DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    observations TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para alunos
CREATE INDEX idx_alunos_personal_id ON alunos(personal_id);
CREATE INDEX idx_alunos_active ON alunos(active);

-- Tabela de Aulas
CREATE TABLE aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'realizada' CHECK (status IN ('realizada', 'falta', 'reposicao')),
    is_reposition BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para aulas
CREATE INDEX idx_aulas_aluno_id ON aulas(aluno_id);
CREATE INDEX idx_aulas_personal_id ON aulas(personal_id);
CREATE INDEX idx_aulas_date ON aulas(date);

-- Tabela de Mensalidades
CREATE TABLE mensalidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
    paid_date DATE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mensalidades
CREATE INDEX idx_mensalidades_aluno_id ON mensalidades(aluno_id);
CREATE INDEX idx_mensalidades_personal_id ON mensalidades(personal_id);
CREATE INDEX idx_mensalidades_status ON mensalidades(status);
CREATE INDEX idx_mensalidades_due_date ON mensalidades(due_date);

-- Tabela de Notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('aniversario', 'vencimento', 'atraso', 'aula')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notificações
CREATE INDEX idx_notifications_personal_id ON notifications(personal_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Tabela de Agenda
CREATE TABLE agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60, -- minutos
    status VARCHAR(20) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'livre', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para agenda
CREATE INDEX idx_agenda_personal_id ON agenda(personal_id);
CREATE INDEX idx_agenda_aluno_id ON agenda(aluno_id);
CREATE INDEX idx_agenda_date ON agenda(date);
CREATE INDEX idx_agenda_date_time ON agenda(date, time);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mensalidades_updated_at BEFORE UPDATE ON mensalidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON agenda
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views úteis

-- View: Dashboard resumo
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    u.id as personal_id,
    COUNT(DISTINCT a.id) FILTER (WHERE a.active = true) as total_alunos_ativos,
    COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'pago' AND DATE_TRUNC('month', m.paid_date) = DATE_TRUNC('month', CURRENT_DATE)) as mensalidades_pagas_mes,
    COALESCE(SUM(m.amount) FILTER (WHERE m.status = 'pago' AND DATE_TRUNC('month', m.paid_date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as faturamento_mes,
    COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'atrasado') as mensalidades_atrasadas,
    COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'pendente' AND m.due_date <= CURRENT_DATE + INTERVAL '3 days') as mensalidades_proximas_vencimento
FROM users u
LEFT JOIN alunos a ON a.personal_id = u.id
LEFT JOIN mensalidades m ON m.personal_id = u.id
GROUP BY u.id;
