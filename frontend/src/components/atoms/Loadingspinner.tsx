import { useLoadingStore } from "@/store/loadingStore";
import { SyncLoader } from "react-spinners";

const PageLoadingSpinner = () => {
	const isLoading = useLoadingStore((state) => state.isLoading);

	if (!isLoading) return null;

	return (
		<div className="flex items-center justify-center min-h-screen bg-base-background">
			<SyncLoader
				color="#F5A281"
				cssOverride={{}}
				loading
				margin={5}
				size={12}
				speedMultiplier={1}
			/>
		</div>
	);
};

export default PageLoadingSpinner;
