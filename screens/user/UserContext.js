import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // ⚠️ 注意：这里的路径要换成你自己的 supabase 配置文件路径

// 1. 创建 Context
export const UserContext = createContext();

// 2. 创建 Provider 组件
export const UserProvider = ({ children }) => {
    // 初始状态先放一个 Loading 占位
    const [profile, setProfile] = useState({ full_name: 'Loading...', avatar_url: null });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // 获取当前登录的用户
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            if (user) {
                // 去 profiles 表抓取名字和头像
                // ⚠️ 注意：请确保 'profiles' 是你的表名，'full_name' 和 'avatar_url' 是你的列名，如果不一样请替换！
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setProfile(data); // 把拿到的数据存起来
                }
            }
        } catch (error) {
            console.error('获取 Profile 失败:', error.message);
            setProfile({ full_name: 'Guest', avatar_url: null }); // 报错的话就显示 Guest
        }
    };

    return (
        <UserContext.Provider value={{ profile, fetchProfile }}>
            {children}
        </UserContext.Provider>
    );
};