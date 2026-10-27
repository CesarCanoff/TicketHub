import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { colors } from '../theme/colors';

export default function CreateChamadoScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.listarCategorias().then(setCategorias).catch((err) => setErro(err.message));
  }, []);

  async function handleCriar() {
    if (!titulo.trim() || !descricao.trim() || !categoriaId) {
      setErro('Preencha título, descrição e categoria de atendimento.');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      await api.criarChamado({ titulo: titulo.trim(), descricao: descricao.trim(), categoriaId });
      navigation.goBack();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.titulo}>Novo chamado</Text>
      <Text style={styles.secao}>Informações</Text>

      <Text style={styles.label}>TÍTULO</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite um título para o chamado"
        placeholderTextColor={colors.placeholder}
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={styles.label}>DESCRIÇÃO</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Descreva o que está acontecendo"
        placeholderTextColor={colors.placeholder}
        value={descricao}
        onChangeText={setDescricao}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>CATEGORIA DE SERVIÇO</Text>
      <View style={styles.categorias}>
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, categoriaId === cat.id && styles.chipSelecionado]}
            onPress={() => setCategoriaId(cat.id)}
          >
            <Text style={[styles.chipTexto, categoriaId === cat.id && styles.chipTextoSelecionado]}>
              {cat.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!!erro && <Text style={styles.erro}>{erro}</Text>}

      <TouchableOpacity style={styles.botao} onPress={handleCriar} disabled={enviando}>
        {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Criar chamado</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 },
  secao: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelecionado: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: 13, color: colors.text },
  chipTextoSelecionado: { color: '#fff', fontWeight: '600' },
  erro: { color: colors.danger, marginTop: 16, fontSize: 13 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 40,
  },
  botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
