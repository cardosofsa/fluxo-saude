import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { fetchRoute } from '../services/routing';
import { REAL_COORDS } from '../data/units';
import { DEFAULT_USER_LOCATION as FALLBACK } from '../config/mapConfig';
import { colors } from '../theme';

export default function UnitMapScreen({ route }) {
  const { unit } = route.params;
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      let origin = FALLBACK;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          origin = [pos.coords.latitude, pos.coords.longitude];
        }
      } catch { /* usa fallback */ }

      const dest = REAL_COORDS[unit.id];
      try {
        const r = await fetchRoute(origin, dest);
        setInfo({ ...r, origin, dest });
      } catch (e) {
        setErr('Não foi possível calcular a rota agora.');
      } finally {
        setLoading(false);
      }
    })();
  }, [unit.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapNote}>Mapa nativo (MapLibre/OSM){'\n'}chega na próxima fase</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.dest}>Rota até {unit.name}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : err ? (
          <Text style={styles.err}>{err}</Text>
        ) : (
          <View style={styles.row}>
            <View style={styles.metric}>
              <Text style={styles.metricVal}>{info.durationText}</Text>
              <Text style={styles.metricLbl}>TEMPO</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricVal}>{info.distanceText}</Text>
              <Text style={styles.metricLbl}>DISTÂNCIA</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricVal}>{info.coords.length}</Text>
              <Text style={styles.metricLbl}>PONTOS</Text>
            </View>
          </View>
        )}
        <Text style={styles.hint}>Cálculo de rota real via OSRM (mesmo motor da versão web).</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  mapPlaceholder: { flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mapIcon: { fontSize: 56 },
  mapNote: { color: '#94A3B8', textAlign: 'center', fontWeight: '600' },
  card: { backgroundColor: colors.card, margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  dest: { fontSize: 16, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  metric: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 20, fontWeight: '800', color: colors.primary },
  metricLbl: { fontSize: 10, color: colors.muted, fontWeight: '700', marginTop: 4 },
  err: { color: colors.danger, marginTop: 12 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 16 },
});
