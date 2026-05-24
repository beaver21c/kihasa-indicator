import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import RegionReport from './pages/RegionReport';
import CustomReport from './pages/CustomReport';

// GitHub Pages 하위경로 대응: basename = import.meta.env.BASE_URL ('/kihasa-indicator/')
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen flex flex-col">
        <div className="px-4 pt-4">
          <Header />
        </div>
        <main className="flex-1 px-4 py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/region" element={<RegionReport />} />
            <Route path="/custom" element={<CustomReport />} />
          </Routes>
        </main>
        <div className="px-4">
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
