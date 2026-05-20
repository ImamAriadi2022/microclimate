import { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { FiShield } from 'react-icons/fi';
import SuccessModal from './SuccessModal';

const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: 'Gunakan kata sandi baru minimal 8 karakter.' });
  const [showSuccess, setShowSuccess] = useState(false);

  const savePassword = (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setStatus({ type: 'danger', message: 'Kata sandi baru minimal 8 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'danger', message: 'Konfirmasi kata sandi baru tidak sama.' });
      return;
    }

    localStorage.setItem('mc_v2_password', newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setStatus({ type: 'success', message: 'Kata sandi berhasil diperbarui.' });
    setShowSuccess(true);
  };

  return (
    <section className="user-dashboard__page account-page">
      <div className="profile-heading">
        <div className="profile-heading__avatar profile-heading__avatar--icon">
          <FiShield size={28} />
        </div>
        <div>
          <h1>Ubah Kata Sandi</h1>
          <p>Buat kata sandi baru untuk akun dashboard ini.</p>
        </div>
      </div>

      <Alert variant={status.type}>{status.message}</Alert>

      <form className="account-form account-form--narrow" onSubmit={savePassword}>
        <Form.Group className="mb-3" controlId="newPassword">
          <Form.Label>Kata Sandi Baru</Form.Label>
          <Form.Control
            type="password"
            value={newPassword}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-4" controlId="confirmNewPassword">
          <Form.Label>Konfirmasi Kata Sandi Baru</Form.Label>
          <Form.Control
            type="password"
            value={confirmPassword}
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Form.Group>
        <Button type="submit" variant="primary">
          <FiShield size={16} />
          Perbarui Sandi
        </Button>
      </form>

      <SuccessModal
        show={showSuccess}
        title="Kata Sandi Berhasil Diubah"
        message="Kata sandi baru sudah tersimpan untuk akun dashboard ini."
        onHide={() => setShowSuccess(false)}
      />
    </section>
  );
};

export default ChangePasswordPage;
