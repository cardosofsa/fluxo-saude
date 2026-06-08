import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { db } from '../services/db';
import { isAdmin, findStaffByCredentials, screenForRole, DEFAULT_STAFF } from '../services/auth';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    db.getStaff().then((s) => setStaff(s && s.length ? s : DEFAULT_STAFF));
  }, []);

  const onSubmit = () => {
    setError('');
    if (!username || !password) { setError('Preencha todos os campos.'); return; }
    if (isAdmin(username, password)) {
      navigation.navigate('ProfessionalDashboard', { user: { name: 'Administrador Geral', role: 'admin' } });
      return;
    }
    const matched = findStaffByCredentials(staff, username, password);
    if (matched) {
      navigation.navigate('ProfessionalDashboard', { user: matched });
    } else {
      setError('CPF ou senha incorretos.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Acesso do Profissional</Text>
        <Text style={styles.sub}>Entre com seu CPF e senha (ou admin / adm123).</Text>

        <Text style={styles.label}>CPF ou usuário</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Somente números"
          autoCapitalize="none"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          placeholderTextColor={colors.muted}
        />

        {!!error && <Text style={styles.error}>⚠️ {error}</Text>}

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]} onPress={onSubmit}>
          <Text style={styles.btnText}>Entrar</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: colors.text },
  error: { color: colors.danger, marginTop: 14, fontWeight: '600' },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
