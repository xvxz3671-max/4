import { useEffect, useState } from 'react';
import { bindCssVars, initData, themeParams } from '@telegram-apps/sdk';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        expand(): void;
        close(): void;
        sendData(data: string): void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        themeParams: Record<string, string>;
      };
    };
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();
      
      // Bind theme parameters to CSS variables
      try {
        bindCssVars(themeParams);
      } catch (error) {
        console.warn('Failed to bind theme params:', error);
      }
      
      // Get user data
      if (tg.initDataUnsafe?.user) {
        setUser({
          telegramId: tg.initDataUnsafe.user.id.toString(),
          firstName: tg.initDataUnsafe.user.first_name,
          lastName: tg.initDataUnsafe.user.last_name,
          username: tg.initDataUnsafe.user.username,
        });
      }
      
      setIsReady(true);
    } else {
      // For development without Telegram
      setUser({
        telegramId: '123456789',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });
      setIsReady(true);
    }
  }, []);

  const sendData = (data: any) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
    } else {
      console.log('Would send to Telegram:', data);
    }
  };

  const close = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return {
    isReady,
    user,
    sendData,
    close,
    isInTelegram: !!window.Telegram?.WebApp
  };
}