import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { db } from '../services/db';

const setup = () => {
  const setActiveScreen = vi.fn();
  const addLog = vi.fn();
  const { result } = renderHook(() => useAuth({ setActiveScreen, addLog }));
  return { result, setActiveScreen, addLog };
};

const submit = () => ({ preventDefault: vi.fn() });

// useAuth carrega o staff de forma assíncrona (db.getStaff). Isolamos o
// LocalStorage entre os testes para um estado-semente previsível.
beforeEach(() => {
  localStorage.clear();
  db.resetAll();
});

describe('useAuth — login', () => {
  it('exige usuário e senha', () => {
    const { result, setActiveScreen } = setup();
    act(() => result.current.handleLoginSubmit(submit()));
    expect(result.current.loginError).toMatch(/preencha/i);
    expect(setActiveScreen).not.toHaveBeenCalled();
  });

  it('loga admin e vai para a tela de admin', () => {
    const { result, setActiveScreen } = setup();
    act(() => result.current.setLoginForm({ username: 'admin', password: 'adm123' }));
    act(() => result.current.handleLoginSubmit(submit()));
    expect(result.current.currentUser?.role).toBe('admin');
    expect(setActiveScreen).toHaveBeenCalledWith('professional_admin');
  });

  it('loga funcionário clínico com CPF formatado (após carregar staff do DB)', async () => {
    const { result, setActiveScreen } = setup();
    await waitFor(() => expect(result.current.staffMembers.length).toBeGreaterThan(0));
    act(() => result.current.setLoginForm({ username: '123.456.789-00', password: '12345678' }));
    act(() => result.current.handleLoginSubmit(submit()));
    expect(result.current.currentUser?.name).toBe('Plantonista Ana Silva');
    expect(setActiveScreen).toHaveBeenCalledWith('professional_dashboard');
    expect(result.current.loginForm).toEqual({ username: '', password: '' });
  });

  it('mostra erro com credenciais inválidas', async () => {
    const { result, setActiveScreen } = setup();
    await waitFor(() => expect(result.current.staffMembers.length).toBeGreaterThan(0));
    act(() => result.current.setLoginForm({ username: '12345678900', password: 'errada' }));
    act(() => result.current.handleLoginSubmit(submit()));
    expect(result.current.loginError).toMatch(/incorret/i);
    expect(result.current.currentUser).toBeNull();
    expect(setActiveScreen).not.toHaveBeenCalled();
  });
});

describe('useAuth — cadastro de funcionário', () => {
  it('cria funcionário com senha de 8 dígitos e CPF limpo', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.staffMembers.length).toBeGreaterThan(0));
    const before = result.current.staffMembers.length;

    act(() => result.current.setAdminForm({ cpf: '111.222.333-44', name: 'Dra. Teste', role: 'clinical', unitId: 'mangabeira' }));
    await act(async () => { await result.current.handleCreateStaff(submit()); });

    expect(result.current.staffMembers).toHaveLength(before + 1);
    expect(result.current.lastGeneratedStaff?.name).toBe('Dra. Teste');
    expect(result.current.lastGeneratedStaff?.password).toMatch(/^\d{8}$/);
    expect(result.current.lastGeneratedStaff?.cpf).toBe('11122233344');
    expect(result.current.adminForm.name).toBe('');
  });

  it('rejeita CPF com tamanho inválido (não cadastra)', async () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    const { result } = setup();
    await waitFor(() => expect(result.current.staffMembers.length).toBeGreaterThan(0));
    const before = result.current.staffMembers.length;

    act(() => result.current.setAdminForm({ cpf: '123', name: 'Curto', role: 'flow', unitId: 'mangabeira' }));
    await act(async () => { await result.current.handleCreateStaff(submit()); });

    expect(result.current.staffMembers).toHaveLength(before);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
