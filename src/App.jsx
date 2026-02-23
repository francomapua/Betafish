import './App.css'
import ReduxSample from './components/example/ReduxSample';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomeScreen from './components/screens/WelcomeScreen';
import GameScreen from './components/screens/GameScreen';
import NewGameScreen from './components/screens/NewGameScreen';

function App() {

  return (
    <div className="bg-gradient-to-b from-orange-950 to-taupe-950 h-screen">
      <Router>

        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/new" element={<NewGameScreen />} />
          <Route path="/game" element={<GameScreen />} />
        </Routes>

      </Router>
    </div>
  )
}

export default App
