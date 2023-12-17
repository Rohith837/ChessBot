import { Chess, cal, algebraic, rank, file, ROOK, BLACK, PAWN, KNIGHT, QUEEN, WHITE, KING, BISHOP } from "./chess";

const MAX_DEPTH = 4;

const HASH_EXACT = 0;
const HASH_ALPHA = 1;
const HASH_BETA = 2;

const WINNING = 100000000;
const LOSING = -WINNING;

const maxPly = 50;

class engine {
    ply = 0;
    computerTurn = null;
    hashTable = {};
    historyMoves = Array(12 * 128).fill(0);
    killerMoves = Array(2 * maxPly);
    chess = new Chess();
    sendMessage = null;
    resetState() {
        this.ply = 0;
        this.hashTable = {};
        this.historyMoves = Array(12 * 128).fill(0);
        this.killerMoves = Array(2 * maxPly);
    }
    evaluate() {
        let blackScore = 0, whiteScore = 0;
        let pawnsScore = 0;
        let numberOfNonPawnWhitePieces = 0, numberOfNonPawnBlackPieces = 0;
        let bk, wk;
        for (let i = 1; i <= 8; i++) {
            for (let j = 1; j <= 8; j++) {

                let square = `${String.fromCharCode(i + 96)}${j}`;

                let piece = this.chess.get(square);
                if (!piece) continue;

                if (piece) piece.square = square;
                if (piece.type === PAWN) pawnsScore += 100

                if (piece.type === KING) {
                    if (piece.color === BLACK) bk = piece;
                    else wk = piece;
                }

                else if (piece.color === BLACK) {
                    if (piece.type !== PAWN) numberOfNonPawnBlackPieces++;
                    blackScore += pieceValues[piece.type] + getSquareTableValue(piece.type, piece.color, square);
                    if (this.ifPieceOnStartingSquare(piece, square)) blackScore += -30;
                }

                else if (piece.color === WHITE) {
                    if (piece.type !== PAWN) numberOfNonPawnWhitePieces++;
                    whiteScore += pieceValues[piece.type] + getSquareTableValue(piece.type, piece.color, square);
                    if (this.ifPieceOnStartingSquare(piece, square)) whiteScore += -30;
                }
            }
        }

        let moves = this.chess._moves({ legal: false });
        const numOfRookMovesAlongFile = moves.reduce((count, move) => (move.piece === ROOK && Math.abs(move.from - move.to) >= 16) ? count + 1 : count, 0);

        if (this.chess._turn === BLACK) blackScore += (numOfRookMovesAlongFile + moves.length);
        else whiteScore += (numOfRookMovesAlongFile + moves.length);

        let idealEndGameScore = 2 * (pieceValues[ROOK] * 2 + pieceValues[BISHOP] * 2) // without considering pawns
        let totalScoreWithoutpawns = whiteScore + blackScore - pawnsScore;
        let endgameWeight = 1 - Math.min(1, (totalScoreWithoutpawns / idealEndGameScore));

        let endgame = endgameWeight === 0 ? false : true;

        blackScore += getSquareTableValue(bk.type, bk.color, bk.square, endgame);
        whiteScore += getSquareTableValue(wk.type, wk.color, wk.square, endgame);

        // Discouraging it from going into the endgame.
        if (endgame && this.computerTurn) {
            if (this.computerTurn === BLACK) blackScore -= 50;
            else if (this.computerTurn === WHITE) whiteScore -= 50;
        }

        let score = whiteScore - blackScore;

        // Prioritize exchanging pieces when we are winning.
        // Here, "120" indicates that even if it costs a pawn(100) to exchange a piece, then it should go for it.
        let exchangeThreshold = 120;

        // when white is up by 500 points
        if (score >= 500) {
            // In the endgame, that pawn might potentially become a passer unless there are enough pieces to defend it.
            if (endgame && numberOfNonPawnWhitePieces <= 1) exchangeThreshold = 60;
            score += (7 - numberOfNonPawnBlackPieces) * exchangeThreshold;
        }

        // when black is up by 500 points
        else if (score <= -500) {
            // In the endgame, that pawn might potentially become a passer unless there are enough pieces to defend it.
            if (endgame && numberOfNonPawnBlackPieces <= 1) exchangeThreshold = 60;
            score -= (7 - numberOfNonPawnWhitePieces) * exchangeThreshold;
        }

        let losingKing = score > 0 ? bk : wk;

        let mopUpScore = (1.6 * pushClose(wk.square, bk.square) + cmd(losingKing.square) * 4.7) * endgameWeight * 2;

        if (score > 0) {
            score += mopUpScore;
        }
        else {
            score -= mopUpScore;
        }

        if (this.chess.turn() === BLACK) return score * -1;
        return score;
    }

