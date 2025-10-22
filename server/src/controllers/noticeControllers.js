import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Helper: Verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt ||
    req.body.token ||
    req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    throw new Error("Invalid token");
  }
};

// Helper: Check noticeboard access
const checkNoticeAccess = async (userId, orgId) => {
  const [org] = await sql`
    SELECT created_by FROM organisations WHERE org_id = ${orgId} LIMIT 1
  `;

  if (!org) return false;
  if (org.created_by === userId) return true;

  const [member] = await sql`
    SELECT r.noticeboard_access
    FROM org_members om
    LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
    WHERE om.org_id = ${orgId} AND om.user_id = ${userId}
    LIMIT 1
  `;

  return Boolean(member?.noticeboard_access);
};

// Create Notice
export const createNotice = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id, title, body } = req.body;

    if (!org_id || !title?.trim() || !body?.trim()) {
      return res.status(400).json({
        message: "Organization ID, title, and body are required",
      });
    }

    const hasAccess = await checkNoticeAccess(userId, org_id);
    if (!hasAccess) {
      return res.status(403).json({
        message: "You don't have permission to create notices",
      });
    }

    const [newNotice] = await sql`
      INSERT INTO org_notices (org_id, created_by, title, body)
      VALUES (${org_id}, ${userId}, ${title.trim()}, ${body.trim()})
      RETURNING notice_id, title, body, created_at, updated_at
    `;

    res.status(201).json({
      message: "Notice created successfully",
      notice: newNotice,
    });
  } catch (error) {
    console.error("Error creating notice:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Notices
export const getNotices = async (req, res) => {
  try {
    verifyToken(req); // Just verify token, don't need userId for this endpoint
    const { org_id } = req.query;

    if (!org_id) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    const notices = await sql`
      SELECT n.notice_id, n.title, n.body, n.created_at, n.updated_at,
             u.name AS created_by_name, u.user_photo AS created_by_photo,
             om.role AS created_by_role
      FROM org_notices n
      LEFT JOIN users u ON n.created_by = u.user_id
      LEFT JOIN org_members om ON om.user_id = n.created_by AND om.org_id = n.org_id
      WHERE n.org_id = ${org_id}
      ORDER BY n.created_at DESC
    `;

    res.status(200).json({
      message: "Notices retrieved successfully",
      notices,
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Notice
export const updateNotice = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { id } = req.params;
    const { title, body } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const [notice] = await sql`
      SELECT n.org_id, n.created_by
      FROM org_notices n
      WHERE n.notice_id = ${id}
      LIMIT 1
    `;

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const hasAccess = await checkNoticeAccess(userId, notice.org_id);
    if (!hasAccess) {
      return res.status(403).json({
        message: "You don't have permission to update notices",
      });
    }

    const [updatedNotice] = await sql`
      UPDATE org_notices
      SET title = ${title.trim()}, body = ${body.trim()}, updated_at = NOW()
      WHERE notice_id = ${id}
      RETURNING notice_id, title, body, created_at, updated_at
    `;

    res.status(200).json({
      message: "Notice updated successfully",
      notice: updatedNotice,
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Notice
export const deleteNotice = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { id } = req.params;

    const [notice] = await sql`
      SELECT n.org_id, n.created_by
      FROM org_notices n
      WHERE n.notice_id = ${id}
      LIMIT 1
    `;

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const hasAccess = await checkNoticeAccess(userId, notice.org_id);
    if (!hasAccess) {
      return res.status(403).json({
        message: "You don't have permission to delete notices",
      });
    }

    await sql`DELETE FROM org_notices WHERE notice_id = ${id}`;

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
