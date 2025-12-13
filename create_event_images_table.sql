-- SQL Script to create event_images table for unlimited image uploads
-- Run this in phpMyAdmin on peacetifal_db database

USE peacetifal_db;

-- Create event_images table
CREATE TABLE IF NOT EXISTS event_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  position INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Add index for faster lookup
CREATE INDEX idx_event_images_event_id ON event_images(event_id);
CREATE INDEX idx_event_images_position ON event_images(position);