    ifPieceOnStartingSquare(piece, square) {
        if (piece.type === PAWN || piece.type === KING || piece.type === QUEEN) return false;
        if (piece.type === BISHOP) {
            if (piece.color === BLACK && (square === 'c8' || square === 'f8')) return true;
            if (piece.color === WHITE && (square === 'c1' || square === 'f1')) return true;
        }
        if (piece.type === KNIGHT) {
            if (piece.color === BLACK && (square === 'b8' || square === 'g8')) return true;
            if (piece.color === WHITE && (square === 'b1' || square === 'g1')) return true;
        }
        let castlingRights = this.chess.getCastlingRights(piece.color);
        castlingRights = castlingRights[KING] || castlingRights[QUEEN];
        if (castlingRights) return false;
        if (piece.color === BLACK && (square === 'a8' || square === 'h8')) return true;
        if (piece.color === WHITE && (square === 'a1' || square === 'h1')) return true;
        return false;
    }

    getValue(move) {

        /* 
        The order should be like this.
        Winning captures/promotions
        Equal captures
        Killer moves (non capture)
        Non-captures sorted by history heuristic
        Losing captures
        */

        let score = 0;
        if (move.captured) {
            let captureScore = (getScore(move.captured) - getScore(move.piece))
            if (captureScore >= 0) score += captureScore * 10 + 10500;
            else score += captureScore;
        }
        else if (isMovesSame(this.killerMoves[this.ply], move)) score += 10000
        else if (isMovesSame(this.killerMoves[maxPly + this.ply], move)) score += 9000
        else score += this.historyMoves[cal(move.piece + move.color) * 128 + move.to];
        return score;
    }

    orderMoves(moves, hashObj) {
        if (!moves) moves = this.chess._moves({ legal: false });

        let previousMove = this.chess._history[this.chess._history.length - 1]?.move;

        let hashMove = (hashObj && hashObj.bestMove) ? hashObj.bestMove : null;

        for (let move of moves) {
            if (isMovesSame(hashMove, move)) {
                move.value = WINNING;
            } else if (previousMove && previousMove.captured && previousMove.to === move.to) {
                // This prioritizes capturing the last moved piece with the least valuable attacker.
                move.value = 30000 - getScore(move.piece);
            } else {
                move.value = this.getValue(move);
            }
        }

        moves.sort((a, b) => { return b.value - a.value });
        return moves
    }
    
    Quiesce(alpha, beta, obj = {}) {

        if (isTimeLimitExceeded(obj)) return alpha;

        if (obj.nodes) {
            obj.nodes++;
        } else {
            obj.nodes = 0;
        }

        let moves = this.chess._moves();

        let inCheck = this.chess.inCheck();

        if (inCheck && moves.length === 0) return LOSING;

        if (
            (!inCheck && moves.length === 0) ||
            this.chess.isDrawBy50MovesRule() ||
            this.chess.isInsufficientMaterial() ||
            this.chess.hasPositionAppearedMoreThanTwice()
        ) return 0;

        // evaluation assumes that even if we finish searching all capturing moves, and none of them increase alpha, one of the capturing moves can most likely raise alpha. This is not valid if we search every move.
        // Strategically sacrificing a this.chess piece can pave the way for a clever fork maneuver.
        if (!inCheck) {
            // A player isn't forced to make a capture (typically), So, evaluation is the score without taking into account any captures.
            // This prevents situations where a player ony has bad captures available from being evaluated as bad,
            let evaluation = this.evaluate();
            if (evaluation >= beta)
                return beta;
            if (alpha < evaluation)
                alpha = evaluation;
        }

        let capturingMoves;

        if (inCheck) capturingMoves = this.orderMoves(moves);

        else capturingMoves = this.orderMoves(moves.filter(move => !!move.captured));

        for (let move of capturingMoves) {
            this.ply++;
            this.chess._makeMove(move, true);
            let score = -this.Quiesce(-beta, -alpha, obj);
            this.chess._undoMove(true);
            this.ply--;

            if (score === WINNING) return WINNING;

            if (score >= beta)
                return beta;
            if (score > alpha)
                alpha = score;
        }

        return alpha;
    }

