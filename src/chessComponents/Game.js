import './Game.css';
import Pieces from './Pieces';
import ChessBoard from './Chessboard';
import ClickSquare from './ClickSquare';
import HintSquares from './HintSquares';
import HoverSquare from './HoverSquare';
import ThinkSquares from './ThinkSquares';
import HighLightSquares from './HighLightSquares';

function Game() {
	return (
		<ChessBoard>
			<HighLightSquares />
			<ClickSquare />
			<ThinkSquares />
			<HintSquares />
			<Pieces />
			<HoverSquare />
		</ChessBoard>
	);
}

export default Game;
