import React, { Fragment, useContext } from 'react';
import GameContext from '../store/game-context';

const HighLightSquares = () => {
    const ctx = useContext(GameContext);
    const { highLightSquares } = ctx;
    return <Fragment>
        {highLightSquares.map((square, ind) => {
            let className = `highlight square-${square}`;
            return <div key={ind} className={className} />;
        })}
    </Fragment>
};

export default HighLightSquares;
