import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { db } from '../services/db';
import { colors, statusBadge } from '../theme';

const statusFor = (min) => (min > 45 ? 'ALTO' : min > 15 ? 'MÉDIO' : 'BAIXO');
const colorFor = (s) => (s === 'ALTO' ? '#EF4444' : s === 'MÉDIO' ? '#F59E0B' : '#10B981');

export default function FlowControlScreen() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { db.getUnits().then((u) => { setUnits(u); setLoading(false); }); }, []);

  const adjust = async (unit, delta) => {
    const waitMinutes = Math.max(0, (unit.waitMinutes || 0) + delta);
    const status = statusFor(waitMinutes);
    const color = colorFor(status);
    setUnits((prev) => prev.map((u) => (u.id === unit.id ? { ...u, waitMinutes, status, color } : u)));
    await db.updateUnit(unit.id, { waitMinutes, status, color });
  };

  if (loading) {
    return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={units}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.intro}>Ajuste o tempo de espera — atualiza em tempo real para os pacientes.</Text>}
        renderItem={({ item }) => {
          const badge = statusBadge(item.status);
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>{item.status} · {item.waitMinutes} min</Text>
                </View>
              </View>
              <View style={styles.controls}>
                <Pressable style={styles.btnMinus} onPress={() => adjust(item, -5)}><Text style={styles.btnSign}>−</Text></Pressable>
                <Pressable style={styles.btnPlus} onPress={() => adjust(item, +5)}><Text style={styles.btnSign}>+</Text></Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  intro: { color: colors.muted, marginBottom: 12, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  name: { fontWeight: '800', color: colors.text, fontSize: 15 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  controls: { flexDirection: 'row', gap: 8 },
  btnMinus: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  btnPlus: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  btnSign: { fontSize: 22, fontWeight: '800', color: colors.text },
});
