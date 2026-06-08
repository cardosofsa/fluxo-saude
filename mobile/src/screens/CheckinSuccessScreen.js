import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { colors } from '../theme';

export default function CheckinSuccessScreen({ route, navigation }) {
  const { code, unitName } = route.params || {};
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.check}><Text style={styles.checkIcon}>✓</Text></View>
        <Text style={styles.title}>Check-in realizado!</Text>
        <Text style={styles.sub}>Apresente o código abaixo na recepção da {unitName || 'unidade'}.</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>SEU CÓDIGO</Text>
          <Text style={styles.code}>{code}</Text>
        </View>

        <Text style={styles.tip}>Chegue com até 30 min de antecedência. Seu lugar na triagem está reservado.</Text>

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('PatientTabs')}>
          <Text style={styles.btnText}>Voltar ao início</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  check: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  checkIcon: { color: '#fff', fontSize: 48, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 8 },
  codeBox: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 24, paddingHorizontal: 48, marginTop: 28, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center' },
  codeLabel: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 2 },
  code: { fontSize: 36, fontWeight: '800', color: colors.primary, marginTop: 6, letterSpacing: 2 },
  tip: { color: colors.muted, textAlign: 'center', marginTop: 24, fontSize: 13 },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, marginTop: 32 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
