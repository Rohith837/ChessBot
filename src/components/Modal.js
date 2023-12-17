import React, { Fragment, useContext, useEffect, useState } from 'react';
import GameContext from '../store/game-context';
import './Modal.css'
const Modal = () => {
	const ctx = useContext(GameContext);
	const { message, getPGN } = ctx;
	const [modalOpen, setModalOpen] = useState(false);
	const [isCopied, setIsCopied] = useState(false);

	const handleOpenModal = () => {
		setModalOpen(true);
		const body = document.body;
		if (modalOpen) {
			body.style.overflow = 'hidden'; // Disable scrolling when modal is open
		} else {
			body.style.overflow = 'auto'; // Enable scrolling when modal is closed
		}
	};

	function copyPGN() {
		console.log("copying.....")
		navigator.clipboard.writeText(getPGN());
		setIsCopied(true);
		setTimeout(() => {
			setIsCopied(false);
		}, 2000)
	}

	useEffect(
		() => {
			if (Object.keys(message).length !== 0) handleOpenModal();
			else closeModal();
		},
		[message]
	);

	const closeModal = () => {
		setModalOpen(false);
	};
	return (
		<Fragment>
			{modalOpen ?
				<div className="modal-overlay">
					<div className="modal-content">
						<h2>{message.status}</h2>
						<p>{message.message}</p>
						<button className="close-button" style={{ marginRight: "10px" }} onClick={closeModal}>
							Close
						</button>
						{message.status && <button className="close-button" style={{ marginLeft: "10px" }} onClick={() => { window.location.reload() }}>
							New Game
						</button>}
						{message.status && <button className="close-button" style={{ marginLeft: "20px" }} onClick={isCopied ? null : copyPGN}>
							{!isCopied ? "Copy PGN" : "PGN copied"}
						</button>}
					</div>
				</div> : <Fragment></Fragment>
			}
		</Fragment>
	);
};

export default Modal;
