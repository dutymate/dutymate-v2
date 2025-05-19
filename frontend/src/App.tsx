import { BrowserRouter } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import { useEffect } from 'react';

import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import ChannelTalkLoader from '@/components/organisms/ChannelTalkLoader';
import SurveyProvider from '@/components/organisms/SurveyProvider';
import Router from '@/routes/Router';
import { isMobileApp } from '@/lib/mobileApp';

import 'react-toastify/dist/ReactToastify.css';
import './toast.css';

function App() {
  if (import.meta.env.PROD) {
    console = window.console || {};
    console.log = function no_console() {};
    console.warn = function no_console() {};
    console.error = function () {};
  }

  useEffect(() => {
    if (isMobileApp()) {
      console.log('모바일 앱에서 실행 중');

      document.documentElement.classList.add('mobile-app-view');
    }
  }, []);

  return (
    <BrowserRouter>
      <SurveyProvider>
        {!isMobileApp() && <ChannelTalkLoader />}
        <PageLoadingSpinner />
        <Router />
        <ToastContainer
          position="top-center"
          autoClose={1000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="light"
          stacked
          transition={Slide}
          className="custom-toast-container"
        />
      </SurveyProvider>
    </BrowserRouter>
  );
}

export default App;
