import { get, post, put, del } from './apiService';

class RoleService {
  // Get all roles
  async getAllRoles() {
    try {
      const response = await get('/roles');
      return {
        success: true,
        data: response.data || response,
        meta: response.meta
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch roles'
      };
    }
  }

  // Get role by ID
  async getRoleById(id) {
    try {
      const response = await get(`/roles/${id}`);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Error fetching role:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch role'
      };
    }
  }

  // Create new role
  async createRole(roleData) {
    try {
      const response = await post('/roles', roleData);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Error creating role:', error);
      return {
        success: false,
        error: error.message || 'Failed to create role'
      };
    }
  }

  // Update role
  async updateRole(id, roleData) {
    try {
      const response = await put(`/roles/${id}`, roleData);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Error updating role:', error);
      return {
        success: false,
        error: error.message || 'Failed to update role'
      };
    }
  }

  // Delete role
  async deleteRole(id) {
    try {
      const response = await del(`/roles/${id}`);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Error deleting role:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete role'
      };
    }
  }

  // Update role menus
  async updateRoleMenus(roleId, menuIds) {
    try {
      const response = await put(`/roles/${roleId}/menus`, { menuIds });
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Error updating role menus:', error);
      return {
        success: false,
        error: error.message || 'Failed to update role menus'
      };
    }
  }

  // Get all menus
  async getAllMenus() {
    try {
      const response = await get('/menus');
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Error fetching menus:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch menus'
      };
    }
  }
}

export default new RoleService();
