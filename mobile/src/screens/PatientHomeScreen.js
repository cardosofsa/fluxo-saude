import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { db } from '../services/db';
import { colors, statusBadge } from '../theme';

function UnitCard({ unit, onPress }) {
  const badge = statusBadge(unit.status);
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => onPress(unit)}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>{unit.name}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{unit.status}</Text>
        </View>
      </View>
      <Text style={styles.cardAddr} numberOfLines={1}>{unit.address}</Text>
      <View style={styles.cardStats}>
        <Text style={styles.stat}>⏱ {unit.waitMinutes} min de espera</Text>
        <Text style={styles.stat}>📍 {unit.distance}</Text>
      </View>
    </Pressable>
  );
}

export default function PatientHomeScreen({ navigation }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState('');

  const load = useCallback(async () => {
    const data = await db.getUnits();
    setUnits(data);
    setSource(data.length ? 'Supabase / dados ao vivo' : 'sem dados');
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando unidades…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={units}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.h1}>Unidades de Atendimento</Text>
            <Text style={styles.sub}>{units.length} unidades • {source}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <UnitCard unit={item} onPress={(u) => navigation.navigate('UnitDetails', { unit: u })} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted },
  header: { marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 2, fontSize: 12 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, paddingRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cardAddr: { color: colors.muted, marginTop: 6, fontSize: 13 },
  cardStats: { flexDirection: 'row', gap: 16, marginTop: 10 },
  stat: { fontSize: 13, color: colors.text, fontWeight: '600' },
});
