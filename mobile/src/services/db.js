import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_UNITS } from '../data/units';

// Camada de dados do app nativo. Usa Supabase quando configurado;
// caso contrário, cai para os dados-semente em memória.
export const db = {
  async getUnits() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('units').select('*');
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase units falhou, usando seed:', err?.message);
      }
    }
    return INITIAL_UNITS;
  },

  async getBeds(unitId) {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('beds').select('*').order('id', { ascending: true });
        if (unitId) q = q.eq('unitId', unitId);
        const { data, error } = await q;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase beds falhou:', err?.message);
      }
    }
    return [];
  },

  async getHandovers() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('handovers')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase handovers falhou:', err?.message);
      }
    }
    return [];
  },

  async getStaff() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('staff').select('*');
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase staff falhou:', err?.message);
      }
    }
    return [];
  },

  async addCheckin(checkin) {
    const row = {
      id: `c_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'Pendente',
      urgency_level: 'Verde',
      ...checkin,
    };
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('digital_checkins').insert([row]);
        if (error) console.warn('Supabase insert checkin:', error.message);
      } catch (err) {
        console.warn('Supabase checkin falhou:', err?.message);
      }
    }
    return row;
  },

  async updateBed(bedId, updates) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('beds').update(updates).eq('id', bedId);
        if (error) console.warn('Supabase update bed:', error.message);
      } catch (err) {
        console.warn('Supabase updateBed falhou:', err?.message);
      }
    }
    return { id: bedId, ...updates };
  },

  async addHandover(handover) {
    const row = { id: `h_${Date.now()}`, created_at: new Date().toISOString(), ...handover };
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('handovers').insert([row]);
        if (error) console.warn('Supabase insert handover:', error.message);
      } catch (err) {
        console.warn('Supabase handover falhou:', err?.message);
      }
    }
    return row;
  },

  async registerStaff(staffMember) {
    const row = { id: `s_${Date.now()}`, created_at: new Date().toISOString(), ...staffMember };
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('staff').insert([row]);
        if (error) console.warn('Supabase insert staff:', error.message);
      } catch (err) {
        console.warn('Supabase registerStaff falhou:', err?.message);
      }
    }
    return row;
  },
};
