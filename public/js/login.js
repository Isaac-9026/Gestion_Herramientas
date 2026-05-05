'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('formLogin').addEventListener('submit', login);
});

async function login(e) {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  clearErrors(['loginUsername', 'loginPassword']);

  let ok = true;

  if (!username) {
    setError('loginUsername', 'err-loginUsername', 'El usuario es obligatorio');
    ok = false;
  }

  if (!password) {
    setError('loginPassword', 'err-loginPassword', 'La contraseña es obligatoria');
    ok = false;
  }

  if (!ok) return;

  setLoading('btnLogin', 'btnLoginText', 'btnLoginSpinner', true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'No se pudo iniciar sesión');
    }

    localStorage.setItem('token', json.token);
    localStorage.setItem('auth_user', JSON.stringify(json.user));

    window.location.href = '/index.html';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading('btnLogin', 'btnLoginText', 'btnLoginSpinner', false);
  }
}