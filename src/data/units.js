// Dados-semente do protótipo (UPAs, Policlínicas, leitos e passagens de plantão).
// Em produção isto deve vir de uma API. Mantido isolado para facilitar essa troca.

export const INITIAL_UNITS = [
  {
    id: 'upa_estadual',
    name: 'UPA Estadual',
    type: 'UPA',
    distance: '4.8 km',
    waitMinutes: 50,
    queueSize: 18,
    status: 'MÉDIO',
    color: '#F59E0B',
    address: 'Av. Eduardo Fróes da Mota, s/n (ao lado do HEC/Clériston, bairro 35º BI)',
    telephone: '(75) 3471-3705',
    doctorsCount: 4,
    occupiedBeds: 12,
    criticalCases: 2,
    todayCheckins: 36,
  },
  {
    id: 'mangabeira',
    name: 'UPA Mangabeira',
    type: 'UPA',
    distance: '3.5 km',
    waitMinutes: 15,
    queueSize: 6,
    status: 'BAIXO',
    color: '#10B981',
    address: 'Loteamento Jardim dos Namorados, s/n, Mangabeira',
    telephone: '(75) 3617-3268',
    doctorsCount: 3,
    occupiedBeds: 6,
    criticalCases: 1,
    todayCheckins: 24,
  },
  {
    id: 'queimadinha',
    name: 'UPA Queimadinha',
    type: 'UPA',
    distance: '1.2 km',
    waitMinutes: 95,
    queueSize: 24,
    status: 'ALTO',
    color: '#EF4444',
    address: 'Loteamento Boa Vista, s/n, Queimadinha',
    telephone: '(75) 3617-3270',
    doctorsCount: 2,
    occupiedBeds: 16,
    criticalCases: 5,
    todayCheckins: 52,
  },
  {
    id: 'feira_x',
    name: 'Policlínica do Feira X',
    type: 'Policlínica',
    distance: '3.9 km',
    waitMinutes: 40,
    queueSize: 10,
    status: 'MÉDIO',
    color: '#F59E0B',
    address: 'Rua A, s/n, Conjunto Feira X',
    telephone: '(75) 3617-3277',
    doctorsCount: 3,
    occupiedBeds: 9,
    criticalCases: 2,
    todayCheckins: 28,
  },
  {
    id: 'george_americo',
    name: 'Policlínica George Américo',
    type: 'Policlínica',
    distance: '5.2 km',
    waitMinutes: 65,
    queueSize: 15,
    status: 'MÉDIO',
    color: '#F59E0B',
    address: 'Rua B, s/n, George Américo',
    telephone: '(75) 3617-3279',
    doctorsCount: 3,
    occupiedBeds: 11,
    criticalCases: 3,
    todayCheckins: 32,
  },
  {
    id: 'parque_ipe',
    name: 'Policlínica Parque Ipê',
    type: 'Policlínica',
    distance: '4.1 km',
    waitMinutes: 20,
    queueSize: 4,
    status: 'BAIXO',
    color: '#10B981',
    address: 'Rua Rodolfo Valentim, nº 126, Parque Ipê',
    telephone: '(75) 3623-3133',
    doctorsCount: 2,
    occupiedBeds: 4,
    criticalCases: 0,
    todayCheckins: 18,
  },
  {
    id: 'rua_nova',
    name: 'Policlínica Rua Nova',
    type: 'Policlínica',
    distance: '2.5 km',
    waitMinutes: 30,
    queueSize: 7,
    status: 'BAIXO',
    color: '#10B981',
    address: 'Rua Cordeiro de Farias, nº 136, Rua Nova',
    telephone: '(75) 3617-3000',
    doctorsCount: 2,
    occupiedBeds: 5,
    criticalCases: 1,
    todayCheckins: 20,
  },
  {
    id: 'humildes',
    name: 'Policlínica de Humildes',
    type: 'Policlínica',
    distance: '14.5 km',
    waitMinutes: 10,
    queueSize: 2,
    status: 'BAIXO',
    color: '#10B981',
    address: 'Rua Cônego Olímpio, s/n, Distrito de Humildes',
    telephone: '(75) 3617-3280',
    doctorsCount: 2,
    occupiedBeds: 3,
    criticalCases: 0,
    todayCheckins: 12,
  },
  {
    id: 'sao_jose',
    name: 'Policlínica de São José',
    type: 'Policlínica',
    distance: '16.2 km',
    waitMinutes: 15,
    queueSize: 3,
    status: 'BAIXO',
    color: '#10B981',
    address: 'Rua da Praça, s/n, Distrito de São José',
    telephone: '(75) 3617-3118',
    doctorsCount: 2,
    occupiedBeds: 2,
    criticalCases: 0,
    todayCheckins: 8,
  },
  {
    id: 'regional_saude',
    name: 'Policlínica Regional de Saúde',
    type: 'Policlínica',
    distance: '4.9 km',
    waitMinutes: 55,
    queueSize: 13,
    status: 'MÉDIO',
    color: '#F59E0B',
    address: 'Av. Eduardo Fróes da Mota (Anel de Contorno), bairro 35º BI',
    telephone: '(75) 3600-0000',
    doctorsCount: 5,
    occupiedBeds: 0,
    criticalCases: 0,
    todayCheckins: 45,
  },
];

