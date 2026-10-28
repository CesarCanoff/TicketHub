export const colors = {
  primary: "#1E3A8A",
  primaryDark: "#152A63",
  blueText: "#81B3FF",
  background: "#F5F5F5",
  card: "#FFFFFF",
  border: "#E2E2E2",
  text: "#1A1A1A",
  textMuted: "#7A7A7A",
  placeholder: "#B0B0B0",
  success: "#1D9E75",
  danger: "#D85A30",
  warning: "#EF9F27",
};

// Cor e rótulo por status, usados na listagem e nos detalhes do chamado.
export const statusInfo = {
  ABERTO: { label: "Aberto", color: colors.warning },
  EM_ATENDIMENTO: { label: "Em atendimento", color: colors.success },
  FECHADO: { label: "Fechado", color: colors.textMuted },
};
