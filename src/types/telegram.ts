
export interface TelegramAuth {
  phoneNumber?: string;
  verificationCode?: string;
  password?: string;
  authState: 'initial' | 'awaitingCode' | 'awaitingPassword' | 'authenticated';
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photo?: TelegramFile;
  unreadCount?: number;
  lastMessage?: TelegramMessage;
}

export interface TelegramMessage {
  id: number;
  chatId: number;
  senderId?: number;
  senderName?: string;
  date: number;
  content: TelegramMessageContent;
  isOutgoing: boolean;
  replyToMessageId?: number;
  forwardInfo?: {
    origin: {
      type: 'user' | 'chat' | 'channel' | 'hidden';
      senderName?: string;
      chatId?: number;
      messageId?: number;
    };
  };
}

export type TelegramMessageContent = 
  | { type: 'text'; text: string; }
  | { type: 'photo'; photo: TelegramFile; caption?: string; }
  | { type: 'video'; video: TelegramFile; caption?: string; }
  | { type: 'document'; document: TelegramFile; caption?: string; }
  | { type: 'audio'; audio: TelegramFile; caption?: string; }
  | { type: 'voice'; voice: TelegramFile; caption?: string; }
  | { type: 'sticker'; sticker: TelegramFile; }
  | { type: 'animation'; animation: TelegramFile; caption?: string; }
  | { type: 'location'; location: { latitude: number; longitude: number; }; }
  | { type: 'contact'; contact: { phoneNumber: string; firstName: string; lastName?: string; }; }
  | { type: 'poll'; poll: { question: string; options: string[]; }; }
  | { type: 'messageUnsupported'; };

export interface TelegramFile {
  id: string;
  size: number;
  name?: string;
  mimeType?: string;
  thumbnail?: {
    id: string;
    width: number;
    height: number;
  };
  localPath?: string;
  isDownloading?: boolean;
  downloadOffset?: number;
  downloadedSize?: number;
  isDownloaded?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
