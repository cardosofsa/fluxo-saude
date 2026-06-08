import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Map, Camera, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { fetchRoute } from '../services/routing';
import { REAL_COORDS } from '../data/units';
import { DEFAULT_USER_LOCATION } from '../config/mapConfig';
import { colors } from '../theme';

// Estilo base do mapa: tiles raster Carto/OSM (gratuito, sem Google, sem chave).
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
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

const toLngLat = ([lat, lng]) => [lng, lat];

export default function UnitMapScreen({ route }) {
  const { unit } = route.params;
  const dest = REAL_COORDS[unit.id];
  const [origin, setOrigin] = useState(DEFAULT_USER_LOCATION);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      let from = DEFAULT_USER_LOCATION;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          from = [pos.coords.latitude, pos.coords.longitude];
        }
      } catch { /* usa fallback */ }
      setOrigin(from);
      try {
        const r = await fetchRoute(from, dest);
        setInfo(r);
      } catch {
        setErr('Não foi possível calcular a rota agora.');
      } finally {
        setLoading(false);
      }
    })();
  }, [unit.id]);

  const center = [(toLngLat(origin)[0] + toLngLat(dest)[0]) / 2, (toLngLat(origin)[1] + toLngLat(dest)[1]) / 2];

  const routeFeature = info && {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: info.coords.map(toLngLat) },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mapWrap}>
        <Map style={styles.map} mapStyle={MAP_STYLE} attribution={false} compassEnabled={false} logoEnabled={false}>
          <Camera centerCoordinate={center} zoomLevel={12.5} animationDuration={0} />

          {routeFeature && (
            <GeoJSONSource id="route" shape={routeFeature}>
              <Layer id="route-line" type="line" paint={{ 'line-color': '#06B6D4', 'line-width': 5 }} />
            </GeoJSONSource>
          )}

          <Marker id="dest" coordinate={toLngLat(dest)}>
            <View style={styles.destPin} />
          </Marker>
          <Marker id="user" coordinate={toLngLat(origin)}>
            <View style={styles.userPinOuter}><View style={styles.userPinInner} /></View>
          </Marker>
        </Map>
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
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
});
