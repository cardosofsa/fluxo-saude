import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';
import { db } from '../services/db';
import { REAL_COORDS } from '../data/units';
import { MAP_DEFAULTS, statusColor } from '../config/mapConfig';
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

export default function MapaScreen({ navigation }) {
  const [units, setUnits] = useState([]);

  useEffect(() => { db.getUnits().then(setUnits); }, []);

  const center = [MAP_DEFAULTS.center[1], MAP_DEFAULTS.center[0]]; // [lng, lat]

  return (
    <SafeAreaView style={styles.safe}>
      <Map style={styles.map} mapStyle={MAP_STYLE} attribution={false} logoEnabled={false} compassEnabled={false}>
        <Camera centerCoordinate={center} zoomLevel={11.5} animationDuration={0} />
        {units.map((u) => {
          const c = REAL_COORDS[u.id];
          if (!c) return null;
          return (
            <Marker key={u.id} id={u.id} coordinate={[c[1], c[0]]}>
              <Pressable onPress={() => navigation.navigate('UnitDetails', { unit: u })} style={styles.pinWrap}>
                <View style={[styles.pin, { backgroundColor: statusColor(u.status) }]} />
                <View style={styles.tooltip}><Text style={styles.tooltipText}>{u.waitMinutes}m</Text></View>
              </Pressable>
            </Marker>
          );
        })}
      </Map>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Mapa de Transparência · toque num pino para ver a unidade</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  map: { flex: 1 },
  pinWrap: { alignItems: 'center' },
  pin: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#fff' },
  tooltip: { backgroundColor: 'rgba(15,23,43,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  tooltipText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  banner: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 10 },
  bannerText: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
