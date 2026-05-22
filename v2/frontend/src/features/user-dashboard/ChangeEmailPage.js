import { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { FiMail, FiSave } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import SuccessModal from './SuccessModal';
import { getAuthToken, saveEmail as saveEmailApi, storeUser } from './userApi';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildUsername = (value) => {
  const base = value.split('@')[0] || 'user';
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'user';
};

const ChangeEmailPage = () => {
  const navigate = useNavigate();
  const { username = 'user' } = useParams();
  const savedEmail = localStorage.getItem('mc_v2_login_email') || '';
  const [oldEmail, setOldEmail] = useState(savedEmail);
  const [newEmail, setNewEmail] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: 'Masukkan email lama dan email baru untuk memperbarui akun.' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [nextPath, setNextPath] = useState('');

  const saveEmail = async (event) => {
    event.preventDefault();
    const cleanOldEmail = oldEmail.trim().toLowerCase();
    const cleanNewEmail = newEmail.trim().toLowerCase();

    if (savedEmail && cleanOldEmail !== savedEmail.toLowerCase()) {
      setStatus({ type: 'danger', message: 'Email lama tidak sesuai dengan email akun saat ini.' });
      return;
    }

    if (!emailPattern.test(cleanNewEmail)) {
      setStatus({ type: 'danger', message: 'Format email baru belum valid.' });
      return;
    }

    if (cleanNewEmail === cleanOldEmail) {
      setStatus({ type: 'danger', message: 'Email baru tidak boleh sama dengan email lama.' });
      return;
    }

    try {
      let nextUsername = buildUsername(cleanNewEmail);
      if (getAuthToken()) {
        const result = await saveEmailApi({ oldEmail: cleanOldEmail, newEmail: cleanNewEmail });
        storeUser(result.user);
        nextUsername = result.user?.username || nextUsername;
      } else {
        localStorage.setItem('mc_v2_login_email', cleanNewEmail);
        localStorage.setItem('mc_v2_username', nextUsername);
      }
      setStatus({ type: 'success', message: 'Email berhasil diperbarui.' });
      setNewEmail('');
      setNextPath(`/${nextUsername || username}/dashboard/email`);
      setShowSuccess(true);
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Email gagal diperbarui.' });
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    if (nextPath) {
      navigate(nextPath, { replace: true });
    }
  };

  return (
    <section className="user-dashboard__page account-page">
      <div className="profile-heading">
        <div className="profile-heading__avatar profile-heading__avatar--icon">
          <FiMail size={28} />
        </div>
        <div>
          <h1>Ubah Email</h1>
          <p>Perbarui alamat email yang digunakan untuk masuk ke dashboard.</p>
        </div>
      </div>

      <Alert variant={status.type}>{status.message}</Alert>

      <form className="account-form account-form--narrow" onSubmit={saveEmail}>
        <Form.Group className="mb-3" controlId="oldEmail">
          <Form.Label>Email Lama</Form.Label>
          <Form.Control
            type="email"
            value={oldEmail}
            placeholder="email-lama@email.com"
            autoComplete="email"
            onChange={(event) => setOldEmail(event.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-4" controlId="newEmail">
          <Form.Label>Email Baru</Form.Label>
          <Form.Control
            type="email"
            value={newEmail}
            placeholder="email-baru@email.com"
            autoComplete="email"
            onChange={(event) => setNewEmail(event.target.value)}
          />
        </Form.Group>
        <Button type="submit" variant="primary">
          <FiSave size={16} />
          Simpan Email
        </Button>
      </form>

      <SuccessModal
        show={showSuccess}
        title="Email Berhasil Diubah"
        message="Alamat email login sudah diperbarui dan username dashboard ikut disesuaikan."
        onHide={closeSuccess}
      />
    </section>
  );
};

export default ChangeEmailPage;
