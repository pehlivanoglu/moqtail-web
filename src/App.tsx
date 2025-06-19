import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  Phone, 
  Settings,
  MoreVertical,
  Send,
  Users,
  MessageSquare
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSelf?: boolean;
  // canvas
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

const ROOM_NAME = 'room1';
const SELF_NAME = Math.random().toString(36).substring(2, 8);
const WS_URL = 'http://localhost:3001';

function App() {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Sarah Chen', message: 'Good morning everyone!', timestamp: '9:32 AM' },
    { id: '2', sender: 'Michael Rodriguez', message: 'Can everyone see my screen sharing?', timestamp: '9:35 AM' },
  ]);

  useEffect(() => {
    const socket = io(WS_URL);
    socketRef.current = socket;
    const participant = {
      id: '', // will be set by server (socket.id)
      name: SELF_NAME,
      isVideoOn: isVideoOn,
      isAudioOn: isMicOn,
    };
    socket.emit('join-room', { room: ROOM_NAME, participant });

    socket.on('participants-update', (list: Participant[]) => {
      // Mark self
      console.log('Participants update:', list);
      if (!selfIdRef.current) {
        const self = list.find(p => p.name === SELF_NAME);
        if (self) selfIdRef.current = self.id;
      }
      setParticipants(list.map(p => ({ ...p, isSelf: p.id === selfIdRef.current })));
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  // Update participant state on mic/video toggle
  useEffect(() => {
    if (!socketRef.current) return;
    if (!selfIdRef.current) return;
    socketRef.current.emit('update-participant', {
      room: ROOM_NAME,
      updates: {
        isAudioOn: isMicOn,
        isVideoOn: isVideoOn,
      },
    });
  }, [isMicOn, isVideoOn]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-semibold">{ROOM_NAME}</h1>
          <div className="flex items-center space-x-2 text-gray-300">
            <Users className="w-4 h-4" />
            <span className="text-sm">{participants.length} participants</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Video Grid Area */}
        <div className={`flex-1 p-4 ${isChatOpen ? 'pr-2' : 'pr-4'} min-h-0`}>
          <div className={`grid gap-3 h-full grid-cols-3 grid-rows-2`}>
            {participants
              .slice() // create a shallow copy
              .sort((a, b) => (b.isSelf ? 1 : 0) - (a.isSelf ? 1 : 0)) // isSelf first
              .map((participant) => (
                <div
                  key={participant.id}
                  className="relative bg-gray-800 rounded-lg overflow-hidden group aspect-video"
                >
                  {participant.isVideoOn ? (
                    // Placeholder for video stream
                    <img alt={participant.name} className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <div className={`w-16 h-16 ${participant.isSelf ? 'bg-blue-600' : 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-xl font-semibold">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Participant Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                    <div className="bg-black bg-opacity-60 px-2 py-1 rounded text-white text-sm font-medium">
                      {participant.name} {participant.isSelf && '(You)'}
                    </div>
                    <div className="flex space-x-1">
                      {!participant.isAudioOn && (
                        <div className="bg-red-600 p-1 rounded">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {!participant.isVideoOn && (
                        <div className="bg-red-600 p-1 rounded">
                          <VideoOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Screen sharing indicator (local only for now) */}
                  {participant.isSelf && isScreenSharing && (
                    <div className="absolute top-3 left-3 bg-green-600 px-2 py-1 rounded text-white text-xs font-medium">
                      Sharing Screen
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        {/* Chat Panel */}
        {isChatOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Chat</h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chatMessages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Bottom Controls */}
      <div className="bg-gray-800 px-6 py-4 flex justify-center items-center space-x-4 border-t border-gray-700 flex-shrink-0">
        {/* Mic Button */}
        <button
          onClick={() => setIsMicOn((v) => !v)}
          className={`p-3 rounded-full transition-all duration-200 ${
            isMicOn 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        {/* Video Button */}
        <button
          onClick={() => setIsVideoOn((v) => !v)}
          className={`p-3 rounded-full transition-all duration-200 ${
            isVideoOn 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        {/* Screen Share Button */}
        <button
          onClick={() => setIsScreenSharing((v) => !v)}
          className={`p-3 rounded-full transition-all duration-200 ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <MonitorUp className="w-5 h-5" />
        </button>
        {/* End Call Button */}
        <button className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 ml-8">
          <Phone className="w-5 h-5 transform rotate-135" />
        </button>
        {/* Chat Toggle Button (when chat is closed) */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default App;