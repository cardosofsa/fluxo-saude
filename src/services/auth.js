// Lógica de autenticação pura (sem React) — fácil de testar.
// ATENÇÃO: isto é um protótipo. Em produção a autenticação deve ser feita
// no backend, com hash de senha e tokens — nunca comparar senha em texto puro
// no frontend nem manter usuários no cliente.

export const ADMIN_CREDENTIALS = { username: 'admin', password: 'adm123' };

export const DEFAULT_STAFF = [
  { cpf: '12345678900', password: '12345678', name: 'Plantonista Ana Silva', role: 'clinical', unitId: 'mangabeira' },
  { cpf: '98765432100', password: '87654321', name: 'Carlos Costa', role: 'flow', unitId: 'mangabeira' },
];

/** Remove qualquer formatação do CPF, deixando só dígitos. */
export const cleanCPF = (value) => (value || '').replace(/\D/g, '');

/** CPF válido (formato): exatamente 11 dígitos após limpeza. */
export const isValidCPFLength = (value) => cleanCPF(value).length === 11;

/** Gera uma senha numérica de 8 dígitos. */
export const generatePassword = () =>
  Math.floor(10000000 + Math.random() * 90000000).toString();

/** Verifica se as credenciais são do administrador. */
export const isAdmin = (username, password) =>
  (username || '').toLowerCase() === ADMIN_CREDENTIALS.username &&
  password === ADMIN_CREDENTIALS.password;

/** Encontra um funcionário pelas credenciais (CPF formatado ou não). */
export const findStaffByCredentials = (staffMembers, username, password) => {
  const cpf = cleanCPF(username);
  return staffMembers.find((s) => cleanCPF(s.cpf) === cpf && s.password === password) || null;
};

/** Tela de destino conforme o papel do usuário. */
export const screenForRole = (role) => {
  if (role === 'admin') return 'professional_admin';
  if (role === 'clinical') return 'professional_dashboard';
  return 'professional_flow_control';
};
