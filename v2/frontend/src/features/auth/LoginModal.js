import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { loginAccount, registerAccount, storeAuthSession } from '../user-dashboard/userApi';

const LoginModal = ({ show, onHide, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    setMode(initialMode);
    setStatus({ type: 'info', message: '' });
  }, [show, initialMode]);

  const buildUsername = (value) => {
    const base = value.split('@')[0] || 'user';
    const normalized = base
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return normalized || 'user';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setStatus({ type: 'danger', message: 'Email dan password wajib diisi.' });
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setStatus({ type: 'danger', message: 'Nama lengkap wajib diisi.' });
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setStatus({ type: 'danger', message: 'Password minimal 8 karakter.' });
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setStatus({ type: 'danger', message: 'Konfirmasi password tidak sama.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = { email: email.trim(), password, fullName: fullName.trim() };
      const result = mode === 'register'
        ? await registerAccount(payload)
        : await loginAccount(payload);
      const username = result.user?.username || buildUsername(email.trim());

      storeAuthSession(result);
      setStatus({
        type: 'success',
        message:
          mode === 'register'
            ? 'Pendaftaran berhasil. Mengarahkan ke dashboard...'
            : 'Login berhasil. Mengarahkan ke dashboard...',
      });
      onHide();
      navigate(`/${username}/dashboard`);
    } catch (error) {
      if (!error.status) {
        const username = buildUsername(email.trim());
        const displayName = fullName.trim() || username;
        localStorage.setItem('mc_v2_login_email', email.trim());
        localStorage.setItem('mc_v2_username', username);
        localStorage.setItem('mc_v2_display_name', displayName);
        setStatus({ type: 'warning', message: 'Server autentikasi belum terhubung. Masuk dalam mode lokal.' });
        onHide();
        navigate(`/${username}/dashboard`);
        return;
      }

      setStatus({ type: 'danger', message: error.message || 'Autentikasi gagal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="mc-auth-modal">
      <Modal.Header closeButton>
        <div>
          <Modal.Title>{mode === 'register' ? 'Buat Akun Baru' : 'Masuk ke Microclimate'}</Modal.Title>
          <div className="text-muted small mt-1">
            {mode === 'register'
              ? 'Daftarkan akun untuk mengelola sumber data dan membuat dashboard custom.'
              : 'Masuk untuk mengakses konfigurasi stasiun dan link dashboard Anda.'}
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        {status.message && (
          <Alert variant={status.type || 'info'} className="py-2 small">
            {status.message}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <Form.Group className="mb-3" controlId="registerName">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control
                type="text"
                placeholder="Masukkan nama lengkap"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
              />
            </Form.Group>
          )}
          <Form.Group className="mb-3" controlId="loginEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="loginPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder={mode === 'register' ? 'Minimal 8 karakter' : 'Masukkan password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </Form.Group>
          {mode === 'register' && (
            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Konfirmasi Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </Form.Group>
          )}
          <Button type="submit" variant="primary" className="w-100 mt-1" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : mode === 'register' ? 'Daftar Akun' : 'Masuk'}
          </Button>
        </Form>
        <div className="text-center mt-3 small">
          {mode === 'register' ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <Button
            variant="link"
            className="p-0 fw-semibold text-decoration-none"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setStatus({ type: 'info', message: '' });
            }}
          >
            {mode === 'register' ? 'Masuk di sini' : 'Daftar sekarang'}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default LoginModal;
