import React, { useContext } from 'react';
import GameContext from '../store/game-context';

const HintSquare = ({ data }) => {
	const ctx = useContext(GameContext);
	const { MovePiece, clickedSquare } = ctx;
	let square = data.to;
	let className = `${data.captured ? 'capture-hint' : 'hint'} square-${square}`;
	function clickHandler() {
		MovePiece(clickedSquare, square);
	}
	return <div className={className} onClick={clickHandler} />;
};

export default HintSquare;
