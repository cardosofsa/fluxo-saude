import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { db } from '../services/db';
import { colors, statusBadge } from '../theme';

const bedColor = (s) => (s === 'critical' ? colors.danger : s === 'observation' ? colors.warning : colors.success);
const bedLabelPt = (s) => (s === 'critical' ? 'CRÍTICO' : s === 'observation' ? 'OBSERVAÇÃO' : 'LIVRE');

export default function ProfessionalDashboardScreen({ route }) {
  const user = route.params?.user || { name: 'Profissional', role: 'clinical' };
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getBeds(user.unitId).then((b) => { setBeds(b); setLoading(false); });
  }, [user.unitId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.hello}>Olá, {user.name}</Text>
        <Text style={styles.role}>{user.role === 'admin' ? 'Administrador' : user.role === 'flow' ? 'Controle de Fluxo' : 'Corpo Clínico'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={beds}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={<Text style={styles.section}>Gestão de Leitos ({beds.length})</Text>}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum leito cadastrado para esta unidade no banco ainda.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.bed, { borderLeftColor: bedColor(item.status) }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bedLabel}>{item.label}</Text>
                <Text style={styles.patient}>{item.patientName || 'Nenhum'}</Text>
              </View>
              <Text style={[styles.bedStatus, { color: bedColor(item.status) }]}>{bedLabelPt(item.status)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff' },
  hello: { fontSize: 20, fontWeight: '800', color: colors.text },
  role: { color: colors.muted, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  bed: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5 },
  bedLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  patient: { color: colors.muted, marginTop: 2, fontSize: 13 },
  bedStatus: { fontWeight: '800', fontSize: 12 },
});
