-- SCHEMA DE BANCO DE DADOS PARA SUPABASE (FLUXO SAÚDE)
-- Copie e cole este script no Editor SQL (SQL Editor) do seu projeto Supabase para criar as tabelas e povoar com dados padrão.

-- 1. Unidades de Atendimento (Units)
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    distance TEXT NOT NULL,
    "waitMinutes" INTEGER NOT NULL DEFAULT 0,
    "queueSize" INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'BAIXO',
    color TEXT NOT NULL DEFAULT '#10B981',
    address TEXT NOT NULL,
    telephone TEXT,
    "doctorsCount" INTEGER NOT NULL DEFAULT 0,
    "occupiedBeds" INTEGER NOT NULL DEFAULT 0,
    "criticalCases" INTEGER NOT NULL DEFAULT 0,
    "todayCheckins" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar acesso público para simplificar o protótipo (desativando RLS)
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;

-- 2. Leitos (Beds)
CREATE TABLE IF NOT EXISTS public.beds (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'free', -- free, observation, critical
    "patientName" TEXT DEFAULT 'Nenhum',
    age TEXT DEFAULT '-',
    time TEXT DEFAULT '-',
    notes TEXT DEFAULT '',
    "unitId" TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.beds DISABLE ROW LEVEL SECURITY;

-- 3. Passagens de Plantão (Handovers)
CREATE TABLE IF NOT EXISTS public.handovers (
    id TEXT PRIMARY KEY,
    "bedLabel" TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    time TEXT NOT NULL,
    professional TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.handovers DISABLE ROW LEVEL SECURITY;

-- 4. Pacientes (Patients)
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    cpf TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cns TEXT,
    "birthDate" TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;

-- 5. Check-ins Digitais (Digital Check-ins)
CREATE TABLE IF NOT EXISTS public.digital_checkins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    symptom TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    time TEXT NOT NULL,
    code TEXT NOT NULL,
    "urgencyLevel" TEXT DEFAULT 'Verde',
    "triageNotes" TEXT DEFAULT '',
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.digital_checkins DISABLE ROW LEVEL SECURITY;

-- 6. Funcionários Clínicos/Fluxo (Staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    cpf TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- clinical, flow
    password TEXT NOT NULL,
    "unitId" TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- DADOS-SEMENTE (SEED DATA)
-- ==========================================

-- Inserir Unidades Padrão
INSERT INTO public.units (id, name, type, distance, "waitMinutes", "queueSize", status, color, address, telephone, "doctorsCount", "occupiedBeds", "criticalCases", "todayCheckins")
VALUES 
('upa_estadual', 'UPA Estadual', 'UPA', '4.8 km', 50, 18, 'MÉDIO', '#F59E0B', 'Av. Eduardo Fróes da Mota, s/n (ao lado do HEC/Clériston, bairro 35º BI)', '(75) 3471-3705', 4, 12, 2, 36),
('mangabeira', 'UPA Mangabeira', 'UPA', '3.5 km', 15, 6, 'BAIXO', '#10B981', 'Loteamento Jardim dos Namorados, s/n, Mangabeira', '(75) 3617-3268', 3, 6, 1, 24),
('queimadinha', 'UPA Queimadinha', 'UPA', '1.2 km', 95, 24, 'ALTO', '#EF4444', 'Loteamento Boa Vista, s/n, Queimadinha', '(75) 3617-3270', 2, 16, 5, 52),
('feira_x', 'Policlínica do Feira X', 'Policlínica', '3.9 km', 40, 10, 'MÉDIO', '#F59E0B', 'Rua A, s/n, Conjunto Feira X', '(75) 3617-3277', 3, 9, 2, 28),
('george_americo', 'Policlínica George Américo', 'Policlínica', '5.2 km', 65, 15, 'MÉDIO', '#F59E0B', 'Rua B, s/n, George Américo', '(75) 3617-3279', 3, 11, 3, 32),
('parque_ipe', 'Policlínica Parque Ipê', 'Policlínica', '4.1 km', 20, 4, 'BAIXO', '#10B981', 'Rua Rodolfo Valentim, nº 126, Parque Ipê', '(75) 3623-3133', 2, 4, 0, 18),
('rua_nova', 'Policlínica Rua Nova', 'Policlínica', '2.5 km', 30, 7, 'BAIXO', '#10B981', 'Rua Cordeiro de Farias, nº 136, Rua Nova', '(75) 3617-3000', 2, 5, 1, 20),
('humildes', 'Policlínica de Humildes', 'Policlínica', '14.5 km', 10, 2, 'BAIXO', '#10B981', 'Rua Cônego Olímpio, s/n, Distrito de Humildes', '(75) 3617-3280', 2, 3, 0, 12),
('sao_jose', 'Policlínica de São José', 'Policlínica', '16.2 km', 15, 3, 'BAIXO', '#10B981', 'Rua da Praça, s/n, Distrito de São José', '(75) 3617-3118', 2, 2, 0, 8),
('regional_saude', 'Policlínica Regional de Saúde', 'Policlínica', '4.9 km', 55, 13, 'MÉDIO', '#F59E0B', 'Av. Eduardo Fróes da Mota (Anel de Contorno), bairro 35º BI', '(75) 3600-0000', 5, 0, 0, 45)
ON CONFLICT (id) DO NOTHING;

-- Inserir Leitos Padrão
INSERT INTO public.beds (id, label, status, "patientName", age, time, notes, "unitId")
VALUES 
(1, 'Leito 01', 'free', 'Nenhum', '-', '-', 'Leito Higienizado', 'mangabeira'),
(2, 'Leito 02', 'observation', 'Marcos Oliveira', '45 anos', '14:20', 'Hipertensão leve, monitorando', 'mangabeira'),
(3, 'Leito 03', 'critical', 'Roberto Souza', '68 anos', '15:10', 'Dor torácica, aguarda transferência', 'mangabeira'),
(4, 'Leito 04', 'free', 'Nenhum', '-', '-', 'Pronto para uso', 'mangabeira'),
(5, 'Leito 05', 'free', 'Nenhum', '-', '-', 'Livre', 'mangabeira'),
(6, 'Leito 06', 'observation', 'Júlia Santos', '29 anos', '16:05', 'Crise de asma controlada', 'mangabeira'),
(7, 'Leito 07', 'free', 'Nenhum', '-', '-', 'Livre', 'mangabeira'),
(8, 'Leito 08', 'free', 'Nenhum', '-', '-', 'Livre', 'mangabeira'),
(9, 'Leito 09', 'free', 'Nenhum', '-', '-', 'Livre', 'mangabeira'),
(10, 'Leito 10', 'free', 'Nenhum', '-', '-', 'Livre', 'mangabeira'),
(11, 'Leito 11', 'free', 'Nenhum', '-', '-', 'Livre', 'mangabeira'),
(12, 'Leito 12', 'critical', 'Claudio Lima', '74 anos', '12:40', 'Ventilação mecânica invasiva', 'mangabeira')
ON CONFLICT (id) DO NOTHING;

-- Inserir Passagens de Plantão Padrão
INSERT INTO public.handovers (id, "bedLabel", status, title, description, time, professional)
VALUES 
('h1', 'Leito 12', 'critical', 'Leito 12 - Crítico', 'Paciente em ventilação mecânica, instável hemodinamicamente. Sinais vitais alterados.', '17:30', 'Dr. Ana Silva'),
('h2', 'Leito 03', 'observation', 'Leito 03 - Observação', 'Aguardando resultado de exames laboratoriais e eletrocardiograma de controle.', '16:45', 'Dr. Ana Silva'),
('h3', 'Leito 05', 'free', 'Leito 05 - Estável', 'Paciente recebeu alta clínica. Leito higienizado e liberado para novos atendimentos.', '15:20', 'Dr. Lucas Ferreira'),
('h4', 'Leito 08', 'critical', 'Leito 08 - Crítico', 'Instável hemodinamicamente, aguardando UTI Cardiológica via regulação estadual.', '14:10', 'Dra. Sandra Ramos')
ON CONFLICT (id) DO NOTHING;

-- Inserir Funcionários Padrão
INSERT INTO public.staff (id, cpf, name, role, password, "unitId")
VALUES 
('s_ana', '12345678900', 'Plantonista Ana Silva', 'clinical', '12345678', 'mangabeira'),
('s_carlos', '98765432100', 'Carlos Costa', 'flow', '87654321', 'mangabeira')
ON CONFLICT (id) DO NOTHING;

-- Inserir Paciente de Teste Padrão
INSERT INTO public.patients (id, cpf, name, cns, "birthDate", password)
VALUES 
('p_rodrigo', '12345678901', 'Rodrigo Carvalho', '898 0001 2345 6789', '1991-09-14', '123')
ON CONFLICT (id) DO NOTHING;
