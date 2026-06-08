import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable } from 'react-native';
import { Map, Camera, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { fetchRoute } from '../services/routing';
import { REAL_COORDS } from '../data/units';
import { DEFAULT_USER_LOCATION } from '../config/mapConfig';
import { colors } from '../theme';

const MAP_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

const toLngLat = ([lat, lng]) => [lng, lat];

const instructionFor = (p) => {
  if (p < 25) return 'Siga em frente na via principal ⬆️';
  if (p < 50) return 'Em 150m, mantenha-se à esquerda ⬅️';
  if (p < 75) return 'Siga na faixa da direita, trânsito livre 🟢';
  return 'Chegando! Entre pelo acesso de emergência ➡️';
};

export default function UnitMapScreen({ route }) {
  const { unit } = route.params;
  const dest = REAL_COORDS[unit.id];
  const [origin, setOrigin] = useState(DEFAULT_USER_LOCATION);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [carLngLat, setCarLngLat] = useState(null);
  const [instruction, setInstruction] = useState('Toque em iniciar para começar a navegação 🚀');
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      let from = DEFAULT_USER_LOCATION;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          from = [pos.coords.latitude, pos.coords.longitude];
        }
      } catch { /* fallback */ }
      setOrigin(from);
      try {
        setInfo(await fetchRoute(from, dest));
      } catch {
        setErr('Não foi possível calcular a rota agora.');
      } finally {
        setLoading(false);
      }
    })();
  }, [unit.id]);

  // Animação turn-by-turn: avança o carro pelos pontos da rota.
  useEffect(() => {
    if (!navigating || !info) return;
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 4;
        const lastIdx = info.coords.length - 1;
        const idx = Math.min(lastIdx, Math.floor((next / 100) * info.coords.length));
        setCarLngLat(toLngLat(info.coords[Math.max(0, idx)]));
        if (next >= 100) {
          clearInterval(timerRef.current);
          setInstruction('Você chegou ao seu destino! 🏁');
          return 100;
        }
        setInstruction(instructionFor(next));
        return next;
      });
    }, 500);
    return () => clearInterval(timerRef.current);
  }, [navigating, info]);

  const start = () => {
    setProgress(0);
    setCarLngLat(toLngLat(origin));
    setInstruction(instructionFor(0));
    setNavigating(true);
  };
  const stop = () => {
    clearInterval(timerRef.current);
    setNavigating(false);
    setProgress(0);
    setCarLngLat(null);
    setInstruction('Toque em iniciar para começar a navegação 🚀');
  };

  const center = [(toLngLat(origin)[0] + toLngLat(dest)[0]) / 2, (toLngLat(origin)[1] + toLngLat(dest)[1]) / 2];
  const routeFeature = info && {
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: info.coords.map(toLngLat) },
  };

  return (
    <SafeAreaView style={styles.safe}>
      {navigating && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{instruction}</Text>
        </View>
      )}

      <View style={styles.mapWrap}>
        <Map style={styles.map} mapStyle={MAP_STYLE} attribution={false} logoEnabled={false} compassEnabled={false}>
          <Camera
            centerCoordinate={navigating && carLngLat ? carLngLat : center}
            zoomLevel={navigating ? 15 : 12.5}
            animationDuration={navigating ? 400 : 0}
          />
          {routeFeature && (
            <GeoJSONSource id="route" shape={routeFeature}>
              <Layer id="route-line" type="line" paint={{ 'line-color': '#06B6D4', 'line-width': 5 }} />
            </GeoJSONSource>
          )}
          <Marker id="dest" coordinate={toLngLat(dest)}><View style={styles.destPin} /></Marker>
          {navigating && carLngLat ? (
            <Marker id="car" coordinate={carLngLat}><Text style={{ fontSize: 26 }}>🚗</Text></Marker>
          ) : (
            <Marker id="user" coordinate={toLngLat(origin)}>
              <View style={styles.userPinOuter}><View style={styles.userPinInner} /></View>
            </Marker>
          )}
        </Map>
      </View>

      <View style={styles.card}>
        <Text style={styles.dest}>Rota até {unit.name}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : err ? (
          <Text style={styles.err}>{err}</Text>
        ) : (
          <>
            <View style={styles.row}>
              <View style={styles.metric}><Text style={styles.metricVal}>{info.durationText}</Text><Text style={styles.metricLbl}>TEMPO</Text></View>
              <View style={styles.metric}><Text style={styles.metricVal}>{info.distanceText}</Text><Text style={styles.metricLbl}>DISTÂNCIA</Text></View>
            </View>

            {!navigating ? (
              <Pressable style={({ pressed }) => [styles.btnStart, pressed && { opacity: 0.85 }]} onPress={start}>
                <Text style={styles.btnStartText}>Iniciar navegação 🚀</Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: 14 }}>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
                <View style={styles.navRow}>
                  <Text style={styles.navPct}>Navegando… {progress}%</Text>
                  <Pressable onPress={stop}><Text style={styles.stopText}>Encerrar ✕</Text></Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  banner: { backgroundColor: '#059669', paddingVertical: 12, paddingHorizontal: 16 },
  bannerText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  destPin: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, borderWidth: 3, borderColor: '#fff' },
  userPinOuter: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(37,99,235,0.3)', alignItems: 'center', justifyContent: 'center' },
  userPinInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },
  card: { backgroundColor: colors.card, margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  dest: { fontSize: 16, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  metric: { alignItems: 'center' },
  metricVal: { fontSize: 22, fontWeight: '800', color: colors.primary },
  metricLbl: { fontSize: 10, color: colors.muted, fontWeight: '700', marginTop: 4 },
  err: { color: colors.danger, marginTop: 12 },
  btnStart: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnStartText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#06B6D4' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  navPct: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  stopText: { color: colors.danger, fontWeight: '800' },
});
