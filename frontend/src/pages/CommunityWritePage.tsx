import CommunityLayout from "@/components/organisms/CommunityLayout";
import CommunityWrite from "../components/organisms/CommunityWrite";
import { SEO } from "../components/SEO";

const CommunityWritePage = () => {
	return (
		<>
			<SEO
				title="글쓰기 | Dutymate 커뮤니티"
				description="동료 간호사들과 나누고 싶은 이야기를 작성해보세요."
			/>
			<CommunityLayout
				title="글쓰기"
				subtitle="동료들과 나누고 싶은 이야기를 작성해보세요"
			>
				<CommunityWrite />
			</CommunityLayout>
		</>
	);
};

export default CommunityWritePage;
