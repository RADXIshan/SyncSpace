import sql from "../database/db.js";

export const createEvent = async (req, res) => {
  try {
    const { title, time, description, user_id } = req.body;

    if (!title || !time || !user_id) {
      return res.status(400).json({ message: "Title, time, and user_id are required" });
    }

    const [newEvent] = await sql`
      INSERT INTO events (user_id, event_title, event_time, event_description)
      VALUES (${user_id}, ${title}, ${time}, ${description})
      RETURNING event_id, user_id, event_title AS title, event_time AS start, event_description AS description
    `;

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEvents = async (req, res) => {
  try {
    // If you want per-user events:
    const { user_id } = req.query;
    const events = user_id
      ? await sql`
          SELECT event_id, user_id, event_title AS title, event_time AS start, event_description AS description
          FROM events WHERE user_id = ${user_id} ORDER BY event_time ASC
        `
      : await sql`
          SELECT event_id, user_id, event_title AS title, event_time AS start, event_description AS description
          FROM events ORDER BY event_time ASC
        `;

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, time, description } = req.body;

    const [updatedEvent] = await sql`
      UPDATE events
      SET event_title = ${title}, event_time = ${time}, event_description = ${description}, updated_at = NOW()
      WHERE event_id = ${id}
      RETURNING event_id, user_id, event_title AS title, event_time AS start, event_description AS description
    `;

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedEvent] = await sql`
      DELETE FROM events WHERE event_id = ${id} RETURNING event_id
    `;

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
