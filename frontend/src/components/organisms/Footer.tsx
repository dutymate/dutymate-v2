import { FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import channelService from '@/services/channelService';

const Footer = () => {
  const navigate = useNavigate();

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
            <h3
              className="text-base sm:text-lg font-bold text-gray-800 cursor-pointer hover:text-primary transition-colors"
              onClick={handleNoticeClick}
            >
              공지사항
            </h3>
            <div className="space-y-1">
              <p
                className="text-xs sm:text-sm text-gray-600 "
                // onClick={handleNoticeClick}
              >
                • 서비스 이용 안내
              </p>
              <p
                className="text-xs sm:text-sm text-gray-600 "
                // onClick={handleNoticeClick}
              >
                • 개인정보 처리방침
              </p>
              <p
                className="text-xs sm:text-sm text-gray-600 "
                // onClick={handleNoticeClick}
              >
                • 이용약관
              </p>
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
