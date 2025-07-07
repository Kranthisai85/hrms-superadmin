import express from 'express';
import RoleController from '../controllers/roleController.js';

const router = express.Router();

router.get('/roles', RoleController.getAllRoles);
router.get('/roles/:id', RoleController.getRoleById);
router.post('/roles', RoleController.createRole);
router.put('/roles/:id', RoleController.updateRole);
router.delete('/roles/:id', RoleController.deleteRole);

export default router;
