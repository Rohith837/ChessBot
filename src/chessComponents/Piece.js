import React from 'react';
import usePieceDrag from './usePieceDrag';

const Piece = ({ d }) => {
	let { type, square, color } = d;
	const { mouseDown, isMoving, position } = usePieceDrag({ square, color });
	let style = isMoving ? { transform: `translate(${position.x}%,${position.y}%)` } : {};
	let className = `piece ${color}${type} square-${square}${isMoving ? ' grabbing' : ''}`;
	let props = { className, style, onMouseDown: mouseDown };
	return <div {...props} />;
};

export default Piece;