export const REAL_COORDS = {
  upa_estadual: [-12.2798, -38.9412],
  mangabeira: [-12.2173, -38.9332],
  queimadinha: [-12.2415, -38.9546],
  feira_x: [-12.2764, -38.9801],
  george_americo: [-12.2255, -38.9772],
  parque_ipe: [-12.2223, -38.9612],
  rua_nova: [-12.2618, -38.9774],
  humildes: [-12.3562, -38.8715],
  sao_jose: [-12.1154, -38.9953],
  regional_saude: [-12.2789, -38.9405],
};

const generateInitialBeds = () => {
  const unitIds = ['upa_estadual', 'mangabeira', 'queimadinha', 'feira_x', 'george_americo', 'parque_ipe', 'rua_nova', 'humildes', 'sao_jose', 'regional_saude'];
  const bedsList = [];
  let globalId = 1;
  unitIds.forEach(unitId => {
    for (let i = 1; i <= 12; i++) {
      let status = 'free';
      let patientName = 'Nenhum';
      let age = '-';
      let time = '-';
      let notes = 'Leito Higienizado';
      
      if (unitId === 'mangabeira' || unitId === 'queimadinha') {
        if (i === 2) {
          status = 'observation';
          patientName = 'Marcos Oliveira';
          age = '45 anos';
          time = '14:20';
          notes = 'Hipertensão leve, monitorando';
        } else if (i === 3) {
          status = 'critical';
          patientName = 'Roberto Souza';
          age = '68 anos';
          time = '15:10';
          notes = 'Dor torácica, aguarda transferência';
        } else if (i === 6) {
          status = 'observation';
          patientName = 'Júlia Santos';
          age = '29 anos';
          time = '16:05';
          notes = 'Crise de asma controlada';
        } else if (i === 12) {
          status = 'critical';
          patientName = 'Claudio Lima';
          age = '74 anos';
          time = '12:40';
          notes = 'Ventilação mecânica invasiva';
        }
      }
      
      bedsList.push({
        id: globalId++,
        label: `Leito ${i < 10 ? '0' + i : i}`,
        status,
        patientName,
        age,
        time,
        notes,
        unitId
      });
    }
  });
  return bedsList;
};

export const INITIAL_BEDS = generateInitialBeds();

export const INITIAL_HANDOVERS = [
  { id: 'h1', bedLabel: 'Leito 12', status: 'critical', title: 'Leito 12 - Crítico', description: 'Paciente em ventilação mecânica, instável hemodinamicamente. Sinais vitais alterados.', time: '17:30', professional: 'Dr. Ana Silva', unitId: 'mangabeira' },
  { id: 'h2', bedLabel: 'Leito 03', status: 'observation', title: 'Leito 03 - Observação', description: 'Aguardando resultado de exames laboratoriais e eletrocardiograma de controle.', time: '16:45', professional: 'Dr. Ana Silva', unitId: 'mangabeira' },
  { id: 'h3', bedLabel: 'Leito 05', status: 'free', title: 'Leito 05 - Estável', description: 'Paciente recebeu alta clínica. Leito higienizado e liberado para novos atendimentos.', time: '15:20', professional: 'Dr. Lucas Ferreira', unitId: 'mangabeira' },
  { id: 'h4', bedLabel: 'Leito 08', status: 'critical', title: 'Leito 08 - Crítico', description: 'Instável hemodinamicamente, aguardando UTI Cardiológica via regulação estadual.', time: '14:10', professional: 'Dra. Sandra Ramos', unitId: 'mangabeira' },
];
