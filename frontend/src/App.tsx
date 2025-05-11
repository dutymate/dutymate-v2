import { BrowserRouter } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';

import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import ChannelTalkLoader from '@/components/organisms/ChannelTalkLoader';
import SurveyProvider from '@/components/organisms/SurveyProvider';
import Router from '@/routes/Router';

import 'react-toastify/dist/ReactToastify.css';
import './toast.css';

function App() {
  if (import.meta.env.PROD) {
    console = window.console || {};
    console.log = function no_console() {};
    console.warn = function no_console() {};
    console.error = function () {};
  }

  return (
    <BrowserRouter>
      <SurveyProvider>
        <ChannelTalkLoader />
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
