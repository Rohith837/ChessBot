import React, { Fragment, useContext } from 'react';
import GameContext from '../store/game-context';

const ThinkSquares = () => {
    const ctx = useContext(GameContext);
    const { thinkSquares } = ctx;
    return <Fragment>
        {thinkSquares.map((square) => {
            return <div key={square} className={`think square-${square}`} />;
        })}
    </Fragment>
};

export default ThinkSquares;
