import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ show, onHide, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: '' });

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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setStatus({ type: 'danger', message: 'Email dan password wajib diisi.' });
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setStatus({ type: 'danger', message: 'Nama lengkap wajib diisi.' });
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setStatus({ type: 'danger', message: 'Konfirmasi password tidak sama.' });
      return;
    }
    const username = buildUsername(email.trim());
    const displayName = fullName.trim() || username;
    localStorage.setItem('mc_v2_login_email', email.trim());
    localStorage.setItem('mc_v2_username', username);
    localStorage.setItem('mc_v2_display_name', displayName);
    setStatus({
      type: 'success',
      message:
        mode === 'register'
          ? 'Daftar simulasi berhasil. Mengarah ke dashboard user.'
          : 'Login simulasi berhasil. Mengarah ke dashboard user.',
    });
    onHide();
    navigate(`/${username}/dashboard/endpoint`);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'register' ? 'Daftar' : 'Masuk'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant={status.type || 'info'}>
          {status.message || 'Fitur login simulasi: belum terhubung ke backend.'}
        </Alert>
        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <Form.Group className="mb-3" controlId="registerName">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nama lengkap"
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
              placeholder="Masukkan password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
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
          <Form.Check
            type="checkbox"
            className="mb-3"
            label="Ingat saya di perangkat ini"
          />
          <Button type="submit" variant="primary" className="w-100">
            {mode === 'register' ? 'Daftar' : 'Login'}
          </Button>
        </Form>
        <div className="text-center mt-3">
          {mode === 'register' ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <Button
            variant="link"
            className="p-0"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? 'Masuk' : 'Daftar'}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default LoginModal;