    AlphaBeta(obj = {}, depth = MAX_DEPTH, alpha = Number.MIN_SAFE_INTEGER, beta = Number.MAX_SAFE_INTEGER, extensions = 0) {

        if (isTimeLimitExceeded(obj)) return alpha;

        let nodes = obj.nodes;

        if (!obj.nodes) obj.nodes = 1;
        else obj.nodes++;

        let hashEntry = this.hashTable[this.chess.hash];
        if (hashEntry && hashEntry.depth >= depth && hashEntry.flag === HASH_EXACT) return hashEntry.evaluation;
        if (hashEntry && hashEntry.depth >= depth && (hashEntry.flag === HASH_ALPHA) && (hashEntry.evaluation <= alpha)) return alpha;
        if (hashEntry && hashEntry.depth >= depth && (hashEntry.flag === HASH_BETA) && (hashEntry.evaluation >= beta)) return beta;

        if (depth === 0) return this.Quiesce(alpha, beta, obj);

        let moves = this.orderMoves(this.chess._moves({ legal: false }), hashEntry);

        if (this.chess.isDrawBy50MovesRule() || this.chess.isInsufficientMaterial() || this.chess.hasPositionAppearedMoreThanTwice()) return 0;

        let color = this.chess._turn, movesSearched = 0, hashFlag = HASH_ALPHA, inCheck = this.chess.inCheck(), bestMove;

        let extension = extensions < 8 ? (inCheck ? 1 : 0) : 0;

        for (let move of moves) {

            if (this.ply === 0) this.sendMessage({ thinkSquares: [algebraic(move.from), algebraic(move.to)] });

            let val;

            this.ply++;
            this.chess._makeMove(move, true);
            if (!this.chess._isKingAttacked(color)) {
                if (movesSearched === 0) val = -this.AlphaBeta(obj, depth + extension - 1, -beta, -alpha, extensions + extension);
                else {
                    // PVS search
                    // Search with a null window to determine whether this move is favorable for us.
                    val = -this.AlphaBeta(obj, depth + extension - 1, -(alpha + 1), -alpha, extensions + extension);
                    // If it is deemed a good move, perform a full re-search to obtain the exact value.
                    if (alpha < val && val < beta) val = -this.AlphaBeta(obj, depth + extension - 1, -beta, -alpha, extensions + extension);
                }
                movesSearched++;
            }
            this.chess._undoMove(true);
            this.ply--;

            if (typeof val !== "number") continue;

            if (val > alpha) {
                hashFlag = HASH_EXACT;
                bestMove = move;
                alpha = val;
                if (val === WINNING) break;
            }

            // This means that our current move is more advantageous for the opponent compared to our alternative move.
            if (alpha >= beta) {

                if (!move.captured) {
                    this.killerMoves[maxPly + this.ply] = this.killerMoves[this.ply]
                    this.killerMoves[this.ply] = move;
                }

                this.historyMoves[cal(move.piece + move.color) * move.from + move.to] += (depth * depth);

                hashFlag = HASH_BETA;
                let hashObj = {};

                hashObj.evaluation = beta;
                hashObj.flag = hashFlag;
                hashObj.depth = depth;
                hashObj.bestMove = move;
                hashObj.nodesSearched = obj.nodes - nodes;

                if (!isTimeLimitExceeded(obj)) this.hashTable[this.chess.hash] = hashObj;
                return beta;
            };
        }

        if (inCheck && movesSearched === 0) return LOSING;

        if (!inCheck && movesSearched === 0) return 0;

        let hashObj = {};

        hashObj.evaluation = alpha;
        hashObj.flag = hashFlag;
        hashObj.depth = depth;
        hashObj.bestMove = bestMove;
        hashObj.nodesSearched = obj.nodes - nodes;

        if (!isTimeLimitExceeded(obj)) this.hashTable[this.chess.hash] = hashObj;

        if (this.ply === 0) return hashObj;
        return alpha;
    }

    iterativeDeepining(obj, d) {
        this.resetState();
        this.computerTurn = this.chess._turn;
        let depth = d ? d : MAX_DEPTH;
        for (let i = 1; i <= depth; i++) {
            if (isTimeLimitExceeded(obj)) return;
            let hashObj = this.AlphaBeta(obj, i, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0);
            if (i !== depth && hashObj.bestMove) {
                let bestMove = { ...hashObj.bestMove };
                bestMove.from = algebraic(bestMove.from);
                bestMove.to = algebraic(bestMove.to);
                let timeTaken = (Date.now() - obj.initialTime);
                let message = { bestMove, positions: hashObj.nodesSearched, depth: hashObj.depth, evaluation: hashObj.evaluation, timeTaken };
                this.sendMessage(message);
            }
        }
    }

