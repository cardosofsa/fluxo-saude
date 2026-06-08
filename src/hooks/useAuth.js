import { useState, useEffect } from 'react';
import { db } from '../services/db';
import {
  cleanCPF,
  isValidCPFLength,
  generatePassword,
  isAdmin,
  findStaffByCredentials,
  screenForRole,
} from '../services/auth';

/**
 * Estado e ações de autenticação do Fluxo Saúde (login de profissional/admin
 * e cadastro de funcionários pelo admin). Lógica pura em ../services/auth.
 *
 * @param {{ setActiveScreen: Function, addLog: Function }} deps
 */
export function useAuth({ setActiveScreen, addLog }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [adminForm, setAdminForm] = useState({ cpf: '', name: '', role: 'clinical', unitId: 'mangabeira' });
  const [lastGeneratedStaff, setLastGeneratedStaff] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await db.getStaff();
        setStaffMembers(staff);
      } catch (err) {
        console.error('Erro ao carregar funcionários do DB:', err);
      }
    };
    loadStaff();
  }, []);

  const handleLoginSubmit = (e) => {
    e?.preventDefault();
    setLoginError('');
    const { username, password } = loginForm;

    if (!username || !password) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }

    if (isAdmin(username, password)) {
      const adminUser = { name: 'Administrador Geral', role: 'admin' };
      setCurrentUser(adminUser);
      setActiveScreen(screenForRole('admin'));
      addLog('[Login] Administrador Geral logado com sucesso.');
      setLoginForm({ username: '', password: '' });
      return;
    }

    const matchedStaff = findStaffByCredentials(staffMembers, username, password);
    if (matchedStaff) {
      setCurrentUser(matchedStaff);
      setActiveScreen(screenForRole(matchedStaff.role));
      const label = matchedStaff.role === 'clinical' ? 'Corpo Clínico' : 'Controle de Fluxo';
      addLog(`[Login] ${matchedStaff.name} (${label}) logado.`);
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('CPF ou Senha incorretos.');
      addLog(`[Login Falhou] Tentativa de login inválida para CPF: ${username}`);
    }
  };

  const handleCreateStaff = async (e) => {
    e?.preventDefault();
    const { cpf, name, role } = adminForm;

    if (!cpf || !name) {
      alert('Por favor, preencha o CPF e o Nome do funcionário.');
      return;
    }
    if (!isValidCPFLength(cpf)) {
      alert('O CPF deve conter exatamente 11 dígitos.');
      return;
    }

    const newStaff = {
      id: `s_${Date.now()}`,
      cpf: cleanCPF(cpf),
      password: generatePassword(),
      name,
      role,
      unitId: adminForm.unitId || 'mangabeira',
    };

    try {
      await db.registerStaff(newStaff);
      setStaffMembers((prev) => [...prev, newStaff]);
      setLastGeneratedStaff(newStaff);
      setAdminForm({ cpf: '', name: '', role: 'clinical', unitId: 'mangabeira' });
      addLog(`[Admin] Novo funcionário criado: ${name} (CPF: ${newStaff.cpf}) → ${newStaff.unitId}`);
    } catch (err) {
      alert('Erro ao cadastrar funcionário: ' + err.message);
    }

    // Mensagem temporária com a senha gerada some após 6s.
    setTimeout(() => setLastGeneratedStaff(null), 6000);
  };

  return {
    currentUser,
    loginForm,
    setLoginForm,
    loginError,
    adminForm,
    setAdminForm,
    lastGeneratedStaff,
    staffMembers,
    handleLoginSubmit,
    handleCreateStaff,
  };
}
