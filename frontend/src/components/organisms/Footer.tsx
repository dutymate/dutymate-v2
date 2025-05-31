import { FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import channelService from '@/services/channelService';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';

interface Notice {
  noticeId: number;
  title: string;
  createdAt: string;
}

const Footer = () => {
  const navigate = useNavigate();
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);

  useEffect(() => {
    // Fetch the 4 most recent notices
    axiosInstance
      .get('/notice')
      .then((res) => {
        // Sort by creation date (newest first)
        const sortedNotices = res.data.sort(
          (a: Notice, b: Notice) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        // Take only the first 4
        setRecentNotices(sortedNotices.slice(0, 4));
      })
      .catch((error) => {
        console.error('Failed to fetch notices:', error);
      });
  }, []);

  const handleChatbotClick = () => {
    channelService.showMessenger();
  };

  const handleNoticeClick = () => {
    navigate('/notice');
  };

  return (
    <footer className="w-full bg-white py-6 sm:py-8 mt-4 sm:mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 공지사항 섹션 */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <h3
                className="text-base sm:text-lg font-bold text-gray-800 cursor-pointer"
                onClick={handleNoticeClick}
              >
                공지사항
              </h3>
            </div>
            <div className="space-y-1">
              {recentNotices.map((notice) => (
                <p
                  key={notice.noticeId}
                  className="text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-primary transition-colors truncate"
                  onClick={() => navigate(`/notice/${notice.noticeId}`)}
                >
                  • {notice.title}
                </p>
              ))}
              <p
                className="text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-primary transition-colors"
                onClick={handleChatbotClick}
              >
                • 제휴 문의
              </p>
            </div>
          </div>

          {/* 소셜 미디어 섹션 */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              소셜 미디어
            </h3>
            <div className="flex space-x-3">
              <a
                href="https://www.instagram.com/dutymate_net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <FaInstagram size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://www.youtube.com/@%EB%93%80%ED%8B%B0%EB%A9%94%EC%9D%B4%ED%8A%B8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <FaYoutube size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://x.com/dutymate_net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <FaTwitter size={18} className="sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* 저작권 정보 */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            © 2025 Dutymate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
