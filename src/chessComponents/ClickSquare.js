import React, { Fragment, useContext } from 'react';
import GameContext from '../store/game-context';

const ClickSquare = () => {
    const ctx = useContext(GameContext);
    const { clickedSquare } = ctx;
    return <Fragment>
        {clickedSquare && <div className={`highlight square-${clickedSquare}`} />}
    </Fragment>
};

export default ClickSquare;
