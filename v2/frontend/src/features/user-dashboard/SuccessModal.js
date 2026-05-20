import { Button, Modal } from 'react-bootstrap';
import { FiCheckCircle } from 'react-icons/fi';

const SuccessModal = ({ show, title, message, actionLabel = 'Selesai', onHide }) => {
  return (
    <Modal show={show} onHide={onHide} centered className="account-success-modal">
      <Modal.Body className="account-success">
        <div className="account-success__icon">
          <FiCheckCircle size={34} />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <Button variant="primary" onClick={onHide}>
          {actionLabel}
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default SuccessModal;
