import React, { useContext } from 'react';
import GameContext from '../store/game-context';
const Coordinates = () => {
	const ctx = useContext(GameContext);
	const { yourTurn } = ctx;
	let color = yourTurn.current;
	let ranks = '12345678'.split('');
	let files = 'abcdefgh'.split('');
	return (
		<svg viewBox="0 0 100 100" className="coordinates">
			{ranks.map((r, index) => {
				let className = 'coordinate-' + (index % 2 === 0 ? 'light' : 'dark');
				let rank = ranks[color !== 'b' ? 7 - index : index];
				return <text key={rank} x="0.75" y={index * 12.5 + 3.5} fontSize="2.8" className={className}>
					{rank}
				</text>
			})}
			{files.map((f, index) => {
				let className = 'coordinate-' + (index % 2 === 0 ? 'dark' : 'light');
				let file = files[color !== 'b' ? index : 7 - index]
				return <text key={file} x={index * 12.5 + 10} y="99" fontSize="2.8" className={className}>
					{file}
				</text>
			})}
		</svg>
	);
};

export default Coordinates;
