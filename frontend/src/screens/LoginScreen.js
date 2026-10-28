import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

import { RFValue } from "react-native-responsive-fontsize";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      await login(email.trim(), senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>TicketHub</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.titulo}>Acesse sua conta</Text>
        <Text style={styles.subtitulo}>
          Entre usando seu e-mail e senha cadastrados
        </Text>

        <Text style={styles.label}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="exemplo@mail.com"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>SENHA</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor={colors.placeholder}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        {!!erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity
          style={styles.botao}
          onPress={handleEntrar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: "55%",
    backgroundColor: colors.primary,
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { color: colors.card, fontSize: RFValue(42), fontWeight: "700" },
  form: {
    flex: 1,
    height: "45%",
    marginTop: -30,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 36,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitulo: { fontSize: 13, color: colors.textMuted, marginBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  erro: { color: colors.danger, marginTop: 14, fontSize: 13 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  botaoTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
  rodape: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
});
