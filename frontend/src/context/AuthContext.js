import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Restaura a sessão salva ao abrir o app.
    (async () => {
      const usuarioSalvo = await AsyncStorage.getItem('@tickethub:usuario');
      if (usuarioSalvo) setUsuario(JSON.parse(usuarioSalvo));
      setCarregando(false);
    })();
  }, []);

  async function login(email, senha) {
    const resultado = await api.login(email, senha);
    await AsyncStorage.setItem('@tickethub:token', resultado.token);
    await AsyncStorage.setItem('@tickethub:usuario', JSON.stringify(resultado.usuario));
    setUsuario(resultado.usuario);
  }

  async function logout() {
    await AsyncStorage.multiRemove(['@tickethub:token', '@tickethub:usuario']);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
