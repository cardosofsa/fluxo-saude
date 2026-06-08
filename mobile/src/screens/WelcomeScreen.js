import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { colors } from '../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>🩺</Text>
          </View>
          <Text style={styles.title}>Fluxo Saúde</Text>
          <Text style={styles.subtitle}>FEIRA DE SANTANA</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
            onPress={() => navigation.navigate('PatientTabs')}
          >
            <Text style={styles.btnPrimaryText}>Sou Paciente  ›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnOutline, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnOutlineText}>Sou Profissional  →</Text>
          </Pressable>

          <Text style={styles.footer}>© Fluxo Saúde — Gestão Inteligente de Fluxos</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingVertical: 64 },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logo: {
    width: 140, height: 140, borderRadius: 40, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  logoIcon: { fontSize: 64 },
  title: { fontSize: 40, fontWeight: '800', color: colors.primaryDark, marginTop: 12 },
  subtitle: { fontSize: 14, letterSpacing: 4, color: colors.muted, fontWeight: '600' },
  actions: { gap: 12 },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
  btnOutlineText: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
