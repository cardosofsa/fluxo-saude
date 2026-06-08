import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { db } from '../services/db';
import { colors } from '../theme';

const STATUSES = [
  { key: 'observation', label: 'Observação' },
  { key: 'critical', label: 'Crítico' },
  { key: 'free', label: 'Estável/Alta' },
];

export default function HandoverScreen({ route }) {
  const user = route.params?.user || { name: 'Profissional', unitId: 'mangabeira' };
  const [handovers, setHandovers] = useState([]);
  const [bedLabel, setBedLabel] = useState('');
  const [status, setStatus] = useState('observation');
  const [patient, setPatient] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(() => { db.getHandovers().then(setHandovers); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!bedLabel || !description) {
      Alert.alert('Atenção', 'Informe o leito e a descrição da passagem.');
      return;
    }
    const label = STATUSES.find((s) => s.key === status)?.label || '';
    const row = await db.addHandover({
      bedLabel,
      status,
      title: `${bedLabel} - ${label}`,
      description,
      patientName: patient || '—',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      professional: user.name,
      unitId: user.unitId || 'mangabeira',
    });
    setHandovers((prev) => [row, ...prev]);
    setBedLabel(''); setPatient(''); setDescription(''); setStatus('observation');
    Alert.alert('Plantão registrado', `${bedLabel} atualizado com sucesso.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Nova passagem de plantão</Text>

        <Text style={styles.label}>Leito</Text>
        <TextInput style={styles.input} value={bedLabel} onChangeText={setBedLabel} placeholder="Ex.: Leito 03" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Status</Text>
        <View style={styles.chips}>
          {STATUSES.map((s) => {
            const on = status === s.key;
            return (
              <Pressable key={s.key} onPress={() => setStatus(s.key)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Paciente</Text>
        <TextInput style={styles.input} value={patient} onChangeText={setPatient} placeholder="Nome do paciente" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Descrição clínica</Text>
        <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Evolução, condutas, pendências…" multiline placeholderTextColor={colors.muted} />

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={submit}>
          <Text style={styles.btnText}>Registrar passagem</Text>
        </Pressable>

        <Text style={[styles.h1, { marginTop: 24 }]}>Histórico ({handovers.length})</Text>
        {handovers.map((h) => (
          <View key={h.id} style={[styles.item, { borderLeftColor: h.status === 'critical' ? colors.danger : h.status === 'observation' ? colors.warning : colors.success }]}>
            <Text style={styles.itemTitle}>{h.title || h.bedLabel}</Text>
            <Text style={styles.itemDesc}>{h.description}</Text>
            <Text style={styles.itemMeta}>{h.professional} · {h.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  h1: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5 },
  itemTitle: { fontWeight: '800', color: colors.text },
  itemDesc: { color: colors.text, marginTop: 4, fontSize: 13 },
  itemMeta: { color: colors.muted, marginTop: 6, fontSize: 11 },
});
