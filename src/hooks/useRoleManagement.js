import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import roleService from '../services/roleService';

const useRoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleMenus, setNewRoleMenus] = useState([]);
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session has expired. Please login again.');
  }, [navigate]);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await roleService.getAllRoles();
      
      if (result.success) {
        setRoles(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch roles');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  // Fetch all menus
  const fetchMenus = useCallback(async () => {
    try {
      const result = await roleService.getAllMenus();
      
      if (result.success) {
        setAllMenus(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch menus');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      console.error('Error fetching menus:', err);
      toastService.error(err.message);
    }
  }, [handleAuthError]);

  // Create new role
  const createRole = useCallback(async (roleData) => {
    try {
      setCreating(true);
      const result = await roleService.createRole(roleData);
      
      if (result.success) {
        toastService.success('Role created successfully');
        await fetchRoles(); // Refresh roles list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create role');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [fetchRoles, handleAuthError]);

  // Update role menus
  const updateRoleMenus = useCallback(async (roleId, menuIds) => {
    try {
      setSaving(true);
      const result = await roleService.updateRoleMenus(roleId, menuIds);
      
      if (result.success) {
        toastService.success('Role menus updated successfully');
        await fetchRoles(); // Refresh roles list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update role menus');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [fetchRoles, handleAuthError]);

  // Delete role
  const deleteRole = useCallback(async (roleId) => {
    try {
      setSaving(true);
      const result = await roleService.deleteRole(roleId);
      
      if (result.success) {
        toastService.success('Role deleted successfully');
        await fetchRoles(); // Refresh roles list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to delete role');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [fetchRoles, handleAuthError]);

  // Open menu modal for role
  const openMenuModal = useCallback((role) => {
    setSelectedRole(role);
    const assignedMenuIds = role.menus?.map((m) => (m.menu || m)?.id).filter(Boolean) || [];
    setSelectedMenus(assignedMenuIds);
    setShowMenuModal(true);
  }, []);

  // Handle menu selection
  const handleMenuSelection = useCallback((menuId) => {
    setSelectedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  }, []);


  // Save menu assignments
  const saveMenuAssignments = useCallback(async () => {
    if (!selectedRole) return;
    await updateRoleMenus(selectedRole.id, selectedMenus);
    setShowMenuModal(false);
  }, [selectedRole, selectedMenus, updateRoleMenus]);

  // Handle create role
  const handleCreateRole = useCallback(async () => {
    if (!newRoleName.trim()) {
      toastService.error('Role name is required');
      return;
    }
    if (newRoleMenus.length === 0) {
      toastService.error('At least one menu must be selected');
      return;
    }

    try {
      await createRole({
        name: newRoleName.trim(),
        menuIds: newRoleMenus,
      });
      
      // Reset form
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleMenus([]);
      setShowCreateModal(false);
    } catch (error) {
      // Error already handled in createRole
    }
  }, [newRoleName, newRoleMenus, createRole]);

  // Handle delete role
  const handleDeleteRole = useCallback((role) => {
    setDeletingRoleId(role.id);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete role
  const confirmDeleteRole = useCallback(async () => {
    if (!deletingRoleId) return;
    
    try {
      await deleteRole(deletingRoleId);
      setShowDeleteModal(false);
      setDeletingRoleId(null);
    } catch (error) {
      // Error already handled in deleteRole
    }
  }, [deletingRoleId, deleteRole]);

  // Get assigned menu count for a role
  const getAssignedMenuCount = useCallback((role) => {
    return role.menus?.filter((item) => (item.menu || item)?.id).length || 0;
  }, []);

  // Initialize data
  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, [fetchRoles, fetchMenus]);

  return {
    // State
    roles,
    allMenus,
    loading,
    error,
    selectedRole,
    selectedMenus,
    saving,
    creating,
    showMenuModal,
    showCreateModal,
    showDeleteModal,
    deletingRoleId,
    newRoleName,
    newRoleDescription,
    newRoleMenus,
    
    // Actions
    setNewRoleName,
    setNewRoleDescription,
    setNewRoleMenus,
    setShowCreateModal,
    setShowMenuModal,
    setShowDeleteModal,
    
    // Functions
    openMenuModal,
    handleMenuSelection,
    saveMenuAssignments,
    handleCreateRole,
    handleDeleteRole,
    confirmDeleteRole,
    getAssignedMenuCount,
    fetchRoles,
    handleAuthError
  };
};

export default useRoleManagement;
