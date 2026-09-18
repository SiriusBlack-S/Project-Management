import { Project } from "../models/project.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const ensureProject = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

const getNotes = asyncHandler(async (req, res) => {
  await ensureProject(req.params.projectId);
  const notes = await ProjectNote.find({ project: req.params.projectId }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
  await ensureProject(req.params.projectId);
  const note = await ProjectNote.create({ project: req.params.projectId, createdBy: req.user._id, content: req.body.content });
  return res.status(201).json(new ApiResponse(201, note, "Note created successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const note = await ProjectNote.findOne({ _id: req.params.noteId, project: req.params.projectId }).populate("createdBy", "username fullName avatar");
  if (!note) throw new ApiError(404, "Note not found");
  return res.status(200).json(new ApiResponse(200, note, "Note fetched successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await ProjectNote.findOneAndUpdate(
    { _id: req.params.noteId, project: req.params.projectId },
    { content: req.body.content },
    { new: true, runValidators: true },
  );
  if (!note) throw new ApiError(404, "Note not found");
  return res.status(200).json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await ProjectNote.findOneAndDelete({ _id: req.params.noteId, project: req.params.projectId });
  if (!note) throw new ApiError(404, "Note not found");
  return res.status(200).json(new ApiResponse(200, note, "Note deleted successfully"));
});

export { getNotes, createNote, getNoteById, updateNote, deleteNote };
