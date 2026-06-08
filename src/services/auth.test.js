import { describe, it, expect } from 'vitest';
import {
  cleanCPF,
  isValidCPFLength,
  generatePassword,
  isAdmin,
  findStaffByCredentials,
  screenForRole,
  DEFAULT_STAFF,
} from './auth';

describe('cleanCPF', () => {
  it('remove pontuação e mantém só dígitos', () => {
    expect(cleanCPF('123.456.789-00')).toBe('12345678900');
  });
  it('lida com valor vazio/undefined', () => {
    expect(cleanCPF('')).toBe('');
    expect(cleanCPF(undefined)).toBe('');
  });
});

describe('isValidCPFLength', () => {
  it('aceita 11 dígitos (com ou sem formatação)', () => {
    expect(isValidCPFLength('123.456.789-00')).toBe(true);
    expect(isValidCPFLength('12345678900')).toBe(true);
  });
  it('rejeita comprimento diferente de 11', () => {
    expect(isValidCPFLength('123')).toBe(false);
    expect(isValidCPFLength('123456789001')).toBe(false);
  });
});

describe('generatePassword', () => {
  it('gera sempre 8 dígitos numéricos', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword();
      expect(pw).toMatch(/^\d{8}$/);
    }
  });
});

describe('isAdmin', () => {
  it('reconhece o admin (case-insensitive no usuário)', () => {
    expect(isAdmin('admin', 'adm123')).toBe(true);
    expect(isAdmin('ADMIN', 'adm123')).toBe(true);
  });
  it('rejeita senha errada ou usuário errado', () => {
    expect(isAdmin('admin', 'errada')).toBe(false);
    expect(isAdmin('fulano', 'adm123')).toBe(false);
  });
});

describe('findStaffByCredentials', () => {
  it('encontra funcionário com CPF formatado ou não', () => {
    expect(findStaffByCredentials(DEFAULT_STAFF, '123.456.789-00', '12345678')?.name)
      .toBe('Plantonista Ana Silva');
    expect(findStaffByCredentials(DEFAULT_STAFF, '12345678900', '12345678')?.name)
      .toBe('Plantonista Ana Silva');
  });
  it('retorna null com senha incorreta', () => {
    expect(findStaffByCredentials(DEFAULT_STAFF, '12345678900', 'xxx')).toBeNull();
  });
});

describe('screenForRole', () => {
  it('mapeia papéis para as telas corretas', () => {
    expect(screenForRole('admin')).toBe('professional_admin');
    expect(screenForRole('clinical')).toBe('professional_dashboard');
    expect(screenForRole('flow')).toBe('professional_flow_control');
    expect(screenForRole('desconhecido')).toBe('professional_flow_control');
  });
});
