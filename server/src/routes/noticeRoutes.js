import { Router } from "express";
import { createNotice, getNotices, updateNotice, deleteNotice } from "../controllers/noticeControllers.js";

const router = Router();

router.post("/", createNotice);
router.get("/", getNotices);
router.put("/:id", updateNotice);
router.delete("/:id", deleteNotice);

export default router;
