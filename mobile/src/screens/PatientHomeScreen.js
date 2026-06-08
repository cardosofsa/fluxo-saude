import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import { db } from '../services/db';
import { colors, statusBadge } from '../theme';

const FILTERS = [
  { key: 'ALL', label: 'Todas' },
  { key: 'UPA', label: 'UPAs' },
  { key: 'Policlínica', label: 'Policlínicas' },
];

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
        <Text style={styles.stat}>⏱ {unit.waitMinutes} min</Text>
        <Text style={styles.stat}>📍 {unit.distance}</Text>
      </View>
    </Pressable>
  );
}

export default function PatientHomeScreen({ navigation }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    const data = await db.getUnits();
    setUnits(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const featured = useMemo(
    () => units.find((u) => u.id === 'mangabeira') || units[0],
    [units]
  );

  const avgWait = useMemo(
    () => (units.length ? Math.round(units.reduce((s, u) => s + (u.waitMinutes || 0), 0) / units.length) : 0),
    [units]
  );

  const filtered = useMemo(
    () =>
      units.filter((u) => {
        const q = query.toLowerCase();
        const matchQ = u.name.toLowerCase().includes(q) || (u.address || '').toLowerCase().includes(q);
        const matchT = filter === 'ALL' || u.type === filter;
        return matchQ && matchT;
      }),
    [units, query, filter]
  );

  const goDetails = (u) => navigation.navigate('UnitDetails', { unit: u });

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Carregando unidades…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>Olá, paciente 👋</Text>
            <Text style={styles.sub}>Feira de Santana, BA</Text>

            {featured && (
              <Pressable style={({ pressed }) => [styles.featured, pressed && { opacity: 0.9 }]} onPress={() => goDetails(featured)}>
                <View style={styles.featuredTopRow}>
                  <View style={styles.tagClose}><Text style={styles.tagCloseText}>MAIS PRÓXIMA</Text></View>
                  <Text style={styles.featuredDist}>› {featured.distance}</Text>
                </View>
                <Text style={styles.featuredName}>{featured.name}</Text>
                <Text style={styles.featuredDesc} numberOfLines={2}>{featured.address}</Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredFoot}>● {featured.status}</Text>
                  <Text style={styles.featuredFoot}>⏱ Fila: {featured.waitMinutes} min</Text>
                </View>
              </Pressable>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{units.length}</Text>
                <Text style={styles.statLbl}>UNIDADES ATIVAS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{avgWait} min</Text>
                <Text style={styles.statLbl}>MÉDIA DE ESPERA</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Buscar UPA ou Policlínica</Text>
            <TextInput
              style={styles.search}
              placeholder="Qual unidade você procura?"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
            <View style={styles.pills}>
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.pill, on && styles.pillOn]}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Unidades de Atendimento</Text>
          </View>
        }
        renderItem={({ item }) => <UnitCard unit={item} onPress={goDetails} />}
        ListEmptyComponent={<Text style={styles.muted}>Nenhuma unidade encontrada.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: colors.muted, textAlign: 'center', marginTop: 12 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 2, marginBottom: 16 },
  featured: { backgroundColor: colors.primary, borderRadius: 18, padding: 18 },
  featuredTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagClose: { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagCloseText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  featuredDist: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12 },
  featuredName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 10 },
  featuredDesc: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 },
  featuredFooter: { flexDirection: 'row', gap: 16, marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 10 },
  featuredFoot: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: 10, color: colors.muted, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  search: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  pills: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontWeight: '700' },
  pillTextOn: { color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, paddingRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cardAddr: { color: colors.muted, marginTop: 6, fontSize: 13 },
  cardStats: { flexDirection: 'row', gap: 16, marginTop: 10 },
  stat: { fontSize: 13, color: colors.text, fontWeight: '600' },
});
