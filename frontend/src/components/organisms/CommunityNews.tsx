import { useEffect } from 'react';
// import { GoDotFill } from 'react-icons/go';
import { IoMdClose } from 'react-icons/io';
import { IoNewspaperOutline } from 'react-icons/io5';

import { useNewsStore } from '@/stores/newsStore';

const CommunityNews = ({ onClose }: any) => {
  const { newsies, fetchNewsies } = useNewsStore();

  useEffect(() => {
    if (newsies.length === 0) {
      fetchNewsies();
    }
  }, []);

  return (
    // {/* 광고 배너 영역 - 데스크톱에서만 표시 */}
    <div className={`shrink-0 px-1 flex-col items-center`}>
      <div className="bg-white rounded-lg p-3 min-h-[37.5rem] sticky top-6 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)] relative">
        {/* Title with improved visuals */}
        <div className="flex flex-col items-center justify-center gap-1 mb-4">
          <button
            className="lg:hidden absolute right-3 top-3 p-2"
            onClick={onClose}
          >
            <IoMdClose className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-2 mt-2">
            <IoNewspaperOutline className="w-5 h-5 text-primary-dark" />
            <h2 className="text-primary-dark font-semibold whitespace-nowrap">
              오늘의 간호 뉴스
            </h2>
          </div>

          <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <p className="text-sm text-gray-600">
              <span className="font-medium">※ 안내</span>: 최신 간호 관련 뉴스를
              AI가 요약하여 제공합니다. 뉴스는 6시, 14시, 21시에 업데이트됩니다.
            </p>
          </div>
        </div>

        {/* News Cards with improved styling */}
        <div className="space-y-4">
          {newsies.map((news, index) => (
            <a
              key={index}
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg"
            >
              <div className="rounded-lg overflow-hidden">
                <div className="bg-white px-3 pt-3 pb-0">
                  <h3 className="font-medium text-foreground flex-1 truncate text-md">
                    {news.title}
                  </h3>
                </div>
                <div className="bg-white px-3 pb-3 pt-1">
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
                    {news.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityNews;
