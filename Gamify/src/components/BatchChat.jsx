import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function BatchChat({ batchId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3001/api/batches/${batchId}/messages`, { withCredentials: true });
      setMessages(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [batchId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await axios.post(
        `http://localhost:3001/api/batches/${batchId}/messages`,
        { message: newMessage },
        { withCredentials: true }
      );
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      setError('Failed to send message');
    }
    setSending(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Batch Chat</h2>
      <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mb-4">
        {loading ? (
          <div>Loading messages...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="mb-3">
              <span className="font-semibold text-purple-700">{msg.sender?.name || 'User'}:</span>
              <span className="ml-2">{msg.message}</span>
              <span className="ml-2 text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          placeholder="Type your message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-all"
          disabled={sending || !newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
} 