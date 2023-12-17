import engine from "./engine";

let chessEngine = new engine();
chessEngine.sendMessage = sendMessage;

function sendMessage(message) {
    /* eslint-disable no-restricted-globals */
    self.postMessage(message);
    /* eslint-disable no-restricted-globals */
}

/* eslint-disable no-restricted-globals */
self.onmessage = ({ data }) => {
    if (data.pgn) {
        chessEngine.chess.loadPgn(data.pgn);
    }
    else if (data.single) {
        let value = chessEngine.search(data.depth,data.maxTime);

        let { bestMove, nodesSearched: positions, depth, evaluation, timeTaken } = value;
        let message = { bestMove, positions, depth, evaluation, timeTaken, finalResult: true };

        self.postMessage(message);
    }
};
/* eslint-disable no-restricted-globals */