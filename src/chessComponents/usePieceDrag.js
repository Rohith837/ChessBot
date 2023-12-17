import { useState, useEffect, useContext } from 'react';
import GameContext from '../store/game-context';

function getTranslateValues(myElement) {
	var style = window.getComputedStyle(myElement);
	var matrix = new window.WebKitCSSMatrix(style.transform);
	return { yValue: matrix.m42, xValue: matrix.m41 };
}

let x = 0;
let y = 0;
let presentX = 0;
let presentY = 0;
let elementWidth = 0;
let elementHeight = 0;

const usePieceDrag = ({ square, color }) => {
	const ctx = useContext(GameContext);
	const { MovePiece, yourTurn, setClickedSquare, setHoverSquare } = ctx;
	const [isMoving, setIsMoving] = useState(false);
	const [position, setposition] = useState({ x: 0, y: 0 });
	
	function stopMoving() {
		setHoverSquare('');
		setClickedSquare();
		setIsMoving(false);
	}
	
	function mouseDown(e) {
		// right click
		if (e.button === 2) {
			stopMoving();
			return;
		}
		setIsMoving(true);
		let yourChance = yourTurn.current ? yourTurn.current[0] === color : false;
		if (yourChance) setClickedSquare(square);
		e = e.nativeEvent;
		elementWidth = e.target.offsetWidth;
		elementHeight = e.target.offsetHeight;
		const { xValue, yValue } = getTranslateValues(e.target);
		x = e.x;
		y = e.y;
		presentX = Math.round(xValue / elementWidth) * 100;
		presentY = Math.round(yValue / elementHeight) * 100;
		presentX += (e.offsetX - elementWidth / 2) * 100 / elementWidth;
		presentY += (e.offsetY - elementHeight / 2) * 100 / elementHeight;
		setposition({ x: presentX, y: presentY });
	}

	function getSquare(x, y) {
		x = Math.round(x / 100) * 100;
		y = Math.round(y / 100) * 100;
		x = x / 100 + 1;
		y = y / 100 + 1;
		// If the board is flipped.
		if (yourTurn.current === 'b') {
			x = 9 - x;
			y = 9 - y;
		}
		return `${String.fromCharCode(96 + x)}${9 - y}`;
	}

	useEffect(
		() => {
			function mouseMove(e) {
				presentX += (e.x - x) * 100 / elementWidth;
				presentY += (e.y - y) * 100 / elementHeight;
				x = e.x;
				y = e.y;
				let Px, Py;
				Px = presentX > 740 ? 740 : presentX;
				Px = presentX < -40 ? -40 : Px;
				Py = presentY > 740 ? 740 : presentY;
				Py = presentY < -40 ? -40 : Py;
				setHoverSquare(getSquare(Px, Py));
				setposition({ x: Px, y: Py });
			}
			function mouseUp(e) {
				let newSquare = getSquare(presentX, presentY);
				MovePiece(square, newSquare);
				stopMoving();
			}
			function removeEventListeners() {
				document.removeEventListener('mousemove', mouseMove);
				document.removeEventListener('mouseup', mouseUp);
			}
			if (isMoving) {
				document.addEventListener('mousemove', mouseMove);
				document.addEventListener('mouseup', mouseUp);
			}
			return () => {
				if (isMoving) {
					removeEventListeners();
				}
			};
		},
		[isMoving]
	);
	return {
		isMoving,
		position,
		mouseDown
	};
};

export default usePieceDrag;
