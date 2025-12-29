/**
 * Users API Resource
 *
 * Handles user management API calls
 */

import apiClient from "@api/client";
import type {
  CreateUserRequest,
  CreateUserResponse,
} from "@api/types/users.types";

export const usersAPI = {
  /**
   * Crea un nuevo usuario
   * Solo admin
   */
  create: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await apiClient.post<CreateUserResponse>("/users", data);
    return response.data;
  },
};
