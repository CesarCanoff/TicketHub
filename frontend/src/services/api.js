import AsyncStorage from "@react-native-async-storage/async-storage";

// Em desenvolvimento com Expo Go no celular, troque localhost pelo IP
// da sua máquina na rede local (ex.: http://192.168.0.10:3000/api).
const BASE_URL = "http://10.0.2.2:3000/api";

async function request(path, options = {}) {
  const token = await AsyncStorage.getItem("@tickethub:token");

  const resposta = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || "Ocorreu um erro. Tente novamente.");
  }

  return dados;
}

export const api = {
  login: (email, senha) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),

  listarCategorias: () => request("/categorias"),

  listarChamados: () => request("/chamados"),

  buscarChamado: (id) => request(`/chamados/${id}`),

  criarChamado: (dados) =>
    request("/chamados", { method: "POST", body: JSON.stringify(dados) }),

  assumirChamado: (id) =>
    request(`/chamados/${id}/assumir`, { method: "PATCH" }),

  encerrarChamado: (id) =>
    request(`/chamados/${id}/encerrar`, { method: "PATCH" }),
};
