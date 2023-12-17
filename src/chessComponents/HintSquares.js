import React, { Fragment, useContext } from 'react';
import HintSquare from './HintSquare';
import GameContext from '../store/game-context';

const HintSquares = () => {
	const ctx = useContext(GameContext);
    const { hintSquares } = ctx;
	return <Fragment>
		{hintSquares.map((data) => {
			let props = { data };
			return <HintSquare key={data.to} {...props} />;
		})}
	</Fragment>
};

export default HintSquares;
