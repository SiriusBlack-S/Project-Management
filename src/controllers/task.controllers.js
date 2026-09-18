import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { TaskStatusEnum } from "../utils/constants.js";

const ensureProject = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(400, "Invalid project id");
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

const getTasks = asyncHandler(async (req, res) => {
  await ensureProject(req.params.projectId);
  const tasks = await Task.find({ project: req.params.projectId })
    .populate("assignedTo", "avatar username fullName")
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await ensureProject(projectId);
  const { title, description, assignedTo, status } = req.body;
  const files = req.files || [];
  const baseUrl = (process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");

  if (assignedTo && !mongoose.isValidObjectId(assignedTo)) throw new ApiError(400, "Invalid assignee id");

  const member = assignedTo
    ? await ProjectMember.findOne({ project: projectId, user: assignedTo })
    : null;
  if (assignedTo && !member) throw new ApiError(400, "Assignee is not a member of this project");

  const attachments = files.map((file) => ({
    url: `${baseUrl}/images/${encodeURIComponent(file.filename)}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo: assignedTo || undefined,
    assignedBy: req.user._id,
    status: status || TaskStatusEnum.TODO,
    attachments,
  });

  return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  await ensureProject(projectId);
  const task = await Task.findOne({ _id: taskId, project: projectId })
    .populate("assignedTo", "avatar username fullName")
    .populate("assignedBy", "avatar username fullName");
  if (!task) throw new ApiError(404, "Task not found");
  const subtasks = await Subtask.find({ task: task._id })
    .populate("createdBy", "avatar username fullName")
    .sort({ createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, { ...task.toObject(), subtasks }, "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  await ensureProject(projectId);
  const allowed = ["title", "description", "assignedTo", "status"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  if (updates.assignedTo) {
    if (!mongoose.isValidObjectId(updates.assignedTo)) throw new ApiError(400, "Invalid assignee id");
    const member = await ProjectMember.findOne({ project: projectId, user: updates.assignedTo });
    if (!member) throw new ApiError(400, "Assignee is not a member of this project");
  }
  if (updates.status && !Object.values(TaskStatusEnum).includes(updates.status)) throw new ApiError(400, "Invalid task status");

  const task = await Task.findOneAndUpdate({ _id: taskId, project: projectId }, updates, { new: true, runValidators: true })
    .populate("assignedTo", "avatar username fullName");
  if (!task) throw new ApiError(404, "Task not found");
  return res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: req.params.projectId });
  if (!task) throw new ApiError(404, "Task not found");
  await Subtask.deleteMany({ task: task._id });
  return res.status(200).json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new ApiError(404, "Task not found");
  const subtask = await Subtask.create({ title: req.body.title, task: taskId, createdBy: req.user._id });
  return res.status(201).json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const subtask = await Subtask.findById(subTaskId);
  if (!subtask) throw new ApiError(404, "Subtask not found");
  const task = await Task.findOne({ _id: subtask.task, project: projectId });
  if (!task) throw new ApiError(404, "Subtask not found");

  const updates = {};
  if (req.user.role === "admin" || req.user.role === "project_admin") {
    if (req.body.title !== undefined) updates.title = req.body.title;
  }
  if (req.body.isCompleted !== undefined) updates.isCompleted = req.body.isCompleted;
  if (!Object.keys(updates).length) throw new ApiError(400, "No valid fields to update");
  const updated = await Subtask.findByIdAndUpdate(subTaskId, updates, { new: true, runValidators: true });
  return res.status(200).json(new ApiResponse(200, updated, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const subtask = await Subtask.findById(subTaskId);
  if (!subtask) throw new ApiError(404, "Subtask not found");
  const task = await Task.findOne({ _id: subtask.task, project: projectId });
  if (!task) throw new ApiError(404, "Subtask not found");
  await Subtask.findByIdAndDelete(subTaskId);
  return res.status(200).json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
});

export { createSubTask, createTask, deleteTask, deleteSubTask, getTaskById, getTasks, updateSubTask, updateTask };
