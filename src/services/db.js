import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_UNITS, INITIAL_BEDS, INITIAL_HANDOVERS } from '../data/units';
import { DEFAULT_STAFF } from './auth';

// Chaves do LocalStorage
const KEYS = {
  UNITS: 'fs_units',
  BEDS: 'fs_beds',
  HANDOVERS: 'fs_handovers',
  CHECKINS: 'fs_checkins',
  PATIENTS: 'fs_patients',
  STAFF: 'fs_staff',
};

// Inicializador de dados mock
const initLocalStorage = () => {
  if (!localStorage.getItem(KEYS.UNITS)) {
    localStorage.setItem(KEYS.UNITS, JSON.stringify(INITIAL_UNITS));
  }
  if (!localStorage.getItem(KEYS.BEDS)) {
    localStorage.setItem(KEYS.BEDS, JSON.stringify(INITIAL_BEDS));
  }
  if (!localStorage.getItem(KEYS.HANDOVERS)) {
    localStorage.setItem(KEYS.HANDOVERS, JSON.stringify(INITIAL_HANDOVERS));
  }
  if (!localStorage.getItem(KEYS.CHECKINS)) {
    localStorage.setItem(KEYS.CHECKINS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    // Seed com o paciente do figma para testes rápidos
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify([
      {
        id: 'p_rodrigo',
        cpf: '12345678901',
        name: 'Rodrigo Carvalho',
        cns: '898 0001 2345 6789',
        birthDate: '1991-09-14',
        password: '123',
      }
    ]));
  }
  if (!localStorage.getItem(KEYS.STAFF)) {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(DEFAULT_STAFF));
  }
};

const DB_VERSION = '2'; // increment when seed data schema changes

// Rodar inicialização
const storedVersion = localStorage.getItem('fs_db_version');
if (storedVersion !== DB_VERSION) {
  // Schema mudou: limpar tudo e recarregar seeds
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.setItem('fs_db_version', DB_VERSION);
}
initLocalStorage();

