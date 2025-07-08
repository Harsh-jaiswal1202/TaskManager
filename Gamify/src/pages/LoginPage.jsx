import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [form, setForm] = useState({ designation: '', email: '', password: '', parentId: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.designation || !form.email || !form.password || (form.designation === 'user' && !form.parentId)) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3001/api/user/login', {
        email: form.email,
        password: form.password,
        designation: form.designation,
      });
      // Set the id cookie for authentication
      Cookies.set('id', response.data.userId, { expires: 7 });
      // On success, navigate based on designation
      if (form.designation === 'admin' || form.designation === 'super-admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-purple-700">Login</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <select
            name="designation"
            value={form.designation}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
          >
            <option value="">-- Select Designation --</option>
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
            <option value="user">User</option>
          </select>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
          />
          {form.designation === 'user' && (
            <input
              type="text"
              name="parentId"
              placeholder="Parent ID"
              value={form.parentId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
            />
          )}
          {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-all duration-300"
          >
            Login
          </button>
        </form>
        <div className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            className="text-purple-600 hover:underline font-semibold"
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
