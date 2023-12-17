import React from 'react';

const GameContext = React.createContext({
	pieces: [],
	hintSquares: [],
	hoverSquare: "",
	thinkSquares: [],
	computerTurn: "",
	highLightSquares: [],
	clickedSquare: '',
	yourTurn: {},
	currentTurn: {},
	message: {},
	searchData: {},
	fen: "",
	setFen: () => { },
	getPGN: () => { },
	loadPgn: () => { },
	loadFenFromInput: () => { },
	setComputerTurn: () => { },
	stopEvaluation: () => { },
	playRandomMove: () => { },
	setHoverSquare: () => { },
	setClickedSquare: () => { },
	computerMove: () => { },
	MovePiece: () => { }
});

export default GameContext;
