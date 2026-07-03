import Navbar from './components/Navbar/Navbar.jsx'
import Home from './Pages/Home/Home.jsx'
import MusicPlayer from './components/MusicPlayer/MusicPlayer.jsx'

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Home />
      </main>
      <MusicPlayer />
    </>
  )
}

export default App