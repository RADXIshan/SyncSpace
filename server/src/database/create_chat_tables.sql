-- Create channel_messages table
CREATE TABLE IF NOT EXISTS channel_messages (
    message_id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    reply_to INTEGER REFERENCES channel_messages(message_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    reaction_id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES channel_messages(message_id) ON DELETE CASCADE,
    UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_user_id ON channel_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at ON channel_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channel_messages_reply_to ON channel_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channel_messages_updated_at 
    BEFORE UPDATE ON channel_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();