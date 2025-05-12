import { useState, useEffect } from 'react';

/**
 * Hook để quản lý việc bật/tắt chế độ mock data
 * @returns {{isUseMockData: boolean, toggleMockData: () => void, setMockData: (value: boolean) => void}}
 */
export function useMockToggle() {
  const [isUseMockData, setIsUseMockData] = useState<boolean>(true);

  // Đọc giá trị ban đầu từ localStorage khi component mount
  useEffect(() => {
    const storedValue = localStorage.getItem('USE_MOCK_DATA');
    // Nếu không có giá trị trong localStorage, mặc định sẽ là true
    if (storedValue === null) {
      localStorage.setItem('USE_MOCK_DATA', 'true');
      setIsUseMockData(true);
    } else {
      setIsUseMockData(storedValue === 'true');
    }
  }, []);

  // Hàm để bật/tắt chế độ mock data
  const toggleMockData = () => {
    const newValue = !isUseMockData;
    localStorage.setItem('USE_MOCK_DATA', String(newValue));
    setIsUseMockData(newValue);
  };

  // Hàm set giá trị cụ thể
  const setMockData = (value: boolean) => {
    localStorage.setItem('USE_MOCK_DATA', String(value));
    setIsUseMockData(value);
  };

  return { isUseMockData, toggleMockData, setMockData };
} 