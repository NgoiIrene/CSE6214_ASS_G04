// RiderProvider.js
import React, { createContext, useState } from 'react';

// 1. 创建 Context
export const RiderContext = createContext();

// 2. 创建 Provider 组件包装器
export const RiderProvider = ({ children }) => {
  // 全局头像状态
  const [avatarUri, setAvatarUri] = useState(null);

  // 你也可以把全局的名字存这里 (比如 'IRENE NGOI')
  const [riderName, setRiderName] = useState('IRENE NGOI');

  return (
    <RiderContext.Provider value={{ avatarUri, setAvatarUri, riderName, setRiderName }}>
      {children}
    </RiderContext.Provider>
  );
};