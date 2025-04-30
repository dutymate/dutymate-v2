import { BrowserRouter } from "react-router-dom";
import Router from "./routes/Router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageLoadingSpinner from "./components/atoms/Loadingspinner";
import ChannelTalkLoader from "./components/organisms/ChannelTalkLoader";

function App() {
	if (import.meta.env.VITE_NODE_ENV === "production") {
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
