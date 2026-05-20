import { useMemo, useRef, useState } from 'react';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { FiCamera, FiSave } from 'react-icons/fi';
import SuccessModal from './SuccessModal';

const ProfilePage = ({ onProfileChange }) => {
  const fileInputRef = useRef(null);
  const savedName = localStorage.getItem('mc_v2_display_name') || '';
  const savedEmail = localStorage.getItem('mc_v2_login_email') || '';
  const savedUsername = localStorage.getItem('mc_v2_username') || '';
  const savedPhoto = localStorage.getItem('mc_v2_profile_photo') || '';

  const [fullName, setFullName] = useState(savedName);
  const [email] = useState(savedEmail);
  const [username, setUsername] = useState(savedUsername);
  const [photo, setPhoto] = useState(savedPhoto);
  const [status, setStatus] = useState({ type: 'info', message: 'Lengkapi identitas profil seperti saat mendaftar.' });
  const [showSuccess, setShowSuccess] = useState(false);

  const initials = useMemo(
    () => (fullName || username || 'user').charAt(0).toUpperCase(),
    [fullName, username]
  );

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'danger', message: 'File foto harus berupa gambar.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setStatus({ type: 'info', message: 'Foto baru siap disimpan.' });
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const cleanName = fullName.trim();
    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!cleanName) {
      setStatus({ type: 'danger', message: 'Nama lengkap wajib diisi.' });
      return;
    }

    if (cleanUsername.length < 3) {
      setStatus({ type: 'danger', message: 'Username minimal 3 karakter.' });
      return;
    }

    localStorage.setItem('mc_v2_display_name', cleanName);
    localStorage.setItem('mc_v2_username', cleanUsername);
    localStorage.setItem('mc_v2_profile_photo', photo);
    setUsername(cleanUsername);
    onProfileChange?.(cleanName);
    setStatus({ type: 'success', message: 'Profil berhasil diperbarui.' });
    setShowSuccess(true);
  };

  return (
    <section className="user-dashboard__page account-page">
      <div className="profile-heading">
        <div className="profile-heading__avatar">
          {photo ? <img src={photo} alt="Foto profil" /> : initials}
        </div>
        <div>
          <h1>Profil</h1>
          <p>Perbarui identitas akun dan foto profil dashboard.</p>
        </div>
      </div>

      <Alert variant={status.type}>{status.message}</Alert>

      <form className="account-form" onSubmit={saveProfile}>
        <Row className="g-4">
          <Col xs={12} md={4}>
            <div className="photo-editor">
              <div className="photo-editor__preview">
                {photo ? <img src={photo} alt="Preview profil" /> : <span>{initials}</span>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="outline-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiCamera size={16} />
                Edit Foto Profil
              </Button>
            </div>
          </Col>
          <Col xs={12} md={8}>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId="profileFullName">
                  <Form.Label>Nama Lengkap</Form.Label>
                  <Form.Control
                    value={fullName}
                    placeholder="Nama lengkap"
                    autoComplete="name"
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="profileEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control value={email} disabled />
                  <Form.Text className="text-muted">
                    Ubah email melalui menu Ubah Email.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="profileUsername">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    value={username}
                    placeholder="username"
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Button type="submit" variant="primary">
                  <FiSave size={16} />
                  Simpan Profil
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </form>

      <SuccessModal
        show={showSuccess}
        title="Profil Berhasil Disimpan"
        message="Perubahan profil dan foto akan dipakai pada dashboard user ini."
        onHide={() => setShowSuccess(false)}
      />
    </section>
  );
};

export default ProfilePage;
