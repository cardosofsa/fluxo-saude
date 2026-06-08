import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { db } from '../services/db';
import { cleanCPF, isValidCPFLength, generatePassword } from '../services/auth';
import { colors } from '../theme';

const ROLES = [
  { key: 'clinical', label: 'Corpo Clínico' },
  { key: 'flow', label: 'Controle de Fluxo' },
];

export default function AdminScreen() {
  const [staff, setStaff] = useState([]);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('clinical');
  const [last, setLast] = useState(null);

  const load = useCallback(() => { db.getStaff().then(setStaff); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!name || !cpf) { Alert.alert('Atenção', 'Preencha nome e CPF.'); return; }
    if (!isValidCPFLength(cpf)) { Alert.alert('Atenção', 'CPF deve ter 11 dígitos.'); return; }
    const newStaff = { cpf: cleanCPF(cpf), password: generatePassword(), name, role, unitId: 'mangabeira' };
    const row = await db.registerStaff(newStaff);
    setStaff((prev) => [...prev, row]);
    setLast(row);
    setName(''); setCpf(''); setRole('clinical');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Cadastrar acesso</Text>
        <Text style={styles.sub}>Gera senha aleatória de 8 dígitos.</Text>

        <Text style={styles.label}>Nome completo</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex.: Dra. Luciana" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>CPF (11 dígitos)</Text>
        <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="Somente números" keyboardType="number-pad" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Perfil</Text>
        <View style={styles.chips}>
          {ROLES.map((r) => {
            const on = role === r.key;
            return (
              <Pressable key={r.key} onPress={() => setRole(r.key)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={submit}>
          <Text style={styles.btnText}>Gerar senha e acesso</Text>
        </Pressable>

        {last && (
          <View style={styles.generated}>
            <Text style={styles.genTitle}>✅ Acesso criado</Text>
            <Text style={styles.genRow}>👤 {last.name}</Text>
            <Text style={styles.genRow}>🔑 Login (CPF): {last.cpf}</Text>
            <Text style={styles.genPw}>Senha: {last.password}</Text>
          </View>
        )}

        <Text style={[styles.h1, { marginTop: 24 }]}>Funcionários ({staff.length})</Text>
        {staff.map((s) => (
          <View key={s.id || s.cpf} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{s.name}</Text>
              <Text style={styles.itemMeta}>CPF: {s.cpf} · {s.role === 'flow' ? 'Fluxo' : 'Clínico'}</Text>
            </View>
            {s.password ? <Text style={styles.itemPw}>{s.password}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  h1: { fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  generated: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginTop: 16 },
  genTitle: { fontWeight: '800', color: '#92400E' },
  genRow: { color: '#92400E', marginTop: 6 },
  genPw: { color: '#92400E', marginTop: 6, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  itemName: { fontWeight: '800', color: colors.text },
  itemMeta: { color: colors.muted, marginTop: 2, fontSize: 12 },
  itemPw: { fontWeight: '800', color: colors.primary, backgroundColor: '#E6F0FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