// Helpers para LocalStorage
const lsGet = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const lsSet = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const db = {
  // --- UNIDADES ---
  async getUnits() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('units').select('*');
        if (!error && data && data.length > 0) return data;
        console.warn('Supabase: Tabela "units" vazia ou com erro, usando LocalStorage:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase para units:', err);
      }
    }
    return lsGet(KEYS.UNITS);
  },

  async updateUnit(unitId, updates) {
    let lsUpdated = false;
    const units = lsGet(KEYS.UNITS);
    const updatedUnits = units.map(u => {
      if (u.id === unitId) {
        lsUpdated = true;
        return { ...u, ...updates };
      }
      return u;
    });
    if (lsUpdated) lsSet(KEYS.UNITS, updatedUnits);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('units').update(updates).eq('id', unitId);
        if (error) console.error('Erro ao atualizar unit no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return updatedUnits.find(u => u.id === unitId);
  },

  // --- LEITOS ---
  async getBeds() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('beds').select('*').order('id', { ascending: true });
        if (!error && data && data.length > 0) return data;
        console.warn('Supabase: Tabela "beds" vazia ou com erro, usando LocalStorage:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase para beds:', err);
      }
    }
    return lsGet(KEYS.BEDS);
  },

  async updateBed(bedId, updates) {
    let lsUpdated = false;
    const beds = lsGet(KEYS.BEDS);
    const updatedBeds = beds.map(b => {
      if (b.id === Number(bedId) || b.id === bedId) {
        lsUpdated = true;
        return { ...b, ...updates };
      }
      return b;
    });
    if (lsUpdated) lsSet(KEYS.BEDS, updatedBeds);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('beds').update(updates).eq('id', bedId);
        if (error) console.error('Erro ao atualizar leito no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return updatedBeds.find(b => b.id === Number(bedId) || b.id === bedId);
  },

  async addBed(bed) {
    const newBed = {
      id: bed.id || Date.now(),
      created_at: new Date().toISOString(),
      ...bed
    };
    const beds = lsGet(KEYS.BEDS);
    lsSet(KEYS.BEDS, [...beds, newBed]);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('beds').insert([newBed]);
        if (error) console.error('Erro ao adicionar leito no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return newBed;
  },

  async deleteBed(bedId) {
    const beds = lsGet(KEYS.BEDS);
    const filtered = beds.filter(b => b.id !== bedId && b.id !== Number(bedId));
    lsSet(KEYS.BEDS, filtered);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('beds').delete().eq('id', bedId);
        if (error) console.error('Erro ao excluir leito no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return true;
  },

  // --- PASSAGENS DE PLANTÃO ---
  async getHandovers() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('handovers').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
        console.warn('Supabase: Tabela "handovers" vazia ou com erro, usando LocalStorage:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase para handovers:', err);
      }
    }
    return lsGet(KEYS.HANDOVERS);
  },

  async addHandover(handover) {
    const newHandover = {
      id: handover.id || `h_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...handover
    };

    const handovers = lsGet(KEYS.HANDOVERS);
    lsSet(KEYS.HANDOVERS, [newHandover, ...handovers]);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('handovers').insert([newHandover]);
        if (error) console.error('Erro ao inserir passagem de plantão no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return newHandover;
  },

  // --- CHECK-INS DIGITAIS ---
  async getCheckins() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('digital_checkins').select('*').order('created_at', { ascending: false });
        if (!error && data) return data;
        console.warn('Supabase: Tabela "digital_checkins" vazia ou com erro, usando LocalStorage:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase para checkins:', err);
      }
    }
    return lsGet(KEYS.CHECKINS);
  },

  async addCheckin(checkin) {
    const newCheckin = {
      id: checkin.id || `c_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'Pendente', // Pendente, Triado, Atendido, Cancelado
      urgency_level: 'Verde', // Padrão inicial
      triage_notes: '',
      ...checkin
    };

    const checkins = lsGet(KEYS.CHECKINS);
    lsSet(KEYS.CHECKINS, [newCheckin, ...checkins]);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('digital_checkins').insert([newCheckin]);
        if (error) console.error('Erro ao inserir checkin no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return newCheckin;
  },

  async triageCheckin(checkinId, updates) {
    const checkins = lsGet(KEYS.CHECKINS);
    const updatedCheckins = checkins.map(c => {
      if (c.id === checkinId) {
        return { ...c, ...updates, status: 'Triado' };
      }
      return c;
    });
    lsSet(KEYS.CHECKINS, updatedCheckins);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('digital_checkins').update({ ...updates, status: 'Triado' }).eq('id', checkinId);
        if (error) console.error('Erro ao fazer triagem no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return updatedCheckins.find(c => c.id === checkinId);
  },

  async updateCheckin(checkinId, updates) {
    const checkins = lsGet(KEYS.CHECKINS);
    const updated = checkins.map(c => c.id === checkinId ? { ...c, ...updates } : c);
    lsSet(KEYS.CHECKINS, updated);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('digital_checkins').update(updates).eq('id', checkinId);
        if (error) console.error('Erro ao atualizar checkin no Supabase:', error);
      } catch (err) { console.error('Supabase error:', err); }
    }
    return updated.find(c => c.id === checkinId);
  },

  // --- PACIENTES ---
  async getPatients() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('patients').select('*');
        if (!error && data) return data;
      } catch (err) {
        console.error('Falha ao buscar pacientes no Supabase:', err);
      }
    }
    return lsGet(KEYS.PATIENTS);
  },

  async registerPatient(patient) {
    const newPatient = {
      id: `p_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...patient
    };

    const patients = lsGet(KEYS.PATIENTS);
    // Verificar duplicidade de CPF
    if (patients.some(p => p.cpf === patient.cpf)) {
      throw new Error('CPF já cadastrado');
    }

    lsSet(KEYS.PATIENTS, [...patients, newPatient]);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('patients').insert([newPatient]);
        if (error) console.error('Erro ao registrar paciente no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return newPatient;
  },

  async loginPatient(cpf, password) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('cpf', cpf)
          .eq('password', password)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.error('Falha ao fazer login do paciente no Supabase:', err);
      }
    }
    const patients = lsGet(KEYS.PATIENTS);
    const matched = patients.find(p => p.cpf === cpf && p.password === password);
    if (!matched) throw new Error('CPF ou senha inválidos.');
    return matched;
  },

  // --- FUNCIONÁRIOS (STAFF) ---
  async getStaff() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('staff').select('*');
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.error('Falha ao buscar staff no Supabase:', err);
      }
    }
    return lsGet(KEYS.STAFF);
  },

  async registerStaff(staffMember) {
    const newStaff = {
      id: `s_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...staffMember
    };

    const staff = lsGet(KEYS.STAFF);
    lsSet(KEYS.STAFF, [...staff, newStaff]);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('staff').insert([newStaff]);
        if (error) console.error('Erro ao registrar funcionário no Supabase:', error);
      } catch (err) {
        console.error('Falha ao conectar no Supabase:', err);
      }
    }
    return newStaff;
  },

  // Reseta todos os dados para o padrão inicial
  resetAll() {
    localStorage.removeItem(KEYS.UNITS);
    localStorage.removeItem(KEYS.BEDS);
    localStorage.removeItem(KEYS.HANDOVERS);
    localStorage.removeItem(KEYS.CHECKINS);
    localStorage.removeItem(KEYS.PATIENTS);
    localStorage.removeItem(KEYS.STAFF);
    initLocalStorage();
  }
};
