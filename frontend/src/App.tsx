import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import PageLoadingSpinner from "@/components/atoms/Loadingspinner";
import ChannelTalkLoader from "@/components/organisms/ChannelTalkLoader";
import Router from "@/routes/Router";

import "react-toastify/dist/ReactToastify.css";

function App() {
	if (import.meta.env.PROD) {
		console = window.console || {};
		console.log = function no_console() {};
		console.warn = function no_console() {};
		console.error = function () {};
	}

	return (
		<BrowserRouter>
			<ChannelTalkLoader />
			<PageLoadingSpinner />
			<Router />
			<ToastContainer
				position="top-center"
				autoClose={1800}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				theme="light"
			/>
		</BrowserRouter>
	);
}

export default App;
