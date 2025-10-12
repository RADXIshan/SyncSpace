import { Router } from "express";
import {
  createOrganization,
} from "../controllers/orgControllers.js";

const router = Router();

router.post("/create", createOrganization);

export default router;