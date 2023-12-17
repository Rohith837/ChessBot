import React, { useContext } from 'react';
import GameContext from '../store/game-context';
import Coordinates from './Coordinates';
const ChessBoard = ({ children }) => {
	const ctx = useContext(GameContext);
	const { yourTurn } = ctx;
	let className = `chessboard ${yourTurn.current === 'b' ? 'flipped' : ''}`;
	return (
		<div className={className}>
			<Coordinates />
			{children}
		</div>
	);
};

export default ChessBoard;
