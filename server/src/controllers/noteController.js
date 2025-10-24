import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch {
    throw new Error("Invalid token");
  }
};

// Helper function to check notes_access permission
const checkNotesAccess = async (userId, orgId) => {
  // Check if user is organization owner (has full access)
  const [org] = await sql`
    SELECT created_by
    FROM organisations
    WHERE org_id = ${orgId}
    LIMIT 1
  `;

  if (org?.created_by === userId) {
    return true;
  }

  // Check user's role permissions
  const [member] = await sql`
    SELECT r.notes_access
    FROM org_members om
    LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
    WHERE om.org_id = ${orgId} AND om.user_id = ${userId}
    LIMIT 1
  `;

  return member?.notes_access || false;
};

// Create Note
export const createNote = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id, channel_id, title, body, pinned } = req.body;

    // Validate required fields
    if (!org_id || !title?.trim() || !body?.trim()) {
      return res.status(400).json({ 
        message: "Organization ID, title, and body are required" 
      });
    }

    // Check notes access permission
    const hasAccess = await checkNotesAccess(userId, org_id);
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "You don't have permission to create notes" 
      });
    }

    // Create the note
    const [newNote] = await sql`
      INSERT INTO org_notes (org_id, channel_id, created_by, title, body, pinned)
      VALUES (${org_id}, ${channel_id || null}, ${userId}, ${title.trim()}, ${body.trim()}, ${pinned || false})
      RETURNING note_id, title, body, pinned, created_at, updated_at
    `;

    res.status(201).json({
      message: "Note created successfully",
      note: newNote
    });

  } catch (error) {
    console.error("Error creating note:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Notes
export const getNotes = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id, channel_id } = req.query;

    if (!org_id) {
      return res.status(400).json({ 
        message: "Organization ID is required" 
      });
    }

    // Everyone can view notes; no permission check for viewing

    // Build query based on channel_id
    let query;
    if (channel_id) {
      // Get notes for specific channel
      query = sql`
        SELECT n.note_id, n.title, n.body, n.pinned, n.created_at, n.updated_at,
               u.name as created_by_name, u.user_photo as created_by_photo
        FROM org_notes n
        LEFT JOIN users u ON n.created_by = u.user_id
        WHERE n.org_id = ${org_id} AND n.channel_id = ${channel_id}
        ORDER BY n.pinned DESC, n.created_at DESC
      `;
    } else {
      // Get all notes for organization
      query = sql`
        SELECT n.note_id, n.title, n.body, n.pinned, n.created_at, n.updated_at,
               u.name as created_by_name, u.user_photo as created_by_photo,
               c.name as channel_name
        FROM org_notes n
        LEFT JOIN users u ON n.created_by = u.user_id
        LEFT JOIN org_channels c ON n.channel_id = c.channel_id
        WHERE n.org_id = ${org_id}
        ORDER BY n.pinned DESC, n.created_at DESC
      `;
    }

    const notes = await query;

    res.status(200).json({
      message: "Notes retrieved successfully",
      notes
    });

  } catch (error) {
    console.error("Error fetching notes:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Note
export const updateNote = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { id } = req.params;
    const { title, body, pinned } = req.body;

    // Validate required fields
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ 
        message: "Title and body are required" 
      });
    }

    // Get note details to check permissions
    const [note] = await sql`
      SELECT n.org_id, n.created_by
      FROM org_notes n
      WHERE n.note_id = ${id}
      LIMIT 1
    `;

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check notes access permission
    const hasAccess = await checkNotesAccess(userId, note.org_id);
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "You don't have permission to update notes" 
      });
    }

    // Update the note
    const [updatedNote] = await sql`
      UPDATE org_notes 
      SET title = ${title.trim()}, body = ${body.trim()}, pinned = ${pinned || false}, updated_at = NOW()
      WHERE note_id = ${id}
      RETURNING note_id, title, body, pinned, created_at, updated_at
    `;

    res.status(200).json({
      message: "Note updated successfully",
      note: updatedNote
    });

  } catch (error) {
    console.error("Error updating note:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Note
export const deleteNote = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { id } = req.params;

    // Get note details to check permissions
    const [note] = await sql`
      SELECT n.org_id, n.created_by
      FROM org_notes n
      WHERE n.note_id = ${id}
      LIMIT 1
    `;

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check notes access permission
    const hasAccess = await checkNotesAccess(userId, note.org_id);
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "You don't have permission to delete notes" 
      });
    }

    // Delete the note
    await sql`DELETE FROM org_notes WHERE note_id = ${id}`;

    res.status(200).json({
      message: "Note deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting note:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};