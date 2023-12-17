import React, { Fragment, useContext } from 'react';
import GameContext from '../store/game-context';

const HoverSquare = () => {
    const ctx = useContext(GameContext);
    const { hoverSquare } = ctx;
    return <Fragment>
        {hoverSquare && <div className={`hover square-${hoverSquare}`} />}
    </Fragment>
};

export default HoverSquare;
