import { useEffect, useState } from 'react';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  return (
    <div className="absolute top-2 right-4 z-50 flex flex-col items-center">
      <label
        className={`relative w-[2.8rem] h-[1.2rem] flex items-center 
          bg-[#d9d9d9] dark:bg-[#242424] rounded-full cursor-pointer
          shadow-[inset_0_2px_6px_rgba(0,0,0,0.25),inset_0_-2px_6px_rgba(255,255,255,0.2)] 
          transition-all duration-300`}
      >
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
          className="sr-only"
        />
        <span
          className={`absolute h-[1rem] w-[1rem] rounded-full transition-all duration-300 shadow-md ${
            darkMode
              ? 'translate-x-[1.6rem] bg-gradient-to-b from-gray-500 to-gray-700'
              : 'translate-x-[0.2rem] bg-gray-100'
          }`}
        />
      </label>
      <div className="mt-0.3 text-[0.7rem] font-medium text-gray-700 dark:text-white">
        {darkMode ? 'Dark' : 'Light'}
      </div>
    </div>
  );
};

export default DarkModeToggle;
