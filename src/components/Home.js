import './Home.css';
import { Fragment, useContext, useEffect, useState } from 'react';
import GameContext from '../store/game-context';
import Game from '../chessComponents/Game';

function Computer() {
	const ctx = useContext(GameContext);
	const { fen, loadFenFromInput, stopEvaluation, searchData, computerTurn, setComputerTurn } = ctx;
	const [value, setValue] = useState(fen);

	const [isMobile, setIsMobile] = useState(window.innerWidth <= 850);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 850);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		setValue(fen);
	}, [fen])

	function onKeyDown(event) {
		event.stopPropagation();
		if (event.key === "Enter") {
			loadFenFromInput(value);
			setValue(fen);
		}
	}

	function onChange(e) {
		setValue(e.target.value);
	}

	function onClick(e) {
		e.target.select()
	}

	function onBlur() {
		setValue(fen)
	}

	let inputAttributes = { value, autoCorrect: "off", onClick, onKeyDown, onChange, onBlur }

	return (
		<Fragment>
			<div className='game'>
				<Game />
				<div className='fen'>
					<div>fen: </div>
					<input {...inputAttributes} />
				</div>
			</div>
			{!computerTurn && <div>
				play as
				<br />
				<button className='playas' onClick={() => setComputerTurn('b')}>white</button>
				<button className='playas' onClick={() => setComputerTurn('w')}>black</button>
			</div>}
			{!isMobile && <SearchInfo data={searchData} stopEvaluation={stopEvaluation} />}
		</Fragment>
	);
}

function SearchInfo({ data, stopEvaluation }) {
	return <Fragment>
		{data && <div className='data'>
			<div className='item'>
				<div>Eval: {data.evaluation >= 0 ? '+' : ''}{Math.floor(data.evaluation) / 100}</div>
				<div>Best move: {data.bestMove}</div>
				<div>Depth Searched: {data.depth}</div>
				<div>Time Taken: {data.timeTaken / 1000} seconds</div>
				<div>positions evaluated: {data.positions.toLocaleString('en-IN')}</div>
			</div>
			{stopEvaluation && <button onClick={stopEvaluation}>stop evaluation</button>}
		</div>}
	</Fragment>
}

export default Computer;
