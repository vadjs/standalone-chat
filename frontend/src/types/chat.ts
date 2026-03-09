type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string; 
}

export interface Conversation {
  id: string; 
  title: string;
  createdAt: string;
  messages: Message[];
}
