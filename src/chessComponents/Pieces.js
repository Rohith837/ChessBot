import React, { Fragment, useContext } from 'react';
import Piece from './Piece';
import GameContext from '../store/game-context';

const Pieces = () => {
	const ctx = useContext(GameContext);
	const { pieces } = ctx;
	const p = [];
	pieces.forEach((data) => {
		data.forEach((d) => {
			if (d) p.push(d);
		});
	});
	return (
		<Fragment>
			{p.map((d) => {
				let f = { d };
				return <Piece key={d.square} {...f} />;
			})}
		</Fragment>
	);
};

export default Pieces;