    search(d,maxTime) {
        let obj = { nodes: 0, initialTime: Date.now(), maxTime };
        this.iterativeDeepining(obj,d);
        let hashObj = this.hashTable[this.chess.hash];
        let bestMove = hashObj.bestMove; // This code throws an error when called after the game has completed.
        bestMove.from = algebraic(bestMove.from);
        bestMove.to = algebraic(bestMove.to);
        hashObj.timeTaken = (Date.now() - obj.initialTime);
        return hashObj;
    }
}


function rankSquare(square) {
    return +square[1];
}

function fileSquare(square) {
    return (square.charCodeAt(0) - 96);
}

// white related
const pawnSquareTable = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
]

const knightSquareTable = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
]

const bishopSquareTable = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
]

const rookSquareTable = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
]

const queenSquareTable = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
]

const kingMiddleSquareTable = [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
]

const kingEndgameSquareTable = [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50]
]

function getSquareTableValue(piece, color, square, endgame = false) {
    let squareRank, squareFile
    if (typeof square === 'number') {
        squareRank = rank(square) + 1;
        squareFile = file(square) + 1;
    } else if (typeof square === 'string') {
        squareRank = rankSquare(square);
        squareFile = fileSquare(square);
    } else {
        throw new Error("unexpected value");
    }
    if (piece === PAWN) {
        if (color === BLACK) return pawnSquareTable[squareRank - 1][squareFile - 1];
        return pawnSquareTable[8 - squareRank][8 - squareFile];
    }
    else if (piece === KNIGHT) {
        return knightSquareTable[8 - squareRank][8 - squareFile];
    }
    else if (piece === BISHOP) {
        return bishopSquareTable[8 - squareRank][8 - squareFile];
    }
    else if (piece === ROOK) {
        if (color === BLACK) return rookSquareTable[squareRank - 1][squareFile - 1];
        return rookSquareTable[8 - squareRank][8 - squareFile];
    }
    else if (piece === QUEEN) {
        if (color === BLACK) return queenSquareTable[squareRank - 1][squareFile - 1];
        return queenSquareTable[8 - squareRank][8 - squareFile];
    }
    else if (endgame) {
        if (color === BLACK) return kingEndgameSquareTable[squareRank - 1][squareFile - 1];
        return kingEndgameSquareTable[8 - squareRank][8 - squareFile];
    }
    if (color === BLACK) return kingMiddleSquareTable[squareRank - 1][squareFile - 1];
    return kingMiddleSquareTable[8 - squareRank][8 - squareFile];
}

const arrCenterManhattanDistance = [
    6, 5, 4, 3, 3, 4, 5, 6,
    5, 4, 3, 2, 2, 3, 4, 5,
    4, 3, 2, 1, 1, 2, 3, 4,
    3, 2, 1, 0, 0, 1, 2, 3,
    3, 2, 1, 0, 0, 1, 2, 3,
    4, 3, 2, 1, 1, 2, 3, 4,
    5, 4, 3, 2, 2, 3, 4, 5,
    6, 5, 4, 3, 3, 4, 5, 6
];

function cmd(square) {
    return arrCenterManhattanDistance[(((+square[1] - 1) * 8) + (square[0].charCodeAt(0) - 97))];
}

// The value ranges from 14 to 0, with 0 indicating that the squares are the same.
function md(square1, square2) {
    return 2 * (Math.max(Math.abs(fileSquare(square1) - fileSquare(square2)), Math.abs(rankSquare(square1) - rankSquare(square2))))
}

function pushClose(square1, square2) {
    return (14 - md(square1, square2));
}

const pieceValues = {
    [PAWN]: 100,
    [KNIGHT]: 320,
    [BISHOP]: 330,
    [ROOK]: 500,
    [QUEEN]: 900,
}

function isMovesSame(move1, move2) {
    if (move1 && move2) {
        return (move1.from === move2.from && move1.to === move2.to);
    }
    return false;
}

function getScore(piece) {
    if (piece === PAWN) return 100;
    if (piece === KNIGHT) return 300;
    if (piece === BISHOP) return 300;
    if (piece === ROOK) return 500;
    if (piece === QUEEN) return 900;
    if (piece === KING) return 2000;
    return 0;
}

function isTimeLimitExceeded(obj) {
    return (obj.initialTime && obj.maxTime && (Date.now() - obj.initialTime) > obj.maxTime);
}

export default engine;