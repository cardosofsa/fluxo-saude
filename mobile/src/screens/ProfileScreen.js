import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { colors } from '../theme';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>R</Text></View>
          <Text style={styles.name}>Rodrigo Carvalho</Text>
          <Text style={styles.sub}>Paciente · Feira de Santana</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados Pessoais</Text>
          <Row label="CPF" value="***.582.491-**" />
          <Row label="CNS (Cartão SUS)" value="898 0001 2345 6789" />
          <Row label="Nascimento" value="14/09/1991 (34 anos)" />
        </View>

        <Pressable
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.getParent()?.navigate('Welcome')}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  avatarWrap: { alignItems: 'center', marginVertical: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  sub: { color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.text, fontWeight: '700', fontSize: 13 },
  logout: { backgroundColor: '#FEE2E2', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  logoutText: { color: colors.danger, fontWeight: '800' },
});
