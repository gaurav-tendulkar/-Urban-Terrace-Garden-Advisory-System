import { lazy, Suspense, useEffect } from 'react';
import LandingPage from './pages/LandingPage.jsx';

const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const GardenBuilder = lazy(() => import('./pages/GardenBuilder.jsx'));

const pages = {
  '/': LandingPage,
  '/chat': ChatPage,
  '/build-garden': GardenBuilder,
};

export default function App() {
  const Page = pages[window.location.pathname] || LandingPage;
  const bodyClass = Page === LandingPage
    ? 'landing-page-body'
    : Page === GardenBuilder
      ? 'builder-body'
      : Page === ChatPage
        ? 'chat-page-body'
        : '';

  useEffect(() => {
    document.body.className = bodyClass;
    return () => {
      document.body.className = '';
    };
  }, [bodyClass]);

  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading garden studio…</div>}>
      <Page />
    </Suspense>
  );
}
