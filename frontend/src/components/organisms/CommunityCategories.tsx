// import React from 'react';

interface CommunityCategoriesProps {
	onCategorySelect: (category: string) => void;
	selectedCategory: string | null;
}

const CommunityCategories = ({
	onCategorySelect,
	selectedCategory,
}: CommunityCategoriesProps) => {
	const categories = [
		{ key: "ALL", value: "전체글" },
		{ key: "DAILY", value: "일상글" },
		{ key: "QNA", value: "간호지식 Q&A" },
		{ key: "INFO", value: "이직 정보" },
		{ key: "HOT", value: "HOT" },
	];

	return (
		<div className="flex gap-1.25 sm:gap-2 w-full overflow-x-auto scrollbar-hide">
			{categories.map((category) => (
				<button
					key={category.key}
					className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg whitespace-nowrap transition-colors ${
						selectedCategory === category.key
							? "bg-primary-10 text-primary-dark"
							: "hover:bg-primary-10 hover:text-primary-dark"
					}`}
					onClick={() => onCategorySelect(category.key)}
				>
					{category.value}
				</button>
			))}
		</div>
	);
};

export default CommunityCategories;
