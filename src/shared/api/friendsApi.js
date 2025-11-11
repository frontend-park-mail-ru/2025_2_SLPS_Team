import { apiClient } from './client.js';

export const friendsApi = {
  getRequests: (page = 1, limit = 20) =>
    apiClient.get(`/api/friends/requests?page=${page}&limit=${limit}`),
  getFriends: (page = 1, limit = 20) =>
    apiClient.get(`/api/friends?page=${page}&limit=${limit}`),
  getPossibleFriends: (page = 1, limit = 20) =>
    apiClient.get(`/api/friends/users/all?page=${page}&limit=${limit}`),
  deleteFriend: (userId, csrf) =>
    apiClient.delete(`/api/friends/${userId}`, {
      headers: csrf ? { 'X-CSRF-Token': csrf } : {},
    }),
  acceptFriend: (userId, csrf) =>
    apiClient.put(`/api/friends/${userId}/accept`, {}, {
      headers: csrf ? { 'X-CSRF-Token': csrf } : {},
    }),
  sendFriendRequest: (userId, csrf) =>
    apiClient.post(`/api/friends/${userId}`, {}, {
      headers: csrf ? { 'X-CSRF-Token': csrf } : {},
    }),
};
