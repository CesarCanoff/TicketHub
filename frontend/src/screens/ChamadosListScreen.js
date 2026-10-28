import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { colors, statusInfo } from "../theme/colors";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

import { RFValue } from "react-native-responsive-fontsize";

function formatarData(isoString) {
  const data = new Date(isoString);
  return (
    data.toLocaleDateString("pt-BR") +
    " " +
    data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export default function ChamadosListScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarChamados();
      setChamados(dados);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Ops!",
        text2: "Não foi possível carregar os chamados.",
      });
      console.warn(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const ehCliente = usuario?.tipo === "CLIENTE";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitulo}>TicketHub</Text>
          <Text style={styles.headerSubtitulo}>
            {ehCliente ? "FUNCIONÁRIO" : "TÉCNICO"}
          </Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={32} color="#CC3D6A" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.secaoTitulo}>
          {ehCliente ? "Meus chamados" : "Chamados"}
        </Text>

        <FlatList
          data={chamados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={carregando} onRefresh={carregar} />
          }
          ListEmptyComponent={
            !carregando && (
              <Text style={styles.vazio}>Nenhum chamado encontrado.</Text>
            )
          }
          renderItem={({ item }) => {
            const info = statusInfo[item.status] || statusInfo.ABERTO;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("ChamadoDetails", { id: item.id })
                }
              >
                <View style={{ flex: 1, flexDirection: "column" }}>
                  <Text style={styles.cardData}>
                    {formatarData(item.atualizado_em)}
                  </Text>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <View style={[styles.badge]}>
                    <View
                      style={[styles.dot, { backgroundColor: info.color }]}
                    />
                    <Text style={[styles.badgeTexto, { color: info.color }]}>
                      {info.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {ehCliente && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("CreateChamado")}
          >
            <Text style={styles.fabTexto}>+ Novo chamado</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitulo: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSubtitulo: {
    color: colors.blueText,
    fontSize: RFValue(12),
    marginTop: 2,
    fontWeight: "600",
  },
  sair: { color: "#fff", fontSize: 14 },
  secaoTitulo: {
    fontSize: RFValue(16),
    fontWeight: "700",
    color: "#0A3F91",
    margin: 20,
    marginBottom: 8,
  },
  cardContainer: {
    flex: 1,
    marginTop: -10,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 7,
  },
  lista: { paddingHorizontal: 20, paddingBottom: 100 },
  vazio: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardData: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  cardTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    paddingBottom: 12,
  },
  badge: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    borderRadius: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeTexto: { fontSize: 11, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
