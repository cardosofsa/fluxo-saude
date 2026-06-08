// Dados-semente (espelho da versão web). Fallback quando o Supabase não responde.
export const INITIAL_UNITS = [
  { id: 'upa_estadual', name: 'UPA Estadual', type: 'UPA', distance: '4.8 km', waitMinutes: 50, queueSize: 18, status: 'MÉDIO', color: '#F59E0B', address: 'Av. Eduardo Fróes da Mota, s/n (ao lado do HEC/Clériston, bairro 35º BI)', telephone: '(75) 3471-3705', doctorsCount: 4, occupiedBeds: 12, criticalCases: 2, todayCheckins: 36 },
  { id: 'mangabeira', name: 'UPA Mangabeira', type: 'UPA', distance: '3.5 km', waitMinutes: 15, queueSize: 6, status: 'BAIXO', color: '#10B981', address: 'Loteamento Jardim dos Namorados, s/n, Mangabeira', telephone: '(75) 3617-3268', doctorsCount: 3, occupiedBeds: 6, criticalCases: 1, todayCheckins: 24 },
  { id: 'queimadinha', name: 'UPA Queimadinha', type: 'UPA', distance: '1.2 km', waitMinutes: 95, queueSize: 24, status: 'ALTO', color: '#EF4444', address: 'Loteamento Boa Vista, s/n, Queimadinha', telephone: '(75) 3617-3270', doctorsCount: 2, occupiedBeds: 16, criticalCases: 5, todayCheckins: 52 },
  { id: 'feira_x', name: 'Policlínica do Feira X', type: 'Policlínica', distance: '3.9 km', waitMinutes: 40, queueSize: 10, status: 'MÉDIO', color: '#F59E0B', address: 'Rua A, s/n, Conjunto Feira X', telephone: '(75) 3617-3277', doctorsCount: 3, occupiedBeds: 9, criticalCases: 2, todayCheckins: 28 },
  { id: 'george_americo', name: 'Policlínica George Américo', type: 'Policlínica', distance: '5.2 km', waitMinutes: 65, queueSize: 15, status: 'MÉDIO', color: '#F59E0B', address: 'Rua B, s/n, George Américo', telephone: '(75) 3617-3279', doctorsCount: 3, occupiedBeds: 11, criticalCases: 3, todayCheckins: 32 },
  { id: 'parque_ipe', name: 'Policlínica Parque Ipê', type: 'Policlínica', distance: '4.1 km', waitMinutes: 20, queueSize: 4, status: 'BAIXO', color: '#10B981', address: 'Rua Rodolfo Valentim, nº 126, Parque Ipê', telephone: '(75) 3623-3133', doctorsCount: 2, occupiedBeds: 4, criticalCases: 0, todayCheckins: 18 },
  { id: 'rua_nova', name: 'Policlínica Rua Nova', type: 'Policlínica', distance: '2.5 km', waitMinutes: 30, queueSize: 7, status: 'BAIXO', color: '#10B981', address: 'Rua Cordeiro de Farias, nº 136, Rua Nova', telephone: '(75) 3617-3000', doctorsCount: 2, occupiedBeds: 5, criticalCases: 1, todayCheckins: 20 },
  { id: 'humildes', name: 'Policlínica de Humildes', type: 'Policlínica', distance: '14.5 km', waitMinutes: 10, queueSize: 2, status: 'BAIXO', color: '#10B981', address: 'Rua Cônego Olímpio, s/n, Distrito de Humildes', telephone: '(75) 3617-3280', doctorsCount: 2, occupiedBeds: 3, criticalCases: 0, todayCheckins: 12 },
  { id: 'sao_jose', name: 'Policlínica de São José', type: 'Policlínica', distance: '16.2 km', waitMinutes: 15, queueSize: 3, status: 'BAIXO', color: '#10B981', address: 'Rua da Praça, s/n, Distrito de São José', telephone: '(75) 3617-3118', doctorsCount: 2, occupiedBeds: 2, criticalCases: 0, todayCheckins: 8 },
  { id: 'regional_saude', name: 'Policlínica Regional de Saúde', type: 'Policlínica', distance: '4.9 km', waitMinutes: 55, queueSize: 13, status: 'MÉDIO', color: '#F59E0B', address: 'Av. Eduardo Fróes da Mota (Anel de Contorno), bairro 35º BI', telephone: '(75) 3600-0000', doctorsCount: 5, occupiedBeds: 0, criticalCases: 0, todayCheckins: 45 },
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
