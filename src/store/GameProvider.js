import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameContext from './game-context';
import { Chess, DEFAULT_POSITION, validateFen } from '../helperFunctions/chess.js'

let chess = new Chess();

const GameProvider = ({ children }) => {
    const [message, setMessage] = useState({});
    const [fen, setFen] = useState(DEFAULT_POSITION);
    const [hintSquares, setHintSquares] = useState([]);
    const [searchData, setSearchData] = useState(null);
    const [pieces, setPieces] = useState(chess.board());
    const [thinkSquares, setThinkSquares] = useState([]);
    const [hoverSquare, setHoverSquare] = useState(null);
    const [computerTurn, setComputerTurn] = useState(null);
    const [clickedSquare, setClickedSquare] = useState(null);
    const [highLightSquares, setHighLightSquares] = useState([]);

    const worker = useRef();
    const yourTurn = useRef('');
    const currentTurn = useRef('');
    const isSearching = useRef(false);
    const hasSearchedUptoDepth1 = useRef(false);

    const DEFAULT_DEPTH = 4;
    const DEFAULT_TIME_LIMIT = 20000;
    const isTakeAwayAllowed = true;

    let undoMoves = useRef([]);

    function highLightPreviousMove() {
        let previousMove = chess.undo();
        if (previousMove) {
            chess.move(previousMove);
            setHighLightSquares([previousMove.from, previousMove.to]);
        } else {
            setHighLightSquares([]);
        }
    }

    function searchBestMove(update = false, depth = DEFAULT_DEPTH, maxTime = DEFAULT_TIME_LIMIT) {
        
        let backgroundWorker = worker.current;
        if(!update) backgroundWorker = new Worker(new URL('../helperFunctions/worker', import.meta.url));

        backgroundWorker.postMessage({pgn: chess.pgn()});
        backgroundWorker.onmessage = ({ data }) => {
            if (data.thinkSquares && update) setThinkSquares(data.thinkSquares);
            else {
                if(update) {
                    let move = chess.move(data.bestMove);
                    data.bestMove = move.san;
                    hasSearchedUptoDepth1.current = true;
                    if (data.finalResult) {
                        isSearching.current = false;
                        chess.setComment(JSON.stringify(data));
                        setFen(move.after);
                    }
                    else chess.undo();
                    setSearchData(data);
                }
                else if(data.finalResult) {
                    console.log(data.bestMove);
                    backgroundWorker.terminate();
                }
            }
        }
        backgroundWorker.postMessage({ single: true, depth, maxTime });
    }

    let stopEvaluation = isSearching.current ? () => {
        if (isSearching.current && hasSearchedUptoDepth1.current) {
            isSearching.current = false;
            chess.setComment(JSON.stringify(searchData));
            let move = chess.move(searchData.bestMove);
            worker.current.terminate();
            worker.current = new Worker(new URL('../helperFunctions/worker', import.meta.url));
            setFen(move.after);
        }
    } : null;

    function playRandomMove() {
        if (isSearching.current || undoMoves.current.length !== 0 || chess.isGameOver()) return;
        let moves = chess.moves({ verbose: true });
        let move = chess.move(moves[Math.floor(Math.random() * moves.length)]);
        setFen(move.after);
    }

    const computerMove = useCallback(() => {
        if (isSearching.current || undoMoves.current.length !== 0 || chess.isGameOver()) return;
        isSearching.current = true;
        hasSearchedUptoDepth1.current = false;
        searchBestMove(true);
    },[])

    window.computerMove = computerMove;

    useEffect(() => {
        worker.current = new Worker(new URL('../helperFunctions/worker', import.meta.url));

        function setSearchDataFromCommnent() {
            let comment = chess.getComment();
            if (comment) {
                comment = comment.replace('[', '{').replace(']', '}');
                comment = JSON.parse(comment);
                setSearchData(comment)
            }
        }

        function ArrowKeys(event) {
            // undo move
            if (event.key === 'ArrowLeft' || (event.ctrlKey && event.key === 'z')) {
                let length = chess._history.length;
                if (!isSearching.current && length !== 0) {
                    let move = chess.undo();
                    undoMoves.current.push(move);
                    setSearchDataFromCommnent();
                    setFen(move.before);
                }
            }
            // redo move
            if (event.key === 'ArrowRight' || (event.ctrlKey && event.key === 'y')) {
                if (undoMoves.current.length !== 0) {
                    let move = chess.move(undoMoves.current.pop());
                    setSearchDataFromCommnent();
                    setFen(move.after);
                }
            }
        }

        function rightClick(event) {
            event.preventDefault();
            setFen(chess.fen());
        }

        window.addEventListener('keydown', ArrowKeys);
        window.addEventListener('contextmenu', rightClick);
        return () => {
            window.removeEventListener('keydown', ArrowKeys);
            window.removeEventListener('contextmenu', rightClick);
        }
    }, [])

    useEffect(() => {

        setMessage({});
        setHintSquares([]);
        setThinkSquares([]);
        highLightPreviousMove();
        setPieces(chess.board());

        if (!yourTurn.current && computerTurn) yourTurn.current = computerTurn === 'w' ? 'b' : 'w';
        if (!computerTurn) yourTurn.current = null;
        currentTurn.current = chess.turn();

        if (chess.isCheckmate()) {
            setMessage({ message: 'Game Over', status: (chess.turn() !== 'w' ? 'White' : 'Black') + " Won By Checkmate" });
        }
        else if (chess.isStalemate()) setMessage({ message: 'Game drawn by stalemate', status: 'Draw' });
        else if (chess.isThreefoldRepetition()) setMessage({ message: 'Game drawn by repetition', status: 'Draw' });
        else if (chess.isInsufficientMaterial()) setMessage({ message: 'Game drawn by insufficient material', status: 'Draw' });
        else if (chess.isDrawBy50MovesRule()) setMessage({ message: 'Game drawn by 50 move rule', status: 'Draw' });
        else if (computerTurn && currentTurn.current === computerTurn) computerMove();

    }, [fen, computerTurn, computerMove])

    useEffect(() => {

        if (clickedSquare) {
            let legalMoves = chess.moves({ square: clickedSquare, verbose: true });
            setHintSquares([...legalMoves]);
            setHighLightSquares((arr) => {
                if (legalMoves.find(move => move.to === arr[0])) arr.shift();
                if (legalMoves.find(move => move.to === arr[arr.length - 1])) arr.pop();
                return [...arr];
            });
        }

        return () => {
            if (clickedSquare) {
                highLightPreviousMove();
                setHintSquares([]);
            }
        }

    }, [clickedSquare, fen])

    function getPGN() {
        chess.deleteComments();
        return chess.pgn();
    }

    function loadPgn(pgn) {
        chess.loadPgn(pgn);
        undoMoves.current = [];
        setFen(chess.fen());
    }

    function loadFenFromInput(inputFen) {
        if (fen === inputFen) return;
        let value = validateFen(inputFen);
        if (value.ok) {
            chess.load(inputFen);
            undoMoves.current = [];
            setFen(inputFen);
            setSearchData(null);
            setComputerTurn(null);
        }
        else setMessage({ message: value.error });
    }

    function returnToCurrentPosition() {
        while (undoMoves.current.length !== 0) chess.move(undoMoves.current.pop());
    }

    function MovePiece(targetSquare, newSquare) {
        if (yourTurn.current !== chess.turn()) return;
        if (isTakeAwayAllowed || undoMoves.current.length === 0) {
            try {
                let move = chess.move({ from: targetSquare, to: newSquare, promotion: 'q' });
                undoMoves.current = [];
                setFen(move.after);
            } catch (error) {
                console.log("Invalid Move");
            }
        }
        else returnToCurrentPosition();
    }

    const gamecontext = {
        pieces,
        hintSquares,
        hoverSquare,
        thinkSquares,
        computerTurn,
        highLightSquares,
        clickedSquare,
        yourTurn,
        currentTurn,
        message,
        searchData,
        fen,
        setFen,
        getPGN,
        loadPgn,
        loadFenFromInput,
        setComputerTurn,
        stopEvaluation,
        playRandomMove,
        setHoverSquare,
        setClickedSquare,
        computerMove,
        MovePiece
    };
    return <GameContext.Provider value={gamecontext}>{children}</GameContext.Provider>;
};

export default GameProvider;
