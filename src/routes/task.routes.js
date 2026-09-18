import { Router } from "express";
import { createSubTask, createTask, deleteTask, deleteSubTask, getTaskById, getTasks, updateSubTask, updateTask } from "../controllers/task.controllers.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/:projectId", validateProjectPermission(), getTasks);
router.post("/:projectId", validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), upload.array("attachments", 5), createTask);
router.get("/:projectId/t/:taskId", validateProjectPermission(), getTaskById);
router.put("/:projectId/t/:taskId", validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), updateTask);
router.delete("/:projectId/t/:taskId", validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), deleteTask);
router.post("/:projectId/t/:taskId/subtasks", validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), createSubTask);
router.put("/:projectId/st/:subTaskId", validateProjectPermission(), updateSubTask);
router.delete("/:projectId/st/:subTaskId", validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), deleteSubTask);

export default router;
