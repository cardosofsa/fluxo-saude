import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, SafeAreaView, ScrollView, Alert } from 'react-native';
import { db } from '../services/db';
import { cleanCPF } from '../services/auth';
import { colors } from '../theme';

const SYMPTOMS = ['Febre', 'Dor', 'Falta de ar', 'Fratura', 'Outros'];

export default function CheckinScreen({ route, navigation }) {
  const unit = route.params?.unit;
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (s) => setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const onSubmit = async () => {
    if (!name || cleanCPF(cpf).length !== 11) {
      Alert.alert('Atenção', 'Informe o nome e um CPF válido (11 dígitos).');
      return;
    }
    setSaving(true);
    const code = `FS-${Math.floor(Math.random() * 9000 + 1000)}`;
    await db.addCheckin({
      name,
      cpf: cleanCPF(cpf),
      symptom: selected.join(', ') || 'Triagem geral',
      unitName: unit?.name || '',
      unitId: unit?.id || null,
      code,
    });
    setSaving(false);
    Alert.alert('Check-in realizado!', `Seu código é ${code}. Apresente na unidade ${unit?.name || ''}.`, [
      { text: 'OK', onPress: () => navigation.navigate('PatientTabs') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>Check-in Digital</Text>
        {!!unit && <Text style={styles.sub}>{unit.name}</Text>}

        <Text style={styles.label}>Nome completo</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>CPF</Text>
        <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="Somente números" keyboardType="number-pad" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Sintomas</Text>
        <View style={styles.chips}>
          {SYMPTOMS.map((s) => {
            const on = selected.includes(s);
            return (
              <Pressable key={s} onPress={() => toggle(s)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={({ pressed }) => [styles.btn, (pressed || saving) && { opacity: 0.7 }]} onPress={onSubmit} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Enviando…' : 'Confirmar check-in'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 28 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
