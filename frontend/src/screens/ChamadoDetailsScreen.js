import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { colors, statusInfo } from "../theme/colors";

import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

function formatarData(isoString) {
  return new Date(isoString).toLocaleDateString("pt-BR");
}

export default function ChamadoDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { usuario } = useAuth();
  const [chamado, setChamado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const dados = await api.buscarChamado(id);
      setChamado(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function handleAssumir() {
    setProcessando(true);
    try {
      await api.assumirChamado(id);
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function handleEncerrar() {
    setProcessando(true);
    try {
      await api.encerrarChamado(id);
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando || !chamado) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const info = statusInfo[chamado.status] || statusInfo.ABERTO;
  const ehTecnico = usuario?.tipo === "TECNICO";
  const podeAssumir = ehTecnico && chamado.status === "ABERTO";
  const podeEncerrar =
    ehTecnico &&
    chamado.status === "EM_ATENDIMENTO" &&
    chamado.tecnico_id === usuario.id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          marginBottom: 16,
        }}
      >
        <Ionicons name="chevron-back-outline" size={25} color="#1E3A8A" />
      </TouchableOpacity>

      <Text style={styles.numero}>{String(chamado.id).padStart(5, "0")}</Text>

      <View style={styles.linhaTitulo}>
        <Text style={styles.titulo}>{chamado.titulo}</Text>
        <View style={[styles.badge, { backgroundColor: info.color + "22" }]}>
          <Text style={[styles.badgeTexto, { color: info.color }]}>
            {info.label}
          </Text>
        </View>
      </View>

      <Text style={styles.rotulo}>Descrição</Text>
      <Text style={styles.valor}>{chamado.descricao}</Text>

      <Text style={styles.rotulo}>Categoria</Text>
      <Text style={styles.valor}>{chamado.categoria_nome}</Text>

      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rotulo}>Criado em</Text>
          <Text style={styles.valor}>{formatarData(chamado.criado_em)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rotulo}>Atualizado em</Text>
          <Text style={styles.valor}>
            {formatarData(chamado.atualizado_em)}
          </Text>
        </View>
      </View>

      <Text style={styles.rotulo}>Técnico responsável</Text>
      <Text style={styles.valor}>
        {chamado.tecnico_nome || "Ainda não atribuído"}
      </Text>

      {!!erro && <Text style={styles.erro}>{erro}</Text>}

      {podeAssumir && (
        <TouchableOpacity
          style={styles.botao}
          onPress={handleAssumir}
          disabled={processando}
        >
          {processando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Assumir chamado</Text>
          )}
        </TouchableOpacity>
      )}

      {podeEncerrar && (
        <TouchableOpacity
          style={styles.botao}
          onPress={handleEncerrar}
          disabled={processando}
        >
          {processando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Fechar chamado</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  numero: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  linhaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeTexto: { fontSize: 12, fontWeight: "600" },
  rotulo: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 4,
  },
  valor: { fontSize: 14, color: colors.text, lineHeight: 20 },
  linha: { flexDirection: "row", marginTop: 4 },
  erro: { color: colors.danger, marginTop: 20, fontSize: 13 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  botaoTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
