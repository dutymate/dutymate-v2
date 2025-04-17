import { BrowserRouter } from "react-router-dom";
import Router from "./routes/Router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageLoadingSpinner from "./components/atoms/Loadingspinner";

function App() {
	return (
		<BrowserRouter>
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
