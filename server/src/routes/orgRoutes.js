import { Router } from "express";
import {
  createOrganization,
  getOrganization,
} from "../controllers/orgControllers.js";

const router = Router();

router.post("/create", createOrganization);
router.get("/:org_id", getOrganization);

export default router;