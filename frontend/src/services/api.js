








const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

const getAuthHeader = () => {
  const token = localStorage.getItem('aura_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // AUTH
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  // MEETINGS
  async getMeetings() {
    const response = await fetch(`${API_BASE_URL}/get_meetings`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch meetings');
    return response.json();
  },

  async addMeeting(meetingData) {
    const response = await fetch(`${API_BASE_URL}/add_meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(meetingData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add meeting');
    }
    return response.json();
  },

  async updateMeeting(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/update_meeting/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error('Failed to update meeting');
    return response.json();
  },

  async deleteMeeting(id) {
    const response = await fetch(`${API_BASE_URL}/delete_meeting/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete meeting');
    return response.json();
  },

  // FOLDERS
  async getFolders() {
    const response = await fetch(`${API_BASE_URL}/get_folders`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
  },

  async addFolder(name) {
    const response = await fetch(`${API_BASE_URL}/add_folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to add folder');
    return response.json();
  },

  async editFolder(id, name) {
    const response = await fetch(`${API_BASE_URL}/edit_folder/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to update folder');
    return response.json();
  },

  async deleteFolder(id) {
    const response = await fetch(`${API_BASE_URL}/delete_folder/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete folder');
    return response.json();
  },

  async uploadAudio(blob) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', UPLOAD_PRESET);
  
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, 
        {
          method: 'POST',
          body: formData
        }
      );
  
      const data = await res.json();
  
      return data.secure_url;
  
    } catch (e) {
      console.error("Upload failed", e);
      throw new Error("Failed to upload audio");
    }
  }
};
