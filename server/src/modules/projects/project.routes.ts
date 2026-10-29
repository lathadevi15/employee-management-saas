
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createProjectController, getProjectsController, getProjectByIdController,
    getProjectMembersController, getAvailableProjectMembersController, addProjectMembersController,
    removeProjectMemberController
} from "./project.controller.js";

const router = Router();

router.post("/", authenticate, createProjectController);
router.get("/", authenticate, getProjectsController);
router.get("/:id", authenticate, getProjectByIdController);

router.get(
  "/:id/members",
  authenticate,
  getProjectMembersController
);

router.get(
  "/:id/available-members",
  authenticate,
  getAvailableProjectMembersController
);
router.post(
  "/:id/members",
  authenticate,
  addProjectMembersController
);


router.delete(
  "/:id/members/:userId",
  authenticate,
  removeProjectMemberController
);
export default router;
