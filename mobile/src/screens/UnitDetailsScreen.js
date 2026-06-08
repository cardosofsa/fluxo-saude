import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Alert, Linking } from 'react-native';
import { colors, statusBadge } from '../theme';

export default function UnitDetailsScreen({ route, navigation }) {
  const { unit } = route.params;
  const badge = statusBadge(unit.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{unit.name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>LOTAÇÃO: {unit.status}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{unit.waitMinutes} min</Text>
            <Text style={styles.statLbl}>ESPERA ESTIMADA</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{unit.distance}</Text>
            <Text style={styles.statLbl}>DISTÂNCIA</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLbl}>ENDEREÇO</Text>
          <Text style={styles.infoVal}>{unit.address}</Text>
          <Text style={[styles.infoLbl, { marginTop: 12 }]}>FILA ATUAL</Text>
          <Text style={styles.infoVal}>{unit.queueSize} pacientes em triagem</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('UnitMap', { unit })}
        >
          <Text style={styles.btnPrimaryText}>›  Ver rota no mapa</Text>
        </Pressable>

        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.8 }]}
            onPress={() => unit.telephone && Linking.openURL(`tel:${unit.telephone.replace(/\D/g, '')}`)}
          >
            <Text style={styles.btnGhostText}>📞 Ligar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate('Checkin', { unit })}
          >
            <Text style={styles.btnGhostText}>✓ Check-in digital</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLbl: { fontSize: 10, color: colors.muted, marginTop: 4, fontWeight: '700' },
  infoCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 16 },
  infoLbl: { fontSize: 11, fontWeight: '800', color: colors.muted },
  infoVal: { fontSize: 14, color: colors.text, marginTop: 4 },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btnGhost: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGhostText: { color: colors.primaryDark, fontWeight: '700' },
});
