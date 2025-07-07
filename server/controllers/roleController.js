import RoleModel from "../models/roleModel.js";

const RoleController = {
    getAllRoles: async (req, res) => {
        try {
            const roles = await RoleModel.findAll();
            res.status(200).json(roles);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
      getRoleById: async (req, res) => {
            const id = req.params.id;
          try {
             const role = await RoleModel.findById(id);
            if (!role) {
              return res.status(404).json({ message: 'Role not found' });
            }
              res.status(200).json(role);
          } catch (err) {
            res.status(500).json({ error: err.message });
          }
        },
    createRole: async (req, res) => {
        try {
            const role = req.body;
             const insertId = await RoleModel.create(role);
            const newRole = await RoleModel.findById(insertId);
            res.status(201).json({ message: 'Role created successfully', role:newRole });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    updateRole: async (req, res) => {
        const id = req.params.id;
        try {
            const role = req.body;
           const affectedRows =  await RoleModel.update(id, role);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Role not found' });
            }
             const updatedRole = await RoleModel.findById(id);
            res.status(200).json({ message: 'Role updated successfully', role: updatedRole });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    deleteRole: async (req, res) => {
        const id = req.params.id;
        try {
            const affectedRows = await RoleModel.delete(id);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Role not found' });
            }
            res.status(200).json({ message: 'Role deleted successfully', });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
export default RoleController;