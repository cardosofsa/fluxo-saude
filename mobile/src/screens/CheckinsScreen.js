import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { db } from '../services/db';
import { colors } from '../theme';

const LEVELS = [
  { key: 'Verde', color: '#10B981' },
  { key: 'Amarelo', color: '#F59E0B' },
  { key: 'Vermelho', color: '#EF4444' },
];

export default function CheckinsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await db.getCheckins();
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const triage = async (item, level) => {
    setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, urgency_level: level, status: 'Triado' } : c)));
    await db.triageCheckin(item.id, { urgency_level: level });
  };

  if (loading) {
    return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in digital no momento.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.status, item.status === 'Triado' && { color: colors.success }]}>{item.status || 'Pendente'}</Text>
            </View>
            <Text style={styles.meta}>{item.symptom || 'Triagem geral'} · {item.unitName || ''}</Text>
            <Text style={styles.code}>Código {item.code}</Text>
            <View style={styles.levels}>
              {LEVELS.map((l) => {
                const on = item.urgency_level === l.key;
                return (
                  <Pressable key={l.key} onPress={() => triage(item, l.key)} style={[styles.level, { borderColor: l.color }, on && { backgroundColor: l.color }]}>
                    <Text style={[styles.levelText, { color: on ? '#fff' : l.color }]}>{l.key}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '800', color: colors.text, fontSize: 15 },
  status: { fontWeight: '700', color: colors.muted, fontSize: 12 },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  code: { color: colors.primary, fontWeight: '700', marginTop: 6, fontSize: 12 },
  levels: { flexDirection: 'row', gap: 8, marginTop: 12 },
  level: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  levelText: { fontWeight: '800', fontSize: 12 },
});
