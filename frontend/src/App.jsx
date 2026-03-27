import { Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import PageLoader from './components/PageLoader.jsx';
import { appRoutes } from './config/routes.jsx';

export default function App() {
  const location = useLocation();

  return (
    <Shell>
      <Suspense fallback={<PageLoader label="Loading studio..." />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {appRoutes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Routes>
        </AnimatePresence>
      </Suspense>
    </Shell>
  );
}
