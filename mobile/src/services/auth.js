// Lógica de autenticação pura (compartilhada com a versão web).
export const ADMIN_CREDENTIALS = { username: 'admin', password: 'adm123' };

export const DEFAULT_STAFF = [
  { cpf: '12345678900', password: '12345678', name: 'Plantonista Ana Silva', role: 'clinical', unitId: 'mangabeira' },
  { cpf: '98765432100', password: '87654321', name: 'Carlos Costa', role: 'flow', unitId: 'mangabeira' },
];

export const cleanCPF = (value) => (value || '').replace(/\D/g, '');
export const isValidCPFLength = (value) => cleanCPF(value).length === 11;
export const generatePassword = () =>
  Math.floor(10000000 + Math.random() * 90000000).toString();

export const isAdmin = (username, password) =>
  (username || '').toLowerCase() === ADMIN_CREDENTIALS.username &&
  password === ADMIN_CREDENTIALS.password;

export const findStaffByCredentials = (staffMembers, username, password) => {
  const cpf = cleanCPF(username);
  return staffMembers.find((s) => cleanCPF(s.cpf) === cpf && s.password === password) || null;
};

export const screenForRole = (role) => {
  if (role === 'admin') return 'ProfessionalAdmin';
  if (role === 'clinical') return 'ProfessionalDashboard';
  return 'ProfessionalFlow';
};
