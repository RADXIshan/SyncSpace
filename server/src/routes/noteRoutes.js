import {Router} from "express";
import { createNote, getNotes, updateNote, deleteNote } from "../controllers/noteController.js";

const router = Router();

router.post("/", createNote);
router.get("/", getNotes);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;