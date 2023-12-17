import GameProvider from './store/GameProvider';
import Home from './components/Home';
import Modal from './components/Modal';

function App() {
	return (
		<GameProvider>
			<Home/>
			<Modal/>
		</GameProvider>
	);
}

export default App;
