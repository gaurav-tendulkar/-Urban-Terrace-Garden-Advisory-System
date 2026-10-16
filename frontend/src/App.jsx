import { useEffect } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import GardenBuilder from './pages/GardenBuilder.jsx';

const pages = {
  '/': LandingPage,
  '/chat': ChatPage,
  '/build-garden': GardenBuilder,
};

export default function App() {
  const Page = pages[window.location.pathname] || LandingPage;
  const bodyClass = Page === LandingPage ? 'landing-page-body' : Page === GardenBuilder ? 'builder-body' : '';

  useEffect(() => {
    document.body.className = bodyClass;
    return () => {
      document.body.className = '';
    };
  }, [bodyClass]);

  return <Page />;
}
