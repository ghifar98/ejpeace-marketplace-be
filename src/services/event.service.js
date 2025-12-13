const EventRepository = require("../models/event.repository");
const { imageExists } = require("../middleware/image.middleware");
const Event = require("../models/Event.model");

const getAllEvents = async () => {
  try {
    const events = await EventRepository.findAll();

    // Convert events to JSON - images are now loaded from relation table
    const validEvents = events.map((event) => {
      return event.toJSON();
    });

    return validEvents;
  } catch (error) {
    if (error.message === "Database connection failed") {
      throw new Error("Service unavailable. Please try again later.");
    }
    throw new Error("Failed to retrieve events: " + error.message);
  }
};

const getEventById = async (id) => {
  try {
    const event = await EventRepository.findById(id);

    if (!event) {
      return null;
    }

    // Return event with images from relation table
    return event.toJSON();
  } catch (error) {
    if (error.message === "Database connection failed") {
      throw new Error("Service unavailable. Please try again later.");
    }
    throw new Error("Failed to retrieve event: " + error.message);
  }
};

const createEvent = async (eventData) => {
  try {
    // Validate that eventData exists
    if (!eventData) {
      throw new Error("Event data is required");
    }

    // Create event object
    const event = new Event(eventData);

    // Validate event data
    const validationErrors = event.validate();
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(", "));
    }

    // Save event to database (images are saved separately in controller)
    const eventId = await EventRepository.create({
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      price: event.price,
    });

    // Return event data with ID
    return {
      id: eventId,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      price: event.price,
      images: [], // Images are saved separately and will be loaded on next fetch
      created_at: event.created_at,
    };
  } catch (error) {
    if (error.message === "Database connection failed") {
      throw new Error("Service unavailable. Please try again later.");
    }
    throw new Error("Failed to create event: " + error.message);
  }
};

const updateEvent = async (id, eventData) => {
  try {
    // Validate that eventData exists
    if (!eventData) {
      throw new Error("Event data is required");
    }

    // Check if event exists
    const existingEvent = await EventRepository.findById(id);
    if (!existingEvent) {
      throw new Error("Event not found");
    }

    // Create merged event data for validation
    const mergedData = {
      title: eventData.title || existingEvent.title,
      description: eventData.description !== undefined ? eventData.description : existingEvent.description,
      start_date: eventData.start_date || existingEvent.start_date,
      end_date: eventData.end_date || existingEvent.end_date,
      location: eventData.location || existingEvent.location,
      price: eventData.price !== undefined ? eventData.price : existingEvent.price,
    };

    // Create event object for validation
    const event = new Event(mergedData);

    // Validate event data
    const validationErrors = event.validate();
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(", "));
    }

    // Build update payload only with provided fields
    const updatePayload = {};
    if (eventData.title !== undefined) updatePayload.title = eventData.title;
    if (eventData.description !== undefined) updatePayload.description = eventData.description;
    if (eventData.start_date !== undefined) updatePayload.start_date = eventData.start_date;
    if (eventData.end_date !== undefined) updatePayload.end_date = eventData.end_date;
    if (eventData.location !== undefined) updatePayload.location = eventData.location;
    if (eventData.price !== undefined) updatePayload.price = eventData.price;

    // Only update if there are fields to update
    if (Object.keys(updatePayload).length > 0) {
      const updated = await EventRepository.update(id, updatePayload);
      if (!updated) {
        throw new Error("Failed to update event");
      }
    }

    // Return updated event (with images from relation table)
    const updatedEvent = await EventRepository.findById(id);
    return updatedEvent.toJSON();
  } catch (error) {
    if (error.message === "Database connection failed") {
      throw new Error("Service unavailable. Please try again later.");
    }
    throw new Error("Failed to update event: " + error.message);
  }
};

const deleteEvent = async (id) => {
  try {
    // Check if event exists
    const existingEvent = await EventRepository.findById(id);
    if (!existingEvent) {
      throw new Error("Event not found");
    }

    // Soft delete event
    const deleted = await EventRepository.softDelete(id);
    if (!deleted) {
      throw new Error("Failed to delete event");
    }

    return { message: "Event deleted successfully" };
  } catch (error) {
    if (error.message === "Database connection failed") {
      throw new Error("Service unavailable. Please try again later.");
    }
    throw new Error("Failed to delete event: " + error.message);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
