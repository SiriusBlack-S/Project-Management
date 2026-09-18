import { Router } from "express";
import { createNote, deleteNote, getNoteById, getNotes, updateNote } from "../controllers/note.controllers.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

router.get("/:projectId", validateProjectPermission(), getNotes);
router.post("/:projectId", validateProjectPermission([UserRolesEnum.ADMIN]), createNote);
router.get("/:projectId/n/:noteId", validateProjectPermission(), getNoteById);
router.put("/:projectId/n/:noteId", validateProjectPermission([UserRolesEnum.ADMIN]), updateNote);
router.delete("/:projectId/n/:noteId", validateProjectPermission([UserRolesEnum.ADMIN]), deleteNote);

export default router;
